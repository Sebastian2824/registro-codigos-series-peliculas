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

    // ========== DOM REFERENCES ==========
    const btnGuardar = document.getElementById('btnGuardar');

    // ========== FUNCIÓN GUARDAR ==========
    async function guardarIndice() {
      const nombreSerie = document.getElementById("serieNombre").value.trim();
      const nombreIngles = document.getElementById("nombreIngles").value.trim();
      const nombreJapones = document.getElementById("nombreJapones").value.trim();
      const anioPublicacion = document.getElementById("anioPublicacion").value.trim();
      const categoria = document.getElementById("categoria").value.trim();
      const idioma = document.getElementById("idioma").value.trim();
      const enlaceImagen = document.getElementById("enlaceImagen").value.trim();
      const enlaceSitio = document.getElementById("enlaceSitio").value.trim();

      if (!nombreSerie || !nombreIngles || !nombreJapones || !anioPublicacion || !categoria || !idioma || !enlaceImagen || !enlaceSitio) {
        alert("⚠️ Por favor, completa todos los campos.");
        return;
      }

      // Deshabilitar botón
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      try {
        await db.collection("animes-series-indice")
          .doc(nombreSerie)
          .set({
            nombresec: nombreIngles,
            nombresec02: nombreJapones,
            año: anioPublicacion,
            categoria: categoria,
            idioma: idioma,
            imagen: enlaceImagen,
            sitio: enlaceSitio
          }, { merge: true });

        alert("✅ Índice registrado correctamente.");

        // Limpiar campos
        document.getElementById("serieNombre").value = "";
        document.getElementById("nombreIngles").value = "";
        document.getElementById("nombreJapones").value = "";
        document.getElementById("anioPublicacion").value = "";
        document.getElementById("categoria").value = "";
        document.getElementById("idioma").value = "";
        document.getElementById("enlaceImagen").value = "";
        document.getElementById("enlaceSitio").value = "";

      } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("❌ Error al guardar: " + error.message);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar en Firebase';
      }
    }

    // ========== EVENTOS ==========
    btnGuardar.addEventListener('click', guardarIndice);

    // Permitir Enter en cualquier input
    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          guardarIndice();
        }
      });
    });