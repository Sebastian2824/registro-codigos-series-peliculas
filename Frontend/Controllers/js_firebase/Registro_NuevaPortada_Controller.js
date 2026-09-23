// ========== CONFIGURACIÓN FIREBASE ==========
    const firebaseConfig = {
      apiKey: window.ENV.VITE_FIREBASE_API_KEY,
      authDomain: window.ENV.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: window.ENV.VITE_FIREBASE_PROYECT_ID,
      storageBucket: window.ENV.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: window.ENV.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: window.ENV.VITE_FIREBASE_APP_ID,
      measurementId: window.ENV.VITE_FIREBASE_MEASUREMENT_ID
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

// ============================================================
// DOM REFERENCES
// ============================================================
const enlaceImagenInput    = document.getElementById('enlaceImagen');
const previewContainer     = document.getElementById('previewContainer');
const previewPlaceholder   = document.getElementById('previewPlaceholder');
const previewImage         = document.getElementById('previewImage');

// ============================================================
// VISTA PREVIAx
// ============================================================
function actualizarVistaPrevia() {
    const url = enlaceImagenInput.value.trim();

    // Si la URL es válida (jpg, jpeg, png, webp, gif)
    if (url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        previewImage.src = url;
        previewImage.style.display = 'block';
        previewPlaceholder.style.display = 'none';
        previewContainer.classList.add('has-image');

        // Manejar error de carga
        previewImage.onerror = function () {
            previewImage.style.display = 'none';
            previewPlaceholder.style.display = 'flex';
            previewPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i>
                <span class="preview-error">Error al cargar imagen</span>
            `;
            previewContainer.classList.remove('has-image');
        };

        previewImage.onload = function () {
            // Ya está mostrando la imagen, no hacer nada
        };

    } else {
        // Mostrar placeholder
        previewImage.style.display = 'none';
        previewPlaceholder.style.display = 'flex';
        previewPlaceholder.innerHTML = `
            <i class="fas fa-image"></i>
            <span>${url ? 'Formato no válido' : 'Ingresa un enlace de imagen'}</span>
        `;
        previewContainer.classList.remove('has-image');
    }
}

// Evento en tiempo real
enlaceImagenInput.addEventListener('input', actualizarVistaPrevia);

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

         // Resetear vista previa
          actualizarVistaPrevia();

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

    // Inicializar vista previa
actualizarVistaPrevia();