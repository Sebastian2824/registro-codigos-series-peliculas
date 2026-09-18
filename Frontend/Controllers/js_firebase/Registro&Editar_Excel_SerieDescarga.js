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

    // ========== VARIABLES ==========
    let datosPreview = [];

    // ========== DOM REFERENCES ==========
    const inputExcel = document.getElementById('inputExcel');
    const saveButton = document.getElementById('saveButton');
    const panelPreview = document.getElementById('panelPreview');
    const uploadArea = document.getElementById('uploadArea');

    // ========== UTILIDADES ==========
    function escapeHTML(str) {
      if (!str) return '';
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
    }

    function mostrarProgreso(titulo, totalItems) {
      const overlay = document.createElement('div');
      overlay.className = 'progress-overlay';
      overlay.id = 'progressOverlay';
      overlay.innerHTML = `
        <div class="progress-container">
          <div class="progress-title">
            <i class="fas fa-spinner fa-spin"></i> ${titulo}
          </div>
          <div class="progress-info">
            <p><i class="fas fa-chart-bar"></i> Total a procesar: <strong>${totalItems}</strong></p>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar" id="progressBar">0%</div>
          </div>
          <div class="progress-status" id="progressStatus">Iniciando proceso...</div>
          <div class="progress-details" id="progressDetails"></div>
        </div>
      `;
      document.body.appendChild(overlay);
      return {
        update: (progreso, mensaje, detalle) => {
          const barra = document.getElementById('progressBar');
          const status = document.getElementById('progressStatus');
          const details = document.getElementById('progressDetails');
          if (barra) {
            const p = Math.round(progreso);
            barra.style.width = `${p}%`;
            barra.textContent = `${p}%`;
          }
          if (status && mensaje) status.textContent = mensaje;
          if (details && detalle) {
            const p = document.createElement('p');
            p.textContent = detalle;
            details.appendChild(p);
            details.scrollTop = details.scrollHeight;
          }
        },
        cerrar: () => {
          const existente = document.getElementById('progressOverlay');
          if (existente) existente.remove();
        }
      };
    }

    // ========== LECTURA DE EXCEL ==========
    inputExcel.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(hoja);
        datosPreview = [];

        datos.forEach(row => {
          const nombreSerie = row['Serie']?.trim();
          const temporada = row['Temporada']?.trim();
          const idioma = row['Idioma']?.trim();
          const episodio = row['Episodio']?.trim();

          Object.keys(row).forEach(col => {
            if (!['Serie', 'Temporada', 'Idioma', 'Episodio'].includes(col)) {
              const servidor = col.trim();
              const iframe = row[col]?.toString().trim();
              if (iframe && iframe !== '-') {
                datosPreview.push({ nombreSerie, temporada, idioma, episodio, servidor, iframe });
              }
            }
          });
        });

        if (datosPreview.length > 0) {
          let html = `
            <table>
              <thead>
                <tr>
                  <th>Serie</th>
                  <th>Temporada</th>
                  <th>Idioma</th>
                  <th>Episodio</th>
                  <th>Servidor</th>
                  <th>URL de Descarga</th>
                </tr>
              </thead>
              <tbody>
          `;
          datosPreview.forEach(d => {
            html += `
              <tr>
                <td><strong>${escapeHTML(d.nombreSerie)}</strong></td>
                <td>${escapeHTML(d.temporada)}</td>
                <td>${escapeHTML(d.idioma)}</td>
                <td>${escapeHTML(d.episodio)}</td>
                <td>${escapeHTML(d.servidor)}</td>
                <td class="iframe-cell">${escapeHTML(d.iframe)}</td>
              </tr>
            `;
          });
          html += `</tbody></table>`;
          panelPreview.innerHTML = html;
          saveButton.disabled = false;
        } else {
          panelPreview.innerHTML = `
            <div class="empty-message">
              <i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i>
              No se encontraron datos válidos en el archivo Excel
            </div>
          `;
          saveButton.disabled = true;
        }
      };
      reader.readAsArrayBuffer(file);
    });

    // ========== GUARDAR EN FIREBASE ==========
    saveButton.addEventListener('click', async function() {
      const total = datosPreview.length;
      if (total === 0) {
        alert('No hay datos para guardar.');
        return;
      }

      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

      const progreso = mostrarProgreso('Importando series de descarga a Firebase', total);
      let procesados = 0;
      let exitos = 0;
      let errores = 0;
      let actualizados = 0;
      let nuevos = 0;

      for (let i = 0; i < total; i++) {
        const { nombreSerie, temporada, idioma, episodio, servidor, iframe } = datosPreview[i];

        try {
          const docSerie = db.collection('animes-series-descargas').doc(nombreSerie);
          const docTemp = docSerie.collection('Temporadas').doc(temporada);
          const docIdioma = docTemp.collection('Idiomas').doc(idioma);
          const docServidor = docIdioma.collection('Servidores').doc(servidor);
          const docEpisodio = docServidor.collection('Episodios').doc(episodio);

          // Crear estructura si no existe
          await docSerie.set({ nombre: nombreSerie }, { merge: true });
          await docTemp.set({ nombre: temporada }, { merge: true });
          await docIdioma.set({ nombre: idioma }, { merge: true });
          await docServidor.set({ nombre: servidor }, { merge: true });

          // Verificar si el episodio ya existe
          const docData = await docEpisodio.get();
          const existente = docData.exists ? docData.data().iframe : null;

          if (!existente) {
            await docEpisodio.set({ iframe });
            nuevos++;
            progreso.update(
              ((i + 1) / total) * 100,
              `Procesando: ${i + 1} de ${total}`,
              `🆕 NUEVO: ${nombreSerie} > ${temporada} > ${idioma} > ${servidor} > ${episodio}`
            );
          } else if (existente !== iframe) {
            await docEpisodio.update({ iframe });
            actualizados++;
            progreso.update(
              ((i + 1) / total) * 100,
              `Procesando: ${i + 1} de ${total}`,
              `🔄 ACTUALIZADO: ${nombreSerie} > ${episodio}`
            );
          } else {
            progreso.update(
              ((i + 1) / total) * 100,
              `Procesando: ${i + 1} de ${total}`,
              `⏭️ SIN CAMBIOS: ${nombreSerie} > ${episodio}`
            );
          }

          exitos++;

        } catch (error) {
          errores++;
          progreso.update(
            ((i + 1) / total) * 100,
            `Procesando: ${i + 1} de ${total}`,
            `❌ ERROR: ${nombreSerie} > ${episodio} - ${error.message}`
          );
        }

        procesados++;
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      progreso.update(100, '¡Proceso completado!',
        `📊 RESUMEN FINAL:\n` +
        `✅ Procesados: ${procesados}\n` +
        `🆕 Nuevos episodios: ${nuevos}\n` +
        `🔄 Episodios actualizados: ${actualizados}\n` +
        `⏭️ Sin cambios: ${exitos - nuevos - actualizados}\n` +
        `❌ Errores: ${errores}`
      );

      await new Promise(resolve => setTimeout(resolve, 3000));
      progreso.cerrar();

      let mensaje = `✅ IMPORTACIÓN COMPLETADA\n\n`;
      mensaje += `📊 Total procesado: ${procesados}\n`;
      mensaje += `🆕 Nuevos episodios: ${nuevos}\n`;
      mensaje += `🔄 Episodios actualizados: ${actualizados}\n`;
      mensaje += `⏭️ Sin cambios: ${exitos - nuevos - actualizados}\n`;
      if (errores > 0) {
        mensaje += `❌ Errores: ${errores}\n\n⚠️ Algunos episodios no se pudieron procesar.`;
      } else {
        mensaje += `\n🎉 ¡Todos los datos se guardaron correctamente!`;
      }

      alert(mensaje);
      location.reload();
    });

    // ========== DRAG & DROP MEJORADO ==========
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#1a73e8';
      uploadArea.style.background = '#e8f0fe';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#e2e8f0';
      uploadArea.style.background = '#fafcff';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#e2e8f0';
      uploadArea.style.background = '#fafcff';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        inputExcel.files = files;
        inputExcel.dispatchEvent(new Event('change'));
      }
    });