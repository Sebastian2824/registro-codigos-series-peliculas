// ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== DOM REFERENCES ==========
    const serieSelect = document.getElementById('serieSelect');
    const temporadaSelect = document.getElementById('temporadaSelect');
    const idiomaSelect = document.getElementById('idiomaSelect');
    const servidorSelect = document.getElementById('servidorSelect');
    const episodiosContainer = document.getElementById('episodiosContainer');
    const formDimension = document.getElementById('formDimension');
    const btnModificarGroup = document.getElementById('btnModificarGroup');

    // Variables globales para mantener los valores actuales
    let serieActual = "";
    let temporadaActual = "";
    let idiomaActual = "";
    let servidorActual = "";

    // ========== FUNCIONES ==========

    window.onload = () => {
      cargarSeries();
    };

    async function cargarSeries() {
      try {
        const res = await fetch(`${WORKER_URL}/nombres-series`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const series = await res.json();

        serieSelect.innerHTML = `<option value="">Selecciona una serie</option>`;
        series.forEach(serie => {
          const option = document.createElement('option');
          option.value = serie;
          option.textContent = serie;
          serieSelect.appendChild(option);
        });

        temporadaSelect.disabled = true;
        idiomaSelect.disabled = true;
        servidorSelect.disabled = true;
      } catch (error) {
        console.error('Error cargando series:', error);
        alert('Error al cargar las series');
      }
    }

    async function cargarTemporadas() {
      const serie = serieSelect.value;
      serieActual = serie;

      temporadaSelect.innerHTML = `<option value="">Selecciona una temporada</option>`;
      idiomaSelect.innerHTML = `<option value="">Selecciona un idioma</option>`;
      servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
      limpiarContenedores();

      if (!serie) {
        temporadaSelect.disabled = true;
        idiomaSelect.disabled = true;
        servidorSelect.disabled = true;
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/temporadas?serie=${encodeURIComponent(serie)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const temporadas = await res.json();

        temporadaSelect.innerHTML = `<option value="">Selecciona una temporada</option>`;
        temporadas.forEach(temp => {
          const option = document.createElement('option');
          option.value = temp;
          option.textContent = temp;
          temporadaSelect.appendChild(option);
        });

        temporadaSelect.disabled = false;
        idiomaSelect.disabled = true;
        servidorSelect.disabled = true;
      } catch (error) {
        console.error('Error cargando temporadas:', error);
      }
    }

    async function cargarIdiomas() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      temporadaActual = temporada;

      idiomaSelect.innerHTML = `<option value="">Selecciona un idioma</option>`;
      servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
      limpiarContenedores();

      if (!temporada) {
        idiomaSelect.disabled = true;
        servidorSelect.disabled = true;
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/idiomas?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const idiomas = await res.json();

        idiomaSelect.innerHTML = `<option value="">Selecciona un idioma</option>`;
        idiomas.forEach(idioma => {
          const option = document.createElement('option');
          option.value = idioma;
          option.textContent = idioma;
          idiomaSelect.appendChild(option);
        });

        idiomaSelect.disabled = false;
        servidorSelect.disabled = true;
      } catch (error) {
        console.error('Error cargando idiomas:', error);
      }
    }

    async function cargarServidores() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      const idioma = idiomaSelect.value;
      idiomaActual = idioma;

      servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
      limpiarContenedores();

      if (!idioma) {
        servidorSelect.disabled = true;
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/servidores?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const servidores = await res.json();

        servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
        servidores.forEach(servidor => {
          const option = document.createElement('option');
          option.value = servidor;
          option.textContent = servidor;
          servidorSelect.appendChild(option);
        });

        servidorSelect.disabled = false;
      } catch (error) {
        console.error('Error cargando servidores:', error);
      }
    }

    async function cargarEpisodios() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      const idioma = idiomaSelect.value;
      const servidor = servidorSelect.value;
      servidorActual = servidor;

      limpiarContenedores();

      if (!servidor) return;

      try {
        const res = await fetch(`${WORKER_URL}/episodios?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const episodios = await res.json();

        if (!Array.isArray(episodios) || episodios.length === 0) {
          episodiosContainer.innerHTML = `
            <div class="empty-message">
              <i class="fas fa-info-circle"></i>
              No hay episodios en este servidor
            </div>
          `;
          btnModificarGroup.style.display = 'none';
          return;
        }

        let tablaHTML = `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 12%">Episodio</th>
                  <th style="width: 50%">Código iframe</th>
                  <th style="width: 15%">Width</th>
                  <th style="width: 15%">Height</th>
                </tr>
              </thead>
              <tbody>
        `;

        episodios.forEach(ep => {
          const episodio = ep.episodio;
          const iframe = ep.iframe || "";

          const widthMatch = iframe.match(/(?:\s|^)width\s*=\s*(?:"([^"]+)"|(\d+))/i);
          const heightMatch = iframe.match(/(?:\s|^)height\s*=\s*(?:"([^"]+)"|(\d+))/i);
          const width = widthMatch ? (widthMatch[1] || widthMatch[2]) : '';
          const height = heightMatch ? (heightMatch[1] || heightMatch[2]) : '';

          tablaHTML += `
            <tr>
              <td><strong>${episodio}</strong></td>
              <td>
                <textarea data-episodio="${episodio}">${iframe}</textarea>
              </td>
              <td><span class="dimension-badge">${width || '—'}</span></td>
              <td><span class="dimension-badge">${height || '—'}</span></td>
            </tr>
          `;
        });

        tablaHTML += `
              </tbody>
            </table>
          </div>
        `;

        episodiosContainer.innerHTML = tablaHTML;
        btnModificarGroup.style.display = 'block';
        formDimension.classList.remove('visible');

      } catch (error) {
        console.error('Error cargando episodios:', error);
        alert('Error al cargar los episodios');
      }
    }

    function limpiarContenedores() {
      episodiosContainer.innerHTML = '';
      formDimension.classList.remove('visible');
      btnModificarGroup.style.display = 'none';
    }

    function mostrarFormulario() {
      formDimension.classList.toggle('visible');
    }

    function ocultarFormulario() {
      formDimension.classList.remove('visible');
    }

    function aplicarCambiosDimension() {
      const nuevoWidth = document.getElementById('nuevoWidth').value.trim();
      const nuevoHeight = document.getElementById('nuevoHeight').value.trim();

      if (!nuevoWidth || !nuevoHeight) {
        alert('⚠️ Debes ingresar valores para width y height.');
        return;
      }

      const textareas = document.querySelectorAll('#episodiosContainer textarea');
      if (textareas.length === 0) {
        alert('No hay episodios para modificar.');
        return;
      }

      textareas.forEach(textarea => {
        let iframe = textarea.value;

        const widthMatch = iframe.match(/\b(width|WIDTH)\s*=\s*("[^"]*"|\d+)/);
        if (widthMatch) {
          const atributo = widthMatch[1];
          iframe = iframe.replace(/\b(width|WIDTH)\s*=\s*("[^"]*"|\d+)/, `${atributo}="${nuevoWidth}"`);
        } else {
          iframe = iframe.replace(/<iframe/i, `<iframe width="${nuevoWidth}"`);
        }

        const heightMatch = iframe.match(/\b(height|HEIGHT)\s*=\s*("[^"]*"|\d+)/);
        if (heightMatch) {
          const atributo = heightMatch[1];
          iframe = iframe.replace(/\b(height|HEIGHT)\s*=\s*("[^"]*"|\d+)/, `${atributo}="${nuevoHeight}"`);
        } else {
          iframe = iframe.replace(/<iframe/i, `<iframe height="${nuevoHeight}"`);
        }

        textarea.value = iframe;

        const fila = textarea.closest('tr');
        if (fila) {
          const badges = fila.querySelectorAll('.dimension-badge');
          if (badges.length >= 2) {
            badges[0].textContent = nuevoWidth;
            badges[1].textContent = nuevoHeight;
          }
        }
      });

      alert('✅ Las dimensiones han sido actualizadas en los campos mostrados. Pulsa "Guardar cambios" para persistir.');
      ocultarFormulario();
    }

    async function guardarCambios() {
      const serie = serieActual;
      const temporada = temporadaActual;
      const idioma = idiomaActual;
      const servidor = servidorActual;

      if (!serie || !temporada || !idioma || !servidor) {
        alert('⚠️ Asegúrate de haber seleccionado todos los filtros.');
        return;
      }

      const textareas = document.querySelectorAll('#episodiosContainer textarea');
      if (textareas.length === 0) {
        alert('No hay episodios para guardar.');
        return;
      }

      const registros = [];
      for (const textarea of textareas) {
        const episodio = textarea.dataset.episodio;
        const nuevoCodigo = textarea.value.trim();
        if (episodio && nuevoCodigo) {
          registros.push({
            nombreSerie: serie,
            temporada: temporada,
            idioma: idioma,
            servidor: servidor,
            episodio: episodio,
            iframe: nuevoCodigo
          });
        }
      }

      if (registros.length === 0) {
        alert('No hay cambios para guardar.');
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registros })
        });

        const data = await res.json();

        if (res.ok) {
          alert(`✅ ${registros.length} episodios guardados correctamente en Cloudflare.`);
        } else {
          alert('❌ Error al guardar: ' + (data.error || res.statusText));
        }
      } catch (error) {
        console.error(error);
        alert('❌ Error al guardar: ' + error.message);
      }
    }

    // ========== EVENT LISTENERS ==========
    serieSelect.addEventListener('change', cargarTemporadas);
    temporadaSelect.addEventListener('change', cargarIdiomas);
    idiomaSelect.addEventListener('change', cargarServidores);
    servidorSelect.addEventListener('change', cargarEpisodios);

    // Deshabilitar selects inicialmente
    temporadaSelect.disabled = true;
    idiomaSelect.disabled = true;
    servidorSelect.disabled = true;

    // Cerrar formulario con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && formDimension.classList.contains('visible')) {
        ocultarFormulario();
      }
    });