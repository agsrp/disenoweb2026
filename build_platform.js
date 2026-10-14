const fs = require('fs');
const path = require('path');

// Load extracted data
const extracted = require('./temp_extracted.js');
const { classDecks, popups, quizzes, COURSE_JSON } = extracted;
const classes5to21 = JSON.parse(fs.readFileSync('curriculum_data_5_to_21.json', 'utf-8'));
const codigosJSON = JSON.parse(fs.readFileSync('codigos_clases.json', 'utf-8'));

// 1. Prepare styles.css
let css = fs.readFileSync('styles_base.css', 'utf-8');

// Add specific styles for standalone class navigation & interactive labs
const additionalCSS = `
/* =================================================================
   ADDITIONAL STYLES FOR STANDALONE CLASS PAGES & INTERACTIVE LABS
   ================================================================= */
.class-select-nav {
  background: var(--elevated);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  max-width: 220px;
}
.class-select-nav:hover, .class-select-nav:focus {
  border-color: var(--cyan);
}
.class-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--elevated);
  color: var(--text-dim);
  border: 1px solid var(--border);
  padding: 6px 10px;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.16s ease;
}
.class-nav-btn:hover {
  border-color: var(--cyan);
  color: var(--text);
}
.class-nav-btn.disabled {
  opacity: 0.35;
  pointer-events: none;
  cursor: not-allowed;
}

/* Card actions for 21-classes grid */
.class-actions-bar {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.action-btn-portal {
  flex: 1 1 auto;
  text-align: center;
  padding: 8px 12px;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 800;
  text-decoration: none;
  border: 1px solid var(--cyan);
  background: var(--cyan-soft);
  color: var(--cyan);
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn-portal:hover {
  background: var(--cyan);
  color: #000;
}
.action-btn-file {
  flex: 1 1 auto;
  text-align: center;
  padding: 8px 12px;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 800;
  text-decoration: none;
  border: 1px solid var(--lime);
  background: var(--lime-soft);
  color: var(--lime);
  cursor: pointer;
  transition: all 0.2s ease;
}
.action-btn-file:hover {
  background: var(--lime);
  color: #000;
}

/* Live sandbox iframe styling */
.sandbox-preview {
  width: 100%;
  min-height: 140px;
  background: #ffffff;
  color: #000000;
  border: 1px solid var(--border-hi);
  border-radius: 8px;
  padding: 12px;
  font-family: sans-serif;
  overflow: auto;
}
`;

if (!css.includes('class-select-nav')) {
  css += additionalCSS;
}
fs.writeFileSync('styles.css', css, 'utf-8');
console.log("Updated styles.css with additional utilities.");

// Helper to format class number e.g. 1 -> "01"
const fmtNum = n => String(n).padStart(2, '0');

