// -------------------------------------------------------------
    // CONFIGURACIÓN (sin cambios)
    // -------------------------------------------------------------
    const firebaseConfig = {
      apiKey: "AIzaSyB6MY2y5uyum87PdUHUpY8NNh4D73Yhx4U",
      authDomain: "animes-plus-89b93.firebaseapp.com",
      projectId: "animes-plus-89b93",
      storageBucket: "animes-plus-89b93.appspot.com",
      messagingSenderId: "402867181985",
      appId: "1:402867181985:web:d695b12977fe4270dbd3e0",
      measurementId: "G-DN632G7XJT"
    };

    const CLOUDFLARE_BASE_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    const GOOGLE_SHEETS_CONFIG = {
      SPREADSHEET_ID: '1V4LTYiuTDZ_Y_k6GRyVmFm5-G3rVhE6x1KfIcxJfLqM',
      SHEET_NAME: 'Portadas',
      RANGE: 'A:D'
    };

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // -------------------------------------------------------------
    // ESTADO Y DOM
    // -------------------------------------------------------------
    let servicioActual = 'firebase';
    let ultimaSerieBuscada = null;

    const firebaseBtn = document.getElementById('firebase-btn');
    const cloudflareBtn = document.getElementById('cloudflare-btn');
    const sheetsBtn = document.getElementById('sheets-btn');
    const searchInput = document.getElementById('search-input');
    const resultadoDiv = document.getElementById('resultado');

    // -------------------------------------------------------------
    // EVENTOS
    // -------------------------------------------------------------
    firebaseBtn.addEventListener('click', () => cambiarServicio('firebase'));
    cloudflareBtn.addEventListener('click', () => cambiarServicio('cloudflare'));
    sheetsBtn.addEventListener('click', () => cambiarServicio('sheets'));
    searchInput.addEventListener('keyup', realizarBusqueda);

    // -------------------------------------------------------------
    // FUNCIONES (lógica intacta, solo se mejora la UI)
    // -------------------------------------------------------------
    function cambiarServicio(servicio) {
      servicioActual = servicio;
      firebaseBtn.classList.toggle('active', servicio === 'firebase');
      cloudflareBtn.classList.toggle('active', servicio === 'cloudflare');
      sheetsBtn.classList.toggle('active', servicio === 'sheets');
      resultadoDiv.innerHTML = '';
      mostrarMensajeServicio();
    }

    function mostrarMensajeServicio() {
      let servicioTexto = '';
      if (servicioActual === 'firebase') servicioTexto = 'Firebase';
      else if (servicioActual === 'cloudflare') servicioTexto = 'Cloudflare';
      else servicioTexto = 'Google Sheets';

      const mensaje = document.createElement('div');
      mensaje.className = 'mensaje-servicio';
      mensaje.innerHTML = `<ion-icon name="server-outline"></ion-icon> Servicio activo: <strong>${servicioTexto}</strong>`;
      resultadoDiv.appendChild(mensaje);
    }

    function mostrarCarga(mensaje = 'Buscando...') {
      resultadoDiv.innerHTML = '';
      const cargaDiv = document.createElement('div');
      cargaDiv.className = 'cargando';
      cargaDiv.innerHTML = `
        <ion-icon name="refresh-outline"></ion-icon>
        <div>${mensaje}</div>
      `;
      resultadoDiv.appendChild(cargaDiv);
    }

    function realizarBusqueda() {
      const input = searchInput.value.trim().toLowerCase();
      resultadoDiv.innerHTML = '';

      if (!input) {
        mostrarMensajeServicio();
        return;
      }

      mostrarCarga(`Buscando en ${servicioActual}...`);

      setTimeout(() => {
        if (servicioActual === 'firebase') {
          buscarConFirebase(input);
        } else if (servicioActual === 'cloudflare') {
          buscarConCloudflare(input);
        } else {
          buscarConGoogleSheets(input);
        }
      }, 300);
    }

    // ---------- Búsquedas (sin cambios) ----------
    function buscarConFirebase(input) {
      const coincidenciasUnicas = new Set();
      db.collection("animes-series-portadas")
        .get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            const idSerie = doc.id.toLowerCase();
            if (idSerie.includes(input)) coincidenciasUnicas.add(doc.id);
          });
          mostrarResultados(coincidenciasUnicas);
        })
        .catch(error => {
          console.error("Error Firebase:", error);
          mostrarError(`Error al buscar con Firebase. ${error.message}`);
        });
    }

    async function buscarConCloudflare(input) {
      try {
        const response = await fetch(`${CLOUDFLARE_BASE_URL}/portadas`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const portadas = await response.json();
        const coincidenciasUnicas = new Set();
        portadas.forEach(portada => {
          const nombreSerie = portada.nombreSerie.toLowerCase();
          if (nombreSerie.includes(input)) coincidenciasUnicas.add(portada.nombreSerie);
        });
        mostrarResultados(coincidenciasUnicas);
      } catch (error) {
        console.error("Error Cloudflare:", error);
        mostrarError(`Error al buscar con Cloudflare. ${error.message}`);
      }
    }

    async function buscarConGoogleSheets(input) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${GOOGLE_SHEETS_CONFIG.SHEET_NAME}`;
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        const rows = parseGoogleSheetsCSV(csvText);
        const coincidenciasUnicas = new Set();

        if (rows.length > 0) {
          const headers = rows[0].map(h => h.trim().toLowerCase());
          const indexNombre = headers.findIndex(h => h.includes('nombre') || h.includes('serie'));
          if (indexNombre === -1) throw new Error('No se encontró columna de nombre de serie');

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length > indexNombre) {
              const nombreSerie = (row[indexNombre] || '').trim();
              if (nombreSerie.toLowerCase().includes(input)) coincidenciasUnicas.add(nombreSerie);
            }
          }
        }
        mostrarResultados(coincidenciasUnicas);
      } catch (error) {
        console.error("Error Google Sheets:", error);
        mostrarError(`Error al buscar con Google Sheets. ${error.message}`);
      }
    }

    function parseGoogleSheetsCSV(text) {
      const rows = [];
      const lines = text.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const row = [];
        let currentCell = '';
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') insideQuotes = !insideQuotes;
          else if (char === ',' && !insideQuotes) {
            row.push(currentCell.trim());
            currentCell = '';
          } else currentCell += char;
        }
        row.push(currentCell.trim());
        const cleanedRow = row.map(cell => cell.replace(/^"|"$/g, ''));
        rows.push(cleanedRow);
      }
      return rows;
    }

    // ---------- Mostrar resultados (mejorado visualmente) ----------
    function mostrarResultados(coincidenciasUnicas) {
      resultadoDiv.innerHTML = '';

      if (coincidenciasUnicas.size === 0) {
        const noResultados = document.createElement('div');
        noResultados.className = 'no-resultados';
        noResultados.innerHTML = `
          <ion-icon name="search-outline"></ion-icon><br>
          No se encontró ninguna serie con ese nombre.<br>
          <small>Intenta con otro término de búsqueda.</small>
        `;
        resultadoDiv.appendChild(noResultados);
        return;
      }

      const title = document.createElement('h3');
      title.textContent = `Selecciona la serie (${coincidenciasUnicas.size} encontradas):`;
      resultadoDiv.appendChild(title);

      coincidenciasUnicas.forEach(serieId => {
        const enlace = document.createElement('a');
        enlace.href = '#';
        enlace.className = 'resultado-item';
        enlace.innerHTML = `
          <ion-icon name="film-outline"></ion-icon>
          <span>${serieId}</span>
        `;
        enlace.addEventListener('click', (e) => {
          e.preventDefault();
          ultimaSerieBuscada = serieId;
          mostrarTemporadas(serieId);
        });
        resultadoDiv.appendChild(enlace);
      });

      // Botón limpiar
      const limpiarBtn = document.createElement('button');
      limpiarBtn.className = 'limpiar-btn';
      limpiarBtn.innerHTML = `<ion-icon name="close-outline"></ion-icon> Limpiar búsqueda`;
      limpiarBtn.addEventListener('click', () => {
        searchInput.value = '';
        resultadoDiv.innerHTML = '';
        mostrarMensajeServicio();
      });
      resultadoDiv.appendChild(limpiarBtn);
    }

    function mostrarError(mensaje) {
      resultadoDiv.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.className = 'no-resultados';
      errorDiv.innerHTML = `
        <ion-icon name="alert-circle-outline"></ion-icon><br>
        ${mensaje}<br><br>
        <button onclick="cambiarServicio('${servicioActual === 'firebase' ? 'cloudflare' : servicioActual === 'cloudflare' ? 'sheets' : 'firebase'}')" 
                style="padding: 8px 20px; background: #1a73e8; color: white; border: none; border-radius: 40px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s;">
          Intentar con otro servicio
        </button>
      `;
      resultadoDiv.appendChild(errorDiv);
    }

    // ---------- Temporadas y detalles (sin cambios de lógica) ----------
    function mostrarTemporadas(serieId) {
      resultadoDiv.innerHTML = '';
      mostrarCarga(`Cargando temporadas de "${serieId}"...`);

      if (servicioActual === 'firebase') {
        mostrarTemporadasFirebase(serieId);
      } else if (servicioActual === 'cloudflare') {
        mostrarTemporadasCloudflare(serieId);
      } else {
        mostrarTemporadasGoogleSheets(serieId);
      }
    }

    function mostrarTemporadasFirebase(serieId) {
      db.collection("animes-series-portadas")
        .doc(serieId)
        .collection("Temporadas")
        .get()
        .then(snapshot => {
          resultadoDiv.innerHTML = `<div class="resultado"><h3>${serieId}</h3><p>Selecciona una temporada:</p></div>`;
          const container = document.createElement("div");
          container.className = "resultado";

          if (snapshot.empty) {
            container.innerHTML = `<div class="no-resultados">No se encontraron temporadas para esta serie.</div>`;
          } else {
            snapshot.forEach(doc => {
              const link = document.createElement("a");
              link.href = "#";
              link.className = "temporada-link";
              link.innerHTML = `<ion-icon name="videocam-outline"></ion-icon><span>${doc.id}</span>`;
              link.addEventListener("click", (e) => {
                e.preventDefault();
                mostrarDetallesTemporada(serieId, doc.id);
              });
              container.appendChild(link);
            });
          }

          const backBtn = document.createElement("button");
          backBtn.className = "back-btn-resultados";
          backBtn.innerHTML = `<ion-icon name="arrow-back-outline"></ion-icon> Volver a resultados`;
          backBtn.onclick = () => {
            if (searchInput.value.trim()) realizarBusqueda();
            else { resultadoDiv.innerHTML = ''; mostrarMensajeServicio(); }
          };
          container.appendChild(backBtn);
          resultadoDiv.appendChild(container);
        })
        .catch(error => {
          console.error("Error temporadas Firebase:", error);
          mostrarError(`Error al cargar temporadas. ${error.message}`);
        });
    }

    async function mostrarTemporadasCloudflare(serieId) {
      try {
        const response = await fetch(`${CLOUDFLARE_BASE_URL}/temporadas-portadas?serie=${encodeURIComponent(serieId)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const temporadas = await response.json();
        resultadoDiv.innerHTML = `<div class="resultado"><h3>${serieId}</h3><p>Selecciona una temporada:</p></div>`;
        const container = document.createElement("div");
        container.className = "resultado";

        if (!temporadas || temporadas.length === 0) {
          container.innerHTML = `<div class="no-resultados">No se encontraron temporadas para esta serie.</div>`;
        } else {
          temporadas.forEach(temporada => {
            const link = document.createElement("a");
            link.href = "#";
            link.className = "temporada-link";
            link.innerHTML = `<ion-icon name="videocam-outline"></ion-icon><span>${temporada}</span>`;
            link.addEventListener("click", (e) => {
              e.preventDefault();
              mostrarDetallesTemporada(serieId, temporada);
            });
            container.appendChild(link);
          });
        }

        const backBtn = document.createElement("button");
        backBtn.className = "back-btn-resultados";
        backBtn.innerHTML = `<ion-icon name="arrow-back-outline"></ion-icon> Volver a resultados`;
        backBtn.onclick = () => {
          if (searchInput.value.trim()) realizarBusqueda();
          else { resultadoDiv.innerHTML = ''; mostrarMensajeServicio(); }
        };
        container.appendChild(backBtn);
        resultadoDiv.appendChild(container);
      } catch (error) {
        console.error("Error temporadas Cloudflare:", error);
        mostrarError(`Error al cargar temporadas. ${error.message}`);
      }
    }

    async function mostrarTemporadasGoogleSheets(serieId) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${GOOGLE_SHEETS_CONFIG.SHEET_NAME}`;
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        const rows = parseGoogleSheetsCSV(csvText);

        resultadoDiv.innerHTML = `<div class="resultado"><h3>${serieId}</h3><p>Selecciona una temporada:</p></div>`;
        const container = document.createElement("div");
        container.className = "resultado";

        if (rows.length > 0) {
          const headers = rows[0].map(h => h.trim().toLowerCase());
          const indexNombre = headers.findIndex(h => h.includes('nombre') || h.includes('serie'));
          const indexTemporada = headers.findIndex(h => h.includes('temporada'));
          const temporadasUnicas = new Set();

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length > Math.max(indexNombre, indexTemporada)) {
              const nombre = (row[indexNombre] || '').trim();
              const temporada = (row[indexTemporada] || '').trim();
              if (nombre === serieId && temporada) temporadasUnicas.add(temporada);
            }
          }

          if (temporadasUnicas.size === 0) {
            container.innerHTML = `<div class="no-resultados">No se encontraron temporadas para esta serie en Google Sheets.</div>`;
          } else {
            temporadasUnicas.forEach(temporada => {
              const link = document.createElement("a");
              link.href = "#";
              link.className = "temporada-link";
              link.innerHTML = `<ion-icon name="videocam-outline"></ion-icon><span>${temporada}</span>`;
              link.addEventListener("click", (e) => {
                e.preventDefault();
                mostrarDetallesTemporada(serieId, temporada);
              });
              container.appendChild(link);
            });
          }
        } else {
          container.innerHTML = `<div class="no-resultados">No se encontraron datos en Google Sheets.</div>`;
        }

        const backBtn = document.createElement("button");
        backBtn.className = "back-btn-resultados";
        backBtn.innerHTML = `<ion-icon name="arrow-back-outline"></ion-icon> Volver a resultados`;
        backBtn.onclick = () => {
          if (searchInput.value.trim()) realizarBusqueda();
          else { resultadoDiv.innerHTML = ''; mostrarMensajeServicio(); }
        };
        container.appendChild(backBtn);
        resultadoDiv.appendChild(container);
      } catch (error) {
        console.error("Error temporadas Google Sheets:", error);
        mostrarError(`Error al cargar temporadas. ${error.message}`);
      }
    }

    // ---------- Detalles de temporada ----------
    function mostrarDetallesTemporada(serieId, temporadaId) {
      resultadoDiv.innerHTML = '';
      mostrarCarga(`Cargando detalles de "${temporadaId}"...`);

      if (servicioActual === 'firebase') {
        mostrarDetallesTemporadaFirebase(serieId, temporadaId);
      } else if (servicioActual === 'cloudflare') {
        mostrarDetallesTemporadaCloudflare(serieId, temporadaId);
      } else {
        mostrarDetallesTemporadaGoogleSheets(serieId, temporadaId);
      }
    }

    function mostrarDetallesTemporadaFirebase(serieId, temporadaId) {
      db.collection("animes-series-portadas")
        .doc(serieId)
        .collection("Temporadas")
        .doc(temporadaId)
        .get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            mostrarDetallesTemporadaUI(serieId, temporadaId, data);
          } else {
            mostrarError("Temporada no encontrada en Firebase.");
          }
        })
        .catch(error => {
          console.error("Error detalles Firebase:", error);
          mostrarError(`Error al cargar detalles. ${error.message}`);
        });
    }

    async function mostrarDetallesTemporadaCloudflare(serieId, temporadaId) {
      try {
        const response = await fetch(`${CLOUDFLARE_BASE_URL}/portada?serie=${encodeURIComponent(serieId)}&temporada=${encodeURIComponent(temporadaId)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) {
          mostrarError("Temporada no encontrada en Cloudflare.");
        } else {
          mostrarDetallesTemporadaUI(serieId, temporadaId, data);
        }
      } catch (error) {
        console.error("Error detalles Cloudflare:", error);
        mostrarError(`Error al cargar detalles. ${error.message}`);
      }
    }

    async function mostrarDetallesTemporadaGoogleSheets(serieId, temporadaId) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${GOOGLE_SHEETS_CONFIG.SHEET_NAME}`;
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        const rows = parseGoogleSheetsCSV(csvText);
        let datosTemporada = null;

        if (rows.length > 0) {
          const headers = rows[0].map(h => h.trim().toLowerCase());
          const indexNombre = headers.findIndex(h => h.includes('nombre') || h.includes('serie'));
          const indexTemporada = headers.findIndex(h => h.includes('temporada'));
          const indexImagen = headers.findIndex(h => h.includes('imagen') || h.includes('image'));
          const indexSitio = headers.findIndex(h => h.includes('sitio') || h.includes('link') || h.includes('url'));

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length > Math.max(indexNombre, indexTemporada, indexImagen, indexSitio)) {
              const nombre = (row[indexNombre] || '').trim();
              const temporada = (row[indexTemporada] || '').trim();
              if (nombre === serieId && temporada === temporadaId) {
                datosTemporada = {
                  imagen: indexImagen !== -1 ? (row[indexImagen] || '').trim() : '',
                  sitio: indexSitio !== -1 ? (row[indexSitio] || '').trim() : ''
                };
                break;
              }
            }
          }
        }

        if (datosTemporada) {
          mostrarDetallesTemporadaUI(serieId, temporadaId, datosTemporada);
        } else {
          mostrarError("Temporada no encontrada en Google Sheets.");
        }
      } catch (error) {
        console.error("Error detalles Google Sheets:", error);
        mostrarError(`Error al cargar detalles. ${error.message}`);
      }
    }

    // ---------- UI de detalles (mejorada visualmente) ----------
    function mostrarDetallesTemporadaUI(serieId, temporadaId, data) {
      resultadoDiv.innerHTML = '';
      const resultadoHTML = document.createElement("div");
      resultadoHTML.className = "resultado";

      const titulo = document.createElement("h3");
      titulo.textContent = "✨ Excelente que lo Disfrutes";
      titulo.style.color = "#059669";
      resultadoHTML.appendChild(titulo);

      const subtitulo = document.createElement("p");
      subtitulo.textContent = `${serieId} · ${temporadaId}`;
      subtitulo.style.color = "#0b2b5c";
      subtitulo.style.fontWeight = "600";
      subtitulo.style.marginBottom = "16px";
      resultadoHTML.appendChild(subtitulo);

      if (data.imagen) {
        const img = document.createElement("img");
        img.src = data.imagen;
        img.alt = `${serieId} ${temporadaId}`;
        img.onerror = function() {
          this.src = 'https://via.placeholder.com/250x350?text=Imagen+No+Disponible';
        };
        resultadoHTML.appendChild(img);
      }

      if (data.sitio) {
        const link = document.createElement("a");
        link.href = data.sitio;
        link.target = "_blank";
        link.className = "ver-ahora-link";
        link.innerHTML = `<ion-icon name="play-outline"></ion-icon> Ver Ahora`;
        link.addEventListener("click", () => {
          searchInput.value = "";
          setTimeout(() => {
            resultadoDiv.innerHTML = '';
            mostrarMensajeServicio();
          }, 500);
        });
        resultadoHTML.appendChild(link);
      } else {
        const sinSitio = document.createElement("div");
        sinSitio.className = "no-resultados";
        sinSitio.innerHTML = `<ion-icon name="link-outline"></ion-icon><br>No hay enlace disponible para esta temporada.`;
        resultadoHTML.appendChild(sinSitio);
      }

      const backBtn = document.createElement("button");
      backBtn.className = "back-btn";
      backBtn.innerHTML = `<ion-icon name="arrow-back-outline"></ion-icon> Volver a temporadas`;
      backBtn.addEventListener("click", () => mostrarTemporadas(serieId));
      resultadoHTML.appendChild(backBtn);

      resultadoDiv.appendChild(resultadoHTML);
    }

    // Inicializar
    cambiarServicio('firebase');