   // ========== IMPORTS ==========
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  import { getFirestore, collection, doc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

  // ========== CONFIGURACIÓN ==========
  const firebaseConfig = {
    apiKey: "AIzaSyB6MY2y5uyum87PdUHUpY8NNh4D73Yhx4U",
    authDomain: "animes-plus-89b93.firebaseapp.com",
    projectId: "animes-plus-89b93",
    storageBucket: "animes-plus-89b93.appspot.com",
    messagingSenderId: "402867181985",
    appId: "1:402867181985:web:d695b12977fe4270dbd3e0",
    measurementId: "G-DN632G7XJT"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const CLOUDFLARE_BASE_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

  // ========== DOM REFERENCES ==========
  const selectSerie = document.getElementById('serie');
  const selectTemporada = document.getElementById('temporada');
  const selectIdioma = document.getElementById('idioma');
  const selectEpisodio = document.getElementById('episodio');
  const btnFirebase = document.getElementById('btnFirebase');
  const btnCloudflare = document.getElementById('btnCloudflare');
  const servicioInfo = document.getElementById('servicioInfo');
  const btnGenerar = document.getElementById('btnGenerar');
  const statusMsg = document.getElementById('statusMsg');

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

  function actualizarBoton() {
    const serie = selectSerie.value;
    const temp = selectTemporada.value;
    const idioma = selectIdioma.value;
    if (serie && temp && idioma) {
      btnGenerar.classList.add('active');
      statusMsg.textContent = 'Listo para generar el HTML.';
      statusMsg.className = 'status-msg';
    } else {
      btnGenerar.classList.remove('active');
      statusMsg.textContent = 'Selecciona serie, temporada e idioma para habilitar la generación.';
      statusMsg.className = 'status-msg';
    }
  }

  // ========== FUNCIONES DE CARGA (Firebase) ==========
  async function cargarSeriesFirebase() {
    try {
      const snapshot = await getDocs(collection(db, 'animes-series'));
      const series = [];
      snapshot.forEach(doc => series.push(doc.id));
      setSelectOptions(selectSerie, series.sort());
      resetSelects(selectTemporada, selectIdioma, selectEpisodio);
      actualizarBoton();
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
      resetSelects(selectIdioma, selectEpisodio);
      actualizarBoton();
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
      resetSelects(selectEpisodio);
      actualizarBoton();
    } catch (e) {
      console.error(e);
      setError(selectIdioma, 'Error');
    }
  }

  async function cargarEpisodiosFirebase(serie, temporada, idioma) {
    try {
      const servidoresSnap = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores'));
      const episodiosSet = new Set();
      for (const servDoc of servidoresSnap.docs) {
        const servidor = servDoc.id;
        const epsSnap = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores', servidor, 'Episodios'));
        epsSnap.forEach(epDoc => episodiosSet.add(epDoc.id));
      }
      const episodios = Array.from(episodiosSet).sort();
      setSelectOptions(selectEpisodio, episodios, 'Todos los episodios');
      actualizarBoton();
    } catch (e) {
      console.error(e);
      setError(selectEpisodio, 'Error');
    }
  }

  // ========== FUNCIONES DE CARGA (Cloudflare) ==========
  async function cargarSeriesCloudflare() {
    try {
      const res = await fetch(`${CLOUDFLARE_BASE_URL}/nombres-series`);
      if (!res.ok) throw new Error('Error HTTP');
      const data = await res.json();
      setSelectOptions(selectSerie, data);
      resetSelects(selectTemporada, selectIdioma, selectEpisodio);
      actualizarBoton();
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
      resetSelects(selectIdioma, selectEpisodio);
      actualizarBoton();
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
      resetSelects(selectEpisodio);
      actualizarBoton();
    } catch (e) {
      console.error(e);
      setError(selectIdioma, 'Error');
    }
  }

  async function cargarEpisodiosCloudflare(serie, temporada, idioma) {
    try {
      const resServidores = await fetch(`${CLOUDFLARE_BASE_URL}/servidores?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}`);
      if (!resServidores.ok) throw new Error('Error al obtener servidores');
      const servidores = await resServidores.json();
      const episodiosSet = new Set();
      for (const serv of servidores) {
        const resEps = await fetch(`${CLOUDFLARE_BASE_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(serv)}`);
        if (resEps.ok) {
          const eps = await resEps.json();
          eps.forEach(ep => episodiosSet.add(ep.episodio));
        }
      }
      const episodios = Array.from(episodiosSet).sort();
      setSelectOptions(selectEpisodio, episodios, 'Todos los episodios');
      actualizarBoton();
    } catch (e) {
      console.error(e);
      setError(selectEpisodio, 'Error');
    }
  }

  // ========== FUNCIONES UNIFICADAS ==========
  function cargarSeries() {
    return servicioActual === 'firebase' ? cargarSeriesFirebase() : cargarSeriesCloudflare();
  }
  function cargarTemporadas(serie) {
    return servicioActual === 'firebase' ? cargarTemporadasFirebase(serie) : cargarTemporadasCloudflare(serie);
  }
  function cargarIdiomas(serie, temporada) {
    return servicioActual === 'firebase' ? cargarIdiomasFirebase(serie, temporada) : cargarIdiomasCloudflare(serie, temporada);
  }
  function cargarEpisodios(serie, temporada, idioma) {
    return servicioActual === 'firebase' ? cargarEpisodiosFirebase(serie, temporada, idioma) : cargarEpisodiosCloudflare(serie, temporada, idioma);
  }

  // ========== OBTENER DATOS PARA GENERAR HTML ==========
  async function obtenerDatosParaGenerar(serie, temporada, idioma, episodioSeleccionado) {
    const resultado = { servidores: [] };

    if (servicioActual === 'firebase') {
      const servSnap = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores'));
      for (const servDoc of servSnap.docs) {
        const servidor = servDoc.id;
        const epsSnap = await getDocs(collection(db, 'animes-series', serie, 'Temporadas', temporada, 'Idiomas', idioma, 'Servidores', servidor, 'Episodios'));
        const episodios = [];
        for (const epDoc of epsSnap.docs) {
          const epNombre = epDoc.id;
          if (episodioSeleccionado && epNombre !== episodioSeleccionado) continue;
          const data = epDoc.data();
          const iframe = data.iframe || '';
          episodios.push({ nombre: epNombre, iframe });
        }
        if (episodios.length > 0) {
          resultado.servidores.push({ nombre: servidor, episodios });
        }
      }
    } else {
      const resServ = await fetch(`${CLOUDFLARE_BASE_URL}/servidores?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}`);
      if (!resServ.ok) throw new Error('Error al obtener servidores');
      const servidores = await resServ.json();
      for (const serv of servidores) {
        const resEps = await fetch(`${CLOUDFLARE_BASE_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(serv)}`);
        if (resEps.ok) {
          const eps = await resEps.json();
          const episodios = [];
          for (const ep of eps) {
            if (episodioSeleccionado && ep.episodio !== episodioSeleccionado) continue;
            episodios.push({ nombre: ep.episodio, iframe: ep.iframe || '' });
          }
          if (episodios.length > 0) {
            resultado.servidores.push({ nombre: serv, episodios });
          }
        }
      }
    }
    return resultado;
  }

  // ========== GENERAR HTML COMPLETO (CON COMILLAS SIMPLES) ==========
  function generarHTMLCompleto(serie, temporada, idioma, episodioSeleccionado, datos) {
    const esEpisodioUnico = episodioSeleccionado && episodioSeleccionado !== '';

    if (!esEpisodioUnico) {
      // ---- CASO 1: Todos los episodios ----
      const episodesMap = new Map();
      for (const serv of datos.servidores) {
        for (const ep of serv.episodios) {
          if (!episodesMap.has(ep.nombre)) {
            episodesMap.set(ep.nombre, { name: ep.nombre, embeds: {} });
          }
          episodesMap.get(ep.nombre).embeds[serv.nombre] = ep.iframe;
        }
      }
      const episodesArray = Array.from(episodesMap.values());
      const nombreArchivo = `${serie} ${temporada} ${idioma}.html`;
      // Usamos JSON.stringify para el array, pero luego reemplazamos las comillas dobles escapadas por comillas simples
      // para que los iframes no tengan escapes.
      let episodesJSON = JSON.stringify(episodesArray, null, 2);
      // Reemplazamos todas las \" por ' (comilla simple) dentro de los valores.
      // Esto es seguro porque los iframes no tienen comillas simples.
      episodesJSON = episodesJSON.replace(/\\"/g, "'");
      // Pero cuidado: esto también reemplazaría las comillas dobles escapadas en las claves, pero las claves son strings con comillas dobles, y al hacer JSON.stringify, las claves también tienen comillas dobles, pero no están escapadas. Así que solo afecta a los valores.
      // Además, necesitamos que las claves sigan con comillas dobles. No afecta.

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reproductor de Video Multifuncional</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0; padding: 20px; font-family: 'Inter', sans-serif;
      background: url(https://static.wixstatic.com/media/8a7da0_da693a5c2b2d42bbb084707197421b0a~mv2.png) center/cover no-repeat fixed;
      min-height: 100vh; display: flex; justify-content: center; align-items: center;
      color: #1a1a2e; position: relative;
    }
    body::before {
      content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255,255,255,0.25); backdrop-filter: blur(4px); z-index: 0;
    }
    .container {
      position: relative; z-index: 1;
      background: rgba(255,255,255,0.70); backdrop-filter: blur(16px) saturate(180%);
      border-radius: 32px; box-shadow: 0 20px 40px -12px rgba(13,71,161,0.20);
      border: 1px solid rgba(255,255,255,0.5); padding: 24px 28px;
      max-width: 950px; width: 94%;
    }
    .top-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .top-bar .left { display: flex; align-items: center; gap: 10px; flex: 1 1 auto; }
    .top-bar .center { flex: 0 1 auto; text-align: center; font-size: 1.2rem; font-weight: 700; color: #1a1a2e; display: flex; align-items: center; gap: 8px; white-space: nowrap; }
    .top-bar .center i { color: #0288d1; font-size: 1.4rem; }
    .top-bar .right { flex: 1 1 auto; display: flex; justify-content: flex-end; }
    .episode-selector {
      padding: 10px 16px; padding-right: 36px; border-radius: 40px; border: 1px solid rgba(0,0,0,0.06);
      background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); font-family: 'Inter', sans-serif;
      font-weight: 600; font-size: 0.85rem; color: #1a1a2e; appearance: none; -webkit-appearance: none;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8"><path fill="%230d47a1" d="M6 8L0 0h12z"/></svg>');
      background-repeat: no-repeat; background-position: right 14px center; background-size: 12px 8px;
      cursor: pointer; transition: all 0.25s ease; min-width: 160px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .episode-selector:focus { outline: none; border-color: #0d47a1; box-shadow: 0 0 0 4px rgba(13,71,161,0.08); }
    .episode-selector:hover { background-color: rgba(255,255,255,0.95); border-color: #0d47a1; }
    .episode-selector option { background: #fff; color: #1a1a2e; }
    .platform-dropdown { position: relative; display: inline-block; min-width: 160px; }
    .platform-dropdown-toggle {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      padding: 10px 16px; border-radius: 40px; border: 1px solid rgba(0,0,0,0.06);
      background: rgba(255,255,255,0.8); backdrop-filter: blur(4px); font-family: 'Inter', sans-serif;
      font-weight: 600; font-size: 0.85rem; color: #1a1a2e; cursor: pointer; transition: all 0.25s ease;
      width: 100%; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .platform-dropdown-toggle:hover { background-color: rgba(255,255,255,0.95); border-color: #0d47a1; }
    .platform-dropdown-toggle .fa-chevron-down { font-size: 0.7rem; transition: transform 0.3s ease; color: #0288d1; }
    .platform-dropdown.active .platform-dropdown-toggle .fa-chevron-down { transform: rotate(180deg); }
    .platform-dropdown-menu {
      position: absolute; top: calc(100% + 6px); right: 0; min-width: 180px;
      background: rgba(255,255,255,0.95); backdrop-filter: blur(16px); border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.08); z-index: 1200; overflow: hidden;
      opacity: 0; visibility: hidden; transform: translateY(-8px) scale(0.96);
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1); border: 1px solid rgba(255,255,255,0.3);
    }
    .platform-dropdown.active .platform-dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
    .platform-dropdown-item {
      padding: 10px 16px; display: flex; align-items: center; justify-content: space-between;
      color: #1a1a2e; cursor: pointer; transition: all 0.2s ease; font-size: 0.85rem; font-weight: 500;
      border-bottom: 1px solid rgba(0,0,0,0.03); gap: 8px;
    }
    .platform-dropdown-item:last-child { border-bottom: none; }
    .platform-dropdown-item:hover { background: rgba(13,71,161,0.04); color: #0d47a1; }
    .platform-dropdown-item.active { background: rgba(13,71,161,0.06); color: #0d47a1; font-weight: 600; }
    .platform-dropdown-item .check-icon { color: #0f9d58; font-size: 0.8rem; opacity: 0; transition: opacity 0.2s; }
    .platform-dropdown-item.active .check-icon { opacity: 1; }
    .nav-buttons { display: flex; justify-content: center; gap: 16px; margin: 6px 0 16px 0; flex-wrap: wrap; }
    .nav-btn {
      background: linear-gradient(135deg, #0d47a1, #0288d1); color: #fff; border: none;
      padding: 10px 22px; border-radius: 40px; font-weight: 600; font-size: 0.85rem; cursor: pointer;
      transition: all 0.25s ease; box-shadow: 0 4px 12px rgba(2,136,209,0.25);
      display: inline-flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif;
    }
    .nav-btn:hover { transform: scale(1.04); box-shadow: 0 6px 20px rgba(13,71,161,0.3); background: linear-gradient(135deg, #0a2a44, #0d47a1); }
    .video-container { width: 100%; aspect-ratio: 16 / 9; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); background: #000; position: relative; }
    .video-container iframe { width: 100%; height: 100%; border: none; }
    @media (max-width: 768px) {
      .container { padding: 18px 16px; border-radius: 24px; width: 98%; }
      .top-bar { flex-direction: row; flex-wrap: wrap; gap: 8px; }
      .top-bar .left, .top-bar .right { flex: 1 1 40%; min-width: 140px; }
      .top-bar .center { flex: 0 1 100%; order: -1; font-size: 1rem; justify-content: center; }
      .episode-selector, .platform-dropdown-toggle { font-size: 0.8rem; padding: 8px 14px; min-width: 120px; }
      .platform-dropdown-menu { min-width: 150px; right: 0; left: auto; }
      .nav-buttons { gap: 10px; }
      .nav-btn { padding: 8px 16px; font-size: 0.8rem; flex: 1; justify-content: center; }
    }
    @media (max-width: 480px) {
      .container { padding: 14px 12px; border-radius: 20px; }
      .top-bar .left, .top-bar .right { flex: 1 1 100%; }
      .episode-selector, .platform-dropdown-toggle { font-size: 0.75rem; padding: 6px 12px; min-width: 100px; }
      .nav-btn { font-size: 0.7rem; padding: 6px 12px; }
    }
  </style>
</head>
<body>
<div class="container">
  <div class="top-bar">
    <div class="left">
      <select class="episode-selector" id="episodeSelector" onchange="selectEpisode(this.value)"></select>
    </div>
    <div class="center"><i class="fas fa-play-circle"></i> Reproductor</div>
    <div class="right">
      <div class="platform-dropdown" id="platformDropdown">
        <button class="platform-dropdown-toggle" id="platformToggleBtn" onclick="toggleDropdown(event)">
          <span id="currentPlatformLabel">Opciones</span>
          <i class="fas fa-chevron-down"></i>
        </button>
        <div class="platform-dropdown-menu" id="platformMenu"></div>
      </div>
    </div>
  </div>
  <div class="nav-buttons">
    <button onclick="previousEpisode()" class="nav-btn"><i class="fas fa-step-backward"></i> Anterior</button>
    <button onclick="nextEpisode()" class="nav-btn">Siguiente <i class="fas fa-step-forward"></i></button>
  </div>
  <div class="video-container" id="videoContainer"></div>
</div>
<script>
  const episodes = ${episodesJSON};
  let currentEpisode = 0;
  let currentPlatform = null;

  function renderPlatformDropdown() {
    const menu = document.getElementById('platformMenu');
    menu.innerHTML = '';
    const current = episodes[currentEpisode];
    const platforms = Object.keys(current.embeds);
    platforms.forEach(platform => {
      const item = document.createElement('div');
      item.className = 'platform-dropdown-item';
      if (platform === currentPlatform) item.classList.add('active');
      item.innerHTML = \`<span>\${platform}</span><i class="fas fa-check check-icon"></i>\`;
      item.onclick = () => { changeVideo(platform); cerrarDropdown(); };
      menu.appendChild(item);
    });
    document.getElementById('currentPlatformLabel').textContent = currentPlatform || platforms[0] || 'Opciones';
  }

  function changeVideo(platform) {
    currentPlatform = platform;
    document.getElementById('videoContainer').innerHTML = episodes[currentEpisode].embeds[platform];
    renderPlatformDropdown();
  }

  function renderEpisodeSelector() {
    const selector = document.getElementById('episodeSelector');
    selector.innerHTML = '';
    episodes.forEach((ep, index) => {
      const opt = document.createElement('option');
      opt.value = index;
      opt.textContent = ep.name;
      selector.appendChild(opt);
    });
    selector.value = currentEpisode;
  }

  function selectEpisode(index) {
    currentEpisode = parseInt(index);
    renderPlatformDropdown();
    const platforms = Object.keys(episodes[currentEpisode].embeds);
    if (platforms.includes(currentPlatform)) changeVideo(currentPlatform);
    else changeVideo(platforms[0]);
  }

  function nextEpisode() {
    if (currentEpisode < episodes.length - 1) { currentEpisode++; document.getElementById('episodeSelector').value = currentEpisode; selectEpisode(currentEpisode); }
  }
  function previousEpisode() {
    if (currentEpisode > 0) { currentEpisode--; document.getElementById('episodeSelector').value = currentEpisode; selectEpisode(currentEpisode); }
  }
  function toggleDropdown(e) { e.stopPropagation(); document.getElementById('platformDropdown').classList.toggle('active'); }
  function cerrarDropdown() { document.getElementById('platformDropdown').classList.remove('active'); }
  document.addEventListener('click', (e) => { const d = document.getElementById('platformDropdown'); if (d && !d.contains(e.target)) cerrarDropdown(); });

  renderEpisodeSelector();
  const firstPlatform = Object.keys(episodes[0].embeds)[0];
  currentPlatform = firstPlatform;
  renderPlatformDropdown();
  changeVideo(firstPlatform);
</script>
</body>
</html>`;
      return { html, filename: nombreArchivo };
    } else {
      // ---- CASO 2: Un solo episodio ----
      const embedMap = {};
      for (const serv of datos.servidores) {
        for (const ep of serv.episodios) {
          if (ep.nombre === episodioSeleccionado) {
            embedMap[serv.nombre] = ep.iframe;
            break;
          }
        }
      }
      const platforms = Object.keys(embedMap);
      if (platforms.length === 0) {
        throw new Error(`Episodio "${episodioSeleccionado}" no encontrado en los datos.`);
      }

      const nombreArchivo = `${serie} ${temporada} ${idioma} - ${episodioSeleccionado}.html`;

      // Generamos el objeto embedMap con comillas simples
      const embedMapStr = platforms.map(key => {
        const value = embedMap[key];
        // Escapar comillas simples dentro del valor (si las hubiera)
        const escapedValue = value.replace(/'/g, "\\'");
        return `  "${key}": '${escapedValue}'`;
      }).join(',\n');

      const platformsJSON = JSON.stringify(platforms);

      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reproductor - ${serie} ${temporada} ${idioma} - ${episodioSeleccionado}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0; padding: 20px; font-family: 'Inter', sans-serif;
      background: url(https://static.wixstatic.com/media/8a7da0_da693a5c2b2d42bbb084707197421b0a~mv2.png) center/cover no-repeat fixed;
      min-height: 100vh; display: flex; justify-content: center; align-items: center;
      color: #1a1a2e; position: relative;
    }
    body::before {
      content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(255,255,255,0.25); backdrop-filter: blur(4px); z-index: 0;
    }
    .container {
      position: relative; z-index: 1;
      background: rgba(255,255,255,0.70); backdrop-filter: blur(16px) saturate(180%);
      border-radius: 32px; box-shadow: 0 20px 40px -12px rgba(13,71,161,0.20);
      border: 1px solid rgba(255,255,255,0.5); padding: 24px 28px;
      max-width: 900px; width: 94%;
    }
    .dropdown-wrapper { position: relative; margin-bottom: 16px; z-index: 10; }
    .toggle-btn {
      background: linear-gradient(135deg, #0d47a1, #0288d1); color: #fff; border: none;
      padding: 12px 24px; border-radius: 40px; font-weight: 600; font-size: 0.9rem;
      cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 12px rgba(2,136,209,0.25);
      display: inline-flex; align-items: center; gap: 10px; font-family: 'Inter', sans-serif;
      width: 100%; justify-content: center;
    }
    .toggle-btn:hover { transform: scale(1.02); box-shadow: 0 6px 20px rgba(13,71,161,0.3); background: linear-gradient(135deg, #0a2a44, #0d47a1); }
    .toggle-btn i { font-size: 1rem; }
    .toggle-btn .fa-chevron-down { transition: transform 0.3s ease; }
    .toggle-btn.active .fa-chevron-down { transform: rotate(180deg); }
    .dropdown-menu {
      position: absolute; top: calc(100% + 8px); left: 0; width: 100%;
      background: rgba(255,255,255,0.95); backdrop-filter: blur(16px); border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.10); border: 1px solid rgba(255,255,255,0.3);
      overflow: hidden; opacity: 0; visibility: hidden; transform: translateY(-8px) scale(0.96);
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1); max-height: 300px; overflow-y: auto;
      padding: 6px 0;
    }
    .dropdown-menu.active { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
    .dropdown-item {
      padding: 10px 20px; display: flex; align-items: center; justify-content: space-between;
      color: #1a1a2e; cursor: pointer; transition: all 0.2s ease; font-size: 0.85rem;
      font-weight: 500; border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .dropdown-item:last-child { border-bottom: none; }
    .dropdown-item:hover { background: rgba(13,71,161,0.06); color: #0d47a1; }
    .dropdown-item .check-icon { color: #0f9d58; font-size: 0.8rem; opacity: 0; transition: opacity 0.2s; }
    .dropdown-item.active .check-icon { opacity: 1; }
    .dropdown-item.active { background: rgba(13,71,161,0.06); color: #0d47a1; font-weight: 600; }
    .video-container { width: 100%; aspect-ratio: 16 / 9; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); background: #000; position: relative; }
    .video-container iframe { width: 100%; height: 100%; border: none; }
    @media (max-width: 768px) {
      .container { padding: 18px 16px; border-radius: 24px; width: 98%; }
      .toggle-btn { font-size: 0.85rem; padding: 10px 16px; }
      .dropdown-menu { max-height: 250px; }
      .dropdown-item { font-size: 0.8rem; padding: 8px 16px; }
    }
    @media (max-width: 480px) {
      .container { padding: 14px 12px; border-radius: 20px; }
      .dropdown-item { font-size: 0.75rem; padding: 6px 12px; }
    }
  </style>
</head>
<body>
<div class="container">
  <div class="dropdown-wrapper">
    <button class="toggle-btn" id="toggleBtn" onclick="toggleDropdown()">
      <i class="fas fa-video"></i> OPCIONES DE VIDEO <i class="fas fa-chevron-down"></i>
    </button>
    <div class="dropdown-menu" id="dropdownMenu"></div>
  </div>
  <div class="video-container" id="videoContainer"></div>
</div>
<script>
  const platforms = ${platformsJSON};
  const embedMap = {
${embedMapStr}
  };
  let currentPlatform = platforms[0] || '';

  function renderDropdown() {
    const menu = document.getElementById('dropdownMenu');
    menu.innerHTML = '';
    platforms.forEach(platform => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      if (platform === currentPlatform) item.classList.add('active');
      item.innerHTML = \`<span>\${platform}</span><i class="fas fa-check check-icon"></i>\`;
      item.addEventListener('click', () => { changeVideo(platform); cerrarDropdown(); });
      menu.appendChild(item);
    });
  }

  function changeVideo(platform) {
    currentPlatform = platform;
    document.getElementById('videoContainer').innerHTML = embedMap[platform];
    const items = document.querySelectorAll('.dropdown-item');
    items.forEach(item => {
      const label = item.querySelector('span').textContent;
      if (label === platform) item.classList.add('active');
      else item.classList.remove('active');
    });
    cerrarDropdown();
  }

  function toggleDropdown() {
    document.getElementById('dropdownMenu').classList.toggle('active');
    document.getElementById('toggleBtn').classList.toggle('active');
  }
  function cerrarDropdown() {
    document.getElementById('dropdownMenu').classList.remove('active');
    document.getElementById('toggleBtn').classList.remove('active');
  }
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.dropdown-wrapper');
    if (wrapper && !wrapper.contains(e.target)) cerrarDropdown();
  });

  window.addEventListener('DOMContentLoaded', () => {
    renderDropdown();
    changeVideo(currentPlatform);
  });
</script>
</body>
</html>`;
      return { html, filename: nombreArchivo };
    }
  }

  // ========== MANEJAR GENERACIÓN ==========
  async function handleGenerate() {
    const serie = selectSerie.value;
    const temporada = selectTemporada.value;
    const idioma = selectIdioma.value;
    const episodio = selectEpisodio.value;

    if (!serie || !temporada || !idioma) {
      statusMsg.textContent = 'Debes seleccionar serie, temporada e idioma.';
      statusMsg.className = 'status-msg error';
      return;
    }

    statusMsg.textContent = 'Generando HTML...';
    statusMsg.className = 'status-msg';

    try {
      const datos = await obtenerDatosParaGenerar(serie, temporada, idioma, episodio);
      if (!datos.servidores || datos.servidores.length === 0) {
        statusMsg.textContent = 'No se encontraron datos para los filtros seleccionados.';
        statusMsg.className = 'status-msg error';
        return;
      }
      const { html, filename } = generarHTMLCompleto(serie, temporada, idioma, episodio, datos);

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      statusMsg.textContent = `¡HTML generado y descargado! (${filename})`;
      statusMsg.className = 'status-msg success';
    } catch (e) {
      console.error(e);
      statusMsg.textContent = 'Error al generar: ' + e.message;
      statusMsg.className = 'status-msg error';
    }
  }

  // ========== CAMBIAR SERVICIO ==========
  function cambiarServicio(nuevo) {
    servicioActual = nuevo;
    btnFirebase.classList.toggle('active', nuevo === 'firebase');
    btnCloudflare.classList.toggle('active', nuevo === 'cloudflare');
    servicioInfo.innerHTML = `<i class="fas fa-info-circle"></i> Usando: <strong>${nuevo === 'firebase' ? 'Firebase' : 'Cloudflare'}</strong>`;
    resetSelects(selectSerie, selectTemporada, selectIdioma, selectEpisodio);
    actualizarBoton();
    cargarSeries();
  }

  // ========== EVENT LISTENERS ==========
  selectSerie.addEventListener('change', async () => {
    const serie = selectSerie.value;
    if (serie) {
      await cargarTemporadas(serie);
      resetSelects(selectIdioma, selectEpisodio);
    } else {
      resetSelects(selectTemporada, selectIdioma, selectEpisodio);
    }
    actualizarBoton();
  });

  selectTemporada.addEventListener('change', async () => {
    const serie = selectSerie.value;
    const temporada = selectTemporada.value;
    if (temporada) {
      await cargarIdiomas(serie, temporada);
      resetSelects(selectEpisodio);
    } else {
      resetSelects(selectIdioma, selectEpisodio);
    }
    actualizarBoton();
  });

  selectIdioma.addEventListener('change', async () => {
    const serie = selectSerie.value;
    const temporada = selectTemporada.value;
    const idioma = selectIdioma.value;
    if (idioma) {
      await cargarEpisodios(serie, temporada, idioma);
    } else {
      resetSelects(selectEpisodio);
    }
    actualizarBoton();
  });

  selectEpisodio.addEventListener('change', actualizarBoton);

  btnFirebase.addEventListener('click', () => cambiarServicio('firebase'));
  btnCloudflare.addEventListener('click', () => cambiarServicio('cloudflare'));

  btnGenerar.addEventListener('click', handleGenerate);

  // ========== INICIALIZACIÓN ==========
  resetSelects(selectTemporada, selectIdioma, selectEpisodio);
  cargarSeries();
  actualizarBoton();