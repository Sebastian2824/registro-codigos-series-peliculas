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
// DOM REFERENCES
// ============================================================
const enlaceImagenInput    = document.getElementById('enlaceImagen');
const previewContainer     = document.getElementById('previewContainer');
const previewPlaceholder   = document.getElementById('previewPlaceholder');
const previewImage         = document.getElementById('previewImage');

// ============================================================
// VISTA PREVIA
// ============================================================
function actualizarVistaPrevia() {
    const url = enlaceImagenInput.value.trim();

    // Si la URL es válida (jpg, jpeg, png, webp, gif)
    if (url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        previewImage.src = url;
        previewImage.style.display = 'block';
        previewPlaceholder.style.display = 'none';
        previewContainer.classList.add('has-image');

        // Manejar error de carga
        previewImage.onerror = function () {
            previewImage.style.display = 'none';
            previewPlaceholder.style.display = 'flex';
            previewPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i>
                <span class="preview-error">Error al cargar imagen</span>
            `;
            previewContainer.classList.remove('has-image');
        };

        previewImage.onload = function () {
            // Ya está mostrando la imagen, no hacer nada
        };

    } else {
        // Mostrar placeholder
        previewImage.style.display = 'none';
        previewPlaceholder.style.display = 'flex';
        previewPlaceholder.innerHTML = `
            <i class="fas fa-image"></i>
            <span>${url ? 'Formato no válido' : 'Ingresa un enlace de imagen'}</span>
        `;
        previewContainer.classList.remove('has-image');
    }
}

// Evento en tiempo real
enlaceImagenInput.addEventListener('input', actualizarVistaPrevia);

// ============================================================
// GUARDAR EN SQL SERVER
// ============================================================
async function guardarEnSQLServer() {
    const nombreSerie   = document.getElementById('serieNombre').value.trim();
    const temporada     = document.getElementById('temporada').value.trim();
    const enlaceImagen  = document.getElementById('enlaceImagen').value.trim();
    const enlaceSitio   = document.getElementById('enlaceSitio').value.trim();
    const enlaceSitio02 = document.getElementById('enlaceSitio02').value.trim();

    if (!nombreSerie || !temporada || !enlaceImagen) {
        alert('⚠️ Por favor, completa los campos obligatorios: Nombre de la serie, Temporada y Enlace de imagen.');
        return;
    }

    // Deshabilitar botón
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const datosPortada = {
            nombreSerie: nombreSerie,
            temporada:   temporada,
            imagen:      enlaceImagen,
            sitio:       enlaceSitio   || null,
            sitio02:     enlaceSitio02 || null
        };

        const res = await fetch(`${SQLSERVER_BASE_URL}/registrar-portada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosPortada)
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || '✅ Portada registrada correctamente en Azure SQL.');

            // Limpiar campos
            document.getElementById('serieNombre').value = '';
            document.getElementById('temporada').value = '';
            document.getElementById('enlaceImagen').value = '';
            document.getElementById('enlaceSitio').value = '';
            document.getElementById('enlaceSitio02').value = '';

            // Resetear vista previa
            actualizarVistaPrevia();

        } else {
            alert('❌ Error al guardar: ' + (data.error || res.statusText));
        }
    } catch (error) {
        console.error('Error al guardar en SQL Server:', error);
        alert('❌ Error al guardar: ' + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar en SQL Server';
    }
}

// ============================================================
// EVENTOS
// ============================================================
document.getElementById('btnGuardar').addEventListener('click', guardarEnSQLServer);

// Soporte para tecla Enter
document.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
        guardarEnSQLServer();
    }
});

// Inicializar vista previa
actualizarVistaPrevia();