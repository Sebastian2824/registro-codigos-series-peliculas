import { ENV } from '../../Config/config.js';
// ============================================================
// CONFIGURACIÓN DE ENTORNO
// ============================================================
const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

const SQLSERVER_BASE_URL = IS_LOCAL
    ? 'http://localhost:3001'
    : ENV.AZURE_API_KEY_URL;

const CLOUDFLARE_BASE_URL = ENV.CLOUDFLARE_API_KEY_URL;

console.log(`🔌 Backend SQL Server: (${IS_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'})`);

// ============================================================
// FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROYECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// MAPEO DE SERVICIOS
// ============================================================
const SERVICE_INFO = {
    firebase:   { name: 'Firebase',   icon: '🔥', description: 'Firestore (nested portadas)', color: '#1a73e8' },
    cloudflare: { name: 'Cloudflare', icon: '☁️', description: 'Cloudflare Worker (D1)',       color: '#f6821f' },
    sqlserver:  { name: 'SQL Server', icon: '🗄️', description: 'Azure SQL (Railway)',          color: '#0078D4' }
};

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let datosCargados = [];
let datosFiltrados = [];
let currentPage = 1;
const itemsPerPage = 10;

// ============================================================
// DOM REFERENCES
// ============================================================
const selectSource       = document.getElementById('selectSource');
const selectDestination  = document.getElementById('selectDestination');
const sourceInfo         = document.getElementById('sourceInfo');
const destinationInfo    = document.getElementById('destinationInfo');

const btnCargar          = document.getElementById('btnCargar');
const btnTransferir      = document.getElementById('btnTransferir');
const btnLimpiar         = document.getElementById('btnLimpiar');
const btnAplicarFiltro   = document.getElementById('btnAplicarFiltro');
const btnLimpiarFiltro   = document.getElementById('btnLimpiarFiltro');

const tablaDatos         = document.getElementById('tablaDatos');
const paginationDiv      = document.getElementById('pagination');
const paginationInfo     = document.getElementById('paginationInfo');

const loadingProgress     = document.getElementById('loadingProgress');
const loadingProgressBar  = document.getElementById('loadingProgressBar');
const loadingProgressText = document.getElementById('loadingProgressText');

const transferProgress     = document.getElementById('transferProgress');
const transferProgressBar  = document.getElementById('transferProgressBar');
const transferProgressText = document.getElementById('transferProgressText');

const statSeries      = document.getElementById('statSeries');
const statTemporadas  = document.getElementById('statTemporadas');
const statPortadas    = document.getElementById('statPortadas');

const logContent = document.getElementById('logContent');
const logInfo    = document.getElementById('logInfo');

// ============================================================
// UTILIDADES
// ============================================================
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function log(title, data) {
    const timestamp = new Date().toLocaleTimeString();
    const dataStr = data ? `<br>${escapeHTML(JSON.stringify(data, null, 2))}` : '';
    logContent.innerHTML += `<div><strong>${timestamp} - ${escapeHTML(title)}</strong>${dataStr}</div><hr>`;
    logContent.scrollTop = logContent.scrollHeight;
}

function actualizarInfoServicios() {
    const src = SERVICE_INFO[selectSource.value];
    const dst = SERVICE_INFO[selectDestination.value];
    sourceInfo.textContent = `Lee datos desde ${src.description}`;
    destinationInfo.textContent = `Escribe en ${dst.description}`;
}

function actualizarEstadisticas() {
    const series = new Set(datosFiltrados.map(d => d.nombreSerie));
    const temporadas = new Set(datosFiltrados.map(d => `${d.nombreSerie}|${d.temporada}`));

    statSeries.textContent     = series.size;
    statTemporadas.textContent = temporadas.size;
    statPortadas.textContent   = datosFiltrados.length;
}

