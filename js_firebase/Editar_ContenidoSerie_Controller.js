 // ---------- CONFIGURACIÓN FIREBASE (sin cambios) ----------
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

    // ---------- VARIABLES GLOBALES ----------
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

    // ---------- FUNCIONES DE PROGRESO (sin cambios) ----------
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

    // ---------- CARGAR DATOS (sin cambios en lógica) ----------
    async function cargarSeries() {
      const snapshot = await db.collection("animes-series").get();
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
      const snapshot = await db.collection("animes-series").doc(serieActual).collection("Temporadas").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        temporadaSelect.appendChild(option);
      });
    }

    async function cargarIdiomas() {
      idiomaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual || !temporadaActual) return;
      const snapshot = await db.collection("animes-series").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        idiomaSelect.appendChild(option);
      });
    }

    async function cargarServidores() {
      servidorSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual || !temporadaActual || !idiomaActual) return;
      const snapshot = await db.collection("animes-series").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").doc(idiomaActual).collection("Servidores").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        servidorSelect.appendChild(option);
      });
    }

    // ---------- DOMINIO ----------
    function extraerDominio(iframeHtml) {
      const match = iframeHtml.match(/src="https?:\/\/([^\/"]+)/);
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
          .collection("animes-series")
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
          const iframe = doc.data().iframe;
          dominioEncontrado = extraerDominio(iframe);
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

    // ---------- ACTUALIZAR DOMINIOS (lógica sin cambios) ----------
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
        .collection("animes-series")
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

      const progreso = mostrarProgreso('Actualizando Serie', totalEpisodios);
      let actualizados = 0, errores = 0;

      try {
        const episodios = [];
        snapshot.forEach(doc => episodios.push({ id: doc.id, iframe: doc.data().iframe }));

        for (let i = 0; i < episodios.length; i++) {
          const episodio = episodios[i];
          const nuevoIframe = episodio.iframe.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
          if (nuevoIframe !== episodio.iframe) {
            try {
              await ref.doc(episodio.id).update({ iframe: nuevoIframe });
              actualizados++;
              progreso.update(
                ((i + 1) / totalEpisodios) * 100,
                `Procesando: ${i + 1} de ${totalEpisodios}`,
                `✅ ${episodio.id} - Actualizado`
              );
            } catch (error) {
              errores++;
              progreso.update(
                ((i + 1) / totalEpisodios) * 100,
                `Procesando: ${i + 1} de ${totalEpisodios}`,
                `❌ ${episodio.id} - Error: ${error.message}`
              );
            }
          } else {
            progreso.update(
              ((i + 1) / totalEpisodios) * 100,
              `Procesando: ${i + 1} de ${totalEpisodios}`,
              `⏭️ ${episodio.id} - Sin cambios`
            );
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        progreso.update(100, '¡Proceso completado!', `📊 Resumen: ${actualizados} actualizados, ${errores} errores`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        progreso.cerrar();
        alert(`✅ Proceso completado:\n- Episodios actualizados: ${actualizados}\n- Errores: ${errores}`);
        await cargarEpisodios();
        await actualizarMarcoDominio();
      } catch (error) {
        progreso.cerrar();
        console.error(error);
        alert('❌ Error al actualizar los dominios');
      }
    }

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

      if (!confirm(`⚠️ ADVERTENCIA: Esto actualizará TODOS los episodios de TODAS las series con el servidor "${servidorActual}"\n\nDominio actual: ${dominioActual}\nNuevo dominio: ${nuevoDominio}\n\n¿Estás completamente seguro?`)) return;

      const seriesSnapshot = await db.collection("animes-series").get();
      const episodiosParaActualizar = [];
      
      let progresoRecoleccion = mostrarProgreso('Analizando estructura', 0);
      progresoRecoleccion.update(0, 'Buscando episodios...', '🔍 Escaneando base de datos');
      
      let seriesProcesadas = 0;
      const totalSeries = seriesSnapshot.size;
      
      for (const serieDoc of seriesSnapshot.docs) {
        const nombreSerie = serieDoc.id;
        const temporadasSnapshot = await db.collection("animes-series").doc(nombreSerie).collection("Temporadas").get();
        for (const tempDoc of temporadasSnapshot.docs) {
          const nombreTemp = tempDoc.id;
          const idiomasSnapshot = await db.collection("animes-series").doc(nombreSerie).collection("Temporadas").doc(nombreTemp).collection("Idiomas").get();
          for (const idiDoc of idiomasSnapshot.docs) {
            const nombreIdi = idiDoc.id;
            const servidoresSnapshot = await db.collection("animes-series").doc(nombreSerie).collection("Temporadas").doc(nombreTemp).collection("Idiomas").doc(nombreIdi).collection("Servidores").get();
            for (const servDoc of servidoresSnapshot.docs) {
              const nombreServ = servDoc.id;
              if (nombreServ.toLowerCase().includes('abyss')) {
                const episodiosRef = db
                  .collection("animes-series")
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
                  const iframeActual = epDoc.data().iframe;
                  const nuevoIframe = iframeActual.replace(new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'), `https://${nuevoDominio}`);
                  if (nuevoIframe !== iframeActual) {
                    episodiosParaActualizar.push({
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
        seriesProcesadas++;
        progresoRecoleccion.update(
          (seriesProcesadas / totalSeries) * 100,
          `Analizando series: ${seriesProcesadas} de ${totalSeries}`,
          `📁 ${nombreSerie}`
        );
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      progresoRecoleccion.cerrar();

      const totalAActualizar = episodiosParaActualizar.length;
      if (totalAActualizar === 0) {
        alert('No se encontraron episodios para actualizar');
        return;
      }
      if (!confirm(`Se encontraron ${totalAActualizar} episodios para actualizar. ¿Deseas continuar?`)) return;

      const progreso = mostrarProgreso('Actualizando Todas las Series', totalAActualizar);
      let actualizados = 0, errores = 0;

      for (let i = 0; i < episodiosParaActualizar.length; i++) {
        const item = episodiosParaActualizar[i];
        try {
          const nuevoIframe = /* reutilizamos la lógica */ 
            (await item.ref.doc(item.id).get()).data().iframe.replace(
              new RegExp(`https?://${dominioActual.replace(/\./g, '\\.')}`, 'g'),
              `https://${nuevoDominio}`
            );
          await item.ref.doc(item.id).update({ iframe: nuevoIframe });
          actualizados++;
          progreso.update(
            ((i + 1) / totalAActualizar) * 100,
            `Procesando: ${i + 1} de ${totalAActualizar}`,
            `✅ ${item.info}`
          );
        } catch (error) {
          errores++;
          progreso.update(
            ((i + 1) / totalAActualizar) * 100,
            `Procesando: ${i + 1} de ${totalAActualizar}`,
            `❌ ${item.info} - Error: ${error.message}`
          );
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      progreso.update(100, '¡Proceso completado!', `📊 Resumen final: ${actualizados} actualizados, ${errores} errores`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      progreso.cerrar();
      alert(`✅ Proceso completado:\n- Episodios actualizados: ${actualizados}\n- Errores: ${errores}`);
      if (serieActual && temporadaActual && idiomaActual && servidorActual) {
        await cargarEpisodios();
        await actualizarMarcoDominio();
      }
    }

    // ---------- CARGAR EPISODIOS (sin cambios) ----------
    async function cargarEpisodios() {
      const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
      tabla.innerHTML = "";
      if (!serieActual || !temporadaActual || !idiomaActual || !servidorActual) return;

      const ref = db
        .collection("animes-series")
        .doc(serieActual)
        .collection("Temporadas")
        .doc(temporadaActual)
        .collection("Idiomas")
        .doc(idiomaActual)
        .collection("Servidores")
        .doc(servidorActual)
        .collection("Episodios");

      const snapshot = await ref.get();
      snapshot.forEach(doc => {
        const fila = tabla.insertRow();
        const celEpisodio = fila.insertCell();
        const inputEp = document.createElement("input");
        inputEp.type = "text";
        inputEp.value = doc.id;
        inputEp.disabled = true;
        celEpisodio.appendChild(inputEp);

        const celIframe = fila.insertCell();
        const inputIframe = document.createElement("input");
        inputIframe.type = "text";
        inputIframe.value = doc.data().iframe;
        celIframe.appendChild(inputIframe);

        const celAcciones = fila.insertCell();
        const wrapper = document.createElement("div");
        wrapper.className = "acciones";

        const btnGuardar = document.createElement("button");
        btnGuardar.className = "btn-guardar";
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
        btnGuardar.onclick = async () => {
          const nuevoIframe = inputIframe.value.trim();
          if (nuevoIframe !== "") {
            await ref.doc(doc.id).update({ iframe: nuevoIframe });
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
        celAcciones.appendChild(wrapper);
      });
      await actualizarMarcoDominio();
    }

    // ---------- NUEVA ENTRADA (sin cambios) ----------
    function nuevaEntrada(tipo) {
      if (tipo === "temporada") {
        temporadaSelect.disabled = true;
        nuevaTemporadaInput.style.display = "block";
      } else if (tipo === "idioma") {
        idiomaSelect.disabled = true;
        nuevoIdiomaInput.style.display = "block";
      } else if (tipo === "servidor") {
        servidorSelect.disabled = true;
        nuevoServidorInput.style.display = "block";
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

    // Guardar nueva entrada (funcionalidad adicional)
    async function guardarNuevaEntrada(tipo) {
      const valor = document.getElementById(tipo === "temporada" ? "nuevaTemporada" : tipo === "idioma" ? "nuevoIdioma" : "nuevoServidor").value.trim();
      if (!valor) {
        alert("Por favor, ingresa un nombre válido.");
        return;
      }
      // Simplemente lo agregamos al select y luego guardamos con "Actualizar"
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

    // ---------- AGREGAR FILA (sin cambios) ----------
    function agregarFila() {
      const table = document.getElementById('tabla-episodios').getElementsByTagName('tbody')[0];
      const newRow = table.insertRow();
      newRow.innerHTML = `
        <td><input type="text" placeholder="Ej: Episodio X" /></td>
        <td><input type="text" placeholder="&lt;iframe&gt;...&lt;/iframe&gt;" /></td>
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
      const iframeInput = fila.cells[1].querySelector('input');
      const episodioNombre = episodioInput.value.trim();
      const iframe = iframeInput.value.trim();

      if (!serieActual || !temporadaActual || !idiomaActual || !servidorActual || !episodioNombre || !iframe) {
        alert("Por favor completa todos los campos.");
        return;
      }

      try {
        const ref = db
          .collection("animes-series")
          .doc(serieActual)
          .collection("Temporadas")
          .doc(temporadaActual)
          .collection("Idiomas")
          .doc(idiomaActual)
          .collection("Servidores")
          .doc(servidorActual)
          .collection("Episodios")
          .doc(episodioNombre);
        await ref.set({ iframe });
        alert("Nuevo episodio registrado.");
        cargarEpisodios();
      } catch (error) {
        console.error(error);
        alert("Error al guardar.");
      }
    }

    function eliminarFila(boton) {
      const fila = boton.closest('tr');
      if (fila) fila.remove();
    }

    // ---------- IMPORTAR (sin cambios) ----------
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('importarTxt').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          const lineas = e.target.result.split('\n');
          const tabla = document.getElementById('tabla-episodios').getElementsByTagName('tbody')[0];
          lineas.forEach(linea => {
            if (!linea.trim()) return;
            const partes = linea.split(';');
            if (partes.length !== 2) return;
            const episodio = partes[0].trim();
            const codigo = partes[1].trim().replace(/"/g, '&quot;');
            const newRow = tabla.insertRow();
            newRow.innerHTML = `
              <td><input type="text" value="${episodio}" /></td>
              <td><input type="text" value="${codigo}" /></td>
              <td>
                <div class="acciones">
                  <button class="btn-guardar" onclick="guardarNuevoEpisodio(this)"><i class="fas fa-save"></i> Guardar</button>
                  <button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i></button>
                </div>
              </td>
            `;
          });
          alert("Importación completada.");
        };
        reader.readAsText(file);
        this.value = '';
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
          rows.forEach(row => {
            if (row.length < 2) return;
            const episodio = String(row[0]).trim();
            const codigo = String(row[1]).trim().replace(/"/g, '&quot;');
            if (episodio && codigo) {
              const newRow = tabla.insertRow();
              newRow.innerHTML = `
                <td><input type="text" value="${episodio}" /></td>
                <td><input type="text" value="${codigo}" /></td>
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
        };
        reader.readAsArrayBuffer(file);
        this.value = '';
      });
    });

    // ---------- GUARDAR CAMBIOS (sin cambios) ----------
    async function guardarCambios() {
      const nuevaTemporada = document.getElementById("nuevaTemporada").value.trim();
      const nuevoIdioma = document.getElementById("nuevoIdioma").value.trim();
      const nuevoServidor = document.getElementById("nuevoServidor").value.trim();

      if (nuevaTemporada) {
        temporadaActual = nuevaTemporada;
        await db.collection("animes-series").doc(serieActual).collection("Temporadas").doc(temporadaActual).set({ creada: true });
      }
      if (nuevoIdioma) {
        idiomaActual = nuevoIdioma;
        await db.collection("animes-series").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").doc(idiomaActual).set({ creado: true });
      }
      if (nuevoServidor) {
        servidorActual = nuevoServidor;
        await db.collection("animes-series").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").doc(idiomaActual).collection("Servidores").doc(servidorActual).set({ creado: true });
      }

      const tabla = document.getElementById("tabla-episodios").getElementsByTagName("tbody")[0];
      const filas = tabla.getElementsByTagName("tr");
      for (const fila of filas) {
        const inputs = fila.getElementsByTagName("input");
        const nombreEpisodio = inputs[0]?.value?.trim();
        const iframe = inputs[1]?.value?.trim().replace(/&quot;/g, '"');
        if (nombreEpisodio && iframe) {
          await db.collection("animes-series")
                  .doc(serieActual)
                  .collection("Temporadas")
                  .doc(temporadaActual)
                  .collection("Idiomas")
                  .doc(idiomaActual)
                  .collection("Servidores")
                  .doc(servidorActual)
                  .collection("Episodios")
                  .doc(nombreEpisodio)
                  .set({ iframe });
        }
      }
      cargarTemporadas();
      cargarEpisodios();
      alert("Datos guardados correctamente.");
      location.reload();
    }

    // ---------- EVENTOS ----------
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