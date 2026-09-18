    // ========== CONFIGURACIÓN FIREBASE ==========
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

    // ========== VARIABLES GLOBALES ==========
    let datosFirebase = [];
    let datosFiltrados = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // ========== DOM REFERENCES ==========
    const btnCargar = document.getElementById('btnCargarFirebase');
    const btnTransferir = document.getElementById('btnTransferir');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const btnAplicarFiltro = document.getElementById('btnAplicarFiltro');
    const btnLimpiarFiltro = document.getElementById('btnLimpiarFiltro');
    const btnFirstPage = document.getElementById('btnFirstPage');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    const btnLastPage = document.getElementById('btnLastPage');
    const btnToggleDebug = document.getElementById('btnToggleDebug');

    const tablaDatos = document.getElementById('tablaDatos');
    const paginationDiv = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const loadingProgress = document.getElementById('loadingProgress');
    const loadingProgressBar = document.getElementById('loadingProgressBar');
    const loadingProgressText = document.getElementById('loadingProgressText');
    const transferProgress = document.getElementById('transferProgress');
    const transferProgressBar = document.getElementById('transferProgressBar');
    const transferProgressText = document.getElementById('transferProgressText');
    const statSeries = document.getElementById('statSeries');
    const statTemporadas = document.getElementById('statTemporadas');
    const statPortadas = document.getElementById('statPortadas');
    const debugContent = document.getElementById('debugContent');
    const debugInfo = document.getElementById('debugInfo');

    // ========== FUNCIONES ==========

    function escapeHTML(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }

    function truncateText(text, maxLength) {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }

    function actualizarDebugInfo(title, data) {
      const timestamp = new Date().toLocaleTimeString();
      debugContent.innerHTML += `<div><strong>${timestamp} - ${title}</strong><br>${JSON.stringify(data, null, 2)}</div><hr>`;
      debugContent.scrollTop = debugContent.scrollHeight;
    }

    function actualizarEstadisticas() {
      const series = new Set(datosFiltrados.map(d => d.nombreSerie));
      const temporadas = new Set(datosFiltrados.map(d => `${d.nombreSerie}-${d.temporada}`));
      statSeries.textContent = series.size;
      statTemporadas.textContent = temporadas.size;
      statPortadas.textContent = datosFiltrados.length;
    }

    function actualizarPaginacion() {
      const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage) || 1;
      paginationInfo.textContent = `Página ${currentPage} de ${totalPages} (${datosFiltrados.length} registros)`;
      btnFirstPage.disabled = currentPage === 1;
      btnPrevPage.disabled = currentPage === 1;
      btnNextPage.disabled = currentPage === totalPages;
      btnLastPage.disabled = currentPage === totalPages;
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
                <img src="${escapeHTML(d.imagen)}" alt="Portada" class="image-preview" 
                     onerror="this.style.display='none'">
                <div class="link-cell">${truncateText(escapeHTML(d.imagen), 30)}</div>
              ` : 'Sin imagen'}
            </td>
            <td class="link-cell">${d.sitio ? truncateText(escapeHTML(d.sitio), 40) : ''}</td>
            <td class="link-cell">${d.sitio02 ? truncateText(escapeHTML(d.sitio02), 40) : ''}</td>
            <td class="actions">
              <button class="btn-sm primary" onclick="verDetalles('${escapeHTML(d.nombreSerie)}', '${escapeHTML(d.temporada)}')"><i class="fas fa-eye"></i></button>
              <button class="btn-sm success" onclick="probarImagen('${escapeHTML(d.imagen)}')"><i class="fas fa-image"></i></button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      tablaDatos.innerHTML = html;
      actualizarPaginacion();
    }

    // ========== ACCIONES AUXILIARES ==========
    window.verDetalles = function(serie, temporada) {
      const datos = datosFiltrados.find(d => d.nombreSerie === serie && d.temporada === temporada);
      if (datos) {
        alert(`Detalles de ${serie} - ${temporada}:\n\nImagen: ${datos.imagen || 'No disponible'}\nSitio: ${datos.sitio || 'No disponible'}\nSitio 02: ${datos.sitio02 || 'No disponible'}`);
      }
    };

    window.probarImagen = function(url) {
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
              <button onclick="window.close()" style="margin-top:12px; padding:10px 20px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer;">Cerrar</button>
            </div>
          </body>
        </html>
      `);
    };

    // ========== EVENTOS ==========

    // Cargar datos de Firebase
    btnCargar.addEventListener('click', async function() {
      try {
        btnCargar.disabled = true;
        btnCargar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        loadingProgress.style.display = 'block';
        loadingProgressBar.style.width = '0%';
        loadingProgressBar.textContent = '0%';
        loadingProgressText.textContent = '0%';

        datosFirebase = [];
        const seriesSnapshot = await db.collection("animes-series-portadas").get();
        const totalSeries = seriesSnapshot.size;
        let seriesProcesadas = 0;

        for (const serieDoc of seriesSnapshot.docs) {
          const nombreSerie = serieDoc.id;
          const temporadasSnapshot = await db.collection("animes-series-portadas")
            .doc(nombreSerie)
            .collection("Temporadas")
            .get();

          for (const temporadaDoc of temporadasSnapshot.docs) {
            const datosTemporada = temporadaDoc.data();
            datosFirebase.push({
              nombreSerie,
              temporada: temporadaDoc.id,
              imagen: datosTemporada.imagen || '',
              sitio: datosTemporada.sitio || '',
              sitio02: datosTemporada.sitio02 || ''
            });
          }

          seriesProcesadas++;
          const percent = Math.round((seriesProcesadas / totalSeries) * 100);
          loadingProgressBar.style.width = `${percent}%`;
          loadingProgressBar.textContent = `${percent}%`;
          loadingProgressText.textContent = `${percent}% (${seriesProcesadas}/${totalSeries} series)`;
        }

        datosFiltrados = [...datosFirebase];
        currentPage = 1;
        mostrarDatosEnTabla();
        actualizarEstadisticas();
        btnTransferir.disabled = false;
        loadingProgress.style.display = 'none';
        alert(`✅ Se cargaron ${datosFirebase.length} portadas de Firebase.`);

      } catch (error) {
        console.error(error);
        alert('❌ Error al cargar datos: ' + error.message);
        loadingProgress.style.display = 'none';
      } finally {
        btnCargar.disabled = false;
        btnCargar.innerHTML = '<i class="fas fa-database"></i> Cargar Portadas de Firebase';
      }
    });

    // Transferir a Cloudflare
    btnTransferir.addEventListener('click', async function() {
      if (datosFiltrados.length === 0) {
        alert('No hay datos para transferir.');
        return;
      }

      const total = datosFiltrados.length;
      let processed = 0;

      transferProgress.style.display = 'block';
      transferProgressBar.style.width = '0%';
      transferProgressBar.textContent = '0%';
      transferProgressText.textContent = '0%';

      btnTransferir.disabled = true;
      btnTransferir.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transferiendo...';

      try {
        for (const portada of datosFiltrados) {
          actualizarDebugInfo(`📤 Enviando: ${portada.nombreSerie} - ${portada.temporada}`);
          const result = await enviarPortada(portada);
          if (result.ok) {
            actualizarDebugInfo(`✅ Registrada: ${portada.nombreSerie}`);
          } else {
            actualizarDebugInfo(`❌ Error con ${portada.nombreSerie}: ${result.error}`);
          }
          processed++;
          const percent = Math.round((processed / total) * 100);
          transferProgressBar.style.width = `${percent}%`;
          transferProgressBar.textContent = `${percent}%`;
          transferProgressText.textContent = `${percent}%`;
        }

        alert('✅ Portadas transferidas exitosamente a Cloudflare.');
        setTimeout(() => { transferProgress.style.display = 'none'; }, 1500);

      } catch (error) {
        console.error(error);
        alert('❌ Error al transferir: ' + error.message);
        transferProgress.style.display = 'none';
      } finally {
        btnTransferir.disabled = false;
        btnTransferir.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Transferir a Cloudflare';
      }
    });

    async function enviarPortada(portada) {
      try {
        const response = await fetch("https://proyect-cloud-flare.apiprueba2025.workers.dev/registrar-portada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreSerie: portada.nombreSerie,
            temporada: portada.temporada,
            imagen: portada.imagen || null,
            sitio: portada.sitio || null,
            sitio02: portada.sitio02 || null
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          return { ok: false, error: errorText };
        }
        const data = await response.json();
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    }

    // Limpiar
    btnLimpiar.addEventListener('click', function() {
      datosFirebase = [];
      datosFiltrados = [];
      currentPage = 1;
      mostrarDatosEnTabla();
      actualizarEstadisticas();
      btnTransferir.disabled = true;
      debugContent.innerHTML = '';
      paginationDiv.style.display = 'none';
    });

    // Aplicar filtros
    btnAplicarFiltro.addEventListener('click', function() {
      const filterSerie = document.getElementById('filterSerie').value.toLowerCase();
      const filterTemporada = document.getElementById('filterTemporada').value.toLowerCase();

      datosFiltrados = datosFirebase.filter(item => {
        const serieMatch = !filterSerie || item.nombreSerie.toLowerCase().includes(filterSerie);
        const temporadaMatch = !filterTemporada || item.temporada.toLowerCase().includes(filterTemporada);
        return serieMatch && temporadaMatch;
      });

      currentPage = 1;
      mostrarDatosEnTabla();
      actualizarEstadisticas();
    });

    // Limpiar filtros
    btnLimpiarFiltro.addEventListener('click', function() {
      document.getElementById('filterSerie').value = '';
      document.getElementById('filterTemporada').value = '';
      datosFiltrados = [...datosFirebase];
      currentPage = 1;
      mostrarDatosEnTabla();
      actualizarEstadisticas();
    });

    // Paginación
    btnFirstPage.addEventListener('click', () => { currentPage = 1; mostrarDatosEnTabla(); });
    btnPrevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; mostrarDatosEnTabla(); } });
    btnNextPage.addEventListener('click', () => {
      const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);
      if (currentPage < totalPages) { currentPage++; mostrarDatosEnTabla(); }
    });
    btnLastPage.addEventListener('click', () => {
      const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);
      currentPage = totalPages;
      mostrarDatosEnTabla();
    });

    // Depuración
    btnToggleDebug.addEventListener('click', function() {
      debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
    });

    // Estado inicial
    mostrarDatosEnTabla();
    actualizarEstadisticas();
    paginationDiv.style.display = 'none';