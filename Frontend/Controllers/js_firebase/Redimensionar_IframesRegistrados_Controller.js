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
    const serieSelect = document.getElementById('serieSelect');
    const temporadaSelect = document.getElementById('temporadaSelect');
    const idiomaSelect = document.getElementById('idiomaSelect');
    const servidorSelect = document.getElementById('servidorSelect');
    const episodiosContainer = document.getElementById('episodiosContainer');
    const formDimension = document.getElementById('formDimension');
    const btnModificarGroup = document.getElementById('btnModificarGroup');

    // ========== FUNCIONES ==========
    window.onload = () => {
      cargarSeries();
    };

    async function cargarSeries() {
      const snapshot = await db.collection("animes-series").get();
      serieSelect.innerHTML = `<option value="">Selecciona una serie</option>`;
      snapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.id;
        serieSelect.appendChild(option);
      });
    }

    async function cargarTemporadas() {
      const serie = serieSelect.value;
      temporadaSelect.innerHTML = `<option value="">Selecciona una temporada</option>`;
      idiomaSelect.innerHTML = `<option value="">Selecciona un idioma</option>`;
      servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
      limpiarContenedores();

      if (!serie) {
        temporadaSelect.disabled = true;
        idiomaSelect.disabled = true;
        servidorSelect.disabled = true;
        return;
      }

      temporadaSelect.disabled = false;
      const snapshot = await db.collection("animes-series").doc(serie).collection("Temporadas").get();
      snapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.id;
        temporadaSelect.appendChild(option);
      });
      idiomaSelect.disabled = true;
      servidorSelect.disabled = true;
    }

    async function cargarIdiomas() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      idiomaSelect.innerHTML = `<option value="">Selecciona un idioma</option>`;
      servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
      limpiarContenedores();

      if (!temporada) {
        idiomaSelect.disabled = true;
        servidorSelect.disabled = true;
        return;
      }

      idiomaSelect.disabled = false;
      const snapshot = await db.collection("animes-series")
        .doc(serie).collection("Temporadas")
        .doc(temporada).collection("Idiomas").get();

      snapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.id;
        idiomaSelect.appendChild(option);
      });
      servidorSelect.disabled = true;
    }

    async function cargarServidores() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      const idioma = idiomaSelect.value;
      servidorSelect.innerHTML = `<option value="">Selecciona un servidor</option>`;
      limpiarContenedores();

      if (!idioma) {
        servidorSelect.disabled = true;
        return;
      }

      servidorSelect.disabled = false;
      const snapshot = await db.collection("animes-series")
        .doc(serie).collection("Temporadas")
        .doc(temporada).collection("Idiomas")
        .doc(idioma).collection("Servidores").get();

      snapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.id;
        servidorSelect.appendChild(option);
      });
    }

    async function cargarEpisodios() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      const idioma = idiomaSelect.value;
      const servidor = servidorSelect.value;
      limpiarContenedores();

      if (!servidor) return;

      const snapshot = await db.collection("animes-series")
        .doc(serie).collection("Temporadas")
        .doc(temporada).collection("Idiomas")
        .doc(idioma).collection("Servidores")
        .doc(servidor).collection("Episodios")
        .get();

      if (snapshot.empty) {
        episodiosContainer.innerHTML = `
          <div class="empty-message">
            <i class="fas fa-info-circle"></i>
            No hay episodios en este servidor
          </div>
        `;
        btnModificarGroup.style.display = 'none';
        return;
      }

      let tablaHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 12%">Episodio</th>
                <th style="width: 50%">Código iframe</th>
                <th style="width: 15%">Width</th>
                <th style="width: 15%">Height</th>
              </tr>
            </thead>
            <tbody>
      `;

      snapshot.forEach(doc => {
        const episodio = doc.id;
        const iframe = doc.data().iframe || "";

        // Extraer width y height
        const widthMatch = iframe.match(/(?:\s|^)width\s*=\s*(?:"([^"]+)"|(\d+))/i);
        const heightMatch = iframe.match(/(?:\s|^)height\s*=\s*(?:"([^"]+)"|(\d+))/i);
        const width = widthMatch ? (widthMatch[1] || widthMatch[2]) : '';
        const height = heightMatch ? (heightMatch[1] || heightMatch[2]) : '';

        tablaHTML += `
          <tr>
            <td><strong>${episodio}</strong></td>
            <td>
              <textarea data-episodio="${episodio}">${iframe}</textarea>
            </td>
            <td><span class="dimension-badge">${width || '—'}</span></td>
            <td><span class="dimension-badge">${height || '—'}</span></td>
          </tr>
        `;
      });

      tablaHTML += `
            </tbody>
          </table>
        </div>
      `;

      episodiosContainer.innerHTML = tablaHTML;
      btnModificarGroup.style.display = 'block';
      formDimension.classList.remove('visible');
    }

    function limpiarContenedores() {
      episodiosContainer.innerHTML = '';
      formDimension.classList.remove('visible');
      btnModificarGroup.style.display = 'none';
    }

    function mostrarFormulario() {
      formDimension.classList.toggle('visible');
    }

    function ocultarFormulario() {
      formDimension.classList.remove('visible');
    }

    function aplicarCambiosDimension() {
      const nuevoWidth = document.getElementById('nuevoWidth').value.trim();
      const nuevoHeight = document.getElementById('nuevoHeight').value.trim();

      if (!nuevoWidth || !nuevoHeight) {
        alert('⚠️ Debes ingresar valores para width y height.');
        return;
      }

      const textareas = document.querySelectorAll('#episodiosContainer textarea');
      if (textareas.length === 0) {
        alert('No hay episodios para modificar.');
        return;
      }

      textareas.forEach(textarea => {
        let iframe = textarea.value;

        // Reemplazar width
        const widthMatch = iframe.match(/\b(width|WIDTH)\s*=\s*("[^"]*"|\d+)/);
        if (widthMatch) {
          const atributo = widthMatch[1];
          iframe = iframe.replace(/\b(width|WIDTH)\s*=\s*("[^"]*"|\d+)/, `${atributo}="${nuevoWidth}"`);
        } else {
          iframe = iframe.replace(/<iframe/i, `<iframe width="${nuevoWidth}"`);
        }

        // Reemplazar height
        const heightMatch = iframe.match(/\b(height|HEIGHT)\s*=\s*("[^"]*"|\d+)/);
        if (heightMatch) {
          const atributo = heightMatch[1];
          iframe = iframe.replace(/\b(height|HEIGHT)\s*=\s*("[^"]*"|\d+)/, `${atributo}="${nuevoHeight}"`);
        } else {
          iframe = iframe.replace(/<iframe/i, `<iframe height="${nuevoHeight}"`);
        }

        textarea.value = iframe;

        // Actualizar badges en la tabla
        const fila = textarea.closest('tr');
        if (fila) {
          const badges = fila.querySelectorAll('.dimension-badge');
          if (badges.length >= 2) {
            badges[0].textContent = nuevoWidth;
            badges[1].textContent = nuevoHeight;
          }
        }
      });

      alert('✅ Las dimensiones han sido actualizadas en los campos mostrados. Pulsa "Guardar cambios" para persistir.');
      ocultarFormulario();
    }

    async function guardarCambios() {
      const serie = serieSelect.value;
      const temporada = temporadaSelect.value;
      const idioma = idiomaSelect.value;
      const servidor = servidorSelect.value;

      if (!serie || !temporada || !idioma || !servidor) {
        alert('⚠️ Asegúrate de haber seleccionado todos los filtros.');
        return;
      }

      const textareas = document.querySelectorAll('#episodiosContainer textarea');
      if (textareas.length === 0) {
        alert('No hay episodios para guardar.');
        return;
      }

      let contador = 0;
      for (const textarea of textareas) {
        const episodio = textarea.dataset.episodio;
        const nuevoCodigo = textarea.value.trim();
        if (!nuevoCodigo) continue;

        await db.collection("animes-series")
          .doc(serie).collection("Temporadas")
          .doc(temporada).collection("Idiomas")
          .doc(idioma).collection("Servidores")
          .doc(servidor).collection("Episodios")
          .doc(episodio)
          .set({ iframe: nuevoCodigo }, { merge: true });
        contador++;
      }

      alert(`✅ ${contador} episodios guardados correctamente.`);
    }

    // ========== EVENTOS ADICIONALES ==========
    // Deshabilitar selects inicialmente
    temporadaSelect.disabled = true;
    idiomaSelect.disabled = true;
    servidorSelect.disabled = true;

    // Permitir cerrar formulario con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && formDimension.classList.contains('visible')) {
        ocultarFormulario();
      }
    });