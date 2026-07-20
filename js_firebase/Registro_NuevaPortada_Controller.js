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

    // ========== FUNCIONES ==========

    async function guardarEnFirebase() {
      const nombreSerie = document.getElementById("serieNombre").value.trim();
      const temporada = document.getElementById("temporada").value.trim();
      const enlaceImagen = document.getElementById("enlaceImagen").value.trim();
      const enlaceSitio = document.getElementById("enlaceSitio").value.trim();
      const enlaceSitio02 = document.getElementById("enlaceSitio02").value.trim();

      if (!nombreSerie || !temporada || !enlaceImagen || !enlaceSitio || !enlaceSitio02) {
        alert("⚠️ Por favor, completa todos los campos antes de guardar.");
        return;
      }

      // Deshabilitar botón para evitar doble clic
      const btnGuardar = document.getElementById('btnGuardar');
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      try {
        // 1. Crear documento base de la serie
        await db.collection("animes-series-portadas")
          .doc(nombreSerie)
          .set({ nombre: nombreSerie }, { merge: true });

        // 2. Crear documento de la temporada dentro de la serie
        await db.collection("animes-series-portadas")
          .doc(nombreSerie)
          .collection("Temporadas")
          .doc(temporada)
          .set({
            imagen: enlaceImagen,
            sitio: enlaceSitio,
            sitio02: enlaceSitio02,
          }, { merge: true });

        alert("✅ Portada registrada correctamente.");

        // Limpiar campos
        document.getElementById("serieNombre").value = "";
        document.getElementById("temporada").value = "";
        document.getElementById("enlaceImagen").value = "";
        document.getElementById("enlaceSitio").value = "";
        document.getElementById("enlaceSitio02").value = "";

      } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("❌ Error al guardar: " + error.message);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar en Firebase';
      }
    }

    // ========== EVENTOS ==========
    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('btnGuardar').addEventListener('click', guardarEnFirebase);
    });