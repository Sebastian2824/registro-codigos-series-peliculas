// ============================================================
// CONFIGURACIÓN DE ENTORNO
// ============================================================
const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

const SQLSERVER_BASE_URL = IS_LOCAL
    ? 'http://localhost:3001'
    : 'https://animes-plus-backend-production.up.railway.app';

console.log(`🔌 Backend SQL Server: ${SQLSERVER_BASE_URL} (${IS_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'})`);

// ============================================================
// UTILIDADES DE FILAS
// ============================================================
function agregarFila() {
    const table = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <td><input type="text" placeholder="Ej: Episodio X"></td>
        <td><input type="text" placeholder="https://..."></td>
        <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
    `;
}

function eliminarFila(boton) {
    const fila = boton.closest('tr');
    if (fila && fila.parentElement.children.length > 1) {
        fila.remove();
    } else {
        alert('Debe quedar al menos una fila.');
    }
}

// ============================================================
// IMPORTAR TXT
// ============================================================
document.getElementById('importarTxt').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const contenido = e.target.result;
        const lineas = contenido.split('\n');
        const table = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];

        let cont = 0;
        lineas.forEach(linea => {
            if (linea.trim() === '') return;
            const partes = linea.split(';');
            if (partes.length !== 2) return;

            const episodio = partes[0].trim();
            const url = partes[1].trim().replace(/"/g, '&quot;');

            const newRow = table.insertRow();
            newRow.innerHTML = `
                <td><input type="text" value="${episodio}"></td>
                <td><input type="text" value="${url}"></td>
                <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
            `;
            cont++;
        });

        alert(`✅ Importación completada. Se agregaron ${cont} filas.`);
        event.target.value = '';
    };
    reader.readAsText(file);
});

// ============================================================
// IMPORTAR EXCEL
// ============================================================
document.getElementById('importarExcel').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const table = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];

        let cont = 0;
        rows.forEach(row => {
            if (row.length < 2) return;
            const episodio = String(row[0]).trim();
            const url = String(row[1]).trim().replace(/"/g, '&quot;');

            // Ignorar filas de encabezado
            if (episodio && url && episodio !== 'Episodio' && !url.startsWith('Enlace')) {
                const newRow = table.insertRow();
                newRow.innerHTML = `
                    <td><input type="text" value="${episodio}"></td>
                    <td><input type="text" value="${url}"></td>
                    <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
                `;
                cont++;
            }
        });

        alert(`✅ Importación desde Excel completada. Se agregaron ${cont} filas.`);
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
});

// ============================================================
// GUARDAR EN SQL SERVER
// ============================================================
async function guardarEnSQLServer() {
    const nombreSerie = document.getElementById('serieNombre').value.trim();
    const temporada   = document.getElementById('temporada').value.trim();
    const idioma      = document.getElementById('idioma').value.trim();
    const servidor    = document.getElementById('servidor').value.trim();
    const tabla       = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];
    const filas       = tabla.getElementsByTagName('tr');

    if (!nombreSerie || !temporada || !idioma || !servidor) {
        alert('⚠️ Por favor, completa todos los campos antes de guardar.');
        return;
    }

    const registros = [];
    for (let fila of filas) {
        const episodio = fila.cells[0].querySelector('input').value.trim();
        const url      = fila.cells[1].querySelector('input').value.trim().replace(/&quot;/g, '"');

        if (episodio && url) {
            registros.push({
                nombreSerie: nombreSerie,
                temporada:   temporada,
                idioma:      idioma,
                servidor:    servidor,
                episodio:    episodio,
                url:         url
            });
        }
    }

    if (registros.length === 0) {
        alert('No hay episodios para guardar.');
        return;
    }

    // Deshabilitar botón
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        // 🔑 Endpoint correcto: /registrar-original (no /registrar)
        // 🔑 Body correcto: { registros } (no { episodios })
        const response = await fetch(`${SQLSERVER_BASE_URL}/registrar-original`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registros })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || `✅ ${registros.length} episodios guardados correctamente en Azure SQL.`);

            // Limpiar formulario
            document.getElementById('serieNombre').value = '';
            document.getElementById('temporada').value = '';
            document.getElementById('idioma').value = '';
            document.getElementById('servidor').value = '';

            // Resetear tabla
            const tbody = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];
            tbody.innerHTML = `
                <tr>
                    <td><input type="text" placeholder="Ej: Episodio 1"></td>
                    <td><input type="text" placeholder="https://..."></td>
                    <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
                </tr>
            `;
        } else {
            alert('❌ Error al guardar: ' + (data.error || response.statusText));
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('❌ Error al guardar: ' + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar en SQL Server';
    }
}

// ============================================================
// EVENTOS
// ============================================================
document.getElementById('btnAgregarFila').addEventListener('click', agregarFila);
document.getElementById('btnGuardar').addEventListener('click', guardarEnSQLServer);