function actualizarPaginacion() {
    const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage) || 1;
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages} (${datosFiltrados.length} registros)`;

    document.getElementById('btnFirstPage').disabled = currentPage === 1;
    document.getElementById('btnPrevPage').disabled  = currentPage === 1;
    document.getElementById('btnNextPage').disabled  = currentPage === totalPages;
    document.getElementById('btnLastPage').disabled  = currentPage === totalPages;
    paginationDiv.style.display = datosFiltrados.length > 0 ? 'flex' : 'none';
}

function mostrarDatosEnTabla() {
    if (datosFiltrados.length === 0) {
        tablaDatos.innerHTML = `
            <p style="text-align: center; padding: 40px; color: #94a3b8;">
                <i class="fas fa-info-circle" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
                No hay datos para mostrar
            </p>
        `;
        paginationDiv.style.display = 'none';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, datosFiltrados.length);
    const datosPagina = datosFiltrados.slice(startIndex, endIndex);

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Serie</th>
                    <th>Temporada</th>
                    <th>Imagen</th>
                    <th>Sitio</th>
                    <th>Sitio 02</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    datosPagina.forEach(d => {
        html += `
            <tr>
                <td><strong>${escapeHTML(d.nombreSerie)}</strong></td>
                <td>${escapeHTML(d.temporada)}</td>
                <td>
                    ${d.imagen ? `
                        <img src="${escapeHTML(d.imagen)}" alt="Portada" class="image-preview" onerror="this.style.display='none'">
                        <div class="link-cell">${truncateText(escapeHTML(d.imagen), 30)}</div>
                    ` : 'Sin imagen'}
                </td>
                <td class="link-cell">${d.sitio ? truncateText(escapeHTML(d.sitio), 40) : ''}</td>
                <td class="link-cell">${d.sitio02 ? truncateText(escapeHTML(d.sitio02), 40) : ''}</td>
                <td class="actions">
                    <button class="btn-sm primary" onclick="verDetalles('${escapeHTML(d.nombreSerie)}', '${escapeHTML(d.temporada)}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm success" onclick="probarImagen('${escapeHTML(d.imagen || '')}')"><i class="fas fa-image"></i></button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    tablaDatos.innerHTML = html;
    actualizarPaginacion();
}

// ============================================================
// ACCIONES AUXILIARES
// ============================================================
window.verDetalles = function (serie, temporada) {
    const datos = datosFiltrados.find(d => d.nombreSerie === serie && d.temporada === temporada);
    if (datos) {
        alert(`Detalles de ${serie} - ${temporada}:\n\nImagen: ${datos.imagen || 'No disponible'}\nSitio: ${datos.sitio || 'No disponible'}\nSitio 02: ${datos.sitio02 || 'No disponible'}`);
    }
};

