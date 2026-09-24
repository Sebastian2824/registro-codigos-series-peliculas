import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync } from 'fs';

export default defineConfig({
  base: '/registro-codigos-series-peliculas/',
  root: './',
  server: {
    port: 5173,
    open: '/index.html'
  },
  plugins: [
    {
      name: 'copiar-carpetas-estaticas',
      closeBundle() {
        const carpetas = ['Controllers', 'Config'];
        carpetas.forEach(carpeta => {
          const src = resolve(__dirname, carpeta);
          const dest = resolve(__dirname, 'dist', carpeta);
          if (existsSync(src)) {
            cpSync(src, dest, { recursive: true });
            console.log(`✅ Copiada carpeta: ${carpeta} → dist/${carpeta}`);
          } else {
            console.warn(`⚠️ No existe: ${carpeta}`);
          }
        });
      }
    }
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'Views/Menu-Principal.html'),
        // Añade aquí las rutas de tus interfaces críticas para que Vite las procese al compilar:
        
        editarContenidoAzure: resolve(__dirname, 'Views/Interfaces-Azure/Editar-Contenido-Serie.html'),
        editarIndiceAzure: resolve(__dirname, 'Views/Interfaces-Azure/Editar-Indice.html'),
        editarPortadaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Editar-Portada-Serie.html'),
        editarSerieDescargaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Editar-Serie-Descarga.html'),
        editarSerieOriginalAzure: resolve(__dirname, 'Views/Interfaces-Azure/Editar-Serie-Original.html'),
        editarUrlAzure: resolve(__dirname, 'Views/Interfaces-Azure/Editar-URL-Serie.html'),
        eliminacionDeSerieGeneralAzure: resolve(__dirname, 'Views/Interfaces-Azure/Eliminación-de-Serie-General.html'),
        exportarIndiceAzure: resolve(__dirname, 'Views/Interfaces-Azure/Exportar-Indice.html'),
        exportarPortadasRegistradasAzure: resolve(__dirname, 'Views/Interfaces-Azure/Exportar-Portadas-Registradas.html'),
        exportarSerieDescargaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Exportar-Serie-Descarga.html'),
        exportarSerieOriginalAzure: resolve(__dirname, 'Views/Interfaces-Azure/Exportar-Serie-Original.html'),
        exportarSeriesRegistradasAzure: resolve(__dirname, 'Views/Interfaces-Azure/Exportar-Series-Registradas.html'),
        exportarUrlSeriesRegistradasAzure: resolve(__dirname, 'Views/Interfaces-Azure/Exportar-URL-Series-Registradas.html'),
        redimensionarIframesRegistradosAzure: resolve(__dirname, 'Views/Interfaces-Azure/Redimensionar-Iframes-Registrados.html'),
        registroNuevaDescargaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro-Nueva-Descarga.html'),
        registroNuevaPortadaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro-Nueva-Portada.html'),
        registroNuevaSerieOriginalAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro-Nueva-Serie-Original.html'),
  registroNuevaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro-Nueva-Serie.html'),
  registroNuevoEnlaceAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro-Nuevo-Enlace.html'),
  registroNuevoIndiceAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro-Nuevo-Indice.html'),
  registroYEditarExcelContenidoAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro&Editar-Excel-Contenido-Serie.html'),
  registroYEditarExcelSerieDescargaAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro&Editar-Excel-Serie-Descarga.html'),
  registroYEditarExcelSerieOriginalAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro&Editar-Excel-Serie-Original.html'),
  registroYEditarExcelUrlAzure: resolve(__dirname, 'Views/Interfaces-Azure/Registro&Editar-Excel-URL-Serie.html'),

  // Interfaces-Cloudflare
  editarContenidoCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Editar-Contenido-Serie.html'),
  editarIndiceCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Editar-Indice.html'),
  editarPortadaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Editar-Portada-Serie.html'),
  editarSerieDescargaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Editar-Serie-Descarga.html'),
  editarSerieOriginalCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Editar-Serie-Original.html'),
  editarUrlCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Editar-URL-Serie.html'),
  eliminacionDeSerieGeneralCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Eliminación-de-Serie-General.html'),
  exportarIndiceCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Exportar-Indice.html'),
  exportarPortadasRegistradasCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Exportar-Portadas-Registradas.html'),
  exportarSerieDescargaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Exportar-Serie-Descarga.html'),
  exportarSerieOriginalCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Exportar-Serie-Original.html'),
  exportarSeriesRegistradasCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Exportar-Series-Registradas.html'),
  exportarUrlSeriesRegistradasCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Exportar-URL-Series-Registradas.html'),
  redimensionarIframesRegistradosCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Redimensionar-Iframes-Registrados.html'),
  registroNuevaDescargaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro-Nueva-Descarga.html'),
  registroNuevaPortadaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro-Nueva-Portada.html'),
  registroNuevaSerieOriginalCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro-Nueva-Serie-Original.html'),
  registroNuevaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro-Nueva-Serie.html'),
  registroNuevoEnlaceCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro-Nuevo-Enlace.html'),
  registroNuevoIndiceCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro-Nuevo-Indice.html'),
  registroYEditarExcelContenidoCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro&Editar-Excel-Contenido-Serie.html'),
  registroYEditarExcelSerieDescargaCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro&Editar-Excel-Serie-Descarga.html'),
  registroYEditarExcelSerieOriginalCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro&Editar-Excel-Serie-Original.html'),
  registroYEditarExcelUrlCloudflare: resolve(__dirname, 'Views/Interfaces-Cloudflare/Registro&Editar-Excel-URL-Serie.html'),

  // Interfaces-Firebase
  editarContenidoFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Editar-Contenido-Serie.html'),
  editarIndiceFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Editar-Indice.html'),
  editarPortadaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Editar-Portada-Serie.html'),
  editarSerieDescargaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Editar-Serie-Descarga.html'),
  editarSerieOriginalFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Editar-Serie-Original.html'),
  editarUrlFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Editar-URL-Serie.html'),
  eliminacionDeSeriesGeneralFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Eliminación-de-Series-General.html'),
  exportarIndiceFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Exportar-Indice.html'),
  exportarPortadasRegistradasFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Exportar-Portadas-Registradas.html'),
  exportarSerieDescargaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Exportar-Serie-Descarga.html'),
  exportarSerieOriginalFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Exportar-Serie-Original.html'),
  exportarSeriesRegistradasFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Exportar-Series-Registradas.html'),
  exportarUrlSeriesRegistradasFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Exportar-URL-Series-Registradas.html'),
  redimensionarIframesRegistradosFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Redimensionar-Iframes-Registrados.html'),
  registroNuevaDescargaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro-Nueva-Descarga.html'),
  registroNuevaPortadaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro-Nueva-Portada.html'),
  registroNuevaSerieOriginalFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro-Nueva-Serie-Original.html'),
  registroNuevaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro-Nueva-Serie.html'),
  registroNuevoEnlaceFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro-Nuevo-Enlace.html'),
  registroNuevoIndiceFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro-Nuevo-Indice.html'),
  registroYEditarExcelContenidoFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro&Editar-Excel-Contenido-Serie.html'),
  registroYEditarExcelSerieDescargaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro&Editar-Excel-Serie-Descarga.html'),
  registroYEditarExcelSerieOriginalFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro&Editar-Excel-Serie-Original.html'),
  registroYEditarExcelUrlFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Registro&Editar-Excel-URL-Serie.html'),
  transferenciaPortadasRegistradasFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Transferencia-Portadas-Registradas.html'),
  transferenciaSerieDescargaFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Transferencia-Serie-Descarga.html'),
  transferenciaSerieOriginalFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Transferencia-Serie-Original.html'),
  transferenciaSeriesRegistradasFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Transferencia-Series-Registradas.html'),
  transferenciaUrlSeriesRegistradasFirebase: resolve(__dirname, 'Views/Interfaces-Firebase/Transferencia-URL-Series-Registradas.html'),

  // Interfaces-Transferencia-Servicios
  transferenciaDeServiciosContenidoSerie: resolve(__dirname, 'Views/Interfaces-Transferencia-Servicios/Transferencia-de-Servicios-Contenido-Serie.html'),
  transferenciaDeServiciosIndice: resolve(__dirname, 'Views/Interfaces-Transferencia-Servicios/Transferencia-de-Servicios-Indice.html'),
  transferenciaDeServiciosPortada: resolve(__dirname, 'Views/Interfaces-Transferencia-Servicios/Transferencia-de-Servicios-Portada.html'),
  transferenciaDeServiciosSerieDescarga: resolve(__dirname, 'Views/Interfaces-Transferencia-Servicios/Transferencia-de-Servicios-Serie-Descarga.html'),
  transferenciaDeServiciosSerieOriginal: resolve(__dirname, 'Views/Interfaces-Transferencia-Servicios/Transferencia-de-Servicios-Serie-Original.html'),
  transferenciaDeServiciosSerieUrl: resolve(__dirname, 'Views/Interfaces-Transferencia-Servicios/Transferencia-de-Servicios-Serie-URL.html'),

  // Views raíz
  buscadorSeriesPortadas: resolve(__dirname, 'Views/Buscador-Series-Portadas.html'),
  generadorReproductorSerieHtml: resolve(__dirname, 'Views/Generador-Reproductor-Serie-HTML.html'),
  vistaPreviaEpisodio: resolve(__dirname, 'Views/Vista-Previa-Episodio.html')
      }
    }
  }
});