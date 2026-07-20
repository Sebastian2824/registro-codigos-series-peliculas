    // ========== CONFIGURACIÓN ==========
    const WORKER_URL = 'https://proyect-cloud-flare.apiprueba2025.workers.dev';

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
            <p><i class="fas fa-cubes"></i> Envío en bloques de 50 registros</p>
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
              const url = row[col]?.toString().trim();
              if (url && url !== '-') {
                datosPreview.push({ nombreSerie, temporada, idioma, episodio, servidor, url });
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
                  <th>URL Original</th>
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
                <td class="url-cell">${escapeHTML(d.url)}</td>
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

    // ========== GUARDAR EN CLOUDFLARE ==========
    saveButton.addEventListener('click', async function() {
      const total = datosPreview.length;
      if (total === 0) {
        alert('No hay datos para guardar.');
        return;
      }

      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando a Cloudflare...';

      const progreso = mostrarProgreso('Importando series originales a Cloudflare', total);
      const chunkSize = 50;
      let procesados = 0;
      let bloquesExitosos = 0;
      let bloquesFallidos = 0;
      let registrosExitosos = 0;

      try {
        for (let i = 0; i < total; i += chunkSize) {
          const chunk = datosPreview.slice(i, i + chunkSize);
          const bloqueActual = Math.floor(i / chunkSize) + 1;
          const totalBloques = Math.ceil(total / chunkSize);
          const inicioBloque = i + 1;
          const finBloque = Math.min(i + chunkSize, total);

          progreso.update(
            (procesados / total) * 100,
            `Enviando bloque ${bloqueActual} de ${totalBloques} (registros ${inicioBloque}-${finBloque})...`,
            `📦 Enviando ${chunk.length} URLs originales al servidor Cloudflare...`
          );

          try {
            const response = await fetch(`${WORKER_URL}/registrar-original`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ registros: chunk }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(JSON.stringify(error));
            }

            const data = await response.json();
            bloquesExitosos++;
            registrosExitosos += chunk.length;

            progreso.update(
              (procesados / total) * 100,
              `✅ Bloque ${bloqueActual} enviado exitosamente`,
              `✅ ${chunk.length} URLs originales guardadas en Cloudflare - ${data.message || 'OK'}`
            );

          } catch (error) {
            bloquesFallidos++;
            progreso.update(
              (procesados / total) * 100,
              `❌ Error en bloque ${bloqueActual}`,
              `❌ Falló el envío de ${chunk.length} URLs: ${error.message.substring(0, 100)}`
            );
            console.error(`Error en bloque ${bloqueActual}:`, error);
          }

          procesados += chunk.length;
          const percent = Math.round((procesados / total) * 100);
          progreso.update(percent, `Progreso: ${percent}% completado`, `📊 Procesadas ${procesados} de ${total} URLs originales`);

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        let mensajeFinal = `📊 RESUMEN DE IMPORTACIÓN A CLOUDFLARE\n\n`;
        mensajeFinal += `✅ Bloques exitosos: ${bloquesExitosos}\n`;
        mensajeFinal += `❌ Bloques fallidos: ${bloquesFallidos}\n`;
        mensajeFinal += `📝 URLs enviadas: ${total}\n`;
        mensajeFinal += `✔️ URLs exitosas: ${registrosExitosos}\n`;

        if (bloquesFallidos === 0) {
          mensajeFinal += `\n🎉 ¡Todas las URLs originales se registraron correctamente en Cloudflare!`;
        } else {
          mensajeFinal += `\n⚠️ Algunos bloques fallaron. Por favor, revisa los datos e intenta nuevamente.`;
        }

        progreso.update(100, 'Proceso completado', mensajeFinal);
        await new Promise(resolve => setTimeout(resolve, 3000));
        progreso.cerrar();

        alert(mensajeFinal);

        if (bloquesExitosos > 0 && bloquesFallidos === 0) {
          setTimeout(() => location.reload(), 1500);
        }

      } catch (error) {
        progreso.cerrar();
        console.error('Error al guardar en Cloudflare:', error);
        alert(`❌ Error al guardar en Cloudflare: ${error.message}`);
      } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar en Cloudflare';
      }
    });

    // ========== DRAG & DROP MEJORADO ==========
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#f6821f';
      uploadArea.style.background = '#fef3e8';
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