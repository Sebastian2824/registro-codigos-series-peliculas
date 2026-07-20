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
const btnTransfer = document.getElementById("btnGenerarResumenPortadas");
const estado = document.getElementById("estado");

// ========== FUNCIÓN PRINCIPAL SECUENCIAL Y SEGURA ==========
async function generarResumenPortadas() {
  btnTransfer.disabled = true;
  btnTransfer.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  estado.className = '';
  estado.innerHTML = '<span class="spinner"></span> Iniciando lectura segura de portadas...';

  try {
    // Lecturas iniciales controladas de las colecciones raíz
    const seriesSnapshot = await getDocs(collection(db, "animes-series-portadas"));
    const resumenSnapshot = await getDocs(collection(db, "animes-series-portadas-resumen"));

    const seriesResumenExistentes = new Map();
    resumenSnapshot.docs.forEach(doc => {
      seriesResumenExistentes.set(doc.id, doc.data());
    });

    let nuevasOActualizadas = 0;
    let totalSeries = seriesSnapshot.size;
    let contador = 0;

    // 🚀 PROCESAMIENTO SECUENCIAL: Analizamos una serie a la vez para cuidar las conexiones HTTP
    for (const serieDoc of seriesSnapshot.docs) {
      const nombreSerie = serieDoc.id;
      contador++;

      // Actualización visual del progreso en tiempo real
      estado.innerHTML = `<span class="spinner"></span> Procesando portadas ${contador} de ${totalSeries}: <strong>${nombreSerie}</strong>...`;

      // Consultamos la subcolección de temporadas de la serie actual de forma síncrona/lineal
      const temporadasSnapshot = await getDocs(collection(db, "animes-series-portadas", nombreSerie, "Temporadas"));

      const temporadas = temporadasSnapshot.docs.map(temporadaDoc => {
        const data = temporadaDoc.data();
        return {
          nombre: temporadaDoc.id,
          imagen: data.imagen || "",
          sitio: data.sitio || "",
          sitio02: data.sitio02 || ""
        };
      });

      // Ordenar las temporadas numéricamente (Temporada 1, Temporada 2...) para que el JSON quede impecable
      temporadas.sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, {numeric: true, sensitivity: 'base'}));

      const nuevoResumen = { nombre: nombreSerie, temporadas };
      const existente = seriesResumenExistentes.get(nombreSerie);

      // Comparación mediante strings antes de escribir para no gastar cuotas en Firebase de forma innecesaria
      if (JSON.stringify(existente) !== JSON.stringify(nuevoResumen)) {
        const resumenRef = doc(db, "animes-series-portadas-resumen", nombreSerie);
        await setDoc(resumenRef, nuevoResumen);
        nuevasOActualizadas++;
      }
    }

    // ========== RENDERIZADO DEL ESTADO FINAL ==========
    if (nuevasOActualizadas > 0) {
      estado.className = 'success';
      estado.innerHTML = `<i class="fas fa-check-circle"></i> Éxito: Se resumieron o actualizaron ${nuevasOActualizadas} series de ${totalSeries} procesadas en 'animes-series-portadas-resumen'.`;
    } else {
      estado.className = 'info';
      estado.innerHTML = `<i class="fas fa-info-circle"></i> Sincronización completa. Todas las portadas de las temporadas ya están al día.`;
    }

  } catch (error) {
    console.error("❌ Error generando resumen de portadas:", error);
    estado.className = 'error';
    estado.innerHTML = `<i class="fas fa-exclamation-circle"></i> Ocurrió un error al generar el resumen: ${error.message}`;
  } finally {
    btnTransfer.disabled = false;
    btnTransfer.innerHTML = '<i class="fas fa-play"></i> Iniciar Transferencia';
  }
}

// ========== EVENT LISTENER ==========
btnTransfer.addEventListener("click", generarResumenPortadas);

// ========== ESTADO INICIAL ==========
estado.innerHTML = `<i class="fas fa-info-circle"></i> Listo para transferir`;