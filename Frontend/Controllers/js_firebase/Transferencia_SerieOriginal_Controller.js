// ========== IMPORTACIONES DESDE EL SDK MODULAR DE FIREBASE ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== DOM REFERENCES ==========
const btnTransfer = document.getElementById("btnGenerarResumenEnlaces");
const estado = document.getElementById("estado");

// ========== FUNCIÓN PRINCIPAL SECUENCIAL Y SEGURA ==========
async function generarResumenEnlaces() {
  btnTransfer.disabled = true;
  btnTransfer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  estado.className = '';
  estado.innerHTML = '<span class="spinner"></span> Iniciando transferencia segura original...';

  try {
    // Lectura de la colección raíz original
    const seriesSnapshot = await getDocs(collection(db, "animes-series-original"));
    let nuevasSeries = 0;
    let actualizadas = 0;
    let totalSeries = seriesSnapshot.size;
    let contador = 0;

    // 🚀 PROCESAMIENTO SECUENCIAL: Analizamos una serie a la vez para no saturar HTTP/2
    for (const serieDoc of seriesSnapshot.docs) {
      const nombreSerie = serieDoc.id;
      contador++;

      // Feedback visual inmediato en la interfaz de administración
      estado.innerHTML = `<span class="spinner"></span> Procesando original ${contador} de ${totalSeries}: <strong>${nombreSerie}</strong>...`;

      const temporadasSnapshot = await getDocs(collection(db, "animes-series-original", nombreSerie, "Temporadas"));
      const temporadas = [];

      // Recorrer temporadas secuencialmente
      for (const temporadaDoc of temporadasSnapshot.docs) {
        const temporadaId = temporadaDoc.id;
        const idiomasSnapshot = await getDocs(collection(db, "animes-series-original", nombreSerie, "Temporadas", temporadaId, "Idiomas"));
        const idiomas = [];

        // Recorrer idiomas secuencialmente
        for (const idiomaDoc of idiomasSnapshot.docs) {
          const idiomaId = idiomaDoc.id;
          const servidoresSnapshot = await getDocs(collection(db, "animes-series-original", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores"));
          const servidores = [];

          // Recorrer servidores secuencialmente
          for (const servidorDoc of servidoresSnapshot.docs) {
            const servidorId = servidorDoc.id;
            const episodiosSnapshot = await getDocs(collection(db, "animes-series-original", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores", servidorId, "Episodios"));

            // Mapeo síncrono manteniendo tu propiedad 'url'
            const episodios = episodiosSnapshot.docs.map(doc => ({
              id: doc.id,
              url: doc.data().url || ""
            }));

            // Ordenar los episodios de forma natural (Episodio 01, Episodio 02...)
            episodios.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true, sensitivity: 'base'}));

            servidores.push({ nombre: servidorId, episodios });
          }

          idiomas.push({ nombre: idiomaId, servidores });
        }

        temporadas.push({ nombre: temporadaId, idiomas });
      }

      // Referencia al documento destino en la colección original-resumen
      const resumenRef = doc(db, "animes-series-original-resumen", nombreSerie);
      const resumenDoc = await getDoc(resumenRef);

      const resumenActual = {
        nombre: nombreSerie,
        temporadas
      };

      // Guardado y verificación limpia
      if (!resumenDoc.exists()) {
        await setDoc(resumenRef, resumenActual);
        nuevasSeries++;
      } else {
        const existente = resumenDoc.data();
        if (JSON.stringify(existente) !== JSON.stringify(resumenActual)) {
          await setDoc(resumenRef, resumenActual);
          actualizadas++;
        }
      }
    }

    // ========== RENDERIZADO DE RESULTADO FINAL ==========
    if (nuevasSeries > 0 || actualizadas > 0) {
      estado.className = 'success';
      estado.innerHTML = `<i class="fas fa-check-circle"></i> Sincronización completa: ${nuevasSeries} nuevas y ${actualizadas} actualizadas de ${totalSeries} series originales analizadas.`;
    } else {
      estado.className = 'info';
      estado.innerHTML = `<i class="fas fa-info-circle"></i> Sincronización al día. No se detectaron cambios en las series originales.`;
    }

  } catch (error) {
    console.error("❌ Error generando resumen original:", error);
    estado.className = 'error';
    estado.innerHTML = `<i class="fas fa-exclamation-circle"></i> Ocurrió un error al generar el resumen: ${error.message}`;
  } finally {
    btnTransfer.disabled = false;
    btnTransfer.innerHTML = '<i class="fas fa-play"></i> Iniciar Transferencia';
  }
}

// ========== EVENT LISTENER ==========
btnTransfer.addEventListener("click", generarResumenEnlaces);

// ========== ESTADO INICIAL ==========
estado.innerHTML = `<i class="fas fa-info-circle"></i> Listo para transferir`;