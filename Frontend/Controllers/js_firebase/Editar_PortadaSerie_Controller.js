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
    const enlaceImagen = document.getElementById("enlaceImagen");
    const enlaceSitio = document.getElementById("enlaceSitio");
    const enlaceSitio02 = document.getElementById("enlaceSitio02");
    const previewImagen = document.getElementById("previewImagen");
    const nuevaTemporadaInput = document.getElementById("nuevaTemporadaInput");
    const inputNuevaTemporada = document.getElementById("inputNuevaTemporada");

    let creandoTemporada = false;

    // ========== FUNCIONES ==========

    // Cargar series
    async function cargarSeries() {
      try {
        const snapshot = await db.collection("animes-series-portadas").get();
        serieSelect.innerHTML = '<option value="" disabled selected>Seleccionar serie...</option>';
        snapshot.forEach(doc => {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.id;
          serieSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando series:", error);
      }
    }

    // Cargar temporadas de la serie seleccionada
    async function cargarTemporadas() {
      const serie = serieSelect.value;
      if (!serie) {
        temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar temporada...</option>';
        return;
      }

      try {
        const snapshot = await db.collection("animes-series-portadas").doc(serie).collection("Temporadas").get();
        temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar temporada...</option>';
        snapshot.forEach(doc => {
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = doc.id;
          temporadaSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando temporadas:", error);
      }
    }

    // Cargar datos de la temporada seleccionada
    async function cargarDatos() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      if (!serie || !temporada) {
        limpiarCampos();
        return;
      }

      try {
        const ref = db.collection("animes-series-portadas").doc(serie).collection("Temporadas").doc(temporada);
        const doc = await ref.get();
        if (doc.exists) {
          const data = doc.data();
          enlaceImagen.value = data.imagen || "";
          enlaceSitio.value = data.sitio || "";
          enlaceSitio02.value = data.sitio02 || "";
          mostrarPreview(data.imagen);
        } else {
          limpiarCampos();
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("Error al cargar los datos de la temporada.");
      }
    }

    function limpiarCampos() {
      enlaceImagen.value = "";
      enlaceSitio.value = "";
      enlaceSitio02.value = "";
      mostrarPreview(null);
    }

    function mostrarPreview(url) {
      if (url && url.trim() !== "" && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        previewImagen.innerHTML = `<img src="${url}" alt="Vista previa" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'placeholder\\'><i class=\\'fas fa-exclamation-triangle\\' style=\\'color:#dc2626;\\'></i><span>Error al cargar imagen</span></div>';">`;
      } else {
        previewImagen.innerHTML = `
          <div class="placeholder">
            <i class="fas fa-image"></i>
            <span>${url ? 'Enlace no válido' : 'Vista previa de la imagen'}</span>
          </div>
        `;
      }
    }

    // Nueva temporada
    function nuevaTemporada() {
      creandoTemporada = true;
      temporadaSelect.disabled = true;
      nuevaTemporadaInput.style.display = "block";
      inputNuevaTemporada.focus();
    }

    function cancelarNuevaTemporada() {
      creandoTemporada = false;
      temporadaSelect.disabled = false;
      nuevaTemporadaInput.style.display = "none";
      inputNuevaTemporada.value = "";
    }

    async function guardarNuevaTemporada() {
      const nombre = inputNuevaTemporada.value.trim();
      if (!nombre) {
        alert("Ingresa un nombre para la temporada.");
        return;
      }

      const serie = serieSelect.value;
      if (!serie) {
        alert("Selecciona una serie primero.");
        return;
      }

      try {
        // Crear la temporada con datos vacíos (solo la referencia)
        await db.collection("animes-series-portadas")
          .doc(serie)
          .collection("Temporadas")
          .doc(nombre)
          .set({ imagen: "", sitio: "", sitio02: "" }, { merge: true });

        alert("Temporada creada correctamente.");
        cancelarNuevaTemporada();
        await cargarTemporadas();
        temporadaSelect.value = nombre;
        await cargarDatos();
      } catch (error) {
        console.error("Error creando temporada:", error);
        alert("Error al crear la temporada: " + error.message);
      }
    }

    // Guardar cambios
    async function guardarCambios() {
      const serie = serieSelect.value;
      const temporada = creandoTemporada ? inputNuevaTemporada.value.trim() : temporadaSelect.value;
      const imagen = enlaceImagen.value.trim();
      const sitio = enlaceSitio.value.trim();
      const sitio02 = enlaceSitio02.value.trim();

      if (!serie) {
        alert("Selecciona una serie.");
        return;
      }

      if (!temporada) {
        alert("Selecciona o crea una temporada.");
        return;
      }

      if (!imagen || !sitio || !sitio02) {
        alert("Completa todos los campos (imagen, sitio y segundo sitio).");
        return;
      }

      if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(imagen)) {
        alert("El enlace de imagen no es válido (debe ser .jpg, .jpeg, .png, .webp o .gif).");
        return;
      }

      try {
        const ref = db.collection("animes-series-portadas")
          .doc(serie)
          .collection("Temporadas")
          .doc(temporada);

        await ref.set({ imagen, sitio, sitio02 }, { merge: true });

        alert("✅ Datos actualizados correctamente.");
        mostrarPreview(imagen);

        if (creandoTemporada) {
          cancelarNuevaTemporada();
          await cargarTemporadas();
          temporadaSelect.value = temporada;
        }
      } catch (error) {
        console.error("Error al guardar:", error);
        alert("❌ Hubo un error al guardar los datos.");
      }
    }

    // ========== EVENTOS ==========
    serieSelect.addEventListener("change", async () => {
      await cargarTemporadas();
      temporadaSelect.value = "";
      limpiarCampos();
    });

    temporadaSelect.addEventListener("change", cargarDatos);

    // Previsualización en tiempo real
    enlaceImagen.addEventListener("input", () => {
      mostrarPreview(enlaceImagen.value.trim());
    });

    // ========== INICIALIZACIÓN ==========
    document.addEventListener("DOMContentLoaded", () => {
      cargarSeries();
    });