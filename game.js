let timerInterval = null;
let timerSeconds  = 360;
let timerRunning  = false;
let carouselActions = [];
let carouselIndex   = 0;
let tokenSize = 48;
let activeTimerStage = 'day';

/* ── Init ── */
function initGameScreen() {
  updatePhaseLabel();
  renderArena();
  if (state.phase === 'night') {
    setGameBottomState('night-btn');
  } else {
    setGameBottomState('day');
    document.getElementById('start-day-btn').style.display  = 'block';
    document.getElementById('timer-wrap').style.display     = 'none';
    document.getElementById('timer-controls').style.display = 'none';
  }
}

function changeTokenSize(delta) {
  tokenSize = Math.min(80, Math.max(28, tokenSize + delta));
  renderArena();
}

function updatePhaseLabel() {
  const lbl = document.getElementById('phase-label');
  const rnd = document.getElementById('round-label');
  if (state.phase === 'night') {
    lbl.className   = 'phase-label night';
    lbl.textContent = '🌙 Night ' + state.round;
  } else {
    lbl.className   = 'phase-label day';
    lbl.textContent = '☀️ Day ' + state.round;
  }
  rnd.textContent = 'Round ' + state.round;
}

function renderArena() {
  const arena = document.getElementById('arena');
  arena.innerHTML = '';
  const players = state.assigned;
  const n       = players.length;
  if (!n) return;

  const farmerWatching = {};
  Object.entries(state.farmerSelections).forEach(([farmerIdx, targetIdx]) => {
    const farmer = state.assigned[farmerIdx];
    if (!farmer || farmer.alive === false) return;
    if (!farmerWatching[targetIdx]) farmerWatching[targetIdx] = [];
    farmerWatching[targetIdx].push(farmer.player);
  });

  requestAnimationFrame(() => {
    const W  = arena.offsetWidth  || window.innerWidth;
    const H  = arena.offsetHeight || 300;
    const cx = W / 2;
    const cy = H * 0.52;
    const rx = W * 0.40;
    const ry = H * 0.44;

    const startAngle = 210;
    const span       = 240;

    players.forEach((p, i) => {
      const frac     = n === 1 ? 0.5 : i / (n - 1);
      const angleDeg = startAngle - frac * span;
      const angleRad = angleDeg * Math.PI / 180;

      const x = cx + rx * Math.cos(angleRad);
      const y = cy - ry * Math.sin(angleRad);

      const isGhost         = p.alive === false;
      const status          = isGhost ? 'ghost' : 'alive';
      const isMonk          = state.monkProtected === i;
      const farmers         = farmerWatching[i] || [];
      const isFarmerWatched = farmers.length > 0;
      const isQuarantined   = !!state.quarantined[i];

      let teamClass = 'team-good';
      if (p.cat === 'Monster' || p.cat === 'Minion') teamClass = 'team-evil';
      else if (p.cat === 'Outcast')                  teamClass = 'team-outcast';

      const farmerLabel = isFarmerWatched && !isGhost
        ? '<span class="token-farmer-label">' +
            farmers.map(escHtml).join(', ') +
          '</span>'
        : '';

      const token = document.createElement('div');
      token.className = 'player-token ' + status + ' ' + teamClass +
        (isMonk && !isGhost          ? ' monk-protected' : '') +
        (isFarmerWatched && !isGhost ? ' farmer-watched' : '') +
        (isQuarantined               ? ' quarantined'    : '');
      token.style.left = x + 'px';
      token.style.top  = y + 'px';
      token.style.setProperty('--token-size', tokenSize + 'px');
      token.style.setProperty('--token-font', (tokenSize * 0.58) + 'px');

      token.innerHTML =
        '<div class="token-dot">' +
          p.icon +
          '<span class="token-ghost-overlay">👻</span>' +
          (isMonk && !isGhost          ? '<span class="token-halo">😇</span>'       : '') +
          (isFarmerWatched && !isGhost ? '<span class="token-farmer-pip">🌾</span>' : '') +
          '<span class="token-quarantine"></span>' +
        '</div>' +
        '<div class="token-name">' + escHtml(p.player) + '</div>' +
        farmerLabel;

      token.onclick = () => openPlayerModal(i);
      arena.appendChild(token);
    });
  });
}

/* ── Bottom state machine ── */
function setGameBottomState(stateName) {
  document.getElementById('btn-night-phase').style.display = 'none';
  document.getElementById('night-carousel').classList.remove('open');
  document.getElementById('day-bottom').classList.remove('open');

  if (stateName === 'night-btn') {
    document.getElementById('btn-night-phase').style.display = 'block';
  } else if (stateName === 'carousel') {
    document.getElementById('night-carousel').classList.add('open');
  } else if (stateName === 'day') {
    document.getElementById('day-bottom').classList.add('open');
  }
}

/* ── Night carousel ── */
function openNightCarousel() {
  carouselActions = buildNightActions(state.round === 1);

  if (state.knightReminderPending) {
    carouselActions.splice(1, 0, {
      id:    'knight-reminder',
      icon:  '⚔️',
      title: 'Wake the Knight',
      desc:  'A player chosen by a Knight was executed last round. Wake the Knight now to take their action.'
    });
    state.knightReminderPending = false;
    saveState();
  }

  carouselIndex = 0;
  state.phase   = 'night';
  saveState();
  updatePhaseLabel();
  renderCarouselDots();
  renderCarouselCard();
  setGameBottomState('carousel');
}

