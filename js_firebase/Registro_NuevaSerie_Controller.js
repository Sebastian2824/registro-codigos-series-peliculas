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

    function agregarFila() {
      const table = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];
      const newRow = table.insertRow();
      newRow.innerHTML = `
        <td><input type="text" placeholder="Ej: Episodio X"></td>
        <td><input type="text" placeholder="&lt;iframe&gt;...&lt;/iframe&gt;"></td>
        <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
      `;
    }

    function eliminarFila(boton) {
      const fila = boton.closest('tr');
      if (fila && fila.parentElement.children.length > 1) {
        fila.remove();
      } else {
        alert('Debe quedar al menos una fila.');
      }
    }

    // ========== IMPORTAR TXT ==========
    document.getElementById('importarTxt').addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const contenido = e.target.result;
        const lineas = contenido.split('\n');
        const table = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];

        lineas.forEach(linea => {
          if (linea.trim() === '') return;
          const partes = linea.split(';');
          if (partes.length !== 2) return;

          const episodio = partes[0].trim();
          const codigo = partes[1].trim().replace(/"/g, '&quot;');

          const newRow = table.insertRow();
          newRow.innerHTML = `
            <td><input type="text" value="${episodio}"></td>
            <td><input type="text" value="${codigo}"></td>
            <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
          `;
        });

        alert('✅ Importación completada.');
        event.target.value = '';
      };
      reader.readAsText(file);
    });

    // ========== IMPORTAR EXCEL ==========
    document.getElementById('importarExcel').addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const table = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];

        rows.forEach(row => {
          if (row.length < 2) return;
          const episodio = String(row[0]).trim();
          const codigo = String(row[1]).trim().replace(/"/g, '&quot;');

          if (episodio && codigo) {
            const newRow = table.insertRow();
            newRow.innerHTML = `
              <td><input type="text" value="${episodio}"></td>
              <td><input type="text" value="${codigo}"></td>
              <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
            `;
          }
        });

        alert('✅ Importación desde Excel completada.');
        event.target.value = '';
      };
      reader.readAsArrayBuffer(file);
    });

    // ========== GUARDAR EN FIREBASE ==========
    async function guardarEnFirebase() {
      const nombreSerie = document.getElementById("serieNombre").value.trim();
      const temporada = document.getElementById("temporada").value.trim();
      const idioma = document.getElementById("idioma").value.trim();
      const servidor = document.getElementById("servidor").value.trim();
      const tabla = document.getElementById("tablaEpisodios").getElementsByTagName("tbody")[0];
      const filas = tabla.getElementsByTagName("tr");

      if (!nombreSerie || !temporada || !idioma || !servidor) {
        alert("⚠️ Por favor, completa todos los campos antes de guardar.");
        return;
      }

      // Deshabilitar botón para evitar doble clic
      const btnGuardar = document.getElementById('btnGuardar');
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      try {
        // Crear documento base de la serie
        await db.collection("animes-series").doc(nombreSerie).set({ nombre: nombreSerie }, { merge: true });

        // Crear temporada
        await db.collection("animes-series")
          .doc(nombreSerie)
          .collection("Temporadas")
          .doc(temporada)
          .set({ nombre: temporada }, { merge: true });

        // Crear idioma
        await db.collection("animes-series")
          .doc(nombreSerie)
          .collection("Temporadas")
          .doc(temporada)
          .collection("Idiomas")
          .doc(idioma)
          .set({ nombre: idioma }, { merge: true });

        // Crear servidor
        await db.collection("animes-series")
          .doc(nombreSerie)
          .collection("Temporadas")
          .doc(temporada)
          .collection("Idiomas")
          .doc(idioma)
          .collection("Servidores")
          .doc(servidor)
          .set({ nombre: servidor }, { merge: true });

        // Guardar episodios
        for (let fila of filas) {
          const episodio = fila.cells[0].querySelector("input").value.trim();
          const codigo = fila.cells[1].querySelector("input").value.trim().replace(/&quot;/g, '"');

          if (episodio && codigo) {
            await db.collection("animes-series")
              .doc(nombreSerie)
              .collection("Temporadas")
              .doc(temporada)
              .collection("Idiomas")
              .doc(idioma)
              .collection("Servidores")
              .doc(servidor)
              .collection("Episodios")
              .doc(episodio)
              .set({ iframe: codigo }, { merge: true });
          }
        }

        alert("✅ Datos guardados correctamente.");

        // Limpiar campos (opcional)
        document.getElementById("serieNombre").value = "";
        document.getElementById("temporada").value = "";
        document.getElementById("idioma").value = "";
        document.getElementById("servidor").value = "";
        // Resetear tabla a una fila
        const tbody = document.getElementById('tablaEpisodios').getElementsByTagName('tbody')[0];
        tbody.innerHTML = `
          <tr>
            <td><input type="text" placeholder="Ej: Episodio 1"></td>
            <td><input type="text" placeholder="&lt;iframe&gt;...&lt;/iframe&gt;"></td>
            <td><button class="btn-eliminar" onclick="eliminarFila(this)"><i class="fas fa-trash-alt"></i> Eliminar</button></td>
          </tr>
        `;

      } catch (error) {
        console.error("Error al guardar:", error);
        alert("❌ Error al guardar: " + error.message);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar en Firebase';
      }
    }

    // ========== EVENTOS ==========
    document.getElementById('btnAgregarFila').addEventListener('click', agregarFila);
    document.getElementById('btnGuardar').addEventListener('click', guardarEnFirebase);