window.probarImagen = function (url) {
    if (!url) { alert('No hay URL de imagen para probar'); return; }
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html>
            <head><title>Prueba de Imagen</title></head>
            <body style="display:flex; justify-content:center; align-items:center; height:100vh; margin:0; background:#f5f5f5; font-family:sans-serif;">
                <div style="text-align:center; background:white; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1); max-width:90vw;">
                    <h2>Prueba de Imagen</h2>
                    <img src="${url}" alt="Imagen" style="max-width:90vw; max-height:70vh; border:1px solid #ccc; border-radius:8px;"
                         onerror="this.src='https://via.placeholder.com/400x300?text=Error+al+cargar'">
                    <p style="margin-top:16px; word-break:break-all; max-width:600px; font-size:13px;">URL: ${url}</p>
                    <button onclick="window.close()" style="margin-top:12px; padding:10px 20px; background:#0078D4; color:white; border:none; border-radius:8px; cursor:pointer;">Cerrar</button>
                </div>
            </body>
        </html>
    `);
};

// ============================================================
// LECTURA DE DATOS POR SERVICIO
// ============================================================

/**
 * Lee portadas desde Firebase (nested).
 * Estructura: animes-series-portadas/{serie}/Temporadas/{temporada}
 */
async function leerFirebasePortadas(onProgress) {
    const resultados = [];
    const seriesSnapshot = await db.collection('animes-series-portadas').get();
    const totalSeries = seriesSnapshot.size;
    let procesadas = 0;

    for (const serieDoc of seriesSnapshot.docs) {
        const nombreSerie = serieDoc.id;
        const temporadasSnapshot = await db.collection('animes-series-portadas')
            .doc(nombreSerie).collection('Temporadas').get();

        for (const temporadaDoc of temporadasSnapshot.docs) {
            const data = temporadaDoc.data();
            resultados.push({
                nombreSerie,
                temporada: temporadaDoc.id,
                imagen:    data.imagen   || '',
                sitio:     data.sitio    || '',
                sitio02:   data.sitio02  || ''
            });
        }

        procesadas++;
        if (onProgress) {
            const percent = Math.round((procesadas / totalSeries) * 100);
            onProgress(percent, `${percent}% (${procesadas}/${totalSeries} series)`);
        }
    }

    return resultados;
}

/**
 * Lee portadas desde Cloudflare Worker.
 */
async function leerCloudflarePortadas(onProgress) {
    if (onProgress) onProgress(10, '10% - Obteniendo portadas de Cloudflare...');

    const res = await fetch(`${CLOUDFLARE_BASE_URL}/todos-los-animes-portadas`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (onProgress) onProgress(80, '80% - Procesando respuesta...');

    const registros = await res.json();
    if (!Array.isArray(registros)) throw new Error('Formato de respuesta inválido');

    const resultados = registros.map(reg => ({
        nombreSerie: reg.nombreSerie,
        temporada:   reg.temporada,
        imagen:      reg.imagen   || '',
        sitio:       reg.sitio    || '',
        sitio02:     reg.sitio02  || ''
    }));

    if (onProgress) onProgress(100, '100% - Completado');
    return resultados;
}

/**
 * Lee portadas desde SQL Server (Railway).
 */
async function leerSQLServerPortadas(onProgress) {
    if (onProgress) onProgress(10, '10% - Obteniendo portadas de Azure SQL...');

    const res = await fetch(`${SQLSERVER_BASE_URL}/todos-los-animes-portadas`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (onProgress) onProgress(80, '80% - Procesando respuesta...');

    const registros = await res.json();
    if (!Array.isArray(registros)) throw new Error('Formato de respuesta inválido');

    const resultados = registros.map(reg => ({
        nombreSerie: reg.nombreSerie,
        temporada:   reg.temporada,
        imagen:      reg.imagen   || '',
        sitio:       reg.sitio    || '',
        sitio02:     reg.sitio02  || ''
    }));

    if (onProgress) onProgress(100, '100% - Completado');
    return resultados;
}

// ============================================================
// ESCRITURA DE DATOS POR SERVICIO
// ============================================================

/**
 * Escribe una portada en Cloudflare Worker.
 */
async function escribirCloudflarePortada(portada) {
    const res = await fetch(`${CLOUDFLARE_BASE_URL}/registrar-portada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombreSerie: portada.nombreSerie,
            temporada:   portada.temporada,
            imagen:      portada.imagen  || null,
            sitio:       portada.sitio   || null,
            sitio02:     portada.sitio02 || null
        })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
    return await res.json();
}

/**
 * Escribe una portada en SQL Server (Railway).
 */
