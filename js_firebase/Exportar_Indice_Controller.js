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
      const snapshot = await db.collection("animes-series-indice").get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        datosCargados.push({
          nombreSerie: doc.id,
          nombresec: data.nombresec || "",
          nombresec02: data.nombresec02 || "",
          año: data.año || "",
          categoria: data.categoria || "",
          idioma: data.idioma || "",
          imagen: data.imagen || "",
          sitio: data.sitio || ""
        });
      }

      poblarFiltros();
      aplicarFiltros();
    }

    function poblarFiltros() {
      const series = new Set();
      const categorias = new Set();
      const idiomas = new Set();
      const años = new Set();

      datosCargados.forEach(d => {
        series.add(d.nombreSerie);
        categorias.add(d.categoria);
        idiomas.add(d.idioma);
        años.add(d.año);
      });

      llenarSelect("filtroSerie", Array.from(series));
      llenarSelect("filtroCategoria", Array.from(categorias));
      llenarSelect("filtroIdioma", Array.from(idiomas));
      llenarSelect("filtroAño", Array.from(años));
    }

    function llenarSelect(id, opciones) {
      const select = document.getElementById(id);
      const valorAnterior = select.value;
      select.innerHTML = `<option value="">Todos</option>`;
      opciones.sort().forEach(op => {
        select.innerHTML += `<option value="${op}">${op}</option>`;
      });
      select.value = valorAnterior;
    }

    function aplicarFiltros() {
      const serie = document.getElementById("filtroSerie").value;
      const categoria = document.getElementById("filtroCategoria").value;
      const idioma = document.getElementById("filtroIdioma").value;
      const año = document.getElementById("filtroAño").value;

      datosFiltrados = datosCargados.filter(d =>
        (!serie || d.nombreSerie === serie) &&
        (!categoria || d.categoria === categoria) &&
        (!idioma || d.idioma === idioma) &&
        (!año || d.año == año)
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
            <td colspan="8">
              <div class="empty-message">
                <i class="fas fa-search"></i>
                No hay series que coincidan con los filtros seleccionados
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
        const imagenPreview = d.imagen && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(d.imagen)
          ? `<img src="${d.imagen}" alt="Vista previa" class="image-preview" onclick="window.open('${d.imagen}', '_blank')" onerror="this.style.display='none'" />`
          : "";

        // Enlaces clickeables con acortamiento
        const enlaceImagen = d.imagen
          ? `<a href="${d.imagen}" target="_blank" class="url-link">${acortarURL(d.imagen)}</a>`
          : "";

        const enlaceSitio = d.sitio && /^https?:\/\/\S+$/i.test(d.sitio)
          ? `<a href="${d.sitio}" target="_blank" class="url-link">${acortarURL(d.sitio)}</a>`
          : (d.sitio || "");

        fila.innerHTML = `
          <td><strong>${escapeHTML(d.nombreSerie)}</strong></td>
          <td>${escapeHTML(d.nombresec)}</td>
          <td>${escapeHTML(d.nombresec02)}</td>
          <td>${escapeHTML(d.año)}</td>
          <td>${escapeHTML(d.categoria)}</td>
          <td>${escapeHTML(d.idioma)}</td>
          <td style="text-align: center;">
            ${imagenPreview}
            <div style="margin-top: 4px; font-size: 12px;">${enlaceImagen}</div>
          </td>
          <td style="max-width: 200px;">${enlaceSitio}</td>
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
      document.getElementById("filtroCategoria").value = "";
      document.getElementById("filtroIdioma").value = "";
      document.getElementById("filtroAño").value = "";
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
        "Nombre Inglés": d.nombresec,
        "Nombre Japonés": d.nombresec02,
        Año: d.año,
        Categoría: d.categoria,
        Idioma: d.idioma,
        "Enlace Imagen": d.imagen,
        "Enlace Sitio": d.sitio
      }));

      const ws = XLSX.utils.json_to_sheet(datosParaExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Series Índice");

      XLSX.writeFile(wb, "series_indice_filtradas.xlsx");
    }

    // ========== INICIALIZACIÓN ==========
    window.onload = cargarDatos;