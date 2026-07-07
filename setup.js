/* ── Home ── */
function startNewGame() {
  clearSavedState();
  resetState();
  clearTimer();
  renderPlayerList();
  showScreen('screen-players');
}

function continueGame() {
  showScreen('screen-game');
  initGameScreen();
}

/* ── Players ── */
function addPlayer() {
  const inp  = document.getElementById('player-input');
  const name = inp.value.trim();
  if (!name || state.players.length >= 18) { inp.value = ''; return; }

  // Duplicate name check
  const duplicate = state.players.some(
    p => p.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    showNameError('A player named "' + escHtml(name) + '" already exists.');
    return;
  }

  state.players.push(name);
  inp.value = '';
  inp.focus();
  hideNameError();
  renderPlayerList();
}

function showNameError(msg) {
  let err = document.getElementById('player-name-error');
  if (!err) {
    err = document.createElement('p');
    err.id = 'player-name-error';
    err.style.cssText = 'color:#e94560;font-size:.85rem;margin:-8px 0 8px;';
    const addRow = document.querySelector('#screen-players .add-row');
    addRow.insertAdjacentElement('afterend', err);
  }
  err.textContent = msg;
}

function hideNameError() {
  const err = document.getElementById('player-name-error');
  if (err) err.textContent = '';
}

function removePlayer(i) {
  state.players.splice(i, 1);
  renderPlayerList();
}

function renderPlayerList() {
  const list = document.getElementById('player-list');
  list.innerHTML = '';
  state.players.forEach((name, i) => {
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML =
      '<span class="player-num">' + (i + 1) + '.</span>' +
      '<span class="player-name-text">' + escHtml(name) + '</span>' +
      '<button class="remove-btn" onclick="removePlayer(' + i + ')">✕</button>';
    list.appendChild(div);
  });
  document.getElementById('select-roles-wrap').style.display =
    state.players.length >= 2 ? 'block' : 'none';
}

/* ── Role screen navigation ── */
function goToMonster()     { buildSingleGrid('monster');   updateCounter('monster');  showScreen('screen-monster');  }
function goToMinion()      { buildMultiGrid('minion');     updateCounter('minion');   showScreen('screen-minion');   }
function goToOutcast()     { buildMultiGrid('outcast');    updateCounter('outcast');  showScreen('screen-outcast');  }
function goToVillager()    { buildMultiGrid('villager');   updateCounter('villager'); showScreen('screen-villager'); }
function goBackToPlayers() { showScreen('screen-players'); }

/* ── Single-select grid (monster only) ── */
function buildSingleGrid(type) {
  const grid = document.getElementById(type + '-grid');
  grid.innerHTML = '';
  const sel = state.selections[type];

  ROLES[type].forEach(role => {
    const isSelected = sel.role && sel.role.id === role.id;
    const card = document.createElement('div');
    card.className = 'role-card' + (isSelected ? ' selected' : '');
    card.id = 'card-' + type + '-' + role.id;
    card.innerHTML =
      '<div class="card-top">' +
        '<span class="role-icon">' + role.icon + '</span>' +
        '<div class="role-info">' +
          '<div class="role-name">' + role.name + '</div>' +
          '<div class="role-range">' + role.note + '</div>' +
        '</div>' +
        '<span class="role-count-badge" id="cd-' + type + '-' + role.id + '">' +
          (isSelected ? '×' + sel.count : '') +
        '</span>' +
      '</div>';
    card.onclick = () => selectSingleRole(type, role);
    grid.appendChild(card);
  });

  refreshSingleCountArea(type);
}

