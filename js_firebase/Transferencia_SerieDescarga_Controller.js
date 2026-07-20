// ========== IMPORTACIONES DESDE EL SDK MODULAR DE FIREBASE ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const btnTransfer = document.getElementById("btnGenerarResumen");
const estado = document.getElementById("estado");

// ========== FUNCIÓN PRINCIPAL SECUENCIAL Y SEGURA ==========
async function generarResumenDescargas() {
  btnTransfer.disabled = true;
  btnTransfer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  estado.className = '';
  estado.innerHTML = '<span class="spinner"></span> Iniciando lectura segura de descargas...';

  try {
    // Lecturas iniciales de las colecciones raíz
    const seriesSnapshot = await getDocs(collection(db, "animes-series-descargas"));
    const resumenSnapshot = await getDocs(collection(db, "animes-series-descargas-resumen"));
    const resumenMap = new Map(resumenSnapshot.docs.map(doc => [doc.id, doc.data()]));

    let seriesActualizadas = 0;
    let totalSeries = seriesSnapshot.size;
    let contador = 0;

    // 🚀 PROCESAMIENTO SECUENCIAL: Analizamos una serie a la vez para evitar cuellos de botella HTTP/2
    for (const serieDoc of seriesSnapshot.docs) {
      const nombreSerie = serieDoc.id;
      contador++;

      // Notificación visual en tiempo real del progreso
      estado.innerHTML = `<span class="spinner"></span> Procesando descargas ${contador} de ${totalSeries}: <strong>${nombreSerie}</strong>...`;

      const temporadasSnapshot = await getDocs(collection(db, "animes-series-descargas", nombreSerie, "Temporadas"));
      const temporadas = [];

      // Recorrer temporadas secuencialmente
      for (const temporadaDoc of temporadasSnapshot.docs) {
        const temporadaId = temporadaDoc.id;
        const idiomasSnapshot = await getDocs(collection(db, "animes-series-descargas", nombreSerie, "Temporadas", temporadaId, "Idiomas"));
        const idiomas = [];

        // Recorrer idiomas secuencialmente
        for (const idiomaDoc of idiomasSnapshot.docs) {
          const idiomaId = idiomaDoc.id;
          const servidoresSnapshot = await getDocs(collection(db, "animes-series-descargas", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores"));
          const servidores = [];

          // Recorrer servidores secuencialmente
          for (const servidorDoc of servidoresSnapshot.docs) {
            const servidorId = servidorDoc.id;
            const episodiosSnapshot = await getDocs(collection(db, "animes-series-descargas", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores", servidorId, "Episodios"));

            // Mapeo síncrono respetando las claves originales ('episodio' e 'iframe')
            const episodios = episodiosSnapshot.docs.map(doc => ({
              episodio: doc.id,
              iframe: doc.data().iframe || ""
            }));

            // Ordenar los episodios de manera natural (Episodio 1, Episodio 2...) para que no se guarden desordenados
            episodios.sort((a, b) => a.episodio.localeCompare(b.episodio, undefined, {numeric: true, sensitivity: 'base'}));

            servidores.push({ nombre: servidorId, episodios });
          }

          idiomas.push({ nombre: idiomaId, servidores });
        }

        temporadas.push({ nombre: temporadaId, idiomas });
      }

      const resumenNuevo = { nombre: nombreSerie, temporadas };
      const resumenActual = resumenMap.get(nombreSerie);

      // Comparación estricta antes de escribir en Firestore para ahorrar cuota de escritura
      if (JSON.stringify(resumenNuevo) !== JSON.stringify(resumenActual)) {
        const resumenRef = doc(db, "animes-series-descargas-resumen", nombreSerie);
        await setDoc(resumenRef, resumenNuevo);
        seriesActualizadas++;
      }
    }

    // ========== RENDERIZADO DEL ESTADO FINAL ==========
    if (seriesActualizadas > 0) {
      estado.className = 'success';
      estado.innerHTML = `<i class="fas fa-check-circle"></i> Sincronización exitosa: Se actualizaron ${seriesActualizadas} de ${totalSeries} series en 'animes-series-descargas-resumen'.`;
    } else {
      estado.className = 'info';
      estado.innerHTML = `<i class="fas fa-info-circle"></i> El almacén de descargas ya está completamente actualizado.`;
    }

  } catch (error) {
    console.error("❌ Error generando resumen de descargas:", error);
    estado.className = 'error';
    estado.innerHTML = `<i class="fas fa-exclamation-circle"></i> Ocurrió un error al generar el resumen: ${error.message}`;
  } finally {
    btnTransfer.disabled = false;
    btnTransfer.innerHTML = '<i class="fas fa-play"></i> Iniciar Transferencia';
  }
}

// ========== EVENT LISTENER ==========
btnTransfer.addEventListener("click", generarResumenDescargas);

// ========== ESTADO INICIAL ==========
estado.innerHTML = `<i class="fas fa-info-circle"></i> Listo para transferir`;