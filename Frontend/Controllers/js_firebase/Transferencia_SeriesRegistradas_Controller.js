// ========== IMPORTACIONES DESDE EL SDK MODULAR DE FIREBASE ==========
import { ENV } from '../../Config/config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Inicializar Firebase de forma eficiente
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ========== DOM REFERENCES ==========
const btnTransfer = document.getElementById("btnGenerarResumen");
const estado = document.getElementById("estado");

async function generarResumenSeriesNuevas() {
  btnTransfer.disabled = true;
  btnTransfer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  estado.className = '';
  estado.innerHTML = '<span class="spinner"></span> Iniciando transferencia segura...';

  try {
    const seriesSnapshot = await getDocs(collection(db, "animes-series"));
    let seriesActualizadas = 0;
    let totalSeries = seriesSnapshot.size;
    let contador = 0;

    // 🚀 CAMBIO CLAVE: Procesamos de forma secuencial (Serie por Serie) para no saturar las conexiones
    for (const serieDoc of seriesSnapshot.docs) {
      const nombreSerie = serieDoc.id;
      contador++;
      
      // Actualizamos el estado visualmente para saber por qué serie va
      estado.innerHTML = `<span class="spinner"></span> Procesando serie ${contador} de ${totalSeries}: <strong>${nombreSerie}</strong>...`;

      const temporadasSnapshot = await getDocs(collection(db, "animes-series", nombreSerie, "Temporadas"));
      const temporadas = [];

      // Procesamos temporadas secuencialmente
      for (const temporadaDoc of temporadasSnapshot.docs) {
        const temporadaId = temporadaDoc.id;
        const idiomasSnapshot = await getDocs(collection(db, "animes-series", nombreSerie, "Temporadas", temporadaId, "Idiomas"));
        const idiomas = [];

        // Procesamos idiomas secuencialmente
        for (const idiomaDoc of idiomasSnapshot.docs) {
          const idiomaId = idiomaDoc.id;
          const servidoresSnapshot = await getDocs(collection(db, "animes-series", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores"));
          const servidores = [];

          // Procesamos servidores secuencialmente
          for (const servidorDoc of servidoresSnapshot.docs) {
            const servidorId = servidorDoc.id;
            const episodiosSnapshot = await getDocs(collection(db, "animes-series", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores", servidorId, "Episodios"));
            
            const episodios = episodiosSnapshot.docs.map(doc => ({
              id: doc.id,
              iframe: doc.data().iframe || ""
            }));

            // Ordenar los episodios numéricamente si es necesario para mantener la estructura limpia
            episodios.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true, sensitivity: 'base'}));

            servidores.push({ nombre: servidorId, episodios });
          }

          idiomas.push({ nombre: idiomaId, servidores });
        }

        temporadas.push({ nombre: temporadaId, idiomas });
      }

      // Estructura de guardado comparativo
      const nuevoResumen = { nombre: nombreSerie, temporadas };
      const resumenRef = doc(db, "animes-series-resumen", nombreSerie);
      const resumenSnap = await getDoc(resumenRef);

      let actualizar = true;
      if (resumenSnap.exists()) {
        const existente = resumenSnap.data();
        actualizar = JSON.stringify(nuevoResumen) !== JSON.stringify(existente);
      }

      if (actualizar) {
        await setDoc(resumenRef, nuevoResumen);
        seriesActualizadas++;
      }
    }

    // ========== RESULTADO FINAL ==========
    if (seriesActualizadas > 0) {
      estado.className = 'success';
      estado.innerHTML = `<i class="fas fa-check-circle"></i> Se completó la transferencia de forma segura. Series actualizadas/corregidas: ${seriesActualizadas} de ${totalSeries}.`;
    } else {
      estado.className = 'info';
      estado.innerHTML = `<i class="fas fa-info-circle"></i> Sincronización completa. No se detectaron más pérdidas de datos.`;
    }

  } catch (error) {
    console.error("❌ Error generando resumen:", error);
    estado.className = 'error';
    estado.innerHTML = `<i class="fas fa-exclamation-circle"></i> Ocurrió un error al generar el resumen: ${error.message}`;
  } finally {
    btnTransfer.disabled = false;
    btnTransfer.innerHTML = '<i class="fas fa-play"></i> Iniciar Transferencia';
  }
}

// ========== EVENT LISTENER ==========
btnTransfer.addEventListener("click", generarResumenSeriesNuevas);