function selectSingleRole(type, role) {
  const sel = state.selections[type];
  if (!sel.role || sel.role.id !== role.id) sel.count = role.min;
  sel.role = role;

  if (type === 'monster') {
    state.selections.loneWolf = (role.id === 'alpha-wolf') ? 1 : 0;
  }

  document.querySelectorAll('#' + type + '-grid .role-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('card-' + type + '-' + role.id);
  if (card) card.classList.add('selected');

  refreshSingleCountArea(type);
  updateCounter(type);
  updateSingleCountDisplay(type);

  const btn = document.getElementById('btn-' + type + '-next');
  if (btn) btn.disabled = false;
}

function refreshSingleCountArea(type) {
  const area = document.getElementById(type + '-count-area');
  const sel  = state.selections[type];
  if (!sel || !sel.role) { if (area) area.style.display = 'none'; return; }
  area.style.display = 'block';

  document.getElementById(type + '-selected-panel').innerHTML =
    '<span class="sp-icon">' + sel.role.icon + '</span>' +
    '<div class="sp-info">' +
      '<div class="sp-name">' + sel.role.name + '</div>' +
      '<div class="sp-count">×' + sel.count + ' in game</div>' +
    '</div>';

  document.getElementById(type + '-count-val').textContent = sel.count;
  updateSingleCountBtns(type);
}

function changeCount(type, delta) {
  const sel      = state.selections[type];
  const newVal   = sel.count + delta;
  const maxAllow = Math.min(
    sel.role.max,
    state.players.length - (totalAssigned() - assignedCountSingle(type))
  );
  if (newVal < sel.role.min || newVal > maxAllow) return;
  sel.count = newVal;
  refreshSingleCountArea(type);
  updateCounter(type);
  updateSingleCountDisplay(type);
}

function updateSingleCountBtns(type) {
  const sel      = state.selections[type];
  const maxAllow = Math.min(
    sel.role.max,
    state.players.length - (totalAssigned() - assignedCountSingle(type))
  );
  document.getElementById(type + '-dec').disabled = sel.count <= sel.role.min;
  document.getElementById(type + '-inc').disabled = sel.count >= maxAllow;
}

function updateSingleCountDisplay(type) {
  const sel = state.selections[type];
  document.querySelectorAll('#' + type + '-grid .role-card').forEach(c => {
    const rid  = c.id.replace('card-' + type + '-', '');
    const cdEl = document.getElementById('cd-' + type + '-' + rid);
    if (!cdEl) return;
    cdEl.textContent = (sel.role && sel.role.id === rid) ? '×' + sel.count : '';
  });
}

/* ── Multi-select grid (minion / outcast / villager) ── */
function buildMultiGrid(type) {
  const grid = document.getElementById(type + '-grid');
  grid.innerHTML = '';
  const mSel = state.selections[type];

  ROLES[type].forEach(role => {
    const isSelected = !!mSel[role.id];
    const count      = mSel[role.id] || role.min;
    const card = document.createElement('div');
    card.className = 'role-card' + (isSelected ? ' multi-selected' : '');
    card.id = 'mcard-' + type + '-' + role.id;
    card.innerHTML =
      '<div class="card-top">' +
        '<span class="role-icon">' + role.icon + '</span>' +
        '<div class="role-info">' +
          '<div class="role-name">' + role.name + '</div>' +
          '<div class="role-range">' + role.note + '</div>' +
        '</div>' +
        '<span class="role-count-badge" id="mcd-' + type + '-' + role.id + '">' +
          (isSelected ? '×' + count : '') +
        '</span>' +
      '</div>' +
      '<div class="inline-count" id="mic-' + type + '-' + role.id + '">' +
        '<button class="ic-btn" id="mdec-' + type + '-' + role.id + '" ' +
          'onclick="changeMultiCount(\'' + type + '\',\'' + role.id + '\',-1);event.stopPropagation()">−</button>' +
        '<span class="ic-val" id="mval-' + type + '-' + role.id + '">' + count + '</span>' +
        '<button class="ic-btn" id="minc-' + type + '-' + role.id + '" ' +
          'onclick="changeMultiCount(\'' + type + '\',\'' + role.id + '\',1);event.stopPropagation()">+</button>' +
        '<span class="ic-label">in game</span>' +
      '</div>';
    card.onclick = () => toggleMultiRole(type, role);
    grid.appendChild(card);
  });

  updateMultiNextBtn(type);
}

function toggleMultiRole(type, role) {
  const mSel = state.selections[type];
  if (mSel[role.id]) {
    delete mSel[role.id];
    document.getElementById('mcard-' + type + '-' + role.id).classList.remove('multi-selected');
    document.getElementById('mcd-'   + type + '-' + role.id).textContent = '';
  } else {
    const remaining = state.players.length - totalAssigned();
    if (remaining < role.min) return;
    mSel[role.id] = role.min;
    document.getElementById('mcard-' + type + '-' + role.id).classList.add('multi-selected');
    document.getElementById('mcd-'   + type + '-' + role.id).textContent = '×' + role.min;
    document.getElementById('mval-'  + type + '-' + role.id).textContent = role.min;
  }
  updateMultiCountBtns(type, role.id);
  updateCounter(type);
  updateMultiNextBtn(type);
}

function changeMultiCount(type, roleId, delta) {
  const mSel = state.selections[type];
  if (!mSel[roleId]) return;
  const role     = ROLES[type].find(r => r.id === roleId);
  const newVal   = mSel[roleId] + delta;
  const maxAllow = Math.min(
    role.max,
    state.players.length - (totalAssigned() - mSel[roleId])
  );
  if (newVal < role.min || newVal > maxAllow) return;
  mSel[roleId] = newVal;
  document.getElementById('mval-' + type + '-' + roleId).textContent = newVal;
  document.getElementById('mcd-'  + type + '-' + roleId).textContent = '×' + newVal;
  updateMultiCountBtns(type, roleId);
  updateCounter(type);
}

function updateMultiCountBtns(type, roleId) {
  const mSel = state.selections[type];
  if (!mSel[roleId]) return;
  const role     = ROLES[type].find(r => r.id === roleId);
  const maxAllow = Math.min(
    role.max,
    state.players.length - (totalAssigned() - mSel[roleId])
  );
  document.getElementById('mdec-' + type + '-' + roleId).disabled = mSel[roleId] <= role.min;
  document.getElementById('minc-' + type + '-' + roleId).disabled = mSel[roleId] >= maxAllow;
}

function updateMultiNextBtn(type) {
  // Minion and outcast are optional so Next is always enabled
  // Villager requires at least one selection
  const btn = document.getElementById('btn-' + type + '-next');
  if (!btn) return;
  if (type === 'villager') {
    btn.disabled = Object.keys(state.selections.villager).length === 0;
  }
}

/* ── These are kept for the monster count panel ── */
function buildVillagerGrid() { buildMultiGrid('villager'); }
function changeVillagerCount(roleId, delta) { changeMultiCount('villager', roleId, delta); }
function updateVillagerCountBtns(roleId) { updateMultiCountBtns('villager', roleId); }
function updateVillagerNextBtn() { updateMultiNextBtn('villager'); }

/* ── Summary ── */
function goToSummary() {
  const total     = state.players.length;
  const assigned  = totalAssigned();
  const remaining = total - assigned;
  const list      = document.getElementById('summary-list');
  const sub       = document.getElementById('summary-subtitle');

  sub.textContent = assigned + ' of ' + total + ' roles assigned' +
    (remaining > 0 ? ' — ' + remaining + ' will be plain Villagers' : ' ✓');

  list.innerHTML = '';
  const catClass = {
    Monster:  'cat-monster',
    Minion:   'cat-minion',
    Outcast:  'cat-outcast',
    Villager: 'cat-villager',
  };

  // Monster (single select)
  const monSel = state.selections.monster;
  if (monSel && monSel.role) {
    const cls = catClass[monSel.role.cat] || '';
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.innerHTML =
      '<span class="summary-icon">' + monSel.role.icon + '</span>' +
      '<div class="summary-info">' +
        '<div class="summary-role">' + monSel.role.name + '</div>' +
        '<div class="summary-cat ' + cls + '">' + monSel.role.cat + '</div>' +
      '</div>' +
      '<span class="summary-count">×' + monSel.count + '</span>';
    list.appendChild(div);
  }

  if (state.selections.loneWolf) {
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.innerHTML =
      '<span class="summary-icon">🌕</span>' +
      '<div class="summary-info">' +
        '<div class="summary-role">Lone Wolf</div>' +
        '<div class="summary-cat cat-monster">Monster — auto-added</div>' +
      '</div>' +
      '<span class="summary-count">×1</span>';
    list.appendChild(div);
  }

  // Minion + outcast (multi select)
  ['minion', 'outcast'].forEach(type => {
    const mSel = state.selections[type];
    ROLES[type].forEach(role => {
      if (!mSel[role.id]) return;
      const cls = catClass[role.cat] || '';
      const div = document.createElement('div');
      div.className = 'summary-item';
      div.innerHTML =
        '<span class="summary-icon">' + role.icon + '</span>' +
        '<div class="summary-info">' +
          '<div class="summary-role">' + role.name + '</div>' +
          '<div class="summary-cat ' + cls + '">' + role.cat + '</div>' +
        '</div>' +
        '<span class="summary-count">×' + mSel[role.id] + '</span>';
      list.appendChild(div);
    });
  });

  // Villager (multi select)
  const vSel = state.selections.villager;
  ROLES.villager.forEach(role => {
    if (!vSel[role.id]) return;
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.innerHTML =
      '<span class="summary-icon">' + role.icon + '</span>' +
      '<div class="summary-info">' +
        '<div class="summary-role">' + role.name + '</div>' +
        '<div class="summary-cat cat-villager">Villager</div>' +
      '</div>' +
      '<span class="summary-count">×' + vSel[role.id] + '</span>';
    list.appendChild(div);
  });

  if (remaining > 0) {
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.style.opacity = '.5';
    div.innerHTML =
      '<span class="summary-icon">🏡</span>' +
      '<div class="summary-info">' +
        '<div class="summary-role">Villager</div>' +
        '<div class="summary-cat cat-villager">Auto-filled</div>' +
      '</div>' +
      '<span class="summary-count">×' + remaining + '</span>';
    list.appendChild(div);
  }

  showScreen('screen-summary');
}

/* ── Assign roles ── */
function assignRoles() {
  const pool = [];

  const monSel = state.selections.monster;
  if (monSel && monSel.role) {
    for (let i = 0; i < monSel.count; i++)
      pool.push({ id: monSel.role.id, role: monSel.role.name, icon: monSel.role.icon, cat: monSel.role.cat });
  }

  if (state.selections.loneWolf)
    pool.push({ id: 'lone-wolf', role: 'Lone Wolf', icon: '🌕', cat: 'Monster' });

  ['minion', 'outcast'].forEach(type => {
    const mSel = state.selections[type];
    ROLES[type].forEach(role => {
      if (!mSel[role.id]) return;
      for (let i = 0; i < mSel[role.id]; i++)
        pool.push({ id: role.id, role: role.name, icon: role.icon, cat: role.cat });
    });
  });

  const vSel = state.selections.villager;
  ROLES.villager.forEach(role => {
    if (!vSel[role.id]) return;
    for (let i = 0; i < vSel[role.id]; i++)
      pool.push({ id: role.id, role: role.name, icon: role.icon, cat: role.cat });
  });

  while (pool.length < state.players.length)
    pool.push({ id: 'villager', role: 'Villager', icon: '🏡', cat: 'Villager' });

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  state.assigned = state.players.map((name, i) => ({
    player: name,
    id:     pool[i].id,
    role:   pool[i].role,
    icon:   pool[i].icon,
    cat:    pool[i].cat,
    alive:  true,
  }));

  saveState();
  renderShowRoles();
  showScreen('screen-showroles');
}

/* ── Show roles ── */
function renderShowRoles() {
  const list = document.getElementById('show-roles-list');
  list.innerHTML = '';
  state.assigned.forEach((entry, i) => {
    const div = document.createElement('div');
    div.className = 'show-role-item';
    div.innerHTML =
      '<span class="sri-icon">' + entry.icon + '</span>' +
      '<div class="sri-info">' +
        '<div class="sri-player">' + escHtml(entry.player) + '</div>' +
        '<div class="sri-role">Tap to reveal role</div>' +
      '</div>' +
      '<span class="sri-arrow">›</span>';
    div.onclick = () => revealRole(i);
    list.appendChild(div);
  });
}

function revealRole(i) {
  const e = state.assigned[i];
  document.getElementById('reveal-icon').textContent   = e.icon;
  document.getElementById('reveal-player').textContent = e.player;
  document.getElementById('reveal-role').textContent   = e.role;
  document.getElementById('reveal-cat').textContent    = e.cat;
  showScreen('screen-reveal');
}

/* ── Start modal ── */
function openStartModal()  { document.getElementById('modal-start').classList.add('open');    }
function closeStartModal() { document.getElementById('modal-start').classList.remove('open'); }

function confirmStartGame() {
  closeStartModal();
  state.gameInProgress = true;
  state.round = 1;
  state.phase = 'night';
  document.getElementById('btn-continue').style.display = 'flex';
  saveState();
  initGameScreen();
  showScreen('screen-game');
}
