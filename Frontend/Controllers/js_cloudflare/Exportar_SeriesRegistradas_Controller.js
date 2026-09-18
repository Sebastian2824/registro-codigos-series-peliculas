// ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== ESTADO GLOBAL ==========
    let datosCargados = [];
    let datosFiltrados = [];
    let paginaActual = 1;
    const registrosPorPagina = 10;

    // ========== FUNCIONES PRINCIPALES ==========

    async function cargarDatos() {
  const tablaBody = document.querySelector("#tablaSeries tbody");
  tablaBody.innerHTML = `
    <tr><td colspan='7' style='text-align:center; padding:40px; color:#94a3b8;'>
      <i class='fas fa-spinner fa-spin' style='font-size:24px; display:block; margin-bottom:12px;'></i> 
      Cargando datos...
    </td></tr>
  `;

  try {
    // Única petición para obtener todos los registros
    const respuesta = await fetch(`${WORKER_URL}/todos-los-animes-series`);
    if (!respuesta.ok) throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
    
    const registros = await respuesta.json();
    if (!Array.isArray(registros)) throw new Error('Formato de respuesta inválido');

    // Mapear a la estructura que espera la interfaz
    datosCargados = registros.map(reg => ({
      nombreSerie: reg.nombreSerie,
      temporada: reg.temporada,
      idioma: reg.idioma,
      servidor: reg.servidor,
      episodio: reg.episodio,
      iframe: reg.iframe || ""
    }));

    // Poblar filtros con los valores únicos
    poblarFiltros();
    // Aplicar filtros y mostrar primera página
    aplicarFiltros();

  } catch (error) {
    console.error("Error cargando datos:", error);
    tablaBody.innerHTML = `
      <tr><td colspan='7' style='text-align:center; padding:40px; color:#dc2626;'>
        <i class='fas fa-exclamation-triangle' style='font-size:24px; display:block; margin-bottom:12px;'></i> 
        Error al cargar los datos: ${error.message}
      </td></tr>
    `;
  }
}

    function poblarFiltros() {
      const serieSet = new Set();
      const temporadaSet = new Set();
      const idiomaSet = new Set();
      const servidorSet = new Set();

      datosCargados.forEach(d => {
        serieSet.add(d.nombreSerie);
        temporadaSet.add(d.temporada);
        idiomaSet.add(d.idioma);
        servidorSet.add(d.servidor);
      });

      llenarSelect("filtroSerie", Array.from(serieSet));
      llenarSelect("filtroTemporada", Array.from(temporadaSet));
      llenarSelect("filtroIdioma", Array.from(idiomaSet));
      llenarSelect("filtroServidor", Array.from(servidorSet));
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
      const idioma = document.getElementById("filtroIdioma").value;
      const servidor = document.getElementById("filtroServidor").value;

      datosFiltrados = datosCargados.filter(d =>
        (!serie || d.nombreSerie === serie) &&
        (!temporada || d.temporada === temporada) &&
        (!idioma || d.idioma === idioma) &&
        (!servidor || d.servidor === servidor)
      );

      paginaActual = 1;
      mostrarPagina();
    }

    function escapeHTML(str) {
      if (!str) return "";
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }

    function mostrarPagina() {
      const tablaBody = document.querySelector("#tablaSeries tbody");
      tablaBody.innerHTML = "";

      if (datosFiltrados.length === 0) {
        tablaBody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-message">
                <i class="fas fa-search"></i>
                No hay resultados que coincidan con los filtros
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

        fila.innerHTML = `
          <td><strong>${escapeHTML(d.nombreSerie)}</strong></td>
          <td>${escapeHTML(d.temporada)}</td>
          <td>${escapeHTML(d.idioma)}</td>
          <td>${escapeHTML(d.servidor)}</td>
          <td>${escapeHTML(d.episodio)}</td>
          <td style="max-width: 300px; word-break: break-word; font-family: monospace; font-size: 13px;">${escapeHTML(d.iframe || "")}</td>
          <td><button class="btn-copy" onclick="copiarIframe('${encodeURIComponent(d.iframe || "")}')"><i class="fas fa-copy"></i></button></td>
        `;
        tablaBody.appendChild(fila);
      });

      renderizarPaginacion();
    }

    // ========== ACCIONES ==========

    function copiarIframe(iframeCodificado) {
      const codigo = decodeURIComponent(iframeCodificado);
      if (!codigo) {
        alert("No hay código para copiar.");
        return;
      }
      navigator.clipboard.writeText(codigo).then(() => {
        alert("Código iframe copiado al portapapeles.");
      }).catch(err => {
        alert("Error al copiar: " + err);
      });
    }

    function copiarTodosIframe() {
      const iframes = datosFiltrados
        .map(d => d.iframe)
        .filter(codigo => codigo && codigo.trim() !== "")
        .join("\n");

      if (iframes) {
        navigator.clipboard.writeText(iframes).then(() => {
          alert("Todos los códigos iframe visibles han sido copiados.");
        }).catch(err => {
          alert("Error al copiar: " + err);
        });
      } else {
        alert("No hay códigos iframe para copiar.");
      }
    }

    // ========== PAGINACIÓN ==========

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

    // ========== RESETEO ==========

    function resetearFiltros() {
      document.getElementById("filtroSerie").value = "";
      document.getElementById("filtroTemporada").value = "";
      document.getElementById("filtroIdioma").value = "";
      document.getElementById("filtroServidor").value = "";
      paginaActual = 1;
      aplicarFiltros();
    }

    // ========== EXPORTAR A EXCEL ==========

    function exportarTablaAExcel() {
      if (datosFiltrados.length === 0) {
        alert("No hay datos para exportar.");
        return;
      }

      const datosParaExportar = datosFiltrados.map(d => ({
        Serie: d.nombreSerie,
        Temporada: d.temporada,
        Idioma: d.idioma,
        Servidor: d.servidor,
        Episodio: d.episodio,
        "Código iframe": d.iframe
      }));

      const ws = XLSX.utils.json_to_sheet(datosParaExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Series filtradas");

      XLSX.writeFile(wb, "series_filtradas.xlsx");
    }

    // ========== INICIALIZACIÓN ==========

    window.onload = cargarDatos;