 // ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

    // ========== DOM ELEMENTS ==========
    const serieSelect = document.getElementById("serieSelect");
    const temporadaSelect = document.getElementById("temporadaSelect");
    const enlaceImagen = document.getElementById("enlaceImagen");
    const enlaceSitio = document.getElementById("enlaceSitio");
    const enlaceSitio02 = document.getElementById("enlaceSitio02");
    const previewImagen = document.getElementById("previewImagen");
    const nuevaTemporadaInput = document.getElementById("nuevaTemporadaInput");
    const inputNuevaTemporada = document.getElementById("inputNuevaTemporada");
    const imagenError = document.getElementById("imagenError");

    let creandoTemporada = false;
    let portadaActual = null;

    // ========== FUNCIONES ==========

    // Cargar series
    async function cargarSeries() {
      try {
        const res = await fetch(`${WORKER_URL}/portadas`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const portadas = await res.json();
        const seriesUnicas = [...new Set(portadas.map(p => p.nombreSerie))].sort();

        serieSelect.innerHTML = '<option value="" disabled selected>Seleccionar serie...</option>';
        seriesUnicas.forEach(serie => {
          const option = document.createElement("option");
          option.value = serie;
          option.textContent = serie;
          serieSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando series:", error);
        serieSelect.innerHTML = '<option value="" disabled selected>Error al cargar series</option>';
      }
    }

    // Cargar temporadas de una serie
    async function cargarTemporadas() {
      const serie = serieSelect.value;
      if (!serie) {
        temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar temporada...</option>';
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/temporadas-portadas?serie=${encodeURIComponent(serie)}`);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const temporadas = await res.json();

        temporadaSelect.innerHTML = '<option value="" disabled selected>Seleccionar temporada...</option>';
        temporadas.forEach(temp => {
          const option = document.createElement("option");
          option.value = temp;
          option.textContent = temp;
          temporadaSelect.appendChild(option);
        });
      } catch (error) {
        console.error("Error cargando temporadas:", error);
        temporadaSelect.innerHTML = '<option value="" disabled selected>Error al cargar temporadas</option>';
      }
    }

    // Cargar datos de la portada
    async function cargarDatos() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      if (!serie || !temporada) {
        limpiarCampos();
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/portada?serie=${encodeURIComponent(serie)}&temporada=${encodeURIComponent(temporada)}`);
        if (!res.ok) {
          if (res.status === 404) {
            limpiarCampos();
            return;
          }
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const portada = await res.json();
        portadaActual = portada;
        enlaceImagen.value = portada.imagen || "";
        enlaceSitio.value = portada.sitio || "";
        enlaceSitio02.value = portada.sitio02 || "";
        mostrarPreview(portada.imagen);
        ocultarErrorImagen();
      } catch (error) {
        console.error("Error cargando datos:", error);
        limpiarCampos();
      }
    }

    function limpiarCampos() {
      enlaceImagen.value = "";
      enlaceSitio.value = "";
      enlaceSitio02.value = "";
      mostrarPreview(null);
      portadaActual = null;
    }

    function mostrarPreview(url) {
      if (url && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(url)) {
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

    function mostrarErrorImagen(mensaje) {
      const span = imagenError.querySelector('span');
      span.textContent = mensaje || 'Error en la imagen';
      imagenError.classList.remove('hidden');
    }

    function ocultarErrorImagen() {
      imagenError.classList.add('hidden');
    }

    // Nueva temporada
    function nuevaTemporada() {
      creandoTemporada = true;
      temporadaSelect.disabled = true;
      nuevaTemporadaInput.style.display = "block";
      inputNuevaTemporada.focus();
      limpiarCampos();
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

      // Guardar portada vacía para la nueva temporada
      try {
        const datosPortada = {
          nombreSerie: serie,
          temporada: nombre,
          imagen: "",
          sitio: "",
          sitio02: ""
        };

        const res = await fetch(`${WORKER_URL}/registrar-portada`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPortada)
        });

        const data = await res.json();

        if (res.ok) {
          alert("Temporada creada correctamente.");
          cancelarNuevaTemporada();
          await cargarTemporadas();
          temporadaSelect.value = nombre;
          await cargarDatos();
        } else {
          alert("Error al crear temporada: " + (data.error || res.statusText));
        }
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

      if (!serie || !temporada) {
        alert("Selecciona una serie y temporada.");
        return;
      }

      if (!imagen) {
        mostrarErrorImagen("El enlace de la imagen es obligatorio.");
        return;
      }

      if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(imagen)) {
        mostrarErrorImagen("Formato de imagen no válido (jpg, jpeg, png, webp, gif).");
        return;
      }

      try {
        const datosPortada = {
          nombreSerie: serie,
          temporada: temporada,
          imagen: imagen,
          sitio: sitio || null,
          sitio02: sitio02 || null
        };

        const res = await fetch(`${WORKER_URL}/registrar-portada`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosPortada)
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ Portada guardada correctamente.");
          mostrarPreview(imagen);
          ocultarErrorImagen();

          if (creandoTemporada) {
            cancelarNuevaTemporada();
            await cargarTemporadas();
            temporadaSelect.value = temporada;
            creandoTemporada = false;
          }
        } else {
          alert("Error al guardar: " + (data.error || res.statusText));
        }
      } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error al guardar los datos: " + error.message);
      }
    }

    // Eliminar portada
    async function eliminarPortada() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      if (!serie || !temporada || !portadaActual) {
        alert("No hay portada seleccionada para eliminar.");
        return;
      }

      if (!confirm(`¿Estás seguro de eliminar la portada de "${serie} - ${temporada}"?`)) {
        return;
      }

      try {
        const res = await fetch(`${WORKER_URL}/eliminar-portada`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombreSerie: serie, temporada: temporada })
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message || "✅ Portada eliminada correctamente.");
          limpiarCampos();
          await cargarTemporadas();
        } else {
          alert("Error al eliminar: " + (data.error || res.statusText));
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar la portada: " + error.message);
      }
    }

    // ========== EVENTOS ==========
    serieSelect.addEventListener("change", async () => {
      await cargarTemporadas();
      temporadaSelect.value = "";
      limpiarCampos();
    });

    temporadaSelect.addEventListener("change", cargarDatos);

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