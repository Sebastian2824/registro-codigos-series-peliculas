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
  estado.innerHTML = '<span class="spinner"></span> Iniciando transferencia segura de enlaces...';

  try {
    // Lectura de la colección raíz de enlaces
    const seriesSnapshot = await getDocs(collection(db, "animes-series-enlaces"));
    let nuevasSeries = 0;
    let actualizadas = 0;
    let totalSeries = seriesSnapshot.size;
    let contador = 0;

    // 🚀 PROCESAMIENTO SECUENCIAL: Una serie a la vez para evitar caídas de red
    for (const serieDoc of seriesSnapshot.docs) {
      const nombreSerie = serieDoc.id;
      contador++;

      // Actualización visual en tiempo real para el administrador
      estado.innerHTML = `<span class="spinner"></span> Procesando enlaces ${contador} de ${totalSeries}: <strong>${nombreSerie}</strong>...`;

      const temporadasSnapshot = await getDocs(collection(db, "animes-series-enlaces", nombreSerie, "Temporadas"));
      const temporadas = [];

      // Recorrer temporadas secuencialmente
      for (const temporadaDoc of temporadasSnapshot.docs) {
        const temporadaId = temporadaDoc.id;
        const idiomasSnapshot = await getDocs(collection(db, "animes-series-enlaces", nombreSerie, "Temporadas", temporadaId, "Idiomas"));
        const idiomas = [];

        // Recorrer idiomas secuencialmente
        for (const idiomaDoc of idiomasSnapshot.docs) {
          const idiomaId = idiomaDoc.id;
          const servidoresSnapshot = await getDocs(collection(db, "animes-series-enlaces", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores"));
          const servidores = [];

          // Recorrer servidores secuencialmente
          for (const servidorDoc of servidoresSnapshot.docs) {
            const servidorId = servidorDoc.id;
            const episodiosSnapshot = await getDocs(collection(db, "animes-series-enlaces", nombreSerie, "Temporadas", temporadaId, "Idiomas", idiomaId, "Servidores", servidorId, "Episodios"));

            // Mapeo síncrono de los campos de enlace (url)
            const episodios = episodiosSnapshot.docs.map(doc => ({
              id: doc.id,
              url: doc.data().url || ""
            }));

            // Ordenar los episodios numéricamente para mantener el orden limpio (Ej: Episodio 1, Episodio 2...)
            episodios.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true, sensitivity: 'base'}));

            servidores.push({ nombre: servidorId, episodios });
          }

          idiomas.push({ nombre: idiomaId, servidores });
        }

        temporadas.push({ nombre: temporadaId, idiomas });
      }

      // Referencia modular al documento destino en la colección resumen
      const resumenRef = doc(db, "animes-series-enlaces-resumen", nombreSerie);
      const resumenDoc = await getDoc(resumenRef);

      const resumenActual = {
        nombre: nombreSerie,
        temporadas
      };

      // Control preciso de inserciones y actualizaciones
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

    // ========== ACTUALIZACIÓN DE INTERFAZ (RESULTADO FINAL) ==========
    if (nuevasSeries > 0 || actualizadas > 0) {
      estado.className = 'success';
      estado.innerHTML = `<i class="fas fa-check-circle"></i> Sincronización exitosa: ${nuevasSeries} nuevas y ${actualizadas} actualizadas de ${totalSeries} series analizadas.`;
    } else {
      estado.className = 'info';
      estado.innerHTML = `<i class="fas fa-info-circle"></i> Sincronización completa. Todos los enlaces de descarga están al día.`;
    }

  } catch (error) {
    console.error("❌ Error generando resumen de enlaces:", error);
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