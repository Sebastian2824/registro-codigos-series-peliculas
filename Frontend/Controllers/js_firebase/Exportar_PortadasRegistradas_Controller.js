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

    // ========== ESTADO GLOBAL ==========
    let datosCargados = [];
    let datosFiltrados = [];
    let paginaActual = 1;
    const registrosPorPagina = 10;

    // ========== FUNCIONES PRINCIPALES ==========

    async function cargarDatos() {
      datosCargados = [];
      const resumenSnapshot = await db.collection("animes-series-portadas-resumen").get();

      for (const doc of resumenSnapshot.docs) {
        const nombreSerie = doc.id;
        const data = doc.data();

        if (data.temporadas && Array.isArray(data.temporadas)) {
          for (const temporadaObj of data.temporadas) {
            datosCargados.push({
              nombreSerie,
              temporada: temporadaObj.nombre || "Desconocida",
              imagen: temporadaObj.imagen || "",
              sitio: temporadaObj.sitio || "",
              sitio02: temporadaObj.sitio02 || ""
            });
          }
        }
      }

      poblarFiltros();
      aplicarFiltros();
    }

    function poblarFiltros() {
      const serieSet = new Set();
      const temporadaSet = new Set();

      datosCargados.forEach(d => {
        serieSet.add(d.nombreSerie);
        temporadaSet.add(d.temporada);
      });

      llenarSelect("filtroSerie", Array.from(serieSet));
      llenarSelect("filtroTemporada", Array.from(temporadaSet));
    }

    function llenarSelect(id, opciones) {
      const select = document.getElementById(id);
      const valorAnterior = select.value;
      select.innerHTML = `<option value="">Todos</option>`;
      opciones.sort().forEach(op => {
        if (op) {
          select.innerHTML += `<option value="${op}">${op}</option>`;
        }
      });
      select.value = valorAnterior;
    }

    function aplicarFiltros() {
      const serie = document.getElementById("filtroSerie").value;
      const temporada = document.getElementById("filtroTemporada").value;

      datosFiltrados = datosCargados.filter(d =>
        (!serie || d.nombreSerie === serie) &&
        (!temporada || d.temporada === temporada)
      );

      paginaActual = 1;
      mostrarPagina();
    }

    function mostrarPagina() {
      const tbody = document.querySelector("#tablaSeries tbody");
      tbody.innerHTML = "";

      if (datosFiltrados.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty-message">
                <i class="fas fa-search"></i>
                No hay portadas que coincidan con los filtros seleccionados
              </div>
            </td>
          </tr>
        `;
        renderizarPaginacion();
        return;
      }

      const inicio = (paginaActual - 1) * registrosPorPagina;
      const fin = inicio + registrosPorPagina;
      const pagina = datosFiltrados.slice(inicio, fin);

      pagina.forEach(d => {
        const fila = document.createElement("tr");

        // Vista previa de imagen
        const imagenPreview = d.imagen && /^https?:\/\/.+\.(jpe|jpg|jpeg|png|webp|gif)/i.test(d.imagen)
          ? `<img src="${d.imagen}" alt="Vista previa" class="image-preview" onclick="window.open('${d.imagen}', '_blank')" onerror="this.style.display='none'" />`
          : "";

        // Enlaces clickeables con acortamiento
        const enlaceImagen = d.imagen
          ? `<a href="${d.imagen}" target="_blank" class="url-link">${acortarURL(d.imagen)}</a>`
          : "";

        const enlaceSitio = d.sitio && /^https?:\/\/\S+$/i.test(d.sitio)
          ? `<a href="${d.sitio}" target="_blank" class="url-link">${acortarURL(d.sitio)}</a>`
          : (d.sitio || "");

        const enlaceSitio02 = d.sitio02 && /^https?:\/\/\S+$/i.test(d.sitio02)
          ? `<a href="${d.sitio02}" target="_blank" class="url-link">${acortarURL(d.sitio02)}</a>`
          : (d.sitio02 || "");

        fila.innerHTML = `
          <td><strong>${escapeHTML(d.nombreSerie)}</strong></td>
          <td>${escapeHTML(d.temporada)}</td>
          <td style="text-align: center;">${imagenPreview}</td>
          <td style="max-width: 200px;">${enlaceImagen}</td>
          <td style="max-width: 200px;">${enlaceSitio}</td>
          <td style="max-width: 200px;">${enlaceSitio02}</td>
        `;
        tbody.appendChild(fila);
      });

      renderizarPaginacion();
    }

    // ========== UTILIDADES ==========

    function acortarURL(url) {
      if (url.length > 50) {
        return url.substring(0, 47) + '...';
      }
      return url;
    }

    function escapeHTML(str) {
      if (!str) return "";
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }

    function renderizarPaginacion() {
      const contenedor = document.getElementById("paginacion");
      contenedor.innerHTML = "";

      const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
      if (totalPaginas <= 1) return;

      const btnAnterior = document.createElement("button");
      btnAnterior.textContent = "⬅ Anterior";
      btnAnterior.disabled = paginaActual === 1;
      btnAnterior.onclick = () => {
        paginaActual--;
        mostrarPagina();
      };

      const btnSiguiente = document.createElement("button");
      btnSiguiente.textContent = "Siguiente ➡";
      btnSiguiente.disabled = paginaActual === totalPaginas;
      btnSiguiente.onclick = () => {
        paginaActual++;
        mostrarPagina();
      };

      const info = document.createElement("span");
      info.textContent = `Página ${paginaActual} de ${totalPaginas}`;

      contenedor.appendChild(btnAnterior);
      contenedor.appendChild(info);
      contenedor.appendChild(btnSiguiente);
    }

    function resetearFiltros() {
      document.getElementById("filtroSerie").value = "";
      document.getElementById("filtroTemporada").value = "";
      paginaActual = 1;
      aplicarFiltros();
    }

    function exportarTablaAExcel() {
      if (datosFiltrados.length === 0) {
        alert("No hay datos para exportar.");
        return;
      }

      const datosParaExportar = datosFiltrados.map(d => ({
        Serie: d.nombreSerie,
        Temporada: d.temporada,
        "Enlace Imagen": d.imagen,
        "Enlace Sitio": d.sitio,
        "Segundo Enlace Sitio": d.sitio02
      }));

      const ws = XLSX.utils.json_to_sheet(datosParaExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Portadas Series");

      XLSX.writeFile(wb, "series_portadas_filtradas.xlsx");
    }

    // ========== INICIALIZACIÓN ==========
    window.onload = cargarDatos;