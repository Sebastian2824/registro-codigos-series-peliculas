const API_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';
    let episodiosData = {
      iframe: [],
      enlaces: [],
      descargas: [],
      original: []
    };

    // Mapeo de tipos a endpoints
    const endpoints = {
      iframe: {
        series: '/nombres-series',
        temporadas: '/temporadas',
        idiomas: '/idiomas',
        servidores: '/servidores',
        episodios: '/episodios',
        deleteEpisodio: '/eliminar-episodio',
        deleteServidor: '/eliminar-servidor'
      },
      enlaces: {
        series: '/nombres-series-url',
        temporadas: '/temporadas-url',
        idiomas: '/idiomas-url',
        servidores: '/servidores-url',
        episodios: '/episodios-url',
        deleteEpisodio: '/eliminar-episodio-url',
        deleteServidor: '/eliminar-servidor-url'
      },
      descargas: {
        series: '/nombres-series-descargas',
        temporadas: '/temporadas-descargas',
        idiomas: '/idiomas-descargas',
        servidores: '/servidores-descargas',
        episodios: '/episodios-descargas',
        deleteEpisodio: '/eliminar-episodio-descargas',
        deleteServidor: '/eliminar-servidor-descargas'
      },
      original: {
        series: '/nombres-series-original',
        temporadas: '/temporadas-original',
        idiomas: '/idiomas-original',
        servidores: '/servidores-original',
        episodios: '/episodios-original',
        deleteEpisodio: '/eliminar-episodio-original',
        deleteServidor: '/eliminar-servidor-original'
      }
    };

    // Mostrar mensaje
    function showMessage(message, type = 'success') {
      const msgDiv = document.getElementById('message');
      msgDiv.className = `message ${type}`;
      msgDiv.innerHTML = message;
      clearTimeout(msgDiv._timeout);
      msgDiv._timeout = setTimeout(() => {
        msgDiv.style.display = 'none';
        msgDiv.className = 'message';
      }, 5000);
    }

    // Cargar series para cada tipo
    async function cargarSeries(tipo) {
      try {
        const response = await fetch(`${API_URL}${endpoints[tipo].series}`);
        const series = await response.json();
        const select = document.getElementById(`${tipo}-serie`);
        select.innerHTML = '<option value="">Seleccionar serie...</option>';
        series.forEach(serie => {
          select.innerHTML += `<option value="${serie}">${serie}</option>`;
        });
      } catch (error) {
        console.error(`Error cargando series para ${tipo}:`, error);
      }
    }

    // Cargar temporadas
    async function cargarTemporadas(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporadaSelect = document.getElementById(`${tipo}-temporada`);
      const idiomaSelect = document.getElementById(`${tipo}-idioma`);
      const servidorSelect = document.getElementById(`${tipo}-servidor`);
      
      if (!serie) {
        temporadaSelect.innerHTML = '<option value="">Primero selecciona una serie</option>';
        temporadaSelect.disabled = true;
        return;
      }

      try {
        const response = await fetch(`${API_URL}${endpoints[tipo].temporadas}?serie=${encodeURIComponent(serie)}`);
        const temporadas = await response.json();
        temporadaSelect.innerHTML = '<option value="">Seleccionar temporada...</option>';
        temporadas.forEach(temp => {
          temporadaSelect.innerHTML += `<option value="${temp}">${temp}</option>`;
        });
        temporadaSelect.disabled = false;
        
        idiomaSelect.innerHTML = '<option value="">Primero selecciona una temporada</option>';
        idiomaSelect.disabled = true;
        servidorSelect.innerHTML = '<option value="">Primero selecciona un idioma</option>';
        servidorSelect.disabled = true;
        
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Selecciona los filtros para ver los episodios</td></tr>';
      } catch (error) {
        console.error(`Error cargando temporadas para ${tipo}:`, error);
      }
    }

    // Cargar idiomas
    async function cargarIdiomas(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idiomaSelect = document.getElementById(`${tipo}-idioma`);
      const servidorSelect = document.getElementById(`${tipo}-servidor`);
      
      if (!serie || !temporada) return;

      try {
        const response = await fetch(`${API_URL}${endpoints[tipo].idiomas}?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}`);
        const idiomas = await response.json();
        idiomaSelect.innerHTML = '<option value="">Seleccionar idioma...</option>';
        idiomas.forEach(idi => {
          idiomaSelect.innerHTML += `<option value="${idi}">${idi}</option>`;
        });
        idiomaSelect.disabled = false;
        
        servidorSelect.innerHTML = '<option value="">Primero selecciona un idioma</option>';
        servidorSelect.disabled = true;
        
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Selecciona los filtros para ver los episodios</td></tr>';
      } catch (error) {
        console.error(`Error cargando idiomas para ${tipo}:`, error);
      }
    }

    // Cargar servidores
    async function cargarServidores(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      const servidorSelect = document.getElementById(`${tipo}-servidor`);
      
      if (!serie || !temporada || !idioma) return;

      try {
        const response = await fetch(`${API_URL}${endpoints[tipo].servidores}?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}`);
        const servidores = await response.json();
        servidorSelect.innerHTML = '<option value="">Seleccionar servidor...</option>';
        servidores.forEach(serv => {
          servidorSelect.innerHTML += `<option value="${serv}">${serv}</option>`;
        });
        servidorSelect.disabled = false;
        
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Selecciona un servidor para ver los episodios</td></tr>';
      } catch (error) {
        console.error(`Error cargando servidores para ${tipo}:`, error);
      }
    }

    // Cargar episodios (con wrapper para Jumpshare en iframe)
    async function cargarEpisodios(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      const servidor = document.getElementById(`${tipo}-servidor`).value;
      
      if (!serie || !temporada || !idioma || !servidor) return;

      try {
        const response = await fetch(`${API_URL}${endpoints[tipo].episodios}?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`);
        const episodios = await response.json();
        episodiosData[tipo] = episodios;
        
        const tbody = document.getElementById(`${tipo}-tbody`);
        if (episodios.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">No hay episodios para esta selección</td></tr>';
          return;
        }

        const esJumpshare = (tipo === 'iframe' && servidor && servidor.toLowerCase().includes('jumpshare'));

        tbody.innerHTML = episodios.map(ep => {
          let contenido = ep.iframe || ep.URL || ep.url || 'N/A';
          if (esJumpshare && contenido && contenido.includes('<iframe')) {
            contenido = `<div class="iframe-wrapper">${contenido}</div>`;
          }
          return `
            <tr>
              <td class="checkbox-cell"><input type="checkbox" value="${ep.episodio}" class="episodio-checkbox-${tipo}"></td>
              <td>${ep.episodio}</td>
              <td>${contenido}</td>
            </tr>
          `;
        }).join('');
        
        const selectAll = document.getElementById(`${tipo}-select-all`);
        if (selectAll) selectAll.checked = false;
        
      } catch (error) {
        console.error(`Error cargando episodios para ${tipo}:`, error);
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#dc2626;">Error al cargar episodios</td></tr>';
      }
    }

    // Seleccionar todos
    function seleccionarTodos(tipo) {
      const selectAll = document.getElementById(`${tipo}-select-all`);
      const checkboxes = document.querySelectorAll(`.episodio-checkbox-${tipo}`);
      checkboxes.forEach(cb => cb.checked = selectAll.checked);
    }

    // Eliminar episodios seleccionados
    async function eliminarSeleccionados(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      const servidor = document.getElementById(`${tipo}-servidor`).value;
      
      const checkboxes = document.querySelectorAll(`.episodio-checkbox-${tipo}:checked`);
      if (checkboxes.length === 0) {
        showMessage('Selecciona al menos un episodio para eliminar', 'error');
        return;
      }
      
      const episodiosAEliminar = Array.from(checkboxes).map(cb => cb.value);
      
      if (!confirm(`¿Estás seguro de eliminar ${episodiosAEliminar.length} episodio(s)?`)) return;
      
      let eliminados = 0;
      let errores = 0;
      
      for (const episodio of episodiosAEliminar) {
        try {
          const response = await fetch(`${API_URL}${endpoints[tipo].deleteEpisodio}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serie,
              temporada,
              idioma,
              servidor,
              episodio
            })
          });
          
          if (response.ok) {
            eliminados++;
          } else {
            errores++;
          }
        } catch (error) {
          errores++;
          console.error(`Error eliminando episodio ${episodio}:`, error);
        }
      }
      
      showMessage(`✅ ${eliminados} episodios eliminados correctamente${errores > 0 ? `, ${errores} errores` : ''}`, eliminados > 0 ? 'success' : 'error');
      
      await cargarEpisodios(tipo);
    }

    // Eliminar servidor completo
    async function eliminarServidorCompleto(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      const servidor = document.getElementById(`${tipo}-servidor`).value;
      
      if (!serie || !temporada || !idioma || !servidor) {
        showMessage('Selecciona todos los filtros antes de eliminar un servidor completo', 'error');
        return;
      }
      
      const totalEpisodios = episodiosData[tipo].length;
      if (totalEpisodios === 0) {
        showMessage('No hay episodios para eliminar en este servidor', 'error');
        return;
      }
      
      if (!confirm(`⚠️ ADVERTENCIA: Esto eliminará TODOS los ${totalEpisodios} episodios del servidor "${servidor}"\n\n¿Estás completamente seguro?`)) return;
      
      try {
        const response = await fetch(`${API_URL}${endpoints[tipo].deleteServidor}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serie,
            temporada,
            idioma,
            servidor
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          showMessage(result.message, 'success');
          await cargarEpisodios(tipo);
        } else {
          showMessage(result.error || 'Error al eliminar el servidor', 'error');
        }
      } catch (error) {
        console.error(`Error eliminando servidor completo para ${tipo}:`, error);
        showMessage('Error de conexión al eliminar el servidor', 'error');
      }
    }

    // Cambio de pestaña
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        document.getElementById(`panel-${tabId}`).classList.add('active');
        
        const select = document.getElementById(`${tabId}-serie`);
        if (select.options.length <= 1) {
          cargarSeries(tabId);
        }
      });
    });

    // Cargar todas las series al inicio
    cargarSeries('iframe');
    cargarSeries('enlaces');
    cargarSeries('descargas');
    cargarSeries('original');