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

    // ========== FUNCIONES DE CARGA ==========
    async function cargarSeries() {
      const snapshot = await db.collection("animes-series-original").get();
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
      const snapshot = await db.collection("animes-series-original").doc(serieActual).collection("Temporadas").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        temporadaSelect.appendChild(option);
      });
    }

    async function cargarIdiomas() {
      idiomaSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual || !temporadaActual) return;
      const snapshot = await db.collection("animes-series-original").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").get();
      snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = option.text = doc.id;
        idiomaSelect.appendChild(option);
      });
    }

    async function cargarServidores() {
      servidorSelect.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
      if (!serieActual || !temporadaActual || !idiomaActual) return;
      const snapshot = await db.collection("animes-series-original").doc(serieActual).collection("Temporadas").doc(temporadaActual).collection("Idiomas").doc(idiomaActual).collection("Servidores").get();
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
        .collection("animes-series-original")
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

        const celUrl = fila.insertCell();
        const inputUrl = document.createElement("input");
        inputUrl.type = "text";
        inputUrl.value = doc.data().url || "";
        celUrl.appendChild(inputUrl);

        const celAcciones = fila.insertCell();
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
          }
        };
        wrapper.appendChild(btnEliminar);
        celAcciones.appendChild(wrapper);
      });
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
      // Agregar al select y cargar siguiente nivel
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
          .collection("animes-series-original")
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
        };
        reader.readAsArrayBuffer(file);
        this.value = '';
      });
    });

    // ========== GUARDAR CAMBIOS ==========
    async function guardarCambios() {
      const nuevaTemporada = document.getElementById("nuevaTemporada").value.trim();
      const nuevoIdioma = document.getElementById("nuevoIdioma").value.trim();
      const nuevoServidor = document.getElementById("nuevoServidor").value.trim();

      if (nuevaTemporada) {
        temporadaActual = nuevaTemporada;
        await db.collection("animes-series-original")
                .doc(serieActual)
                .collection("Temporadas")
                .doc(temporadaActual)
                .set({ creada: true });
      }
      if (nuevoIdioma) {
        idiomaActual = nuevoIdioma;
        await db.collection("animes-series-original")
                .doc(serieActual)
                .collection("Temporadas")
                .doc(temporadaActual)
                .collection("Idiomas")
                .doc(idiomaActual)
                .set({ creado: true });
      }
      if (nuevoServidor) {
        servidorActual = nuevoServidor;
        await db.collection("animes-series-original")
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
          await db.collection("animes-series-original")
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
      location.reload();
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

    servidorSelect.addEventListener("change", () => {
      servidorActual = servidorSelect.value;
      cargarEpisodios();
    });

    document.addEventListener("DOMContentLoaded", cargarSeries);