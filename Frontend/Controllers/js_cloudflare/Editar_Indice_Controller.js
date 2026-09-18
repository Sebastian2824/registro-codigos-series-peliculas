// ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== DOM ELEMENTS ==========
    const serieSelect = document.getElementById("serieSelect");
    const nombreIngles = document.getElementById("nombreIngles");
    const nombreJapones = document.getElementById("nombreJapones");
    const anioPublicacion = document.getElementById("anioPublicacion");
    const categoria = document.getElementById("categoria");
    const idioma = document.getElementById("idioma");
    const enlaceImagen = document.getElementById("enlaceImagen");
    const enlaceSitio = document.getElementById("enlaceSitio");
    const previewContainer = document.getElementById("previewImagen");
    const imagenError = document.getElementById("imagenError");

    let serieActual = null;

    // ========== FUNCIONES ==========

    // Cargar lista de series desde el worker
    async function cargarSeries() {
      try {
        const res = await fetch(`${WORKER_URL}/indice-series`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const series = await res.json();

        if (!Array.isArray(series)) {
          throw new Error('Formato de respuesta inválido');
        }

        serieSelect.innerHTML = '<option value="" disabled selected>Seleccionar serie...</option>';
        series.forEach(serie => {
          const option = document.createElement("option");
          option.value = serie.nombreSerie;
          option.textContent = serie.nombreSerie;
          serieSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando series:", error);
        serieSelect.innerHTML = '<option value="" disabled selected>Error al cargar series</option>';
      }
    }

    // Cargar datos de la serie seleccionada
    async function cargarDatos() {
      const serie = serieSelect.value;
      if (!serie) {
        limpiarCampos();
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/indice-serie?serie=${encodeURIComponent(serie)}`);
        if (!res.ok) {
          if (res.status === 404) {
            alert("Serie no encontrada en el índice");
            limpiarCampos();
            return;
          }
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const serieData = await res.json();
        serieActual = serieData;

        nombreIngles.value = serieData.nombresec || "";
        nombreJapones.value = serieData.nombresec02 || "";
        anioPublicacion.value = serieData.año || "";
        categoria.value = serieData.categoria || "";
        idioma.value = serieData.idioma || "";
        enlaceImagen.value = serieData.imagen || "";
        enlaceSitio.value = serieData.sitio || "";

        mostrarPreview(serieData.imagen);
        ocultarErrorImagen();
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("Error al cargar los datos de la serie: " + error.message);
        limpiarCampos();
      }
    }

    // Mostrar preview de imagen
    function mostrarPreview(url) {
      if (url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        previewContainer.innerHTML = `<img src="${url}" alt="Vista previa" onerror="mostrarErrorImagen('Error al cargar la imagen')" />`;
      } else {
        previewContainer.innerHTML = `
          <div class="placeholder">
            <i class="fas fa-image"></i>
            <span>${url ? 'Enlace no válido' : 'Vista previa de la imagen'}</span>
          </div>
        `;
      }
    }

    function mostrarErrorImagen(mensaje) {
      const errorSpan = imagenError.querySelector('span');
      errorSpan.textContent = mensaje || 'Error al cargar la imagen';
      imagenError.classList.remove('hidden');
      previewContainer.innerHTML = `
        <div class="placeholder">
          <i class="fas fa-exclamation-triangle" style="color:#dc2626;"></i>
          <span>Error al cargar imagen</span>
        </div>
      `;
    }

    function ocultarErrorImagen() {
      imagenError.classList.add('hidden');
    }

    function limpiarCampos() {
      nombreIngles.value = "";
      nombreJapones.value = "";
      anioPublicacion.value = "";
      categoria.value = "";
      idioma.value = "";
      enlaceImagen.value = "";
      enlaceSitio.value = "";
      previewContainer.innerHTML = `
        <div class="placeholder">
          <i class="fas fa-image"></i>
          <span>Vista previa de la imagen</span>
        </div>
      `;
      ocultarErrorImagen();
      serieActual = null;
    }

    function validarCampos() {
      const serie = serieSelect.value;
      const imagen = enlaceImagen.value.trim();

      if (!serie) {
        alert("Selecciona una serie para editar.");
        return false;
      }

      if (!imagen) {
        mostrarErrorImagen("El enlace de la imagen es obligatorio");
        return false;
      } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(imagen)) {
        mostrarErrorImagen("Ingresa un enlace válido (jpg, jpeg, png, webp, gif)");
        return false;
      } else {
        ocultarErrorImagen();
      }

      return true;
    }

    // Guardar cambios
    async function guardarCambios() {
      if (!validarCampos()) return;

      const datosActualizados = {
        nombreSerie: serieSelect.value,
        nombresec: nombreIngles.value.trim() || null,
        nombresec02: nombreJapones.value.trim() || null,
        año: anioPublicacion.value.trim() || null,
        categoria: categoria.value.trim() || null,
        idioma: idioma.value.trim() || null,
        imagen: enlaceImagen.value.trim(),
        sitio: enlaceSitio.value.trim() || null
      };

      try {
        const res = await fetch(`${WORKER_URL}/actualizar-indice`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosActualizados)
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ Serie actualizada correctamente en el índice.");
          mostrarPreview(datosActualizados.imagen);
        } else {
          alert("Error al actualizar: " + (data.error || res.statusText));
        }
      } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar los datos: " + error.message);
      }
    }

    // Eliminar serie
    async function eliminarSerie() {
      const serie = serieSelect.value;
      if (!serie || !serieActual) {
        alert("No hay serie seleccionada para eliminar.");
        return;
      }

      if (!confirm(`¿Estás seguro de eliminar la serie "${serie}" del índice? Esta acción no se puede deshacer.`)) {
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/eliminar-indice`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombreSerie: serie })
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ Serie eliminada correctamente del índice.");
          limpiarCampos();
          await cargarSeries();
        } else {
          alert("Error al eliminar: " + (data.error || res.statusText));
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar la serie: " + error.message);
      }
    }

    // ========== EVENTOS ==========
    serieSelect.addEventListener("change", cargarDatos);

    enlaceImagen.addEventListener("input", () => {
      const url = enlaceImagen.value.trim();
      if (url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
        ocultarErrorImagen();
        mostrarPreview(url);
      } else {
        if (url) {
          mostrarErrorImagen("Formato de enlace no válido");
        } else {
          ocultarErrorImagen();
          mostrarPreview(null);
        }
      }
    });

    // ========== INICIALIZACIÓN ==========
    document.addEventListener("DOMContentLoaded", () => {
      cargarSeries();
      ocultarErrorImagen();
    });