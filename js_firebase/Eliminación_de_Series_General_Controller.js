// ========== CONFIGURACIÓN FIREBASE ==========
    const firebaseConfig = {
      apiKey: "AIzaSyB6MY2y5uyum87PdUHUpY8NNh4D73Yhx4U",
      authDomain: "animes-plus-89b93.firebaseapp.com",
      projectId: "animes-plus-89b93",
      storageBucket: "animes-plus-89b93.appspot.com",
      messagingSenderId: "402867181985",
      appId: "1:402867181985:web:d695b12977fe4270dbd3e0"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // ========== CONFIGURACIÓN DE COLECCIONES ==========
    const collections = {
      iframe: { name: "animes-series", field: "iframe" },
      enlaces: { name: "animes-series-enlaces", field: "url" },
      descargas: { name: "animes-series-descargas", field: "iframe" },
      original: { name: "animes-series-original", field: "url" }
    };

    let episodiosData = { iframe: [], enlaces: [], descargas: [], original: [] };

    // ========== UTILIDADES ==========
    function showMessage(message, type = 'success') {
      const msgDiv = document.getElementById('message');
      msgDiv.className = `message ${type}`;
      msgDiv.innerHTML = message;
      msgDiv.style.display = 'block';
      clearTimeout(msgDiv._timeout);
      msgDiv._timeout = setTimeout(() => {
        msgDiv.style.display = 'none';
        msgDiv.className = 'message';
      }, 5000);
    }

    function escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function actualizarContador(tipo, total) {
      const counterDiv = document.getElementById(`${tipo}-counter`);
      if (total === 0) {
        counterDiv.style.display = 'none';
      } else {
        counterDiv.style.display = 'inline-block';
        const span = counterDiv.querySelector('span');
        if (span) span.textContent = total;
        else counterDiv.innerHTML = `<i class="fas fa-list"></i> ${total} episodio(s)`;
      }
    }

    // ========== FUNCIONES DE CARGA ==========
    async function cargarSeries(tipo) {
      try {
        const snapshot = await db.collection(collections[tipo].name).get();
        const series = [];
        snapshot.forEach(doc => series.push(doc.id));
        series.sort();
        const select = document.getElementById(`${tipo}-serie`);
        select.innerHTML = '<option value="">Seleccionar serie...</option>';
        series.forEach(serie => {
          const opt = document.createElement('option');
          opt.value = serie;
          opt.textContent = serie;
          select.appendChild(opt);
        });
      } catch (error) {
        console.error(error);
        showMessage(`Error cargando series: ${error.message}`, 'error');
      }
    }

    async function cargarTemporadas(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      if (!serie) return;
      try {
        const snapshot = await db.collection(collections[tipo].name).doc(serie).collection("Temporadas").get();
        const temporadas = [];
        snapshot.forEach(doc => temporadas.push(doc.id));
        temporadas.sort();
        const select = document.getElementById(`${tipo}-temporada`);
        select.innerHTML = '<option value="">Seleccionar temporada...</option>';
        temporadas.forEach(temp => {
          const opt = document.createElement('option');
          opt.value = temp;
          opt.textContent = temp;
          select.appendChild(opt);
        });
        select.disabled = false;
        // Resetear siguientes selects
        document.getElementById(`${tipo}-idioma`).innerHTML = '<option value="">Selecciona temporada</option>';
        document.getElementById(`${tipo}-idioma`).disabled = true;
        document.getElementById(`${tipo}-servidor`).innerHTML = '<option value="">Selecciona idioma</option>';
        document.getElementById(`${tipo}-servidor`).disabled = true;
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Selecciona los filtros para ver los episodios</td></tr>';
        actualizarContador(tipo, 0);
      } catch (error) {
        console.error(error);
      }
    }

    async function cargarIdiomas(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      if (!serie || !temporada) return;
      try {
        const snapshot = await db.collection(collections[tipo].name).doc(serie)
          .collection("Temporadas").doc(temporada).collection("Idiomas").get();
        const idiomas = [];
        snapshot.forEach(doc => idiomas.push(doc.id));
        idiomas.sort();
        const select = document.getElementById(`${tipo}-idioma`);
        select.innerHTML = '<option value="">Seleccionar idioma...</option>';
        idiomas.forEach(idi => {
          const opt = document.createElement('option');
          opt.value = idi;
          opt.textContent = idi;
          select.appendChild(opt);
        });
        select.disabled = false;
        document.getElementById(`${tipo}-servidor`).innerHTML = '<option value="">Selecciona idioma</option>';
        document.getElementById(`${tipo}-servidor`).disabled = true;
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Selecciona un servidor</td></tr>';
        actualizarContador(tipo, 0);
      } catch (error) {
        console.error(error);
      }
    }

    async function cargarServidores(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      if (!serie || !temporada || !idioma) return;
      try {
        const snapshot = await db.collection(collections[tipo].name).doc(serie)
          .collection("Temporadas").doc(temporada)
          .collection("Idiomas").doc(idioma).collection("Servidores").get();
        const servidores = [];
        snapshot.forEach(doc => servidores.push(doc.id));
        servidores.sort();
        const select = document.getElementById(`${tipo}-servidor`);
        select.innerHTML = '<option value="">Seleccionar servidor...</option>';
        servidores.forEach(serv => {
          const opt = document.createElement('option');
          opt.value = serv;
          opt.textContent = serv;
          select.appendChild(opt);
        });
        select.disabled = false;
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Selecciona un servidor para ver episodios</td></tr>';
        actualizarContador(tipo, 0);
      } catch (error) {
        console.error(error);
      }
    }

    async function cargarEpisodios(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      const servidor = document.getElementById(`${tipo}-servidor`).value;

      if (!serie || !temporada || !idioma || !servidor) return;

      try {
        const episodiosRef = db.collection(collections[tipo].name).doc(serie)
          .collection("Temporadas").doc(temporada)
          .collection("Idiomas").doc(idioma)
          .collection("Servidores").doc(servidor)
          .collection("Episodios");

        const snapshot = await episodiosRef.get();
        const episodios = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          episodios.push({
            episodio: doc.id,
            contenido: data[collections[tipo].field] || 'N/A'
          });
        });

        // Ordenar numéricamente
        episodios.sort((a, b) => {
          const numA = parseInt(a.episodio.match(/\d+/)) || 0;
          const numB = parseInt(b.episodio.match(/\d+/)) || 0;
          return numA - numB;
        });

        episodiosData[tipo] = episodios;
        const tbody = document.getElementById(`${tipo}-tbody`);

        if (episodios.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">No hay episodios en este servidor</td></tr>';
          actualizarContador(tipo, 0);
          return;
        }

        actualizarContador(tipo, episodios.length);

        let html = '';
        for (const ep of episodios) {
          const contenido = ep.contenido;
          const displayContenido = contenido.length > 200
            ? `<div class="content-wrapper">${escapeHtml(contenido)}</div>`
            : `<span class="url-text">${escapeHtml(contenido)}</span>`;

          html += `
            <tr>
              <td class="checkbox-cell"><input type="checkbox" value="${escapeHtml(ep.episodio)}" class="episodio-checkbox-${tipo}"></td>
              <td><strong>${escapeHtml(ep.episodio)}</strong></td>
              <td>${displayContenido}</td>
            </tr>
          `;
        }
        tbody.innerHTML = html;

        // Desmarcar "seleccionar todos"
        const selectAll = document.getElementById(`${tipo}-select-all`);
        if (selectAll) selectAll.checked = false;

        console.log(`✅ ${tipo}: ${episodios.length} episodios mostrados`);
      } catch (error) {
        console.error(error);
        document.getElementById(`${tipo}-tbody`).innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px; color:#dc2626;">Error: ${error.message}</td></tr>`;
        showMessage(`Error cargando episodios: ${error.message}`, 'error');
      }
    }

    // ========== FUNCIONES DE ACCIÓN ==========
    function recargarEpisodios(tipo) {
      cargarEpisodios(tipo);
      showMessage('Episodios recargados', 'info');
    }

    function seleccionarTodos(tipo) {
      const selectAll = document.getElementById(`${tipo}-select-all`);
      const checkboxes = document.querySelectorAll(`.episodio-checkbox-${tipo}`);
      checkboxes.forEach(cb => cb.checked = selectAll.checked);
    }

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

      if (!confirm(`¿Estás seguro de eliminar ${checkboxes.length} episodio(s)?\n\nEsta acción no se puede deshacer.`)) return;

      let eliminados = 0;
      const errores = [];
      for (const cb of checkboxes) {
        try {
          await db.collection(collections[tipo].name).doc(serie)
            .collection("Temporadas").doc(temporada)
            .collection("Idiomas").doc(idioma)
            .collection("Servidores").doc(servidor)
            .collection("Episodios").doc(cb.value).delete();
          eliminados++;
        } catch (error) {
          errores.push(`${cb.value}: ${error.message}`);
        }
      }

      // Verificar si el servidor quedó vacío
      const restantes = await db.collection(collections[tipo].name).doc(serie)
        .collection("Temporadas").doc(temporada)
        .collection("Idiomas").doc(idioma)
        .collection("Servidores").doc(servidor)
        .collection("Episodios").get();

      if (restantes.size === 0) {
        try {
          await db.collection(collections[tipo].name).doc(serie)
            .collection("Temporadas").doc(temporada)
            .collection("Idiomas").doc(idioma)
            .collection("Servidores").doc(servidor).delete();
          showMessage(`✅ Servidor "${servidor}" eliminado automáticamente (quedó vacío)`, 'success');
          await cargarServidores(tipo);
        } catch (error) {
          console.error(error);
        }
      }

      if (errores.length > 0) {
        showMessage(`⚠️ ${eliminados} eliminados, ${errores.length} errores: ${errores.join('; ')}`, 'error');
      } else {
        showMessage(`✅ ${eliminados} episodios eliminados correctamente`, 'success');
      }
      await cargarEpisodios(tipo);
    }

    async function eliminarServidorCompleto(tipo) {
      const serie = document.getElementById(`${tipo}-serie`).value;
      const temporada = document.getElementById(`${tipo}-temporada`).value;
      const idioma = document.getElementById(`${tipo}-idioma`).value;
      const servidor = document.getElementById(`${tipo}-servidor`).value;

      if (!serie || !temporada || !idioma || !servidor) {
        showMessage('Selecciona todos los filtros antes de eliminar un servidor completo', 'error');
        return;
      }

      const total = episodiosData[tipo]?.length || 0;
      if (total === 0) {
        showMessage('Este servidor ya está vacío', 'info');
        return;
      }

      if (!confirm(`⚠️ ADVERTENCIA: Esto eliminará TODOS los ${total} episodios del servidor "${servidor}"\n\nEsta acción es irreversible.\n\n¿Estás completamente seguro?`)) return;

      try {
        const servidorRef = db.collection(collections[tipo].name).doc(serie)
          .collection("Temporadas").doc(temporada)
          .collection("Idiomas").doc(idioma)
          .collection("Servidores").doc(servidor);

        const episodiosRef = servidorRef.collection("Episodios");
        const snapshot = await episodiosRef.get();
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(servidorRef);
        await batch.commit();

        showMessage(`✅ Servidor "${servidor}" eliminado correctamente con todos sus ${snapshot.size} episodios`, 'success');
        await cargarServidores(tipo);
        document.getElementById(`${tipo}-tbody`).innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#94a3b8;">Servidor eliminado</td></tr>';
        actualizarContador(tipo, 0);
      } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
      }
    }

    // ========== EXPONER FUNCIONES GLOBALES ==========
    window.cargarSeries = cargarSeries;
    window.cargarTemporadas = cargarTemporadas;
    window.cargarIdiomas = cargarIdiomas;
    window.cargarServidores = cargarServidores;
    window.cargarEpisodios = cargarEpisodios;
    window.recargarEpisodios = recargarEpisodios;
    window.seleccionarTodos = seleccionarTodos;
    window.eliminarSeleccionados = eliminarSeleccionados;
    window.eliminarServidorCompleto = eliminarServidorCompleto;

    // ========== INICIALIZACIÓN ==========
    cargarSeries('iframe');
    cargarSeries('enlaces');
    cargarSeries('descargas');
    cargarSeries('original');

    // ========== MANEJO DE TABS ==========
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('cloudflare')) return; // ya tiene su propio handler
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${tabId}`).classList.add('active');
      });
    });