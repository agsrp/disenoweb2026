/**
 * SISTEMA DE CONTROL DE ASISTENCIA Y SEGUIMIENTO PEDAGÓGICO
 * Curso de Diseño Web 2026 — Prof. Agustín R. Pérez
 * 
 * Sincronización en tiempo real con Google Sheets vía Google Apps Script Webhook.
 */

(function () {
  const STORAGE_KEYS = {
    PROFILE: 'dw_student_profile_2026',
    WEBHOOK: 'dw_sheets_webhook_url_2026',
    HISTORY: 'dw_student_history_2026',
    QUEUE: 'dw_offline_sync_queue_2026'
  };

  // URL por defecto (puede ser configurada por el docente desde la interfaz)
  const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbz4DnM33HiQijb02muthAn9Lgf_D4lLkcXpBtTXrd8iwo1W_nfhePww_251dSUjy6Zf/exec';

  // 1. GESTIÓN DEL PERFIL DEL ALUMNO
  function getStudentProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStudentProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    updateStudentNavbarBadge();
    // Enviar evento de inicio/actualización
    recordActivity('registro_perfil', {
      mensaje: 'Perfil de alumno registrado/actualizado',
      clase: getCurrentClassLabel()
    });
  }

  function getWebhookUrl() {
    const stored = localStorage.getItem(STORAGE_KEYS.WEBHOOK);
    if (!stored || stored === '') {
      localStorage.setItem(STORAGE_KEYS.WEBHOOK, DEFAULT_WEBHOOK_URL);
      return DEFAULT_WEBHOOK_URL;
    }
    return stored;
  }

  function setWebhookUrl(url) {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK, url.trim());
  }

  function getCurrentClassLabel() {
    // Detectar clase actual desde URL o título
    const match = window.location.pathname.match(/clase_(\d+)\.html/);
    if (match) {
      return `Clase ${match[1].padStart(2, '0')}`;
    }
    return 'Portal Principal';
  }

  // 2. ENLACE Y SINCRONIZACIÓN CON GOOGLE SHEETS
  async function sendPayloadToSheets(payload) {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
      console.log('📌 [Tracker Docente] Webhook no configurado aún. Guardado localmente:', payload);
      return false;
    }

    try {
      // Usar mode: 'no-cors' para Google Apps Script
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log('✅ [Tracker Docente] Registro enviado a Google Sheets exitosamente.');
      return true;
    } catch (err) {
      console.warn('⚠️ [Tracker Docente] Sin conexión, guardando en cola offline:', err);
      enqueueOffline(payload);
      return false;
    }
  }

  function enqueueOffline(payload) {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
      queue.push(payload);
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    } catch (e) {}
  }

  async function flushOfflineQueue() {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) return;

    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUEUE) || '[]');
      if (queue.length === 0) return;

      console.log(`🔄 [Tracker Docente] Sincronizando ${queue.length} registros pendientes...`);
      for (const item of queue) {
        await sendPayloadToSheets(item);
      }
      localStorage.setItem(STORAGE_KEYS.QUEUE, '[]');
    } catch (e) {}
  }

  // 3. REGISTRAR ACTIVIDAD (PUNTO DE ENTRADA PRINCIPAL)
  window.recordActivity = function (tipo, data = {}) {
    const profile = getStudentProfile();
    const totalXP = parseInt(localStorage.getItem('dw_user_xp_2026') || '0', 10);
    const unlockedClasses = JSON.parse(localStorage.getItem('dw_unlocked_classes_2026') || '[]');

    const timestamp = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const payload = {
      timestamp: timestamp,
      dni: profile ? profile.dni : 'ANÓNIMO',
      alumno: profile ? `${profile.apellido}, ${profile.nombre}` : 'Alumno sin registrar',
      email: profile ? profile.email || '' : '',
      tipo: tipo, // 'ingreso_clase', 'codigo_asistencia', 'quiz_completado', 'registro_perfil'
      clase: data.clase || getCurrentClassLabel(),
      detalle: data.detalle || '',
      puntaje: data.puntaje !== undefined ? data.puntaje : '',
      porcentaje: data.porcentaje !== undefined ? data.porcentaje : '',
      xpSumado: data.xpSumado || 0,
      xpTotal: totalXP,
      clasesDesbloqueadas: unlockedClasses.length,
      listaClases: unlockedClasses.join(', '),
      navegador: navigator.userAgent.split(' ')[0]
    };

    // Guardar en historial local
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
      history.push(payload);
      if (history.length > 100) history.shift();
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {}

    // Enviar a la nube
    sendPayloadToSheets(payload);
  };

  // 4. MODAL DE REGISTRO E IDENTIFICACIÓN DEL ALUMNO
  // 4. MODAL DE REGISTRO E IDENTIFICACIÓN DEL ALUMNO (INICIO DE SESIÓN)
  function injectStudentModal() {
    if (document.getElementById('modal-student-profile')) return;

    const modalHTML = `
      <div class="modal-overlay" id="modal-student-profile" onclick="if(event.target.id==='modal-student-profile') closeStudentModal()">
        <div class="modal-window" style="max-width:520px;">
          <div class="modal-top">
            <span class="modal-badge" id="student-modal-badge" style="color:var(--primary); border-color:var(--primary); background:var(--primary-soft);">🔐 ACCESO AL AULA // INICIO DE SESIÓN</span>
            <button class="modal-close" onclick="closeStudentModal()" title="Cerrar ventana [ESC]">✕ Cerrar</button>
          </div>
          
          <div id="student-modal-header">
            <h2 class="modal-title" id="student-modal-title" style="margin-bottom:6px;">Iniciar Sesión de Alumno</h2>
            <p class="modal-lead" id="student-modal-lead" style="margin-bottom:18px;">
              Ingresá tu nombre y DNI para registrar tu asistencia en la planilla docente del <strong>Prof. Agustín R. Pérez</strong>, guardar tus avances y calificaciones en tiempo real.
            </p>
          </div>

          <form id="form-student-reg" onsubmit="handleStudentFormSubmit(event)" style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:var(--text-dim); margin-bottom:5px;">NOMBRE Y APELLIDO *</label>
              <input type="text" id="inp-student-name" required placeholder="Ej: Valentina Morales" style="width:100%; background:var(--elevated); border:1px solid var(--border-hi); color:var(--text); padding:11px 14px; border-radius:var(--radius-sm, 6px); font-size:14.5px; outline:none; font-family:var(--font-sans);" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:var(--text-dim); margin-bottom:5px;">DNI / LEGAJO *</label>
                <input type="text" id="inp-student-dni" required placeholder="Ej: 43890123" style="width:100%; background:var(--elevated); border:1px solid var(--border-hi); color:var(--text); padding:11px 14px; border-radius:var(--radius-sm, 6px); font-size:14.5px; outline:none; font-family:var(--font-sans);" />
              </div>
              <div>
                <label style="display:block; font-size:12px; font-weight:700; color:var(--text-dim); margin-bottom:5px;">EMAIL (OPCIONAL)</label>
                <input type="email" id="inp-student-email" placeholder="alumno@mail.com" style="width:100%; background:var(--elevated); border:1px solid var(--border-hi); color:var(--text); padding:11px 14px; border-radius:var(--radius-sm, 6px); font-size:14.5px; outline:none; font-family:var(--font-sans);" />
              </div>
            </div>

            <!-- Resumen actual si ya tiene perfil -->
            <div id="student-current-stats" style="background:var(--elevated); border:1px solid var(--border); border-radius:var(--radius-sm, 8px); padding:14px; margin-top:4px; display:none;">
              <div style="font-size:11.5px; font-weight:700; color:var(--text-dim); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.04em;">Resumen de tu cuenta</div>
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
                <span style="color:var(--text-dim);">Clases Habilitadas:</span>
                <strong id="stat-clases-val" style="color:var(--lime);">0 / 21</strong>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span style="color:var(--text-dim);">Puntaje de Experiencia:</span>
                <strong id="stat-xp-val" style="color:var(--primary);">0 XP</strong>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:10px; flex-wrap:wrap;">
              <div id="student-guest-wrap">
                <button type="button" onclick="closeStudentModal()" style="background:none; border:none; color:var(--text-muted); font-size:12.5px; cursor:pointer; text-decoration:underline;">Explorar como invitado</button>
              </div>
              <div style="display:flex; gap:8px;">
                <button type="button" id="btn-student-logout" onclick="logoutStudent()" class="cta-btn secondary" style="display:none; padding:10px 14px; font-size:12.5px;">🚪 Cerrar Sesión</button>
                <button type="submit" id="btn-student-submit" class="cta-btn" style="padding:11px 22px; font-size:13.5px;">🚀 Iniciar Sesión</button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL DE CONFIGURACIÓN DOCENTE (GOOGLE SHEETS WEBHOOK) -->
      <div class="modal-overlay" id="modal-teacher-config" onclick="if(event.target.id==='modal-teacher-config') closeTeacherModal()">
        <div class="modal-window" style="max-width:560px;">
          <div class="modal-top">
            <span class="modal-badge" style="color:var(--cyan); border-color:var(--cyan); background:var(--cyan-soft);">PANEL DEL PROFESOR // GOOGLE SHEETS</span>
            <button class="modal-close" onclick="closeTeacherModal()">✕ Cerrar</button>
          </div>
          <h2 class="modal-title" style="margin-bottom:6px;">Conexión con Planilla de Google Sheets</h2>
          <p class="modal-lead" style="margin-bottom:14px;">
            Ingresá la URL del Web App de Google Apps Script para sincronizar las notas y asistencias automáticamente en tu Google Drive.
          </p>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:var(--text-dim); margin-bottom:4px;">URL DE GOOGLE APPS SCRIPT WEB APP</label>
              <input type="url" id="inp-webhook-url" placeholder="https://script.google.com/macros/s/AKfycb.../exec" style="width:100%; background:var(--elevated); border:1px solid var(--border-hi); color:var(--text); padding:10px 12px; border-radius:8px; font-size:13px; font-family:var(--font-mono); outline:none;" />
            </div>

            <div style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap;">
              <button class="cta-btn" onclick="saveWebhookSettings()">Guardar URL de Planilla</button>
              <button class="cta-btn secondary" onclick="testWebhookConnection()">📡 Probar Envío de Prueba</button>
            </div>

            <div id="webhook-test-status" style="font-family:var(--font-mono); font-size:12px; color:var(--text-dim); margin-top:4px;"></div>

            <div style="background:var(--elevated); padding:12px; border-radius:8px; font-size:12px; color:var(--text-dim); line-height:1.45; border-left:3px solid var(--lime); margin-top:6px;">
              <strong>¿No tenés la planilla configurada todavía?</strong><br>
              Revisá el archivo <code>google_sheets_setup.md</code> incluido en el proyecto con el código listo para copiar y pegar en <em>script.google.com</em> en 2 minutos.
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 5. MANEJADORES DE FORMULARIOS Y MODALES
  window.openStudentModal = function () {
    injectStudentModal();
    const profile = getStudentProfile();
    const nameInp = document.getElementById('inp-student-name');
    const dniInp = document.getElementById('inp-student-dni');
    const emailInp = document.getElementById('inp-student-email');
    const statsBox = document.getElementById('student-current-stats');
    const badgeEl = document.getElementById('student-modal-badge');
    const titleEl = document.getElementById('student-modal-title');
    const leadEl = document.getElementById('student-modal-lead');
    const submitBtn = document.getElementById('btn-student-submit');
    const logoutBtn = document.getElementById('btn-student-logout');
    const guestWrap = document.getElementById('student-guest-wrap');

    if (profile) {
      if (nameInp) nameInp.value = `${profile.nombre} ${profile.apellido}`.trim();
      if (dniInp) dniInp.value = profile.dni || '';
      if (emailInp) emailInp.value = profile.email || '';
      if (badgeEl) badgeEl.textContent = '🎓 ACCESO AL AULA // CURSO 2026';
      if (titleEl) titleEl.textContent = `Iniciar Sesión // Hola, ${profile.nombre}`;
      if (leadEl) leadEl.innerHTML = `Confirmá tus datos para registrar tu asistencia en la planilla oficial del <strong>Prof. Agustín R. Pérez</strong>. Si sos otro alumno, podés cambiar los datos abajo.`;
      if (submitBtn) submitBtn.textContent = `🚀 Ingresar como ${profile.nombre}`;
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-flex';
        logoutBtn.textContent = '👤 Cambiar Alumno';
      }
      if (guestWrap) guestWrap.style.display = 'block';

      if (statsBox) {
        statsBox.style.display = 'block';
        const unlocked = JSON.parse(localStorage.getItem('dw_unlocked_classes_2026') || '[]');
        const xp = localStorage.getItem('dw_user_xp_2026') || '0';
        document.getElementById('stat-clases-val').textContent = `${unlocked.length} / 21`;
        document.getElementById('stat-xp-val').textContent = `${xp} XP`;
      }
    } else {
      if (nameInp) nameInp.value = '';
      if (dniInp) dniInp.value = '';
      if (emailInp) emailInp.value = '';
      if (badgeEl) badgeEl.textContent = '🔐 ACCESO AL AULA // INICIO DE SESIÓN';
      if (titleEl) titleEl.textContent = 'Iniciar Sesión de Alumno';
      if (leadEl) leadEl.innerHTML = 'Ingresá tu nombre y DNI para registrar tu asistencia en la planilla del <strong>Prof. Agustín R. Pérez</strong>, guardar tu progreso y desbloquear tus puntos de experiencia.';
      if (submitBtn) submitBtn.textContent = '🚀 Iniciar Sesión e Ingresar';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (statsBox) statsBox.style.display = 'none';
      if (guestWrap) guestWrap.style.display = 'block';
    }

    document.getElementById('modal-student-profile').classList.add('open');
    if (nameInp) setTimeout(() => nameInp.focus(), 150);
  };

  window.closeStudentModal = function () {
    const el = document.getElementById('modal-student-profile');
    if (el) el.classList.remove('open');
  };

  window.continueAsGuest = function () {
    sessionStorage.setItem('dw_session_entered_2026', 'guest');
    closeStudentModal();
    const toast = document.getElementById('xp-toast');
    if (toast) {
      toast.textContent = '👀 Modo invitado activo';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  };

  window.logoutStudent = function () {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    sessionStorage.removeItem('dw_session_entered_2026');
    updateStudentNavbarBadge();
    openStudentModal();
    const toast = document.getElementById('xp-toast');
    if (toast) {
      toast.textContent = '👤 Datos limpios: ingresá tu Nombre y DNI';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1800);
    }
  };

  window.handleStudentFormSubmit = function (e) {
    e.preventDefault();
    const fullName = document.getElementById('inp-student-name').value.trim();
    const dni = document.getElementById('inp-student-dni').value.trim();
    const email = document.getElementById('inp-student-email').value.trim();

    if (!fullName || !dni) {
      alert('Por favor completá tu Nombre y DNI para registrar tu asistencia.');
      return;
    }

    const parts = fullName.split(' ');
    const nombre = parts.slice(0, parts.length > 1 ? parts.length - 1 : 1).join(' ');
    const apellido = parts.length > 1 ? parts[parts.length - 1] : '';

    saveStudentProfile({ nombre, apellido, dni, email });
    sessionStorage.setItem('dw_session_entered_2026', 'true');
    closeStudentModal();

    // Mostrar confirmación
    const toast = document.getElementById('xp-toast');
    if (toast) {
      toast.textContent = `👋 ¡HOLA ${nombre.toUpperCase()}! ASISTENCIA REGISTRADA`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }
  };

  window.openTeacherConfigModal = function () {
    const pass = prompt('🔐 Ingrese la contraseña de docente (Código Maestro):');
    if (!pass) return;
    if (pass.trim().toUpperCase() !== 'PROFE2026') {
      alert('✗ Contraseña incorrecta. Acceso restringido únicamente al profesor.');
      return;
    }
    injectStudentModal();
    const inp = document.getElementById('inp-webhook-url');
    if (inp) inp.value = getWebhookUrl();
    document.getElementById('modal-teacher-config').classList.add('open');
  };

  // Atajo de teclado para el profesor: Ctrl + Shift + P
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'P') {
      e.preventDefault();
      window.openTeacherConfigModal();
    }
  });

  window.closeTeacherModal = function () {
    const el = document.getElementById('modal-teacher-config');
    if (el) el.classList.remove('open');
  };

  window.saveWebhookSettings = function () {
    const val = document.getElementById('inp-webhook-url').value;
    setWebhookUrl(val);
    const status = document.getElementById('webhook-test-status');
    if (status) {
      status.innerHTML = '<span style="color:var(--lime);">✓ URL de Google Apps Script guardada correctamente.</span>';
    }
    flushOfflineQueue();
  };

  window.testWebhookConnection = async function () {
    const status = document.getElementById('webhook-test-status');
    if (status) status.textContent = 'Enviando ping de prueba a Google Sheets...';
    
    const profile = getStudentProfile();
    const ok = await sendPayloadToSheets({
      timestamp: new Date().toLocaleString('es-AR'),
      dni: profile ? profile.dni : 'TEST_DOCENTE',
      alumno: profile ? `${profile.apellido}, ${profile.nombre}` : 'Prof. Agustín R. Pérez (Prueba)',
      email: 'profesor@test.com',
      tipo: 'ping_prueba',
      clase: getCurrentClassLabel(),
      detalle: 'Prueba de conexión desde la plataforma web',
      xpSumado: 10,
      xpTotal: 100,
      clasesDesbloqueadas: 1,
      listaClases: '1'
    });

    if (status) {
      status.innerHTML = '<span style="color:var(--lime); font-weight:700;">✓ Petición enviada. Verificá si apareció la fila en tu Google Sheet.</span>';
    }
  };

  // 6. ACTUALIZAR INSIGNIA EN EL NAVBAR
  function updateStudentNavbarBadge() {
    const navRight = document.querySelector('.navbar .nav-right') || document.querySelector('.nav-right');
    if (!navRight) return;

    let badge = document.getElementById('student-profile-btn');
    if (!badge) {
      badge = document.createElement('button');
      badge.id = 'student-profile-btn';
      badge.className = 'icon-btn';
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '6px';
      badge.style.fontFamily = 'var(--font-sans)';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = '700';
      badge.onclick = () => openStudentModal();
      navRight.prepend(badge);
    }

    const profile = getStudentProfile();
    if (profile) {
      badge.innerHTML = `👤 ${profile.nombre} (${profile.dni})`;
      badge.title = 'Sesión iniciada. Hacé clic para ver tus datos o cambiar de alumno.';
      badge.style.borderColor = 'var(--primary)';
      badge.style.color = 'var(--primary)';
      badge.style.background = 'var(--primary-soft)';
    } else {
      badge.innerHTML = `🔐 Iniciar Sesión`;
      badge.title = 'Hacé clic para ingresar tus datos y registrar tu asistencia';
      badge.style.borderColor = 'var(--accent)';
      badge.style.color = 'var(--accent)';
      badge.style.background = 'var(--accent-soft)';
    }
  }

  // 6b. HAMBURGER BUTTON & MOBILE MENU CONTROLLER
  function ensureMobileHamburger() {
    const navbar = document.querySelector('.navbar');
    const navTabs = document.querySelector('.nav-tabs');
    const navRight = document.querySelector('.nav-right');
    if (!navbar || !navTabs) return;

    // Check if backdrop exists
    let backdrop = document.querySelector('.nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'nav-backdrop';
      backdrop.id = 'nav-backdrop';
      navbar.parentNode.insertBefore(backdrop, navbar.nextSibling);
    }

    // Check if hamburger button exists
    let burger = document.getElementById('nav-hamburger-btn');
    if (!burger) {
      burger = document.createElement('button');
      burger.id = 'nav-hamburger-btn';
      burger.className = 'nav-hamburger-btn';
      burger.setAttribute('aria-label', 'Abrir Menú de Navegación');
      burger.setAttribute('title', 'Menú');
      burger.innerHTML = '☰';
      if (navRight) {
        navRight.appendChild(burger);
      } else {
        navbar.appendChild(burger);
      }
    }

    function toggleMenu(forceClose = false) {
      const isOpen = navTabs.classList.contains('open');
      if (forceClose || isOpen) {
        navTabs.classList.remove('open');
        backdrop.classList.remove('open');
        burger.innerHTML = '☰';
        burger.setAttribute('aria-expanded', 'false');
      } else {
        navTabs.classList.add('open');
        backdrop.classList.add('open');
        burger.innerHTML = '✕';
        burger.setAttribute('aria-expanded', 'true');
      }
    }

    burger.onclick = (e) => {
      e.stopPropagation();
      toggleMenu();
    };

    backdrop.onclick = () => toggleMenu(true);

    // Close menu when clicking any nav item inside navTabs
    navTabs.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, select');
      if (target && target.tagName !== 'SELECT') {
        toggleMenu(true);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navTabs.classList.contains('open')) {
        toggleMenu(true);
      }
    });
  }

  // 7. INICIALIZACIÓN AUTOMÁTICA AL CARGAR LA PÁGINA (INICIO DE SESIÓN AL INGRESAR)
  function initTrackerOnLoad() {
    injectStudentModal();
    updateStudentNavbarBadge();
    ensureMobileHamburger();

    // El inicio de sesión debe aparecer siempre al ingresar a la página web
    const sessionEntered = sessionStorage.getItem('dw_session_entered_2026');

    if (!sessionEntered) {
      setTimeout(() => {
        openStudentModal();
      }, 350);
    } else {
      const profile = getStudentProfile();
      if (profile) {
        recordActivity('ingreso_clase', {
          detalle: `Ingresó a ver los contenidos de ${getCurrentClassLabel()}`
        });
      }
    }

    // Intentar vaciar cola offline
    flushOfflineQueue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTrackerOnLoad);
  } else {
    initTrackerOnLoad();
  }
})();
