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

const CLOUDFLARE_BASE_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

console.log(`🔌 Backend SQL Server: ${SQLSERVER_BASE_URL} (${IS_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'})`);
console.log(`☁️  Backend Cloudflare: ${CLOUDFLARE_BASE_URL}`);

// ============================================================
// FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyB6MY2y5uyum87PdUHUpY8NNh4D73Yhx4U",
    authDomain: "animes-plus-89b93.firebaseapp.com",
    projectId: "animes-plus-89b93",
    storageBucket: "animes-plus-89b93.appspot.com",
    messagingSenderId: "402867181985",
    appId: "1:402867181985:web:d695b12977fe4270dbd3e0",
    measurementId: "G-DN632G7XJT"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============================================================
// MAPEO DE SERVICIOS
// ============================================================
const SERVICE_INFO = {
    firebase:   { name: 'Firebase',   icon: '🔥', description: 'Firestore (nested originales)', color: '#1a73e8' },
    cloudflare: { name: 'Cloudflare', icon: '☁️', description: 'Cloudflare Worker (D1)',         color: '#f6821f' },
    sqlserver:  { name: 'SQL Server', icon: '🗄️', description: 'Azure SQL (Railway)',            color: '#0078D4' }
};

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let datosCargados = [];
let datosFiltrados = [];
let currentPage = 1;
const itemsPerPage = 10;
const chunkSize = 100;

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
const statEpisodios   = document.getElementById('statEpisodios');
const statServidores  = document.getElementById('statServidores');

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
    const servidores = new Set(datosFiltrados.map(d => d.servidor));

    statSeries.textContent     = series.size;
    statTemporadas.textContent = temporadas.size;
    statEpisodios.textContent  = datosFiltrados.length;
    statServidores.textContent = servidores.size;
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
                    <th>Idioma</th>
                    <th>Servidor</th>
                    <th>Episodio</th>
                    <th>URL Original</th>
                </tr>
            </thead>
            <tbody>
    `;

    datosPagina.forEach(d => {
        html += `
            <tr>
                <td><strong>${escapeHTML(d.nombreSerie)}</strong></td>
                <td>${escapeHTML(d.temporada)}</td>
                <td>${escapeHTML(d.idioma)}</td>
                <td>${escapeHTML(d.servidor)}</td>
                <td>${escapeHTML(d.episodio)}</td>
                <td class="url-cell" title="${escapeHTML(d.url)}">${truncateText(escapeHTML(d.url), 60)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    tablaDatos.innerHTML = html;
    actualizarPaginacion();
}

// ============================================================
// LECTURA DE DATOS POR SERVICIO
// ============================================================

/**
 * Lee originales desde Firebase (nested).
 * Estructura: animes-series-original/{serie}/Temporadas/{temp}/Idiomas/{idi}/Servidores/{srv}/Episodios/{ep}
 */
