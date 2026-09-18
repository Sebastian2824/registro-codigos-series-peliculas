// ---------- CONFIGURACIÓN FIREBASE ----------
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

    // ---------- DOM ELEMENTS ----------
    const serieSelect = document.getElementById("serieSelect");
    const nombreIngles = document.getElementById("nombreIngles");
    const nombreJapones = document.getElementById("nombreJapones");
    const anioPublicacion = document.getElementById("anioPublicacion");
    const categoria = document.getElementById("categoria");
    const idioma = document.getElementById("idioma");
    const enlaceImagen = document.getElementById("enlaceImagen");
    const enlaceSitio = document.getElementById("enlaceSitio");
    const previewContainer = document.getElementById("previewImagen");

    // ---------- FUNCIONES ----------
    async function cargarSeries() {
      try {
        const snapshot = await db.collection("animes-series-indice").get();
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

    async function cargarDatos() {
      const serie = serieSelect.value;
      if (!serie) {
        limpiarCampos();
        return;
      }

      try {
        const doc = await db.collection("animes-series-indice").doc(serie).get();
        if (doc.exists) {
          const data = doc.data();
          nombreIngles.value = data.nombresec || "";
          nombreJapones.value = data.nombresec02 || "";
          anioPublicacion.value = data.año || "";
          categoria.value = data.categoria || "";
          idioma.value = data.idioma || "";
          enlaceImagen.value = data.imagen || "";
          enlaceSitio.value = data.sitio || "";
          mostrarPreview(data.imagen);
        } else {
          limpiarCampos();
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("Error al cargar los datos de la serie.");
      }
    }

    function limpiarCampos() {
      nombreIngles.value = "";
      nombreJapones.value = "";
      anioPublicacion.value = "";
      categoria.value = "";
      idioma.value = "";
      enlaceImagen.value = "";
      enlaceSitio.value = "";
      mostrarPreview(null);
    }

    function mostrarPreview(url) {
      if (url && url.trim() !== "") {
        previewContainer.innerHTML = `<img src="${url}" alt="Vista previa" />`;
      } else {
        previewContainer.innerHTML = `
          <div class="placeholder">
            <i class="fas fa-image"></i>
            <span>Vista previa de la imagen</span>
          </div>
        `;
      }
    }

    async function guardarCambios() {
      const serie = serieSelect.value;
      const ingles = nombreIngles.value.trim();
      const japones = nombreJapones.value.trim();
      const anio = anioPublicacion.value.trim();
      const cat = categoria.value.trim();
      const lang = idioma.value.trim();
      const imagen = enlaceImagen.value.trim();
      const sitio = enlaceSitio.value.trim();

      if (!serie) {
        alert("Por favor, selecciona una serie.");
        return;
      }

      if (!ingles || !japones || !anio || !cat || !lang || !imagen || !sitio) {
        alert("Todos los campos son obligatorios.");
        return;
      }

      try {
        await db.collection("animes-series-indice").doc(serie).set({
          nombresec: ingles,
          nombresec02: japones,
          año: anio,
          categoria: cat,
          idioma: lang,
          imagen: imagen,
          sitio: sitio
        }, { merge: true });

        alert("✅ Datos actualizados correctamente.");
        mostrarPreview(imagen);
      } catch (error) {
        console.error("Error al guardar:", error);
        alert("❌ Hubo un error al guardar los datos.");
      }
    }

    // ---------- EVENTOS ----------
    serieSelect.addEventListener("change", cargarDatos);
    document.addEventListener("DOMContentLoaded", cargarSeries);

    // Vista previa en tiempo real al escribir la URL de imagen
    enlaceImagen.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      if (url) {
        // Mostrar preview solo si parece una URL
        if (url.startsWith("http")) {
          mostrarPreview(url);
        }
      } else {
        mostrarPreview(null);
      }
    });