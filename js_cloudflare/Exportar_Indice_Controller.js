 // ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== ESTADO GLOBAL ==========
    let datosCargados = [];
    let datosFiltrados = [];
    let paginaActual = 1;
    const registrosPorPagina = 10;

    // ========== FUNCIONES PRINCIPALES ==========

    async function cargarDatos() {
      const tbody = document.querySelector("#tablaSeries tbody");
      tbody.innerHTML = "<tr><td colspan='8'><div class='empty-message'><i class='fas fa-spinner fa-spin'></i> Cargando datos...</div></td></tr>";
      datosCargados = [];

      try {
        const res = await fetch(`${WORKER_URL}/todos-los-animes-indice`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const series = await res.json();

        if (!Array.isArray(series)) {
          throw new Error('Formato de respuesta inválido');
        }

        datosCargados = series.map(s => ({
          nombreSerie: s.nombreSerie || "",
          nombresec: s.nombresec || "",
          nombresec02: s.nombresec02 || "",
          año: s.año || "",
          categoria: s.categoria || "",
          idioma: s.idioma || "",
          imagen: s.imagen || "",
          sitio: s.sitio || ""
        }));

        poblarFiltros();
        aplicarFiltros();

      } catch (error) {
        console.error("Error cargando datos:", error);
        tbody.innerHTML = "<tr><td colspan='8'><div class='empty-message'><i class='fas fa-exclamation-triangle' style='color:#dc2626;'></i> Error al cargar los datos</div></td></tr>";
      }
    }

    async function buscarSeries() {
      const query = document.getElementById("buscarInput").value.trim();

      if (!query) {
        await cargarDatos();
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/buscar-indice?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const series = await res.json();

        if (!Array.isArray(series)) {
          throw new Error('Formato de respuesta inválido');
        }

        datosCargados = series.map(s => ({
          nombreSerie: s.nombreSerie || "",
          nombresec: s.nombresec || "",
          nombresec02: s.nombresec02 || "",
          año: s.año || "",
          categoria: s.categoria || "",
          idioma: s.idioma || "",
          imagen: s.imagen || "",
          sitio: s.sitio || ""
        }));

        // Limpiar filtros al buscar
        document.getElementById("filtroSerie").value = "";
        document.getElementById("filtroCategoria").value = "";
        document.getElementById("filtroIdioma").value = "";
        document.getElementById("filtroAño").value = "";

        poblarFiltros();
        aplicarFiltros();

      } catch (error) {
        console.error("Error buscando series:", error);
        alert("Error al buscar series: " + error.message);
      }
    }

    // ========== FILTROS ==========
    function poblarFiltros() {
      const series = new Set();
      const categorias = new Set();
      const idiomas = new Set();
      const años = new Set();

      datosCargados.forEach(d => {
        series.add(d.nombreSerie);
        if (d.categoria) categorias.add(d.categoria);
        if (d.idioma) idiomas.add(d.idioma);
        if (d.año) años.add(d.año);
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
        if (op) {
          select.innerHTML += `<option value="${op}">${op}</option>`;
        }
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

    // ========== PAGINACIÓN ==========
    function mostrarPagina() {
      const tbody = document.querySelector("#tablaSeries tbody");
      tbody.innerHTML = "";

      if (datosFiltrados.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-message">
                <i class="fas fa-search"></i>
                No hay series que coincidan con los filtros
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

        const imagenPreview = d.imagen && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(d.imagen)
          ? `<img src="${d.imagen}" alt="Vista previa" class="image-preview" onclick="window.open('${d.imagen}', '_blank')" onerror="this.style.display='none'" />`
          : "";

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

    function renderizarPaginacion() {
      const contenedor = document.getElementById("paginacion");
      contenedor.innerHTML = "";

      const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
      if (totalPaginas <= 1) return;

      const btnAnterior = document.createElement("button");
      btnAnterior.textContent = "⬅ Anterior";
      btnAnterior.disabled = paginaActual === 1;
      btnAnterior.onclick = () => { paginaActual--; mostrarPagina(); };

      const btnSiguiente = document.createElement("button");
      btnSiguiente.textContent = "Siguiente ➡";
      btnSiguiente.disabled = paginaActual === totalPaginas;
      btnSiguiente.onclick = () => { paginaActual++; mostrarPagina(); };

      const info = document.createElement("span");
      info.textContent = `Página ${paginaActual} de ${totalPaginas}`;

      contenedor.appendChild(btnAnterior);
      contenedor.appendChild(info);
      contenedor.appendChild(btnSiguiente);
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

    function resetearFiltros() {
      document.getElementById("filtroSerie").value = "";
      document.getElementById("filtroCategoria").value = "";
      document.getElementById("filtroIdioma").value = "";
      document.getElementById("filtroAño").value = "";
      document.getElementById("buscarInput").value = "";
      paginaActual = 1;
      cargarDatos();
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

    // ========== EVENTOS ==========
    document.getElementById("buscarInput").addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        buscarSeries();
      }
    });

    // ========== INICIALIZACIÓN ==========
    window.onload = cargarDatos;