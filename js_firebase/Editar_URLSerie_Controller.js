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
        const ref = db
          .collection("animes-series-enlaces")
          .doc(serieActual)
          .collection("Temporadas")
          .doc(temporadaActual)
          .collection("Idiomas")
          .doc(idiomaActual)
          .collection("Servidores")
          .doc(servidor)
          .collection("Episodios");

        const snapshot = await ref.limit(1).get();
        let dominioEncontrado = null;
        snapshot.forEach(doc => {
          const url = doc.data().url;
          dominioEncontrado = extraerDominioDeURL(url);
        });

        if (dominioEncontrado) {
          dominioActualInput.value = dominioEncontrado;
          nuevoDominioInput.placeholder = `Ej: ${dominioEncontrado}`;
          infoDominio.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981;"></i> Dominio detectado: ${dominioEncontrado}`;
        } else {
          dominioActualInput.value = 'No detectado';
          nuevoDominioInput.placeholder = 'Ej: nuevodominio.com';
          infoDominio.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f6821f;"></i> No se pudo detectar el dominio';
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

      const ref = db
        .collection("animes-series-enlaces")
        .doc(serieActual)
        .collection("Temporadas")
        .doc(temporadaActual)
        .collection("Idiomas")
        .doc(idiomaActual)
        .collection("Servidores")
        .doc(servidorActual)
        .collection("Episodios");

      const snapshot = await ref.get();
      const totalEpisodios = snapshot.size;
      if (totalEpisodios === 0) {
        alert('No hay episodios para actualizar');
        return;
      }

      if (!confirm(`¿Actualizar ${totalEpisodios} episodios?\nSerie: ${serieActual}\nDominio actual: ${dominioActual}\nNuevo dominio: ${nuevoDominio}`)) return;

      const progreso = mostrarProgreso('Actualizando URLs de la Serie', totalEpisodios);
      let actualizados = 0, errores = 0, i = 0;

      for (const doc of snapshot.docs) {
        i++;
        const urlActual = doc.data().url;
        const nuevaUrl = urlActual.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
        if (nuevaUrl !== urlActual) {
          try {
            await ref.doc(doc.id).update({ url: nuevaUrl });
            actualizados++;
            progreso.update(
              (i / totalEpisodios) * 100,
              `Procesando: ${i} de ${totalEpisodios}`,
              `✅ ${doc.id} - URL actualizada`
            );
          } catch (error) {
            errores++;
            progreso.update(
              (i / totalEpisodios) * 100,
              `Procesando: ${i} de ${totalEpisodios}`,
              `❌ ${doc.id} - Error: ${error.message}`
            );
          }
        } else {
          progreso.update(
            (i / totalEpisodios) * 100,
            `Procesando: ${i} de ${totalEpisodios}`,
            `⏭️ ${doc.id} - Sin cambios`
          );
        }
        await new Promise(resolve => setTimeout(resolve, 50));
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

      const seriesSnapshot = await db.collection("animes-series-enlaces").get();
      const progreso = mostrarProgreso('Analizando estructura', seriesSnapshot.size);
      const urlsPorActualizar = [];
      let seriesProcesadas = 0;
      const totalSeries = seriesSnapshot.size;

      for (const serieDoc of seriesSnapshot.docs) {
        const nombreSerie = serieDoc.id;
        seriesProcesadas++;
        progreso.update(
          (seriesProcesadas / totalSeries) * 100,
          `Analizando serie: ${nombreSerie}`,
          `🔍 Buscando servidores "abyss" en ${nombreSerie}`
        );
        const temporadasSnapshot = await db.collection("animes-series-enlaces").doc(nombreSerie).collection("Temporadas").get();
        for (const tempDoc of temporadasSnapshot.docs) {
          const nombreTemp = tempDoc.id;
          const idiomasSnapshot = await db.collection("animes-series-enlaces").doc(nombreSerie).collection("Temporadas").doc(nombreTemp).collection("Idiomas").get();
          for (const idiDoc of idiomasSnapshot.docs) {
            const nombreIdi = idiDoc.id;
            const servidoresSnapshot = await db.collection("animes-series-enlaces").doc(nombreSerie).collection("Temporadas").doc(nombreTemp).collection("Idiomas").doc(nombreIdi).collection("Servidores").get();
            for (const servDoc of servidoresSnapshot.docs) {
              const nombreServ = servDoc.id;
              if (nombreServ.toLowerCase().includes('abyss')) {
                const episodiosRef = db
                  .collection("animes-series-enlaces")
                  .doc(nombreSerie)
                  .collection("Temporadas")
                  .doc(nombreTemp)
                  .collection("Idiomas")
                  .doc(nombreIdi)
                  .collection("Servidores")
                  .doc(nombreServ)
                  .collection("Episodios");
                const episodiosSnapshot = await episodiosRef.get();
                for (const epDoc of episodiosSnapshot.docs) {
                  const urlActual = epDoc.data().url;
                  const nuevaUrl = urlActual.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
                  if (nuevaUrl !== urlActual) {
                    urlsPorActualizar.push({
                      ref: episodiosRef,
                      id: epDoc.id,
                      info: `${nombreSerie} > ${nombreTemp} > ${nombreIdi} > ${nombreServ} > ${epDoc.id}`
                    });
                  }
                }
              }
            }
          }
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
          const epDoc = await item.ref.doc(item.id).get();
          const urlActual = epDoc.data().url;
          const nuevaUrl = urlActual.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
          await item.ref.doc(item.id).update({ url: nuevaUrl });
          actualizados++;
          progresoActualizacion.update(
            ((i + 1) / urlsPorActualizar.length) * 100,
            `Procesando: ${i + 1} de ${urlsPorActualizar.length}`,
            `✅ ${item.info}`
          );
        } catch (error) {
          errores++;
          progresoActualizacion.update(
            ((i + 1) / urlsPorActualizar.length) * 100,
            `Procesando: ${i + 1} de ${urlsPorActualizar.length}`,
            `❌ ${item.info} - Error: ${error.message}`
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
      const snapshot = await db.collection("animes-series-enlaces").get();
      serieSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        serieSelect.appendChild(option);
      });
    }

    async function cargarTemporadas() {
      temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual) return;
      const snapshot = await db.collection("animes-series-enlaces").doc(serieActual).collection("Temporadas").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        temporadaSelect.appendChild(option);
      });
    }

    async function cargarIdiomas() {
      idiomaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual || !temporadaActual) return;
      const snapshot = await db.collection("animes-series-enlaces").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        idiomaSelect.appendChild(option);
      });
    }

    async function cargarServidores() {
      servidorSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual || !temporadaActual || !idiomaActual) return;
      const snapshot = await db.collection("animes-series-enlaces").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").doc(idiomaActual).collection("Servidores").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        servidorSelect.appendChild(option);
      });
    }

    async function cargarEpisodios() {
      const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
      tabla.innerHTML = "";
      if (!serieActual || !temporadaActual || !idiomaActual || !servidorActual) return;

      const ref = db
        .collection("animes-series-enlaces")
        .doc(serieActual)
        .collection("Temporadas")
        .doc(temporadaActual)
        .collection("Idiomas")
        .doc(idiomaActual)
        .collection("Servidores")
        .doc(servidorActual)
        .collection("Episodios");

      const snapshot = await ref.get();
      if (snapshot.empty) {
        tabla.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No hay episodios registrados</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const fila = tabla.insertRow();
        const celEp = fila.insertCell();
        const inputEp = document.createElement("input");
        inputEp.type = "text";
        inputEp.value = doc.id;
        inputEp.disabled = true;
        celEp.appendChild(inputEp);

        const celUrl = fila.insertCell();
        const inputUrl = document.createElement("input");
        inputUrl.type = "text";
        inputUrl.value = doc.data().url || "";
        celUrl.appendChild(inputUrl);

        const celAcc = fila.insertCell();
        const wrapper = document.createElement("div");
        wrapper.className = "acciones";

        const btnGuardar = document.createElement("button");
        btnGuardar.className = "btn-guardar";
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
        btnGuardar.onclick = async () => {
          const nuevoUrl = inputUrl.value.trim();
          if (nuevoUrl !== "") {
            await ref.doc(doc.id).update({ url: nuevoUrl });
            alert("Episodio actualizado");
            await actualizarMarcoDominio();
          }
        };
        wrapper.appendChild(btnGuardar);

        const btnEliminar = document.createElement("button");
        btnEliminar.className = "btn-eliminar";
        btnEliminar.innerHTML = '<i class="fas fa-trash-alt"></i>';
        btnEliminar.onclick = async () => {
          if (confirm("¿Estás seguro de eliminar este episodio?")) {
            await ref.doc(doc.id).delete();
            fila.remove();
            await actualizarMarcoDominio();
          }
        };
        wrapper.appendChild(btnEliminar);
        celAcc.appendChild(wrapper);
      });
      await actualizarMarcoDominio();
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
      newRow.innerHTML = `
        <td><input type="text" placeholder="Ej: Episodio X" /></td>
        <td><input type="text" placeholder="https://..." /></td>
        <td>
          <div class="acciones">
            <button class="btn-guardar" onclick="guardarNuevoEpisodio(this)"><i class="fas fa-save"></i> Guardar</button>
            <button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      `;
    }

    async function guardarNuevoEpisodio(boton) {
      const fila = boton.closest('tr');
      const episodioInput = fila.cells[0].querySelector('input');
      const urlInput = fila.cells[1].querySelector('input');
      const episodioNombre = episodioInput.value.trim();
      const url = urlInput.value.trim();

      if (!serieActual || !temporadaActual || !idiomaActual || !servidorActual || !episodioNombre || !url) {
        alert("Completa todos los campos.");
        return;
      }

      try {
        const ref = db
          .collection("animes-series-enlaces")
          .doc(serieActual)
          .collection("Temporadas")
          .doc(temporadaActual)
          .collection("Idiomas")
          .doc(idiomaActual)
          .collection("Servidores")
          .doc(servidorActual)
          .collection("Episodios")
          .doc(episodioNombre);
        await ref.set({ url });
        alert("Episodio registrado.");
        cargarEpisodios();
      } catch (error) {
        console.error(error);
        alert("Error al guardar.");
      }
    }

    function eliminarFila(boton) {
      const fila = boton.closest('tr');
      if (fila) fila.remove();
      const tabla = document.getElementById('tabla-episodios').getElementsByTagName('tbody')[0];
      if (tabla.children.length === 0) {
        tabla.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px;">No hay episodios registrados</td></tr>';
      }
    }

    // ========== IMPORTAR ==========
    document.addEventListener('DOMContentLoaded', () => {
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
            newRow.innerHTML = `
              <td><input type="text" value="${episodio}" /></td>
              <td><input type="text" value="${url}" /></td>
              <td>
                <div class="acciones">
                  <button class="btn-guardar" onclick="guardarNuevoEpisodio(this)"><i class="fas fa-save"></i> Guardar</button>
                  <button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i></button>
                </div>
              </td>
            `;
          });
          alert("Importación completada.");
          e.target.value = '';
        };
        reader.readAsText(file);
      });

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
          rows.forEach(row => {
            if (row.length < 2) return;
            const episodio = String(row[0]).trim();
            const url = String(row[1]).trim();
            if (episodio && url) {
              const newRow = tabla.insertRow();
              newRow.innerHTML = `
                <td><input type="text" value="${episodio}" /></td>
                <td><input type="text" value="${url}" /></td>
                <td>
                  <div class="acciones">
                    <button class="btn-guardar" onclick="guardarNuevoEpisodio(this)"><i class="fas fa-save"></i> Guardar</button>
                    <button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i></button>
                  </div>
                </td>
              `;
            }
          });
          alert("Importación desde Excel completada.");
          e.target.value = '';
        };
        reader.readAsArrayBuffer(file);
      });
    });

    // ========== GUARDAR CAMBIOS ==========
    async function guardarCambios() {
      const nuevaTemporada = document.getElementById("nuevaTemporada").value.trim();
      const nuevoIdioma = document.getElementById("nuevoIdioma").value.trim();
      const nuevoServidor = document.getElementById("nuevoServidor").value.trim();

      if (nuevaTemporada) {
        temporadaActual = nuevaTemporada;
        await db.collection("animes-series-enlaces")
                .doc(serieActual)
                .collection("Temporadas")
                .doc(temporadaActual)
                .set({ creada: true });
      }
      if (nuevoIdioma) {
        idiomaActual = nuevoIdioma;
        await db.collection("animes-series-enlaces")
                .doc(serieActual)
                .collection("Temporadas")
                .doc(temporadaActual)
                .collection("Idiomas")
                .doc(idiomaActual)
                .set({ creado: true });
      }
      if (nuevoServidor) {
        servidorActual = nuevoServidor;
        await db.collection("animes-series-enlaces")
                .doc(serieActual)
                .collection("Temporadas")
                .doc(temporadaActual)
                .collection("Idiomas")
                .doc(idiomaActual)
                .collection("Servidores")
                .doc(servidorActual)
                .set({ creado: true });
      }

      const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
      const filas = tabla.getElementsByTagName("tr");
      for (const fila of filas) {
        const inputs = fila.getElementsByTagName("input");
        const nombreEpisodio = inputs[0]?.value?.trim();
        const url = inputs[1]?.value?.trim();
        if (nombreEpisodio && url) {
          await db.collection("animes-series-enlaces")
                  .doc(serieActual)
                  .collection("Temporadas")
                  .doc(temporadaActual)
                  .collection("Idiomas")
                  .doc(idiomaActual)
                  .collection("Servidores")
                  .doc(servidorActual)
                  .collection("Episodios")
                  .doc(nombreEpisodio)
                  .set({ url });
        }
      }

      cargarTemporadas();
      cargarEpisodios();
      alert("Datos guardados correctamente.");
      resetearInterfaz();
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

    document.addEventListener("DOMContentLoaded", cargarSeries);