import { ENV } from '../../Config/config.js';

// ===== CONFIGURACIÓN FIREBASE =====
    const firebaseConfig = {
     apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROYECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // ===== DOM ELEMENTS =====
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const correoInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');

    const ventanaRecuperacion = document.getElementById('ventana-recuperacion');
    const forgotLink = document.getElementById('forgotLink');
    const btnCancelarRecuperacion = document.getElementById('btn-cancelar-recuperacion');
    const btnActualizarPassword = document.getElementById('btn-actualizar-password');
    const recuperarCorreo = document.getElementById('recuperar-correo');
    const recuperarFecha = document.getElementById('recuperar-fecha');
    const nuevaPassword = document.getElementById('nueva-password');

    // ===== INICIO DE SESIÓN =====
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = correoInput.value.trim();
      const password = passwordInput.value.trim();

      if (!correo || !password) {
        alert('⚠️ Por favor completa todos los campos.');
        return;
      }

      // Deshabilitar botón para evitar múltiples clics
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

      try {
        const snapshot = await db.collection('usuarios')
          .where('correo', '==', correo)
          .where('contraseña', '==', password)
          .get();

        if (!snapshot.empty) {
          const userId = snapshot.docs[0].id;
          localStorage.setItem('usuarioId', userId);
          alert('✅ Inicio de sesión exitoso');
          window.location.href = '/registro-codigos-series-peliculas/Views/Menu-Principal.html';
        } else {
          alert('❌ Correo o contraseña incorrectos.');
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('⚠️ Error al iniciar sesión. Inténtalo más tarde.');
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
      }
    });

    // ===== RECUPERACIÓN DE CONTRASEÑA =====
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      ventanaRecuperacion.style.display = 'flex';
    });

    btnCancelarRecuperacion.addEventListener('click', () => {
      ventanaRecuperacion.style.display = 'none';
      // Limpiar campos
      recuperarCorreo.value = '';
      recuperarFecha.value = '';
      nuevaPassword.value = '';
    });

    // Cerrar modal al hacer clic fuera
    ventanaRecuperacion.addEventListener('click', (e) => {
      if (e.target === ventanaRecuperacion) {
        btnCancelarRecuperacion.click();
      }
    });

    btnActualizarPassword.addEventListener('click', async () => {
      const correo = recuperarCorreo.value.trim();
      const fecha = recuperarFecha.value.trim();
      const password = nuevaPassword.value.trim();

      if (!correo || !fecha || !password) {
        alert('⚠️ Por favor completa todos los campos.');
        return;
      }

      // Deshabilitar botón
      btnActualizarPassword.disabled = true;
      btnActualizarPassword.textContent = 'Actualizando...';

      try {
        const snapshot = await db.collection('usuarios')
          .where('correo', '==', correo)
          .where('fechaNacimiento', '==', fecha)
          .get();

        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          await docRef.update({ contraseña: password });
          alert('✅ Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
          btnCancelarRecuperacion.click();
        } else {
          alert('❌ Datos incorrectos. Verifica tu correo y fecha de nacimiento.');
        }
      } catch (error) {
        console.error('Error al actualizar contraseña:', error);
        alert('⚠️ Hubo un error. Inténtalo más tarde.');
      } finally {
        btnActualizarPassword.disabled = false;
        btnActualizarPassword.textContent = 'Actualizar';
      }
    });

    // ===== ENTER PARA ENVIAR EN RECUPERACIÓN =====
    document.querySelectorAll('#ventana-recuperacion input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          btnActualizarPassword.click();
        }
      });
    });