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
    const selectServidor = document.getElementById('servidor');
    const selectEpisodio = document.getElementById('episodio');
    const reproductor = document.getElementById('reproductor');
    const episodeInfo = document.getElementById('episodeInfo');
    const btnFirebase = document.getElementById('btnFirebase');
    const btnCloudflare = document.getElementById('btnCloudflare');
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

    function cargarServidores(serie, temporada, idioma) {
      return servicioActual === 'firebase' ? cargarServidoresFirebase(serie, temporada, idioma) : cargarServidoresCloudflare(serie, temporada, idioma);
    }

    function cargarEpisodios(serie, temporada, idioma, servidor) {
      return servicioActual === 'firebase' ? cargarEpisodiosFirebase(serie, temporada, idioma, servidor) : cargarEpisodiosCloudflare(serie, temporada, idioma, servidor);
    }

    function mostrarVideo(serie, temporada, idioma, servidor, episodio) {
      return servicioActual === 'firebase' ? mostrarVideoFirebase(serie, temporada, idioma, servidor, episodio) : mostrarVideoCloudflare(serie, temporada, idioma, servidor, episodio);
    }

    // ========== CAMBIAR SERVICIO ==========
    function cambiarServicio(nuevo) {
      servicioActual = nuevo;
      // Actualizar UI
      btnFirebase.classList.toggle('active', nuevo === 'firebase');
      btnCloudflare.classList.toggle('active', nuevo === 'cloudflare');
      servicioInfo.innerHTML = `<i class="fas fa-info-circle"></i> Usando: <strong>${nuevo === 'firebase' ? 'Firebase' : 'Cloudflare'}</strong>`;

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

    // ========== INICIALIZACIÓN ==========
    // Deshabilitar selects secundarios al inicio
    resetSelects(selectTemporada, selectIdioma, selectServidor, selectEpisodio);
    showPlaceholder('Selecciona los filtros para ver el video');
    cargarSeries();