async function escribirSQLServerPortada(portada) {
    const res = await fetch(`${SQLSERVER_BASE_URL}/registrar-portada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombreSerie: portada.nombreSerie,
            temporada:   portada.temporada,
            imagen:      portada.imagen  || null,
            sitio:       portada.sitio   || null,
            sitio02:     portada.sitio02 || null
        })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
    return await res.json();
}

/**
 * Escribe una portada en Firebase (nested).
 */
async function escribirFirebasePortada(portada) {
    const docRef = db.collection('animes-series-portadas')
        .doc(portada.nombreSerie)
        .collection('Temporadas')
        .doc(portada.temporada);

    await docRef.set({
        imagen:  portada.imagen  || '',
        sitio:   portada.sitio   || '',
        sitio02: portada.sitio02 || ''
    }, { merge: true });

    return { message: `Portada ${portada.nombreSerie}/${portada.temporada} guardada en Firebase`, total: 1 };
}

// ============================================================
// FUNCIÓN GENÉRICA DE TRANSFERENCIA
// ============================================================
async function transferirDatos() {
    if (datosFiltrados.length === 0) {
        alert('No hay datos para transferir.');
        return;
    }

    const origen = selectSource.value;
    const destino = selectDestination.value;

    if (origen === destino) {
        alert('El origen y el destino no pueden ser iguales.');
        return;
    }

    const total = datosFiltrados.length;

    if (!confirm(`¿Transferir ${total} portadas de ${SERVICE_INFO[origen].name} a ${SERVICE_INFO[destino].name}?\n\nEsto puede tomar unos segundos.`)) {
        return;
    }

    transferProgress.style.display = 'block';
    transferProgressBar.style.width = '0%';
    transferProgressBar.textContent = '0%';
    transferProgressText.textContent = '0%';

    btnTransferir.disabled = true;
    btnTransferir.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transfiriendo...';

    log(`Iniciando transferencia: ${SERVICE_INFO[origen].name} → ${SERVICE_INFO[destino].name}`, { total });

    let processed = 0;
    let exitosos = 0;
    let fallidos = 0;

    try {
        for (const portada of datosFiltrados) {
            try {
                if (destino === 'cloudflare') {
                    await escribirCloudflarePortada(portada);
                } else if (destino === 'sqlserver') {
                    await escribirSQLServerPortada(portada);
                } else if (destino === 'firebase') {
                    await escribirFirebasePortada(portada);
                } else {
                    throw new Error(`Destino desconocido: ${destino}`);
                }

                exitosos++;
            } catch (error) {
                fallidos++;
                log(`❌ Error con "${portada.nombreSerie}/${portada.temporada}": ${error.message.substring(0, 150)}`);
            }

            processed++;
            const percent = Math.round((processed / total) * 100);
            transferProgressBar.style.width = `${percent}%`;
            transferProgressBar.textContent = `${percent}%`;
            transferProgressText.textContent = `${percent}% - ${processed}/${total} portadas`;
        }

        let mensajeFinal = `📊 RESUMEN DE TRANSFERENCIA\n\n`;
        mensajeFinal += `🔄 Origen: ${SERVICE_INFO[origen].name}\n`;
        mensajeFinal += `🎯 Destino: ${SERVICE_INFO[destino].name}\n`;
        mensajeFinal += `✔️ Portadas exitosas: ${exitosos}\n`;
        mensajeFinal += `❌ Portadas fallidas: ${fallidos}\n`;
        mensajeFinal += `📝 Total procesadas: ${processed}\n`;

        log('Transferencia completada', { exitosos, fallidos, processed });

        transferProgressText.textContent = '✅ Transferencia completada';
        setTimeout(() => {
            transferProgress.style.display = 'none';
        }, 3000);

        alert(mensajeFinal);

    } catch (error) {
        console.error('Error en transferencia:', error);
        log(`❌ Error general: ${error.message}`);
        alert(`❌ Error en la transferencia: ${error.message}`);
        transferProgress.style.display = 'none';
    } finally {
        btnTransferir.disabled = false;
        btnTransferir.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Transferir al Destino';
    }
}

// ============================================================
// EVENTOS
// ============================================================

selectSource.addEventListener('change', () => {
    actualizarInfoServicios();
    if (selectSource.value === selectDestination.value) {
        const opciones = ['firebase', 'cloudflare', 'sqlserver'];
        const siguiente = opciones.find(o => o !== selectSource.value);
        selectDestination.value = siguiente;
        actualizarInfoServicios();
    }
});

selectDestination.addEventListener('change', () => {
    actualizarInfoServicios();
    if (selectSource.value === selectDestination.value) {
        alert('⚠️ El origen y el destino no pueden ser iguales');
        const opciones = ['firebase', 'cloudflare', 'sqlserver'];
        const anterior = opciones.find(o => o !== selectDestination.value);
        selectDestination.value = anterior;
        actualizarInfoServicios();
    }
});

btnCargar.addEventListener('click', async function () {
    const origen = selectSource.value;

    btnCargar.disabled = true;
    btnCargar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
    loadingProgress.style.display = 'block';
    loadingProgressBar.style.width = '0%';
    loadingProgressBar.textContent = '0%';
    loadingProgressText.textContent = 'Iniciando...';

    datosCargados = [];
    datosFiltrados = [];
    currentPage = 1;

    try {
        const onProgress = (percent, text) => {
            loadingProgressBar.style.width = `${percent}%`;
            loadingProgressBar.textContent = `${percent}%`;
            loadingProgressText.textContent = text;
        };

        if (origen === 'firebase') {
            datosCargados = await leerFirebasePortadas(onProgress);
        } else if (origen === 'cloudflare') {
            datosCargados = await leerCloudflarePortadas(onProgress);
        } else if (origen === 'sqlserver') {
            datosCargados = await leerSQLServerPortadas(onProgress);
        }

        datosFiltrados = [...datosCargados];
        mostrarDatosEnTabla();
        actualizarEstadisticas();
        btnTransferir.disabled = datosCargados.length === 0;

        log(`Portadas cargadas de ${SERVICE_INFO[origen].name}`, { total: datosCargados.length });

        alert(`✅ Se cargaron ${datosCargados.length} portadas de ${SERVICE_INFO[origen].name}.`);

        setTimeout(() => {
            loadingProgress.style.display = 'none';
        }, 1000);

    } catch (error) {
        console.error('Error al cargar:', error);
        alert(`❌ Error al cargar portadas de ${SERVICE_INFO[origen].name}: ${error.message}`);
        log(`❌ Error al cargar: ${error.message}`);
        loadingProgress.style.display = 'none';
    } finally {
        btnCargar.disabled = false;
        btnCargar.innerHTML = '<i class="fas fa-download"></i> Cargar Portadas del Origen';
    }
});

btnTransferir.addEventListener('click', transferirDatos);

btnLimpiar.addEventListener('click', function () {
    datosCargados = [];
    datosFiltrados = [];
    currentPage = 1;
    mostrarDatosEnTabla();
    actualizarEstadisticas();
    btnTransferir.disabled = true;
    logContent.innerHTML = '';
    paginationDiv.style.display = 'none';
});

btnAplicarFiltro.addEventListener('click', function () {
    const filterSerie     = document.getElementById('filterSerie').value.toLowerCase();
    const filterTemporada = document.getElementById('filterTemporada').value.toLowerCase();

    datosFiltrados = datosCargados.filter(item => {
        const serieMatch = !filterSerie || item.nombreSerie.toLowerCase().includes(filterSerie);
        const tempMatch  = !filterTemporada || item.temporada.toLowerCase().includes(filterTemporada);
        return serieMatch && tempMatch;
    });

    currentPage = 1;
    mostrarDatosEnTabla();
    actualizarEstadisticas();
});

btnLimpiarFiltro.addEventListener('click', function () {
    document.getElementById('filterSerie').value = '';
    document.getElementById('filterTemporada').value = '';
    datosFiltrados = [...datosCargados];
    currentPage = 1;
    mostrarDatosEnTabla();
    actualizarEstadisticas();
});

document.getElementById('btnFirstPage').addEventListener('click', () => { currentPage = 1; mostrarDatosEnTabla(); });
document.getElementById('btnPrevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; mostrarDatosEnTabla(); } });
document.getElementById('btnNextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; mostrarDatosEnTabla(); }
});
document.getElementById('btnLastPage').addEventListener('click', () => {
    const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);
    currentPage = totalPages;
    mostrarDatosEnTabla();
});

document.getElementById('btnToggleLog').addEventListener('click', function () {
    logInfo.style.display = logInfo.style.display === 'none' ? 'block' : 'none';
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
actualizarInfoServicios();
mostrarDatosEnTabla();
actualizarEstadisticas();
paginationDiv.style.display = 'none';

log('Frontend listo', { origen: selectSource.value, destino: selectDestination.value });