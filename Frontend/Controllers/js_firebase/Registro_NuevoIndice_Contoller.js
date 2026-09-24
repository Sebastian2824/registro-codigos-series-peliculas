  import { ENV } from '../../Config/config.js';
  // ========== CONFIGURACIÓN FIREBASE ==========
    const firebaseConfig = {
      apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROYECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // ========== DOM REFERENCES ==========
    const enlaceImagenInput = document.getElementById('enlaceImagen');
    const previewContainer = document.getElementById('previewContainer');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const previewImage = document.getElementById('previewImage');
    const serieError = document.getElementById('serieError');
    const imagenError = document.getElementById('imagenError');
    const btnGuardar = document.getElementById('btnGuardar');

 // ========== FUNCIÓN DE VISTA PREVIA ==========d
    function actualizarVistaPrevia() {
      const url = enlaceImagenInput.value.trim();

      if (url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        previewImage.src = url;
        previewImage.style.display = 'block';
        previewPlaceholder.style.display = 'none';
        previewContainer.classList.add('has-image');

        previewImage.onerror = function() {
          previewImage.style.display = 'none';
          previewPlaceholder.style.display = 'flex';
          previewPlaceholder.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i>
            <span class="preview-error">Error al cargar imagen</span>
          `;
          previewContainer.classList.remove('has-image');
        };

        previewImage.onload = function() {
          // Ya se muestra la imagen, no se hace nada especial
        };

        // Ocultar error de imagen si existe
        imagenError.classList.add('hidden');
      } else {
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

    // ========== FUNCIONES DE VALIDACIÓN ==========
    function mostrarErrorSerie(mensaje) {
      const span = serieError.querySelector('span');
      span.textContent = mensaje;
      serieError.classList.remove('hidden');
    }

    function ocultarErrorSerie() {
      serieError.classList.add('hidden');
    }

    function mostrarErrorImagen(mensaje) {
      const span = imagenError.querySelector('span');
      span.textContent = mensaje;
      imagenError.classList.remove('hidden');
    }

    function ocultarErrorImagen() {
      imagenError.classList.add('hidden');
    }

    function validarCampos() {
      const nombreSerie = document.getElementById("serieNombre").value.trim();
      const enlaceImagen = document.getElementById("enlaceImagen").value.trim();

      let valido = true;

      if (!nombreSerie) {
        mostrarErrorSerie("El nombre de la serie es obligatorio");
        valido = false;
      } else {
        ocultarErrorSerie();
      }

      if (!enlaceImagen) {
        mostrarErrorImagen("El enlace de la imagen es obligatorio");
        valido = false;
      } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(enlaceImagen)) {
        mostrarErrorImagen("Ingresa un enlace válido (jpg, jpeg, png, webp, gif)");
        valido = false;
      } else {
        ocultarErrorImagen();
      }

      return valido;
    }

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

         // Resetear vista previa
          actualizarVistaPrevia();
          // Ocultar errores
          ocultarErrorSerie();
          ocultarErrorImagen();

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

       // Inicializar vista previa
    actualizarVistaPrevia();