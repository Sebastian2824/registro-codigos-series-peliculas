// config/env.js
// Carga TODAS las variables de entorno y las expone en window.ENV.
// Se importa como <script type="module"> ANTES de los controladores.

window.ENV = {
  // --- Firebase ---
  VITE_FIREBASE_API_KEY:             import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROYECT_ID:          import.meta.env.VITE_FIREBASE_PROYECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID:              import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID:      import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,

  // --- Cloudflare ---
  VITE_CLOUDFLARE_API_KEY_URL:        import.meta.env.VITE_CLOUDFLARE_API_KEY_URL,

  // --- Google Sheets ---
  VITE_GOOGLESHEETS_API_KEY_URL:       import.meta.env.VITE_GOOGLESHEETS_API_KEY_URL,

  // --- Azure / SQL Server ---
  VITE_AZURE_API_KEY_URL:            import.meta.env.VITE_AZURE_API_KEY_URL,

  // --- Modo ---
  MODE:  import.meta.env.MODE,
  DEV:   import.meta.env.DEV,
  PROD:  import.meta.env.PROD
};

// Evento por si algún controlador quiere esperar explícitamente
window.dispatchEvent(new Event('env-ready'));

console.log('✅ [env.js] Variables de entorno cargadas en window.ENV');