function renderCarouselDots() {
  const dots = document.getElementById('carousel-dots');
  dots.innerHTML = '';
  carouselActions.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'carousel-dot' +
      (i === carouselIndex ? ' active' : (i < carouselIndex ? ' done' : ''));
    dots.appendChild(d);
  });
}

function renderCarouselCard() {
  const action = carouselActions[carouselIndex];
  const isLast = carouselIndex === carouselActions.length - 1;

  document.getElementById('cc-icon').textContent  = action.icon;
  document.getElementById('cc-title').textContent = action.title;
  document.getElementById('cc-desc').textContent  = action.desc;

  const reminder = document.getElementById('cc-farmer-reminder');
  if (reminder) {
    const isFarmerCard = action.id === 'farmer-acts';
    const isNight3Plus = state.round >= 3;
    if (isFarmerCard && isNight3Plus) {
      const lines = [];
      Object.entries(state.farmerSelections).forEach(([farmerIdx, targetIdx]) => {
        const farmer = state.assigned[farmerIdx];
        const target = state.assigned[targetIdx];
        if (!farmer || !target || farmer.alive === false) return;
        lines.push(farmer.player + ' → tell them ' + target.player + '\'s role');
      });
      if (lines.length > 0) {
        reminder.style.display = 'block';
        reminder.innerHTML =
          '<div class="farmer-reminder-title">🌾 Night ' + state.round + ' Reminder</div>' +
          lines.map(l =>
            '<div class="farmer-reminder-row">' + escHtml(l) + '</div>'
          ).join('');
      } else {
        reminder.style.display = 'none';
      }
    } else {
      reminder.style.display = 'none';
    }
  }

  document.getElementById('carousel-prev').style.display =
    carouselIndex === 0 ? 'none' : 'flex';
  document.getElementById('carousel-next').style.display =
    isLast ? 'none' : 'flex';
  document.getElementById('wake-btn').style.display =
    isLast ? 'block' : 'none';

  renderCarouselDots();
}

function carouselNext() {
  if (carouselIndex < carouselActions.length - 1) {
    carouselIndex++;
    renderCarouselCard();
  }
}

function carouselPrev() {
  if (carouselIndex > 0) {
    carouselIndex--;
    renderCarouselCard();
  }
}

function endNightPhase() {
  state.phase = 'day';
  saveState();
  updatePhaseLabel();
  resetTimer();
  document.getElementById('timer-wrap').style.display     = 'none';
  document.getElementById('timer-controls').style.display = 'none';
  document.getElementById('start-day-btn').style.display  = 'block';
  setGameBottomState('day');
}

/* ── Day timer ── */
function startDayTimer() {
  activeTimerStage = 'day';
  document.getElementById('start-day-btn').style.display  = 'none';
  document.getElementById('extra-timers').style.display   = 'none';
  document.getElementById('timer-wrap').style.display     = 'block';
  document.getElementById('timer-controls').style.display = 'flex';
  document.getElementById('timer-label').textContent      = 'Day Phase Timer';
  timerSeconds = 360;
  timerRunning = true;
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!timerRunning) return;
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-display').textContent = '0:00';
      document.getElementById('extra-timers').style.display = 'flex';
    }
  }, 1000);
}

function startExtraTimer(seconds) {
  activeTimerStage = seconds === 120 ? '2min' : '1min';
  document.getElementById('extra-timers').style.display   = 'none';
  document.getElementById('timer-wrap').style.display     = 'block';
  document.getElementById('timer-controls').style.display = 'flex';
  document.getElementById('timer-label').textContent      =
    seconds === 120 ? '2 Minute Timer' : '1 Minute Timer';
  timerSeconds = seconds;
  timerRunning = true;
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!timerRunning) return;
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timer-display').textContent = '0:00';
      document.getElementById('extra-timers').style.display = 'flex';
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m  = Math.floor(timerSeconds / 60);
  const s  = timerSeconds % 60;
  const el = document.getElementById('timer-display');
  el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  el.className   = 'timer-display' + (timerSeconds <= 60 ? ' urgent' : '');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerSeconds  = 360;
  activeTimerStage = 'day';
  const el  = document.getElementById('timer-display');
  const btn = document.getElementById('pause-btn');
  if (el)  { el.textContent  = '6:00'; el.className = 'timer-display'; }
  if (btn) { btn.textContent = '⏸ Pause'; }
  document.getElementById('extra-timers').style.display  = 'none';
  document.getElementById('timer-label').textContent     = 'Day Phase Timer';
}

function clearTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 360;
}

function triggerNextNight() {
  clearTimer();
  state.round++;
  state.phase = 'night';
  saveState();
  updatePhaseLabel();
  setGameBottomState('night-btn');
}

function completeTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  if (activeTimerStage === 'day') {
    document.getElementById('extra-timers').style.display = 'none';
    startExtraTimer(120);
  } else if (activeTimerStage === '2min') {
    document.getElementById('extra-timers').style.display = 'none';
    startExtraTimer(60);
  } else if (activeTimerStage === '1min') {
    document.getElementById('timer-display').textContent  = '0:00';
    document.getElementById('extra-timers').style.display = 'flex';
  }
}

function pauseTimer() {
  timerRunning = !timerRunning;
  document.getElementById('pause-btn').textContent =
    timerRunning ? '⏸ Pause' : '▶ Resume';
}
