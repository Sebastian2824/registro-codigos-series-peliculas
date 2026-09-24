 import { ENV } from '../../Config/config.js';
 // ========== IMPORTS ==========
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
    import { getFirestore, collection, doc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

    // ========== CONFIGURACIÓN ==========
    const firebaseConfig = {
      apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROYECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

const SQLSERVER_BASE_URL = IS_LOCAL
    ? 'http://localhost:3001'
    : ENV.AZURE_API_KEY_URL;

console.log(`🔌 Backend SQL Server: ${SQLSERVER_BASE_URL} (${IS_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'})`);

    const CLOUDFLARE_BASE_URL = ENV.CLOUDFLARE_API_KEY_URL;

    // ========== DOM REFERENCES ==========
    const selectSerie = document.getElementById('serie');
    const selectTemporada = document.getElementById('temporada');
    const selectIdioma = document.getElementById('idioma');
    const selectServidor = document.getElementById('servidor');
    const selectEpisodio = document.getElementById('episodio');
    const reproductor = document.getElementById('reproductor');
    const episodeInfo = document.getElementById('episodeInfo');
    const btnFirebase = document.getElementById('btnFirebase');
    const btnCloudflare = document.getElementById('btnCloudflare');
    const btnSQLServer = document.getElementById('btnSQLServer');
    const servicioInfo = document.getElementById('servicioInfo');

    // ========== ESTADO ==========
    let servicioActual = 'firebase';

    // ========== FUNCIONES DE UTILIDAD ==========
    function setLoading(select) {
      select.disabled = true;
      select.innerHTML = '<option value="">Cargando...</option>';
    }

    function setError(select, msg) {
      select.disabled = true;
      select.innerHTML = `<option value="">${msg}</option>`;
    }

    function setSelectOptions(select, options, placeholder = 'Seleccione') {
      select.innerHTML = `<option value="">${placeholder}</option>`;
      if (options && options.length > 0) {
        options.forEach(opt => {
          const val = typeof opt === 'string' ? opt : opt.id || opt;
          const label = typeof opt === 'string' ? opt : opt.nombre || opt.id || opt;
          select.innerHTML += `<option value="${val}">${label}</option>`;
        });
        select.disabled = false;
      } else {
        select.disabled = true;
        select.innerHTML = '<option value="">Sin opciones</option>';
      }
    }

    function resetSelects(...selects) {
      selects.forEach(sel => {
        sel.disabled = true;
        sel.innerHTML = '<option value="">Seleccione</option>';
      });
    }

    function showPlaceholder(message = 'Selecciona un episodio para ver el video', icon = 'fa-film') {
      reproductor.innerHTML = `
        <div class="placeholder">
          <i class="fas ${icon}"></i>
          <p>${message}</p>
        </div>
      `;
    }

    function showError(message) {
      reproductor.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          ${message}
        </div>
      `;
    }

    function showWarning(message) {
      reproductor.innerHTML = `
        <div class="warning-message">
          <i class="fas fa-exclamation-triangle"></i>
          ${message}
        </div>
      `;
    }

    function renderIframe(iframeContent, servidor) {
      reproductor.innerHTML = '';
      const isJumpshare = servidor && servidor.toLowerCase().includes('jumpshare');

      if (isJumpshare) {
        const container = document.createElement('div');
        container.className = 'jumpshare-container';
        let modified = iframeContent;
        if (modified.includes('style="')) {
          modified = modified.replace(
            /style="[^"]*"/,
            'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"'
          );
        } else {
          modified = modified.replace(
            '<iframe',
            '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"'
          );
        }
        container.innerHTML = modified;
        reproductor.appendChild(container);
      } else {
        reproductor.innerHTML = iframeContent;
        // Asegurar que los iframes tengan estilos básicos
        reproductor.querySelectorAll('iframe').forEach(ifr => {
          ifr.style.width = '100%';
          ifr.style.minHeight = '340px';
          ifr.style.border = 'none';
          ifr.style.borderRadius = '12px';
        });
      }
    }

    // ========== FUNCIONES DE CARGA (Firebase) ==========
    async function cargarSeriesFirebase() {
      try {
        const snapshot = await getDocs(collection(db, 'animes-series'));
        const series = [];
        snapshot.forEach(doc => series.push(doc.id));
        setSelectOptions(selectSerie, series.sort());
      } catch (e) {
        console.error(e);
        setError(selectSerie, 'Error al cargar series');
      }
    }

    async function cargarTemporadasFirebase(serie) {
      try {
        const snapshot = await getDocs(collection(db, 'animes-series', serie, 'Temporadas'));
        const temps = [];
        snapshot.forEach(doc => temps.push(doc.id));
        setSelectOptions(selectTemporada, temps.sort());
        resetSelects(selectIdioma, selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectTemporada, 'Error');
      }
    }

    async function cargarIdiomasFirebase(serie, temporada) {
      try {
        const snapshot = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas'));
        const idiomas = [];
        snapshot.forEach(doc => idiomas.push(doc.id));
        setSelectOptions(selectIdioma, idiomas.sort());
        resetSelects(selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectIdioma, 'Error');
      }
    }

    async function cargarServidoresFirebase(serie, temporada, idioma) {
      try {
        const snapshot = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores'));
        const servidores = [];
        snapshot.forEach(doc => servidores.push(doc.id));
        setSelectOptions(selectServidor, servidores.sort());
        resetSelects(selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectServidor, 'Error');
      }
    }

    async function cargarEpisodiosFirebase(serie, temporada, idioma, servidor) {
      try {
        const snapshot = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores', servidor, 'Episodios'));
        const episodios = [];
        snapshot.forEach(doc => episodios.push(doc.id));
        setSelectOptions(selectEpisodio, episodios.sort());
        showPlaceholder('Selecciona un episodio para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectEpisodio, 'Error');
      }
    }

    async function mostrarVideoFirebase(serie, temporada, idioma, servidor, episodio) {
      try {
        const docRef = doc(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores', servidor, 'Episodios', episodio);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.iframe) {
            renderIframe(data.iframe, servidor);
            episodeInfo.textContent = `${serie} · ${temporada} · ${idioma} · ${servidor} · ${episodio}`;
          } else {
            showWarning('El campo "iframe" no está definido en este episodio.');
          }
        } else {
          showError('Episodio no encontrado en Firebase.');
        }
      } catch (e) {
        console.error(e);
        showError('Error al cargar el episodio desde Firebase.');
      }
    }

    // ========== FUNCIONES DE CARGA (Cloudflare) ==========
    async function cargarSeriesCloudflare() {
      try {
        const res = await fetch(`${CLOUDFLARE_BASE_URL}/nombres-series`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectSerie, data);
      } catch (e) {
        console.error(e);
        setError(selectSerie, 'Error al cargar series');
      }
    }

    async function cargarTemporadasCloudflare(serie) {
      try {
        const res = await fetch(`${CLOUDFLARE_BASE_URL}/temporadas?serie=${encodeURIComponent(serie)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectTemporada, data);
        resetSelects(selectIdioma, selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectTemporada, 'Error');
      }
    }

    async function cargarIdiomasCloudflare(serie, temporada) {
      try {
        const res = await fetch(`${CLOUDFLARE_BASE_URL}/idiomas?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectIdioma, data);
        resetSelects(selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectIdioma, 'Error');
      }
    }

    async function cargarServidoresCloudflare(serie, temporada, idioma) {
      try {
        const res = await fetch(`${CLOUDFLARE_BASE_URL}/servidores?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectServidor, data);
        resetSelects(selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectServidor, 'Error');
      }
    }

    async function cargarEpisodiosCloudflare(serie, temporada, idioma, servidor) {
      try {
        const res = await fetch(`${CLOUDFLARE_BASE_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        const episodios = data.map(e => e.episodio);
        setSelectOptions(selectEpisodio, episodios);
        showPlaceholder('Selecciona un episodio para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } catch (e) {
        console.error(e);
        setError(selectEpisodio, 'Error');
      }
    }

    async function mostrarVideoCloudflare(serie, temporada, idioma, servidor, episodio) {
      try {
        const res = await fetch(`${CLOUDFLARE_BASE_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        const ep = data.find(e => e.episodio === episodio);
        if (ep && ep.iframe) {
          renderIframe(ep.iframe, servidor);
          episodeInfo.textContent = `${serie} · ${temporada} · ${idioma} · ${servidor} · ${episodio}`;
        } else {
          showWarning('El campo "iframe" no está definido en este episodio.');
        }
      } catch (e) {
        console.error(e);
        showError('Error al cargar el episodio desde Cloudflare.');
      }
    }

    // ========== FUNCIONES DE CARGA (SQL Server / Azure) ==========
async function cargarSeriesSQLServer() {
    try {
        const res = await fetch(`${SQLSERVER_BASE_URL}/nombres-series`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectSerie, data);
    } catch (e) {
        console.error(e);
        setError(selectSerie, 'Error al cargar series');
    }
}

async function cargarTemporadasSQLServer(serie) {
    try {
        const res = await fetch(`${SQLSERVER_BASE_URL}/temporadas?serie=${encodeURIComponent(serie)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectTemporada, data);
        resetSelects(selectIdioma, selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
    } catch (e) {
        console.error(e);
        setError(selectTemporada, 'Error');
    }
}

async function cargarIdiomasSQLServer(serie, temporada) {
    try {
        const res = await fetch(`${SQLSERVER_BASE_URL}/idiomas?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectIdioma, data);
        resetSelects(selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
    } catch (e) {
        console.error(e);
        setError(selectIdioma, 'Error');
    }
}

async function cargarServidoresSQLServer(serie, temporada, idioma) {
    try {
        const res = await fetch(`${SQLSERVER_BASE_URL}/servidores?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}`);
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        setSelectOptions(selectServidor, data);
        resetSelects(selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
    } catch (e) {
        console.error(e);
        setError(selectServidor, 'Error');
    }
}

async function cargarEpisodiosSQLServer(serie, temporada, idioma, servidor) {
    try {
        const res = await fetch(
            `${SQLSERVER_BASE_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`
        );
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        const episodios = data.map(e => e.episodio);
        setSelectOptions(selectEpisodio, episodios);
        showPlaceholder('Selecciona un episodio para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
    } catch (e) {
        console.error(e);
        setError(selectEpisodio, 'Error');
    }
}

async function mostrarVideoSQLServer(serie, temporada, idioma, servidor, episodio) {
    try {
        const res = await fetch(
            `${SQLSERVER_BASE_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`
        );
        if (!res.ok) throw new Error('Error HTTP');
        const data = await res.json();
        const ep = data.find(e => e.episodio === episodio);
        if (ep && ep.iframe) {
            renderIframe(ep.iframe, servidor);
            episodeInfo.textContent = `${serie} · ${temporada} · ${idioma} · ${servidor} · ${episodio}`;
        } else {
            showWarning('El campo "iframe" no está definido en este episodio.');
        }
    } catch (e) {
        console.error(e);
        showError('Error al cargar el episodio desde Azure SQL.');
    }
}

    // ========== FUNCIONES UNIFICADAS ==========
function cargarSeries() {
    if (servicioActual === 'firebase')   return cargarSeriesFirebase();
    if (servicioActual === 'cloudflare') return cargarSeriesCloudflare();
    return cargarSeriesSQLServer();
}

function cargarTemporadas(serie) {
    if (servicioActual === 'firebase')   return cargarTemporadasFirebase(serie);
    if (servicioActual === 'cloudflare') return cargarTemporadasCloudflare(serie);
    return cargarTemporadasSQLServer(serie);
}

function cargarIdiomas(serie, temporada) {
    if (servicioActual === 'firebase')   return cargarIdiomasFirebase(serie, temporada);
    if (servicioActual === 'cloudflare') return cargarIdiomasCloudflare(serie, temporada);
    return cargarIdiomasSQLServer(serie, temporada);
}

function cargarServidores(serie, temporada, idioma) {
    if (servicioActual === 'firebase')   return cargarServidoresFirebase(serie, temporada, idioma);
    if (servicioActual === 'cloudflare') return cargarServidoresCloudflare(serie, temporada, idioma);
    return cargarServidoresSQLServer(serie, temporada, idioma);
}

function cargarEpisodios(serie, temporada, idioma, servidor) {
    if (servicioActual === 'firebase')   return cargarEpisodiosFirebase(serie, temporada, idioma, servidor);
    if (servicioActual === 'cloudflare') return cargarEpisodiosCloudflare(serie, temporada, idioma, servidor);
    return cargarEpisodiosSQLServer(serie, temporada, idioma, servidor);
}

function mostrarVideo(serie, temporada, idioma, servidor, episodio) {
    if (servicioActual === 'firebase')   return mostrarVideoFirebase(serie, temporada, idioma, servidor, episodio);
    if (servicioActual === 'cloudflare') return mostrarVideoCloudflare(serie, temporada, idioma, servidor, episodio);
    return mostrarVideoSQLServer(serie, temporada, idioma, servidor, episodio);
}

    // ========== CAMBIAR SERVICIO ==========
    // ========== CAMBIAR SERVICIO ==========
function cambiarServicio(nuevo) {
    servicioActual = nuevo;

    btnFirebase.classList.toggle('active', nuevo === 'firebase');
    btnCloudflare.classList.toggle('active', nuevo === 'cloudflare');
    btnSQLServer.classList.toggle('active', nuevo === 'sqlserver');  // 👈 NUEVO

    const nombres = {
        firebase: 'Firebase',
        cloudflare: 'Cloudflare',
        sqlserver: 'SQL Server'
    };
    servicioInfo.innerHTML = `<i class="fas fa-info-circle"></i> Usando: <strong>${nombres[nuevo]}</strong>`;

    // Resetear selects
    resetSelects(selectSerie, selectTemporada, selectIdioma, selectServidor, selectEpisodio);
    // Resetear visor
    showPlaceholder('Selecciona los filtros para ver el video');
    episodeInfo.textContent = 'Ningún episodio seleccionado';
    // Cargar series del nuevo servicio
    cargarSeries();
}

    // ========== EVENT LISTENERS ==========
    selectSerie.addEventListener('change', async () => {
      const serie = selectSerie.value;
      if (serie) {
        await cargarTemporadas(serie);
        resetSelects(selectIdioma, selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } else {
        resetSelects(selectTemporada, selectIdioma, selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      }
    });

    selectTemporada.addEventListener('change', async () => {
      const serie = selectSerie.value;
      const temporada = selectTemporada.value;
      if (temporada) {
        await cargarIdiomas(serie, temporada);
        resetSelects(selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } else {
        resetSelects(selectIdioma, selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      }
    });

    selectIdioma.addEventListener('change', async () => {
      const serie = selectSerie.value;
      const temporada = selectTemporada.value;
      const idioma = selectIdioma.value;
      if (idioma) {
        await cargarServidores(serie, temporada, idioma);
        resetSelects(selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } else {
        resetSelects(selectServidor, selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      }
    });

    selectServidor.addEventListener('change', async () => {
      const serie = selectSerie.value;
      const temporada = selectTemporada.value;
      const idioma = selectIdioma.value;
      const servidor = selectServidor.value;
      if (servidor) {
        await cargarEpisodios(serie, temporada, idioma, servidor);
        showPlaceholder('Selecciona un episodio para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      } else {
        resetSelects(selectEpisodio);
        showPlaceholder('Selecciona los filtros para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      }
    });

    selectEpisodio.addEventListener('change', () => {
      const serie = selectSerie.value;
      const temporada = selectTemporada.value;
      const idioma = selectIdioma.value;
      const servidor = selectServidor.value;
      const episodio = selectEpisodio.value;
      if (episodio) {
        mostrarVideo(serie, temporada, idioma, servidor, episodio);
      } else {
        showPlaceholder('Selecciona un episodio para ver el video');
        episodeInfo.textContent = 'Ningún episodio seleccionado';
      }
    });

    btnFirebase.addEventListener('click', () => cambiarServicio('firebase'));
    btnCloudflare.addEventListener('click', () => cambiarServicio('cloudflare'));
    btnSQLServer.addEventListener('click', () => cambiarServicio('sqlserver'));

    // ========== INICIALIZACIÓN ==========
    // Deshabilitar selects secundarios al inicio
    resetSelects(selectTemporada, selectIdioma, selectServidor, selectEpisodio);
    showPlaceholder('Selecciona los filtros para ver el video');
    cargarSeries();