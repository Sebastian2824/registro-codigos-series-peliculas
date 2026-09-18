 // ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== DOM ELEMENTS ==========
    const serieSelect = document.getElementById("serieSelect");
    const temporadaSelect = document.getElementById("temporadaSelect");
    const idiomaSelect = document.getElementById("idiomaSelect");
    const servidorSelect = document.getElementById("servidorSelect");

    const nuevaTemporadaInput = document.getElementById("nuevaTemporadaInput");
    const nuevoIdiomaInput = document.getElementById("nuevoIdiomaInput");
    const nuevoServidorInput = document.getElementById("nuevoServidorInput");

    let serieActual = "";
    let temporadaActual = "";
    let idiomaActual = "";
    let servidorActual = "";

    // ========== PROGRESO ==========
    function mostrarProgreso(titulo, totalItems) {
      const overlay = document.createElement('div');
      overlay.className = 'progress-overlay';
      overlay.id = 'progressOverlay';
      overlay.innerHTML = `
        <div class="progress-container">
          <div class="progress-title"><i class="fas fa-spinner fa-spin"></i> ${titulo}</div>
          <div class="progress-info">
            <p><i class="fas fa-chart-bar"></i> Total a procesar: <strong>${totalItems}</strong></p>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar" id="progressBar">0%</div>
          </div>
          <div class="progress-status" id="progressStatus">Iniciando proceso...</div>
          <div class="progress-details" id="progressDetails"></div>
        </div>
      `;
      document.body.appendChild(overlay);
      return {
        update: (progreso, mensaje, detalle) => {
          const barra = document.getElementById('progressBar');
          const status = document.getElementById('progressStatus');
          const details = document.getElementById('progressDetails');
          if (barra) {
            const p = Math.round(progreso);
            barra.style.width = `${p}%`;
            barra.textContent = `${p}%`;
          }
          if (status && mensaje) status.textContent = mensaje;
          if (details && detalle) {
            const p = document.createElement('p');
            p.textContent = detalle;
            details.appendChild(p);
            details.scrollTop = details.scrollHeight;
          }
        },
        cerrar: () => {
          const existente = document.getElementById('progressOverlay');
          if (existente) existente.remove();
        }
      };
    }

    // ========== DOMINIO ==========
    function extraerDominioDeURL(url) {
      const match = url.match(/https?:\/\/([^\/]+)/);
      return match ? match[1] : null;
    }

    async function actualizarMarcoDominio() {
      const servidor = servidorSelect.value;
      const dominioContainer = document.getElementById('dominioContainer');
      const dominioActualInput = document.getElementById('dominioActual');
      const nuevoDominioInput = document.getElementById('nuevoDominio');
      const infoDominio = document.getElementById('infoDominio');

      if (!servidor || !serieActual || !temporadaActual || !idiomaActual) {
        dominioContainer.classList.remove('visible');
        return;
      }

      if (servidor.toLowerCase().includes('abyss')) {
        dominioContainer.classList.add('visible');
        try {
          const res = await fetch(`${WORKER_URL}/episodios-url?serie=${encodeURIComponent(serieActual)}&temporada=${encodeURIComponent(temporadaActual)}&idioma=${encodeURIComponent(idiomaActual)}&servidor=${encodeURIComponent(servidor)}`);
          const episodios = await res.json();
          let dominioEncontrado = null;
          if (episodios.length > 0 && episodios[0].url) {
            dominioEncontrado = extraerDominioDeURL(episodios[0].url);
          }
          if (dominioEncontrado) {
            dominioActualInput.value = dominioEncontrado;
            nuevoDominioInput.placeholder = `Ej: ${dominioEncontrado}`;
            infoDominio.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Dominio detectado: ${dominioEncontrado}`;
          } else {
            dominioActualInput.value = 'No detectado';
            nuevoDominioInput.placeholder = 'Ej: nuevodominio.com';
            infoDominio.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f6821f;"></i> No se pudo detectar el dominio';
          }
        } catch (error) {
          console.error('Error detectando dominio:', error);
          dominioActualInput.value = 'Error';
          infoDominio.innerHTML = '<i class="fas fa-times-circle" style="color:#dc2626;"></i> Error al detectar';
        }
      } else {
        dominioContainer.classList.remove('visible');
      }
    }

    // ========== ACTUALIZAR DOMINIOS (SERIE ACTUAL) ==========
    async function actualizarDominiosSerie() {
      const nuevoDominio = document.getElementById('nuevoDominio').value.trim();
      const dominioActual = document.getElementById('dominioActual').value.trim();
      
      if (!nuevoDominio) {
        alert('Por favor, ingresa un nuevo dominio válido');
        return;
      }
      if (nuevoDominio === dominioActual) {
        alert('El nuevo dominio es igual al actual. No se realizarán cambios.');
        return;
      }

      const res = await fetch(`${WORKER_URL}/episodios-url?serie=${encodeURIComponent(serieActual)}&temporada=${encodeURIComponent(temporadaActual)}&idioma=${encodeURIComponent(idiomaActual)}&servidor=${encodeURIComponent(servidorActual)}`);
      const episodios = await res.json();
      
      if (episodios.length === 0) {
        alert('No hay episodios para actualizar');
        return;
      }

      if (!confirm(`¿Actualizar ${episodios.length} episodios?\nSerie: ${serieActual}\nDominio actual: ${dominioActual}\nNuevo dominio: ${nuevoDominio}`)) return;

      const progreso = mostrarProgreso('Actualizando URLs de la Serie', episodios.length);
      let actualizados = 0, errores = 0;

      for (let i = 0; i < episodios.length; i++) {
        const ep = episodios[i];
        const nuevaUrl = ep.url.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
        if (nuevaUrl !== ep.url) {
          try {
            const updateRes = await fetch(`${WORKER_URL}/actualizar-episodio-url`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                serie: serieActual,
                temporada: temporadaActual,
                idioma: idiomaActual,
                servidor: servidorActual,
                episodio: ep.episodio,
                url: nuevaUrl
              })
            });
            if (updateRes.ok) {
              actualizados++;
              progreso.update(
                ((i + 1) / episodios.length) * 100,
                `Procesando: ${i + 1} de ${episodios.length}`,
                `✅ ${ep.episodio} - URL actualizada`
              );
            } else {
              errores++;
              progreso.update(
                ((i + 1) / episodios.length) * 100,
                `Procesando: ${i + 1} de ${episodios.length}`,
                `❌ ${ep.episodio} - Error`
              );
            }
          } catch (error) {
            errores++;
            progreso.update(
              ((i + 1) / episodios.length) * 100,
              `Procesando: ${i + 1} de ${episodios.length}`,
              `❌ ${ep.episodio} - ${error.message}`
            );
          }
        } else {
          progreso.update(
            ((i + 1) / episodios.length) * 100,
            `Procesando: ${i + 1} de ${episodios.length}`,
            `⏭️ ${ep.episodio} - Sin cambios`
          );
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      progreso.update(100, '¡Proceso completado!', `📊 Resumen: ${actualizados} actualizados, ${errores} errores`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      progreso.cerrar();
      alert(`✅ Proceso completado:\n- URLs actualizadas: ${actualizados}\n- Errores: ${errores}`);
      await cargarEpisodios();
      await actualizarMarcoDominio();
    }

    // ========== ACTUALIZAR DOMINIOS (TODAS LAS SERIES) ==========
    async function actualizarDominiosTodasSeries() {
      const nuevoDominio = document.getElementById('nuevoDominio').value.trim();
      const dominioActual = document.getElementById('dominioActual').value.trim();
      
      if (!nuevoDominio) {
        alert('Por favor, ingresa un nuevo dominio válido');
        return;
      }
      if (nuevoDominio === dominioActual) {
        alert('El nuevo dominio es igual al actual. No se realizarán cambios.');
        return;
      }

      if (!confirm(`⚠️ ADVERTENCIA: Esto actualizará TODAS las URLs de TODAS las series con servidor que contenga "abyss"\n\nDominio actual: ${dominioActual}\nNuevo dominio: ${nuevoDominio}\n\n¿Estás completamente seguro?`)) return;

      const seriesRes = await fetch(`${WORKER_URL}/nombres-series-url`);
      const series = await seriesRes.json();
      
      const progreso = mostrarProgreso('Analizando estructura', series.length);
      const urlsPorActualizar = [];
      
      for (let i = 0; i < series.length; i++) {
        const serie = series[i];
        progreso.update(
          ((i + 1) / series.length) * 100,
          `Analizando serie: ${serie}`,
          `🔍 Buscando servidores "abyss" en ${serie}`
        );
        try {
          const tempsRes = await fetch(`${WORKER_URL}/temporadas-url?serie=${encodeURIComponent(serie)}`);
          const temporadas = await tempsRes.json();
          for (const temp of temporadas) {
            const idiomasRes = await fetch(`${WORKER_URL}/idiomas-url?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temp)}`);
            const idiomas = await idiomasRes.json();
            for (const idioma of idiomas) {
              const servidoresRes = await fetch(`${WORKER_URL}/servidores-url?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temp)}&idioma=${encodeURIComponent(idioma)}`);
              const servidores = await servidoresRes.json();
              for (const servidor of servidores) {
                if (servidor.toLowerCase().includes('abyss')) {
                  const episodiosRes = await fetch(`${WORKER_URL}/episodios-url?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temp)}&idioma=${encodeURIComponent(idioma)}&servidor=${encodeURIComponent(servidor)}`);
                  const episodios = await episodiosRes.json();
                  for (const ep of episodios) {
                    if (ep.url) {
                      const nuevaUrl = ep.url.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
                      if (nuevaUrl !== ep.url) {
                        urlsPorActualizar.push({
                          serie, temp, idioma, servidor,
                          episodio: ep.episodio,
                          nuevaUrl
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error analizando serie ${serie}:`, error);
        }
      }
      progreso.cerrar();

      if (urlsPorActualizar.length === 0) {
        alert('No se encontraron URLs para actualizar');
        return;
      }
      if (!confirm(`Se encontraron ${urlsPorActualizar.length} URLs para actualizar. ¿Deseas continuar?`)) return;

      const progresoActualizacion = mostrarProgreso('Actualizando URLs - Todas las Series', urlsPorActualizar.length);
      let actualizados = 0, errores = 0;

      for (let i = 0; i < urlsPorActualizar.length; i++) {
        const item = urlsPorActualizar[i];
        try {
          const updateRes = await fetch(`${WORKER_URL}/actualizar-episodio-url`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serie: item.serie,
              temporada: item.temp,
              idioma: item.idioma,
              servidor: item.servidor,
              episodio: item.episodio,
              url: item.nuevaUrl
            })
          });
          if (updateRes.ok) {
            actualizados++;
            progresoActualizacion.update(
              ((i + 1) / urlsPorActualizar.length) * 100,
              `Procesando: ${i + 1} de ${urlsPorActualizar.length}`,
              `✅ ${item.serie} > ${item.episodio}`
            );
          } else {
            errores++;
            progresoActualizacion.update(
              ((i + 1) / urlsPorActualizar.length) * 100,
              `Procesando: ${i + 1} de ${urlsPorActualizar.length}`,
              `❌ ${item.serie} > ${item.episodio}`
            );
          }
        } catch (error) {
          errores++;
          progresoActualizacion.update(
            ((i + 1) / urlsPorActualizar.length) * 100,
            `Procesando: ${i + 1} de ${urlsPorActualizar.length}`,
            `❌ ${item.serie} > ${item.episodio} - ${error.message}`
          );
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      progresoActualizacion.update(100, '¡Proceso completado!', `📊 Resumen: ${actualizados} actualizados, ${errores} errores`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      progresoActualizacion.cerrar();
      alert(`✅ Proceso completado:\n- URLs actualizadas: ${actualizados}\n- Errores: ${errores}`);
      if (serieActual && temporadaActual && idiomaActual && servidorActual) {
        await cargarEpisodios();
        await actualizarMarcoDominio();
      }
    }

    // ========== CARGAR DATOS ==========
    async function cargarSeries() {
      try {
        const res = await fetch(`${WORKER_URL}/nombres-series-url`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const series = await res.json();
        if (!Array.isArray(series)) throw new Error('Formato inválido');

        serieSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
        series.forEach(nombre => {
          const option = document.createElement("option");
          option.value = option.text = nombre;
          serieSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando series:", error);
        serieSelect.innerHTML = '<option value="" disabled selected>Error al cargar series</option>';
      }
    }

    async function cargarTemporadas() {
      if (!serieActual) return;
      try {
        const res = await fetch(`${WORKER_URL}/temporadas-url?serie=${encodeURIComponent(serieActual)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const temporadas = await res.json();
        if (!Array.isArray(temporadas)) throw new Error('Formato inválido');

        temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
        temporadas.forEach(temp => {
          const option = document.createElement("option");
          option.value = option.text = temp;
          temporadaSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando temporadas:", error);
        temporadaSelect.innerHTML = '<option value="" disabled selected>Error al cargar temporadas</option>';
      }
    }

    async function cargarIdiomas() {
      if (!serieActual || !temporadaActual) return;
      try {
        const res = await fetch(`${WORKER_URL}/idiomas-url?serie=${encodeURIComponent(serieActual)}&temporada=${encodeURIComponent(temporadaActual)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const idiomas = await res.json();
        if (!Array.isArray(idiomas)) throw new Error('Formato inválido');

        idiomaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
        idiomas.forEach(idioma => {
          const option = document.createElement("option");
          option.value = option.text = idioma;
          idiomaSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando idiomas:", error);
        idiomaSelect.innerHTML = '<option value="" disabled selected>Error al cargar idiomas</option>';
      }
    }

    async function cargarServidores() {
      if (!serieActual || !temporadaActual || !idiomaActual) return;
      try {
        const res = await fetch(`${WORKER_URL}/servidores-url?serie=${encodeURIComponent(serieActual)}&temporada=${encodeURIComponent(temporadaActual)}&idioma=${encodeURIComponent(idiomaActual)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const servidores = await res.json();
        if (!Array.isArray(servidores)) throw new Error('Formato inválido');

        servidorSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
        servidores.forEach(servidor => {
          const option = document.createElement("option");
          option.value = option.text = servidor;
          servidorSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando servidores:", error);
        servidorSelect.innerHTML = '<option value="" disabled selected>Error al cargar servidores</option>';
      }
    }

    async function cargarEpisodios() {
      if (!serieActual || !temporadaActual || !idiomaActual || !servidorActual) return;
      try {
        const res = await fetch(`${WORKER_URL}/episodios-url?serie=${encodeURIComponent(serieActual)}&temporada=${encodeURIComponent(temporadaActual)}&idioma=${encodeURIComponent(idiomaActual)}&servidor=${encodeURIComponent(servidorActual)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const episodios = await res.json();
        if (!Array.isArray(episodios)) throw new Error('Formato inválido');

        const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
        tabla.innerHTML = "";

        if (episodios.length === 0) {
          tabla.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No hay episodios registrados</td></tr>';
          return;
        }

        episodios.forEach(ep => {
          const fila = tabla.insertRow();
          fila.classList.add("fila-existente");
          fila.setAttribute("data-episodio-original", ep.episodio);

          const celEp = fila.insertCell();
          const inputEp = document.createElement("input");
          inputEp.type = "text";
          inputEp.value = ep.episodio;
          celEp.appendChild(inputEp);

          const celUrl = fila.insertCell();
          const inputUrl = document.createElement("input");
          inputUrl.type = "text";
          inputUrl.value = ep.url || "";
          celUrl.appendChild(inputUrl);

          const celAcc = fila.insertCell();
          const wrapper = document.createElement("div");
          wrapper.className = "acciones";

          const btnAct = document.createElement("button");
          btnAct.className = "btn-actualizar";
          btnAct.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
          wrapper.appendChild(btnAct);

          const btnDel = document.createElement("button");
          btnDel.className = "btn-eliminar";
          btnDel.innerHTML = '<i class="fas fa-trash-alt"></i>';
          wrapper.appendChild(btnDel);

          celAcc.appendChild(wrapper);
        });
        await actualizarMarcoDominio();
      } catch (error) {
        console.error("Error cargando episodios:", error);
        const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
        tabla.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #dc2626; padding: 20px;">Error al cargar episodios: ${error.message}</td></tr>`;
      }
    }

    // ========== NUEVAS ENTRADAS ==========
    function nuevaEntrada(tipo) {
      if (tipo === "temporada") {
        temporadaSelect.disabled = true;
        nuevaTemporadaInput.style.display = "block";
        document.getElementById("nuevaTemporada").focus();
      } else if (tipo === "idioma") {
        idiomaSelect.disabled = true;
        nuevoIdiomaInput.style.display = "block";
        document.getElementById("nuevoIdioma").focus();
      } else if (tipo === "servidor") {
        servidorSelect.disabled = true;
        nuevoServidorInput.style.display = "block";
        document.getElementById("nuevoServidor").focus();
      }
    }

    function cancelarEntrada(tipo) {
      if (tipo === "temporada") {
        temporadaSelect.disabled = false;
        nuevaTemporadaInput.style.display = "none";
        document.getElementById("nuevaTemporada").value = "";
      } else if (tipo === "idioma") {
        idiomaSelect.disabled = false;
        nuevoIdiomaInput.style.display = "none";
        document.getElementById("nuevoIdioma").value = "";
      } else if (tipo === "servidor") {
        servidorSelect.disabled = false;
        nuevoServidorInput.style.display = "none";
        document.getElementById("nuevoServidor").value = "";
      }
    }

    async function guardarNuevaEntrada(tipo) {
      const valor = document.getElementById(tipo === "temporada" ? "nuevaTemporada" : tipo === "idioma" ? "nuevoIdioma" : "nuevoServidor").value.trim();
      if (!valor) {
        alert("Ingresa un nombre válido.");
        return;
      }
      if (tipo === "temporada") {
        const opt = document.createElement("option");
        opt.value = opt.text = valor;
        temporadaSelect.appendChild(opt);
        temporadaSelect.value = valor;
        temporadaActual = valor;
        cancelarEntrada("temporada");
        await cargarIdiomas();
      } else if (tipo === "idioma") {
        const opt = document.createElement("option");
        opt.value = opt.text = valor;
        idiomaSelect.appendChild(opt);
        idiomaSelect.value = valor;
        idiomaActual = valor;
        cancelarEntrada("idioma");
        await cargarServidores();
      } else if (tipo === "servidor") {
        const opt = document.createElement("option");
        opt.value = opt.text = valor;
        servidorSelect.appendChild(opt);
        servidorSelect.value = valor;
        servidorActual = valor;
        cancelarEntrada("servidor");
        await cargarEpisodios();
      }
    }

    // ========== AGREGAR FILA ==========
    function agregarFila() {
      const tabla = document.getElementById('tabla-episodios').getElementsByTagName('tbody')[0];
      if (tabla.children.length === 1 && tabla.children[0].cells.length === 3 && tabla.children[0].cells[0].colSpan === 3) {
        tabla.innerHTML = "";
      }
      const newRow = tabla.insertRow();
      newRow.classList.add("fila-nueva");
      newRow.innerHTML = `
        <td><input type="text" placeholder="Ej: Episodio X" /></td>
        <td><input type="text" placeholder="https://..." /></td>
        <td>
          <div class="acciones">
            <button class="btn-registrar"><i class="fas fa-save"></i> Registrar</button>
            <button class="btn-eliminar-fila"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      `;
    }

    // ========== ACCIONES DE FILA ==========
    async function actualizarEpisodio(fila) {
      const episodioOriginal = fila.getAttribute("data-episodio-original");
      const inputs = fila.getElementsByTagName("input");
      const episodioNombre = inputs[0].value.trim();
      const url = inputs[1].value.trim();

      if (!episodioNombre || !url) {
        alert("Completa todos los campos antes de actualizar.");
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/actualizar-episodio-url`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serie: serieActual,
            temporada: temporadaActual,
            idioma: idiomaActual,
            servidor: servidorActual,
            episodio: episodioOriginal,
            url: url
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert("Episodio actualizado correctamente");
          fila.setAttribute("data-episodio-original", episodioNombre);
          await actualizarMarcoDominio();
        } else {
          alert("Error al actualizar: " + (data.error || res.status));
        }
      } catch (err) {
        console.error(err);
        alert("Error interno: " + err.message);
      }
    }

    async function registrarNuevoEpisodio(fila) {
      const inputs = fila.getElementsByTagName("input");
      const episodioNombre = inputs[0].value.trim();
      const url = inputs[1].value.trim();

      if (!serieActual || !temporadaActual || !idiomaActual || !servidorActual || !episodioNombre || !url) {
        alert("Completa todos los campos antes de registrar.");
        return;
      }

      const registros = [{
        nombreSerie: serieActual,
        temporada: temporadaActual,
        idioma: idiomaActual,
        servidor: servidorActual,
        episodio: episodioNombre,
        url: url
      }];

      try {
        const res = await fetch(`${WORKER_URL}/registrar-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registros })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message || "Episodio registrado correctamente");
          fila.classList.remove("fila-nueva");
          fila.classList.add("fila-existente");
          fila.setAttribute("data-episodio-original", episodioNombre);

          const btnReg = fila.querySelector('.btn-registrar');
          if (btnReg) {
            btnReg.className = "btn-actualizar";
            btnReg.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
          }
          await actualizarMarcoDominio();
        } else {
          alert("Error al registrar: " + (data.error || res.statusText));
        }
      } catch (err) {
        console.error(err);
        alert("Error interno: " + err.message);
      }
    }

    async function eliminarEpisodio(fila) {
      const episodioNombre = fila.getAttribute("data-episodio-original");
      if (!confirm(`¿Eliminar episodio "${episodioNombre}"?`)) return;

      try {
        const res = await fetch(`${WORKER_URL}/eliminar-episodio-url`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serie: serieActual,
            temporada: temporadaActual,
            idioma: idiomaActual,
            servidor: servidorActual,
            episodio: episodioNombre
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert("Episodio eliminado correctamente");
          fila.remove();
          await actualizarMarcoDominio();
          const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
          if (tabla.children.length === 0) {
            tabla.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No hay episodios registrados</td></tr>';
          }
        } else {
          alert("Error al eliminar: " + (data.error || res.status));
        }
      } catch (err) {
        console.error(err);
        alert("Error interno: " + err.message);
      }
    }

    function eliminarFilaNueva(fila) {
      if (confirm("¿Eliminar esta fila?")) {
        fila.remove();
        const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
        if (tabla.children.length === 0) {
          tabla.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No hay episodios registrados</td></tr>';
        }
      }
    }

    // ========== DELEGACIÓN DE EVENTOS ==========
    document.getElementById('tablaBody').addEventListener('click', async (event) => {
      const target = event.target.closest('button');
      if (!target) return;
      const fila = target.closest('tr');
      if (!fila) return;

      if (target.classList.contains('btn-actualizar')) {
        await actualizarEpisodio(fila);
      } else if (target.classList.contains('btn-registrar')) {
        await registrarNuevoEpisodio(fila);
      } else if (target.classList.contains('btn-eliminar')) {
        await eliminarEpisodio(fila);
      } else if (target.classList.contains('btn-eliminar-fila')) {
        eliminarFilaNueva(fila);
      }
    });

    // ========== IMPORTAR TXT Y EXCEL ==========
    function configurarImportacionTxt() {
      document.getElementById('importarTxt').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          const lineas = e.target.result.split('\n');
          const tabla = document.getElementById('tabla-episodios').getElementsByTagName('tbody')[0];
          if (tabla.children.length === 1 && tabla.children[0].cells.length === 3 && tabla.children[0].cells[0].colSpan === 3) {
            tabla.innerHTML = "";
          }
          lineas.forEach(linea => {
            if (!linea.trim()) return;
            const partes = linea.split(';');
            if (partes.length !== 2) return;
            const episodio = partes[0].trim();
            const url = partes[1].trim();
            const newRow = tabla.insertRow();
            newRow.classList.add("fila-nueva");
            newRow.innerHTML = `
              <td><input type="text" value="${episodio}" /></td>
              <td><input type="text" value="${url}" /></td>
              <td>
                <div class="acciones">
                  <button class="btn-registrar"><i class="fas fa-save"></i> Registrar</button>
                  <button class="btn-eliminar-fila"><i class="fas fa-trash-alt"></i></button>
                </div>
              </td>
            `;
          });
          alert(`Importación completada. Se agregaron ${lineas.length} episodios.`);
          e.target.value = '';
        };
        reader.readAsText(file);
      });
    }

    function configurarImportacionExcel() {
      document.getElementById('importarExcel').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const tabla = document.getElementById('tabla-episodios').getElementsByTagName('tbody')[0];
          if (tabla.children.length === 1 && tabla.children[0].cells.length === 3 && tabla.children[0].cells[0].colSpan === 3) {
            tabla.innerHTML = "";
          }
          let contador = 0;
          rows.forEach(row => {
            if (row.length < 2) return;
            const episodio = String(row[0]).trim();
            const url = String(row[1]).trim();
            if (episodio && url && episodio !== 'Episodio' && url !== 'URL') {
              const newRow = tabla.insertRow();
              newRow.classList.add("fila-nueva");
              newRow.innerHTML = `
                <td><input type="text" value="${episodio}" /></td>
                <td><input type="text" value="${url}" /></td>
                <td>
                  <div class="acciones">
                    <button class="btn-registrar"><i class="fas fa-save"></i> Registrar</button>
                    <button class="btn-eliminar-fila"><i class="fas fa-trash-alt"></i></button>
                  </div>
                </td>
              `;
              contador++;
            }
          });
          alert(`Importación desde Excel completada. Se agregaron ${contador} episodios.`);
          e.target.value = '';
        };
        reader.readAsArrayBuffer(file);
      });
    }

    // ========== GUARDAR CAMBIOS ==========
    async function guardarCambios() {
      const nuevaTemporada = document.getElementById("nuevaTemporada").value.trim();
      const nuevoIdioma = document.getElementById("nuevoIdioma").value.trim();
      const nuevoServidor = document.getElementById("nuevoServidor").value.trim();

      const temporadaUsar = nuevaTemporada || temporadaActual;
      const idiomaUsar = nuevoIdioma || idiomaActual;
      const servidorUsar = nuevoServidor || servidorActual;

      const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
      const filas = tabla.getElementsByTagName("tr");
      const todosRegistros = [];

      for (const fila of filas) {
        const inputs = fila.getElementsByTagName("input");
        if (!inputs[0] || !inputs[1]) continue;
        const episodioNombre = inputs[0].value.trim();
        const url = inputs[1].value.trim();
        if (episodioNombre && url) {
          todosRegistros.push({
            nombreSerie: serieActual,
            temporada: temporadaUsar,
            idioma: idiomaUsar,
            servidor: servidorUsar,
            episodio: episodioNombre,
            url: url
          });
        }
      }

      if (todosRegistros.length === 0) {
        alert("No hay episodios para guardar.");
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/registrar-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registros: todosRegistros })
        });
        const data = await res.json();
        if (res.ok) {
          alert(`✅ ${todosRegistros.length} episodios guardados correctamente.`);
          resetearInterfaz();
        } else {
          alert("Error al guardar: " + (data.error || res.statusText));
        }
      } catch (error) {
        console.error(error);
        alert("Error al guardar: " + error.message);
      }
    }

    function resetearInterfaz() {
      const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
      tabla.innerHTML = "";
      document.getElementById("nuevaTemporada").value = "";
      document.getElementById("nuevoIdioma").value = "";
      document.getElementById("nuevoServidor").value = "";
      nuevaTemporadaInput.style.display = "none";
      nuevoIdiomaInput.style.display = "none";
      nuevoServidorInput.style.display = "none";
      temporadaSelect.disabled = false;
      idiomaSelect.disabled = false;
      servidorSelect.disabled = false;
      serieSelect.value = "";
      temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      idiomaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      servidorSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      serieActual = "";
      temporadaActual = "";
      idiomaActual = "";
      servidorActual = "";
      document.getElementById('dominioContainer').classList.remove('visible');
    }

    // ========== EVENTOS ==========
    serieSelect.addEventListener("change", () => {
      serieActual = serieSelect.value;
      cargarTemporadas();
    });

    temporadaSelect.addEventListener("change", () => {
      temporadaActual = temporadaSelect.value;
      cargarIdiomas();
    });

    idiomaSelect.addEventListener("change", () => {
      idiomaActual = idiomaSelect.value;
      cargarServidores();
    });

    servidorSelect.addEventListener("change", async () => {
      servidorActual = servidorSelect.value;
      await cargarEpisodios();
      await actualizarMarcoDominio();
    });

    // ========== INICIALIZACIÓN ==========
    document.addEventListener("DOMContentLoaded", () => {
      cargarSeries();
      configurarImportacionTxt();
      configurarImportacionExcel();
    });