async function leerFirebaseOriginales(onProgress) {
    const resultados = [];
    const seriesSnapshot = await db.collection('animes-series-original').get();
    const totalSeries = seriesSnapshot.size;
    let procesadas = 0;

    for (const serieDoc of seriesSnapshot.docs) {
        const nombreSerie = serieDoc.id;

        const temporadasSnapshot = await db.collection('animes-series-original')
            .doc(nombreSerie).collection('Temporadas').get();

        for (const temporadaDoc of temporadasSnapshot.docs) {
            const temporada = temporadaDoc.id;

            const idiomasSnapshot = await db.collection('animes-series-original')
                .doc(nombreSerie).collection('Temporadas')
                .doc(temporada).collection('Idiomas').get();

            for (const idiomaDoc of idiomasSnapshot.docs) {
                const idioma = idiomaDoc.id;

                const servidoresSnapshot = await db.collection('animes-series-original')
                    .doc(nombreSerie).collection('Temporadas')
                    .doc(temporada).collection('Idiomas')
                    .doc(idioma).collection('Servidores').get();

                for (const servidorDoc of servidoresSnapshot.docs) {
                    const servidor = servidorDoc.id;

                    const episodiosSnapshot = await db.collection('animes-series-original')
                        .doc(nombreSerie).collection('Temporadas')
                        .doc(temporada).collection('Idiomas')
                        .doc(idioma).collection('Servidores')
                        .doc(servidor).collection('Episodios').get();

                    for (const epDoc of episodiosSnapshot.docs) {
                        const data = epDoc.data();
                        resultados.push({
                            nombreSerie,
                            temporada,
                            idioma,
                            servidor,
                            episodio: epDoc.id,
                            url: data.url || data.iframe || ''
                        });
                    }
                }
            }
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
 * Lee originales desde Cloudflare Worker.
 */
async function leerCloudflareOriginales(onProgress) {
    if (onProgress) onProgress(10, '10% - Obteniendo originales de Cloudflare...');

    const res = await fetch(`${CLOUDFLARE_BASE_URL}/todos-los-animes-original`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (onProgress) onProgress(80, '80% - Procesando respuesta...');

    const registros = await res.json();
    if (!Array.isArray(registros)) throw new Error('Formato de respuesta inválido');

    const resultados = registros.map(reg => ({
        nombreSerie: reg.nombreSerie,
        temporada:   reg.temporada,
        idioma:      reg.idioma,
        servidor:    reg.servidor,
        episodio:    reg.episodio,
        url:         reg.URL || reg.url || ''
    }));

    if (onProgress) onProgress(100, '100% - Completado');
    return resultados;
}

/**
 * Lee originales desde SQL Server (Railway).
 */
async function leerSQLServerOriginales(onProgress) {
    if (onProgress) onProgress(10, '10% - Obteniendo originales de Azure SQL...');

    const res = await fetch(`${SQLSERVER_BASE_URL}/todos-los-animes-original`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (onProgress) onProgress(80, '80% - Procesando respuesta...');

    const registros = await res.json();
    if (!Array.isArray(registros)) throw new Error('Formato de respuesta inválido');

    const resultados = registros.map(reg => ({
        nombreSerie: reg.nombreSerie,
        temporada:   reg.temporada,
        idioma:      reg.idioma,
        servidor:    reg.servidor,
        episodio:    reg.episodio,
        url:         reg.URL || reg.url || ''
    }));

    if (onProgress) onProgress(100, '100% - Completado');
    return resultados;
}

// ============================================================
// ESCRITURA DE DATOS POR SERVICIO
// ============================================================

/**
 * Escribe un chunk de originales en Cloudflare Worker.
 */
async function escribirCloudflareOriginales(chunk) {
    const res = await fetch(`${CLOUDFLARE_BASE_URL}/registrar-original`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registros: chunk })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
    return await res.json();
}

/**
 * Escribe un chunk de originales en SQL Server (Railway).
 */
async function escribirSQLServerOriginales(chunk) {
    const res = await fetch(`${SQLSERVER_BASE_URL}/registrar-original`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registros: chunk })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }
    return await res.json();
}

/**
 * Escribe un chunk de originales en Firebase (nested).
 */
async function escribirFirebaseOriginales(chunk) {
    let exitosos = 0;

    for (const reg of chunk) {
        try {
            const docRef = db.collection('animes-series-original')
                .doc(reg.nombreSerie)
                .collection('Temporadas')
                .doc(reg.temporada)
                .collection('Idiomas')
                .doc(reg.idioma)
                .collection('Servidores')
                .doc(reg.servidor)
                .collection('Episodios')
                .doc(reg.episodio);

            await docRef.set({
                url: reg.url || ''
            }, { merge: true });

            exitosos++;
        } catch (error) {
            console.error(`Error escribiendo en Firebase (${reg.episodio}):`, error);
        }
    }

    return { message: `${exitosos} originales guardados en Firebase`, total: exitosos };
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

    if (!confirm(`¿Transferir ${total} originales de ${SERVICE_INFO[origen].name} a ${SERVICE_INFO[destino].name}?\n\nEsto puede tomar unos segundos.`)) {
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
    let bloquesExitosos = 0;
    let bloquesFallidos = 0;
    let totalRegistrosExitosos = 0;

    try {
        for (let i = 0; i < total; i += chunkSize) {
            const chunk = datosFiltrados.slice(i, i + chunkSize);
            const bloqueActual = Math.floor(i / chunkSize) + 1;
            const totalBloques = Math.ceil(total / chunkSize);

            log(`Enviando bloque ${bloqueActual}/${totalBloques} (${chunk.length} registros)`);

            try {
                let resultado;

                if (destino === 'cloudflare') {
                    resultado = await escribirCloudflareOriginales(chunk);
                } else if (destino === 'sqlserver') {
                    resultado = await escribirSQLServerOriginales(chunk);
                } else if (destino === 'firebase') {
                    resultado = await escribirFirebaseOriginales(chunk);
                } else {
                    throw new Error(`Destino desconocido: ${destino}`);
                }

                bloquesExitosos++;
                totalRegistrosExitosos += chunk.length;
                log(`✅ Bloque ${bloqueActual} exitoso`, resultado);

            } catch (error) {
                bloquesFallidos++;
                log(`❌ Error en bloque ${bloqueActual}: ${error.message.substring(0, 150)}`);
            }

            processed += chunk.length;
            const percent = Math.round((processed / total) * 100);
            transferProgressBar.style.width = `${percent}%`;
            transferProgressBar.textContent = `${percent}%`;
            transferProgressText.textContent = `${percent}% - Bloque ${bloqueActual}/${totalBloques}`;

            await new Promise(r => setTimeout(r, 100));
        }

        let mensajeFinal = `📊 RESUMEN DE TRANSFERENCIA\n\n`;
        mensajeFinal += `🔄 Origen: ${SERVICE_INFO[origen].name}\n`;
        mensajeFinal += `🎯 Destino: ${SERVICE_INFO[destino].name}\n`;
        mensajeFinal += `✅ Bloques exitosos: ${bloquesExitosos}\n`;
        mensajeFinal += `❌ Bloques fallidos: ${bloquesFallidos}\n`;
        mensajeFinal += `📝 Registros procesados: ${processed}\n`;

        log('Transferencia completada', { bloquesExitosos, bloquesFallidos, processed });

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
            datosCargados = await leerFirebaseOriginales(onProgress);
        } else if (origen === 'cloudflare') {
            datosCargados = await leerCloudflareOriginales(onProgress);
        } else if (origen === 'sqlserver') {
            datosCargados = await leerSQLServerOriginales(onProgress);
        }

        datosFiltrados = [...datosCargados];
        mostrarDatosEnTabla();
        actualizarEstadisticas();
        btnTransferir.disabled = datosCargados.length === 0;

        log(`Originales cargados de ${SERVICE_INFO[origen].name}`, { total: datosCargados.length });

        alert(`✅ Se cargaron ${datosCargados.length} originales de ${SERVICE_INFO[origen].name}.`);

        setTimeout(() => {
            loadingProgress.style.display = 'none';
        }, 1000);

    } catch (error) {
        console.error('Error al cargar:', error);
        alert(`❌ Error al cargar originales de ${SERVICE_INFO[origen].name}: ${error.message}`);
        log(`❌ Error al cargar: ${error.message}`);
        loadingProgress.style.display = 'none';
    } finally {
        btnCargar.disabled = false;
        btnCargar.innerHTML = '<i class="fas fa-download"></i> Cargar Originales del Origen';
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
    const filterIdioma    = document.getElementById('filterIdioma').value.toLowerCase();

    datosFiltrados = datosCargados.filter(item => {
        const serieMatch  = !filterSerie     || item.nombreSerie.toLowerCase().includes(filterSerie);
        const tempMatch   = !filterTemporada || item.temporada.toLowerCase().includes(filterTemporada);
        const idiomaMatch = !filterIdioma    || item.idioma.toLowerCase().includes(filterIdioma);
        return serieMatch && tempMatch && idiomaMatch;
    });

    currentPage = 1;
    mostrarDatosEnTabla();
    actualizarEstadisticas();
});

btnLimpiarFiltro.addEventListener('click', function () {
    document.getElementById('filterSerie').value = '';
    document.getElementById('filterTemporada').value = '';
    document.getElementById('filterIdioma').value = '';
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