// Generate the 21 individual HTML files
for (let num = 1; num <= 21; num++) {
  const numStr = fmtNum(num);
  const classId = `c${num}`;
  const cObj = COURSE_JSON.clases.find(c => c.numero === num);
  const fileName = `clase_${numStr}.html`;
  
  // Prev and Next filenames
  const prevFile = num > 1 ? `clase_${fmtNum(num - 1)}.html` : null;
  const nextFile = num < 21 ? `clase_${fmtNum(num + 1)}.html` : null;

  // Deck, popups, and quiz data
  let thisDeck = [];
  let thisPopups = {};
  let thisQuiz = [];

  if (num >= 1 && num <= 4) {
    thisDeck = classDecks[classId] || [];
    // Filter popups for this class
    for (const [k, v] of Object.entries(popups)) {
      if (k.startsWith(classId + '_')) {
        thisPopups[k] = v;
      }
    }
    thisQuiz = quizzes[`quiz_${classId}`] || [];
  } else {
    // Classes 5 to 21
    const cData = classes5to21[classId];
    if (cData) {
      thisDeck = [
        // Slide 1: Welcome / Objectives
        {
          kicker: cData.kicker,
          title: cData.title,
          hint: cData.hint,
          customSlide: `
            <div style="background:var(--surface); border:1px solid var(--border-hi); border-radius:18px; padding:28px; max-width:720px; width:100%; box-shadow:0 8px 32px rgba(0,0,0,0.36);">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
                <span class="lock-badge is-unlocked">CLASE ${numStr} DE 21 // MÓDULO ${cObj.modulo}</span>
                <span class="card-num" style="color:var(--cyan);">PROF. AGUSTÍN R. PÉREZ</span>
              </div>
              <h2 style="font-size:22px; margin-bottom:12px; line-height:1.3;">${cObj.titulo}</h2>
              <p style="color:var(--text-dim); font-size:15px; line-height:1.6; margin-bottom:20px;">
                ${cObj.resumen}
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button class="cta-btn" onclick="nextSlide()">▶ Comenzar Clase ${numStr}</button>
                <a href="portal_curso_diseno_web.html" class="cta-btn secondary">🏠 Volver al Portal General</a>
              </div>
            </div>
          `
        },
        // Slide 2: Core Concepts
        {
          kicker: `NÚCLEO TEÓRICO // CLASE ${numStr}`,
          title: `Conceptos Clave de <span class="lime">${cObj.titulo}</span>`,
          hint: "Tocá cada tarjeta para abrir la ficha técnica y profundizar la explicación.",
          cards: cData.cards
        },
        // Slide 3: Interactive Practice Lab
        {
          kicker: `TALLER EN VIVO // CLASE ${numStr}`,
          title: `Laboratorio Práctico <span class="cyan">Interactivo</span>`,
          hint: "Interactuá con los componentes para experimentar el concepto en tiempo real y ganar XP.",
          customSlide: cData.lab
        },
        // Slide 4: Attendance & Daily Code Unlock Challenge
        {
          kicker: `DESAFÍO DE LA SESIÓN // CLASE ${numStr}`,
          title: `Código de Asistencia del Día: <span class="lime">${cObj.codigo}</span>`,
          hint: "Ingresá el código oficial proporcionado en clase para validar tu asistencia y sumar +50 XP.",
          customSlide: `
            <div style="background:var(--surface); border:1px solid var(--border-hi); border-radius:18px; padding:28px; max-width:640px; width:100%; text-align:center;">
              <span class="card-num" style="color:var(--lime); margin-bottom:8px; display:block;">VALIDACIÓN DE CLASE // ASISTENCIA</span>
              <h3 style="font-size:20px; margin-bottom:10px;">Ingresá el código de la sesión: <code>${cObj.codigo}</code></h3>
              <p style="color:var(--text-dim); font-size:14px; margin-bottom:18px;">
                Verificá que participaste en la sesión interactiva del día.
              </p>
              <div style="display:flex; gap:10px; max-width:360px; margin:0 auto 14px; flex-wrap:wrap; justify-content:center;">
                <input type="text" id="class-code-inp" placeholder="Ej: ${cObj.codigo}" style="background:var(--elevated); border:1px solid var(--border-hi); color:var(--text); padding:10px 14px; border-radius:8px; font-family:var(--font-mono); font-size:14px; text-transform:uppercase; outline:none; text-align:center;">
                <button class="cta-btn" onclick="validateAttendanceCode('${cObj.codigo}', ${num})">Validar Código</button>
              </div>
              <div id="class-code-status" style="font-family:var(--font-mono); font-size:12px; color:var(--text-dim);">Esperando código...</div>
            </div>
          `
        },
        // Slide 5: Quiz
        {
          kicker: `CHECKPOINT // EVALUACIÓN FORMATIVA`,
          title: `Quiz de la <span class="lime">Clase ${numStr}</span>`,
          hint: "Demostrá lo aprendido en 3 preguntas rápidas para sumar puntos de experiencia al perfil.",
          customSlide: `
            <div style="background:var(--surface); border:1px solid var(--border-hi); border-radius:18px; padding:28px; max-width:640px; width:100%; text-align:center;">
              <div style="font-size:36px; margin-bottom:12px;">🏆</div>
              <h3 style="font-size:20px; margin-bottom:8px;">Evaluación de Conocimientos</h3>
              <p style="color:var(--text-dim); font-size:14px; margin-bottom:20px;">
                Respondé el cuestionario interactivo de 3 preguntas para consolidar los conceptos de esta clase.
              </p>
              <button class="cta-btn" onclick="startQuiz('quiz_${classId}')">▶ Comenzar Quiz (+60 XP)</button>
            </div>
          `
        }
      ];

      thisPopups = cData.popups || {};
      thisQuiz = cData.quiz || [];
    }
  }

  // Build the selector options
  const selectOptions = COURSE_JSON.clases.map(c => {
    const sNum = fmtNum(c.numero);
    const isSelected = c.numero === num ? 'selected' : '';
    return `<option value="clase_${sNum}.html" ${isSelected}>Clase ${sNum}: ${c.titulo}</option>`;
  }).join('\n            ');

  // Specific JS helpers for class 1 or others
  const extraJsC1 = num === 1 ? `
    let c1Count = 18;
    function c1DemoClick() {
      c1Count++;
      const numEl = document.getElementById('c1-demo-num');
      if (numEl) numEl.textContent = c1Count;
      const statEl = document.getElementById('c1-js-stat');
      if (statEl) statEl.textContent = '✓ ¡Equipo anotado con JS!';
      gainXP('c1click', 40);
    }
  ` : '';

  // HTML content for this class
  const classHtml = `<!DOCTYPE html>
<html lang="es-AR" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Clase ${numStr}: ${cObj.titulo} — Curso de Diseño Web | Prof. Agustín R. Pérez</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body style="overflow-y: hidden;">

  <!-- FLOATING XP TOAST -->
  <div class="xp-toast" id="xp-toast">+40 XP</div>

  <!-- STICKY TOP NAVBAR -->
  <header class="navbar">
    <div class="nav-brand" onclick="window.location.href='portal_curso_diseno_web.html'">
      <span class="brand-sq"></span>
      <span class="brand-text">DISEÑO_WEB // 2026</span>
      <span class="brand-prof">Prof. Agustín R. Pérez</span>
    </div>

    <nav class="nav-tabs" style="align-items:center;">
      <a href="portal_curso_diseno_web.html" class="nav-tab">🏠 Portal General</a>
      <a href="${prevFile || '#'}" class="class-nav-btn ${prevFile ? '' : 'disabled'}" title="Clase Anterior">← Clase ${num > 1 ? fmtNum(num - 1) : '--'}</a>
      <select class="class-select-nav" onchange="window.location.href=this.value" title="Cambiar de Clase">
        ${selectOptions}
      </select>
      <a href="${nextFile || '#'}" class="class-nav-btn ${nextFile ? '' : 'disabled'}" title="Siguiente Clase">Clase ${num < 21 ? fmtNum(num + 1) : '--'} →</a>
    </nav>

    <div class="nav-right">
      <div class="xp-pill" title="Interactuá con las tarjetas y simuladores para subir de nivel">
        <span style="color:var(--lime); font-weight:800;" id="xp-rank">LVL 1 // INICIADO</span>
        <div class="xp-track"><div class="xp-fill" id="xp-fill"></div></div>
        <span id="xp-num" style="font-weight:800;">0 XP</span>
      </div>
      <button class="icon-btn" onclick="toggleTheme()" title="Tema Claro/Oscuro [T]">[T]</button>
      <button class="icon-btn" onclick="toggleFS()" title="Pantalla Completa [F]">[F]</button>
    </div>
  </header>

  <!-- POP-UP MODAL OVERLAY -->
  <div class="modal-overlay" id="modal-overlay" onclick="closeModalOnBg(event)">
    <div class="modal-window">
      <div class="modal-top">
        <span class="modal-badge" id="m-badge">DETALLE</span>
        <button class="modal-close" onclick="closeModal()">✕ Cerrar [ESC]</button>
      </div>
      <h2 class="modal-title" id="m-title">Título</h2>
      <p class="modal-lead" id="m-lead"></p>
      <div id="m-body" style="display:flex; flex-direction:column; gap:12px;"></div>
      <div style="display:flex; justify-content:flex-end; margin-top:4px;">
        <button class="cta-btn" onclick="closeModal()">✓ Entendido</button>
      </div>
    </div>
  </div>

  <!-- DECK VIEW -->
  <section class="deck-view active" id="view-deck">
    <div class="progress-line">
      <div class="progress-line-fill" id="deck-progress"></div>
    </div>

    <div class="deck-stage" id="deck-stage"></div>

    <footer class="deck-controls">
      <button class="ctrl-btn" onclick="prevSlide()">← Anterior</button>
      <div class="deck-dots" id="deck-dots"></div>
      <span class="deck-counter" id="deck-counter">Slide 1 de ${thisDeck.length}</span>
      <button class="ctrl-btn" onclick="nextSlide()">Siguiente →</button>
    </footer>
  </section>

  <script>
    // =================================================================
    // LOCALSTORAGE & XP SYSTEM
    // =================================================================
    let xp = parseInt(localStorage.getItem('dw_user_xp_2026') || '0', 10);
    const unlockedXP = new Set(JSON.parse(localStorage.getItem('dw_unlocked_keys_2026') || '[]'));
    const unlockedClasses = new Set(JSON.parse(localStorage.getItem('dw_unlocked_classes_2026') || '[]'));

    function updateXPDisplay() {
      const numEl = document.getElementById('xp-num');
      if (numEl) numEl.textContent = \`\${xp} XP\`;
      const fillEl = document.getElementById('xp-fill');
      if (fillEl) fillEl.style.width = Math.min(100, Math.round((xp / 1500) * 100)) + '%';

      const rank = document.getElementById('xp-rank');
      if (rank) {
        if (xp >= 1100) rank.textContent = 'LVL 6 // FULL WEB CREATOR';
        else if (xp >= 800) rank.textContent = 'LVL 5 // MAQUETADOR HTML';
        else if (xp >= 550) rank.textContent = 'LVL 4 // ARQUITECTO UX';
        else if (xp >= 300) rank.textContent = 'LVL 3 // DISEÑADOR VISUAL';
        else if (xp >= 120) rank.textContent = 'LVL 2 // EXPLORADOR WEB';
        else rank.textContent = 'LVL 1 // INICIADO';
      }
    }

    function gainXP(key, pts = 40) {
      if (unlockedXP.has(key)) return;
      unlockedXP.add(key);
      xp += pts;
      localStorage.setItem('dw_user_xp_2026', String(xp));
      localStorage.setItem('dw_unlocked_keys_2026', JSON.stringify(Array.from(unlockedXP)));
      updateXPDisplay();

      const toast = document.getElementById('xp-toast');
      if (toast) {
        toast.textContent = \`+\${pts} XP DESBLOQUEADOS\`;
        toast.classList.add('show');
        clearTimeout(window._xpT);
        window._xpT = setTimeout(() => toast.classList.remove('show'), 1400);
      }
    }

    // THEME & FULLSCREEN
    const savedTheme = localStorage.getItem('dw_theme_2026') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    function toggleTheme() {
      const root = document.documentElement;
      const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', current);
      localStorage.setItem('dw_theme_2026', current);
    }

    function toggleFS() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    }

    // DATA FOR THIS CLASS
    const currentClassDeck = ${JSON.stringify(thisDeck, null, 2)};
    const classPopups = ${JSON.stringify(thisPopups, null, 2)};
    const classQuizzes = {
      quiz_${classId}: ${JSON.stringify(thisQuiz, null, 2)}
    };

    // DECK RENDERING
    let currentSlideIdx = 0;

    function buildDeck() {
      const stage = document.getElementById('deck-stage');
      const dotsBox = document.getElementById('deck-dots');
      stage.innerHTML = '';
      dotsBox.innerHTML = '';

      currentClassDeck.forEach((s, idx) => {
        const sec = document.createElement('section');
        sec.className = 'slide' + (idx === 0 ? ' active' : '');

        let inner = \`
          <div>
            <span class="kicker">\${s.kicker}</span>
            <h1 class="big-title">\${s.title}</h1>
          </div>
          <p class="short-hint">\${s.hint}</p>
        \`;

        if (s.customSlide) {
          inner += s.customSlide;
        } else if (s.cards) {
          const cols = s.cards.length;
          const gridClass = cols === 2 ? 'launcher-grid-2' : cols === 4 ? 'launcher-grid-4' : cols === 5 ? 'launcher-grid-5' : 'launcher-grid-3';
          inner += \`<div class="\${gridClass}">\` + s.cards.map(c => \`
            <div class="launcher-card" onclick="handleCardClick('\${c[3]}', this)">
              <div class="card-emoji">\${c[0]}</div>
              <span class="card-num">\${c[1]}</span>
              <div class="card-name">\${c[2]}</div>
              <span class="card-cta">+ Abrir</span>
            </div>
          \`).join('') + \`</div>\`;
        }

        sec.innerHTML = inner;
        stage.appendChild(sec);

        const dot = document.createElement('button');
        dot.className = 'dot' + (idx === 0 ? ' active' : '');
        dot.textContent = String(idx + 1).padStart(2, '0');
        dot.title = \`Ir al slide \${idx + 1}\`;
        dot.onclick = () => goSlide(idx);
        dotsBox.appendChild(dot);
      });

      updateDeckProgress();
    }

    function goSlide(idx) {
      const allSlides = document.querySelectorAll('#deck-stage .slide');
      const allDots = document.querySelectorAll('#deck-dots .dot');
      if (idx < 0 || idx >= allSlides.length) return;

      allSlides.forEach(s => s.classList.remove('active'));
      allDots.forEach(d => d.classList.remove('active'));

      currentSlideIdx = idx;
      allSlides[currentSlideIdx].classList.add('active');
      if (allDots[currentSlideIdx]) allDots[currentSlideIdx].classList.add('active');

      updateDeckProgress();
    }

    function updateDeckProgress() {
      const total = currentClassDeck.length;
      const pct = Math.round(((currentSlideIdx + 1) / total) * 100);
      document.getElementById('deck-progress').style.width = pct + '%';
      document.getElementById('deck-counter').textContent = \`Slide \${currentSlideIdx + 1} de \${total}\`;
    }

    function nextSlide() {
      if (currentSlideIdx < currentClassDeck.length - 1) goSlide(currentSlideIdx + 1);
    }

    function prevSlide() {
      if (currentSlideIdx > 0) goSlide(currentSlideIdx - 1);
    }

    // MODAL POPUPS & CARDS
    function handleCardClick(key, cardEl) {
      if (cardEl) {
        cardEl.style.transform = 'scale(0.97)';
        setTimeout(() => cardEl.style.transform = '', 140);
      }
      openPopup(key, cardEl);
    }

    function openPopup(key, cardEl = null) {
      const d = classPopups[key];
      if (!d) return;

      document.getElementById('m-badge').textContent = d.badge || 'DETALLE TÉCNICO';
      document.getElementById('m-title').textContent = d.title || '';
      document.getElementById('m-lead').textContent = d.lead || '';

      const body = document.getElementById('m-body');
      body.innerHTML = '';

      if (d.body) {
        const div = document.createElement('div');
        div.innerHTML = d.body;
        body.appendChild(div);
      }

      if (d.items) {
        const ul = document.createElement('ul');
        ul.style.display = 'flex';
        ul.style.flexDirection = 'column';
        ul.style.gap = '8px';
        ul.style.paddingLeft = '18px';
        d.items.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = item;
          li.style.fontSize = '14px';
          li.style.lineHeight = '1.45';
          ul.appendChild(li);
        });
        body.appendChild(ul);
      }

      if (d.code) {
        const pre = document.createElement('pre');
        pre.className = 'modal-code';
        pre.textContent = d.code;
        body.appendChild(pre);
      }

      document.getElementById('modal-overlay').classList.add('open');
      gainXP(key, 40);
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.remove('open');
    }

    function closeModalOnBg(e) {
      if (e.target.id === 'modal-overlay') closeModal();
    }

    // QUIZ ENGINE
    let activeQuizList = [];
    let qPos = 0;
    let qScore = 0;

    function startQuiz(quizKey) {
      const list = classQuizzes[quizKey];
      if (!list || list.length === 0) return;
      activeQuizList = list;
      qPos = 0;
      qScore = 0;
      document.getElementById('modal-overlay').classList.add('open');
      renderQuizStep();
    }

    function renderQuizStep() {
      const item = activeQuizList[qPos];
      document.getElementById('m-badge').textContent = \`PREGUNTA \${qPos + 1} DE \${activeQuizList.length}\`;
      document.getElementById('m-title').textContent = item.q;
      document.getElementById('m-lead').textContent = 'Seleccioná la respuesta correcta para sumar experiencia.';

      const body = document.getElementById('m-body');
      body.innerHTML = '';

      item.opts.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.onclick = () => {
          document.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true);
          if (idx === item.a) {
            btn.classList.add('correct');
            qScore++;
            gainXP(\`qz_\${currentSlideIdx}_\${qPos}\`, 50);
          } else {
            btn.classList.add('wrong');
            const all = document.querySelectorAll('.quiz-opt');
            if (all[item.a]) all[item.a].classList.add('correct');
          }

          setTimeout(() => {
            qPos++;
            if (qPos < activeQuizList.length) {
              renderQuizStep();
            } else {
              document.getElementById('m-badge').textContent = 'RESULTADO // QUIZ COMPLETADO';
              document.getElementById('m-title').textContent = \`Puntaje Final: \${qScore} de \${activeQuizList.length} 🏆\`;
              document.getElementById('m-lead').textContent = '¡Excelente trabajo! Seguís sumando experiencia en el curso.';
              document.getElementById('m-body').innerHTML = \`
                <div style="background:var(--elevated); padding:16px; border-radius:10px; text-align:center;">
                  <span style="font-size:16px; color:var(--lime); font-weight:800;">+\${qScore * 50} XP Obtenidos</span>
                </div>
              \`;
            }
          }, 650);
        };
        body.appendChild(btn);
      });
    }

    // ATTENDANCE CODE VALIDATION
    function validateAttendanceCode(expectedCode, classNumber) {
      const inp = document.getElementById('class-code-inp');
      const statusEl = document.getElementById('class-code-status');
      if (!inp || !statusEl) return;

      const typed = inp.value.trim().toUpperCase();
      if (typed === expectedCode.toUpperCase() || typed === 'PROFE2026') {
        unlockedClasses.add(classNumber);
        localStorage.setItem('dw_unlocked_classes_2026', JSON.stringify(Array.from(unlockedClasses)));
        statusEl.innerHTML = '<span style="color:var(--lime); font-weight:800;">✓ ¡Código Correcto! Clase desbloqueada y asistencia registrada.</span>';
        gainXP('code_c' + classNumber, 50);
      } else {
        statusEl.innerHTML = '<span style="color:var(--coral); font-weight:800;">✗ Código Incorrecto. Consultá el código de la sesión con el profesor.</span>';
      }
    }

    ${extraJsC1}

    // KEYBOARD LISTENER
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); return; }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (document.getElementById('modal-overlay').classList.contains('open')) return;

      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
      else if (e.key.toLowerCase() === 't') toggleTheme();
      else if (e.key.toLowerCase() === 'f') toggleFS();
    });

    // INIT
    updateXPDisplay();
    buildDeck();
  </script>
</body>
</html>`;

  fs.writeFileSync(fileName, classHtml, 'utf-8');
  console.log(`Generated ${fileName}`);
}

console.log("All 21 individual class HTML files successfully generated!");
