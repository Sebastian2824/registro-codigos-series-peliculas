    // ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== DOM REFERENCES ==========
    const enlaceImagenInput = document.getElementById('enlaceImagen');
    const previewContainer = document.getElementById('previewContainer');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const previewImage = document.getElementById('previewImage');
    const serieError = document.getElementById('serieError');
    const imagenError = document.getElementById('imagenError');
    const btnGuardar = document.getElementById('btnGuardar');

    // ========== FUNCIÓN DE VISTA PREVIA ==========
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
    async function guardarEnCloudflare() {
      if (!validarCampos()) {
        return;
      }

      const datosIndice = {
        nombreSerie: document.getElementById("serieNombre").value.trim(),
        nombresec: document.getElementById("nombreIngles").value.trim() || null,
        nombresec02: document.getElementById("nombreJapones").value.trim() || null,
        año: document.getElementById("anioPublicacion").value.trim() || null,
        categoria: document.getElementById("categoria").value.trim() || null,
        idioma: document.getElementById("idioma").value.trim() || null,
        imagen: document.getElementById("enlaceImagen").value.trim(),
        sitio: document.getElementById("enlaceSitio").value.trim() || null
      };

      // Deshabilitar botón
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      try {
        const res = await fetch(`${WORKER_URL}/registrar-indice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosIndice)
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ Serie registrada correctamente en el índice de Cloudflare D1.");
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
        } else {
          alert("❌ Error al guardar: " + (data.error || res.statusText));
        }
      } catch (error) {
        console.error("Error al guardar en Cloudflare:", error);
        alert("❌ Error al guardar: " + error.message);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar en Cloudflare';
      }
    }

    // ========== EVENTOS ==========
    btnGuardar.addEventListener('click', guardarEnCloudflare);

    // Soporte para tecla Enter
    document.addEventListener('keypress', function(event) {
      if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
        guardarEnCloudflare();
      }
    });

    // Inicializar vista previa
    actualizarVistaPrevia();