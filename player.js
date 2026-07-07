let activePlayerIndex = null;

function openPlayerModal(i) {
  activePlayerIndex = i;
  const p             = state.assigned[i];
  const isGhost       = p.alive === false;
  const isQuarantined = !!state.quarantined[i];

  document.getElementById('pm-icon').textContent = p.icon;
  document.getElementById('pm-name').textContent = p.player;

  const badge = document.getElementById('pm-status-badge');
  badge.textContent = isGhost ? 'Ghost' : 'Alive';
  badge.className   = 'pm-status-badge ' + (isGhost ? 'ghost' : 'alive');

  document.getElementById('pm-role-reveal').classList.remove('open');
  document.getElementById('pm-role-toggle').classList.remove('open');
  document.getElementById('pm-role-toggle')
    .querySelector('span:first-child').textContent = '👁 Show Role Info';

  document.getElementById('pm-role-icon').textContent = p.icon;
  document.getElementById('pm-role-name').textContent = p.role;
  document.getElementById('pm-role-cat').textContent  = p.cat;

  renderRoleHistory(i);

  const toggleBtn   = document.getElementById('pm-toggle-status');
  const toggleLabel = document.getElementById('pm-toggle-label');
  if (isGhost) {
    toggleLabel.textContent = 'Restore to Alive';
    toggleBtn.querySelector('.pab-sub').textContent = 'Bring back into active play';
    toggleBtn.classList.remove('danger');
  } else {
    toggleLabel.textContent = 'Make Ghost';
    toggleBtn.querySelector('.pab-sub').textContent = 'Remove from active play';
    toggleBtn.classList.add('danger');
  }

  const quarantineBtn   = document.getElementById('pm-quarantine');
  const quarantineLabel = document.getElementById('pm-quarantine-label');
  if (quarantineBtn) {
    quarantineBtn.style.display = isGhost ? 'none' : 'flex';
    quarantineLabel.textContent = isQuarantined ? 'Remove Quarantine' : 'Quarantine Player';
    quarantineBtn.querySelector('.pab-sub').textContent = isQuarantined
      ? 'Remove grey quarantine overlay'
      : 'Add grey quarantine overlay';
  }

  const taxBtn = document.getElementById('pm-tax-target');
  if (taxBtn) {
    if (p.id === 'tax-collector' && !isGhost) {
      taxBtn.style.display = 'flex';
      const target     = state.taxCollectorTargets[i];
      const targetName = target !== undefined ? state.assigned[target]?.player : 'None';
      document.getElementById('pm-tax-label').textContent = 'Set Target';
      taxBtn.querySelector('.pab-sub').textContent = 'Currently: ' + targetName;
    } else {
      taxBtn.style.display = 'none';
    }
  }

  const weaverBtn = document.getElementById('pm-weaver-assign');
  if (weaverBtn) {
    weaverBtn.style.display = (p.id === 'weaver' && !isGhost) ? 'flex' : 'none';
  }

  const knightBtn = document.getElementById('pm-knight-select');
  if (knightBtn) {
    if (p.id === 'knight' && !isGhost) {
      knightBtn.style.display = 'flex';
      const currentTarget = state.knightTargets[activePlayerIndex];
      const targetName    = currentTarget !== undefined
        ? state.assigned[currentTarget]?.player : 'None';
      document.getElementById('pm-knight-label').textContent = 'Set Knight Target';
      knightBtn.querySelector('.pab-sub').textContent = 'Currently watching: ' + targetName;
    } else {
      knightBtn.style.display = 'none';
    }
  }

  const matchmakerBtn = document.getElementById('pm-matchmaker-set');
  if (matchmakerBtn) {
    if (p.id === 'matchmaker' && !isGhost) {
      matchmakerBtn.style.display = 'flex';
      matchmakerBtn.querySelector('.pab-sub').textContent =
        state.lovers.length === 2
          ? (state.assigned[state.lovers[0]]?.player || '?') + ' & ' +
            (state.assigned[state.lovers[1]]?.player || '?')
          : 'No lovers set';
    } else {
      matchmakerBtn.style.display = 'none';
    }
  }

  const killBtn = document.getElementById('pm-kill');
  if (killBtn) {
    killBtn.style.display = isGhost ? 'none' : 'flex';
  }

  const monkBtn    = document.getElementById('pm-monk-protect');
  const monkInGame = getRolesInGame().includes('monk');
  if (monkBtn) {
    const isMonkPlayer = p.id === 'monk';
    monkBtn.style.display = (monkInGame && !isMonkPlayer && !isGhost) ? 'flex' : 'none';
    if (monkInGame && !isMonkPlayer && !isGhost) {
      const isProtected = state.monkProtected === i;
      const monkLabel   = document.getElementById('pm-monk-label');
      const monkSub     = monkBtn.querySelector('.pab-sub');
      if (isProtected) {
        monkLabel.textContent = 'Remove Monk Protection';
        monkSub.textContent   = 'Player is currently protected';
        monkBtn.classList.add('monk-active');
      } else {
        monkLabel.textContent = 'Mark as Monk Protected';
        monkSub.textContent   = 'Survives their first execution';
        monkBtn.classList.remove('monk-active');
      }
    }
  }

  const farmerBtn    = document.getElementById('pm-farmer-select');
  const farmerInGame = getRolesInGame().includes('farmer');
  const isFarmer     = p.id === 'farmer';
  if (farmerBtn) {
    farmerBtn.style.display = (farmerInGame && isFarmer && !isGhost) ? 'flex' : 'none';
    if (farmerInGame && isFarmer && !isGhost) {
      const currentTarget = state.farmerSelections[i];
      const farmerLabel   = document.getElementById('pm-farmer-label');
      const farmerSub     = farmerBtn.querySelector('.pab-sub');
      if (currentTarget !== undefined) {
        const targetName = state.assigned[currentTarget].player;
        farmerLabel.textContent = 'Change Farmer Selection';
        farmerSub.textContent   = 'Currently watching: ' + targetName;
        farmerBtn.classList.add('farmer-active');
      } else {
        farmerLabel.textContent = 'Select Farmer Target';
        farmerSub.textContent   = 'Choose a player to watch';
        farmerBtn.classList.remove('farmer-active');
      }
    }
  }

  document.getElementById('modal-player').classList.add('open');
}

function renderRoleHistory(i) {
  const p         = state.assigned[i];
  const historyEl = document.getElementById('pm-role-history');
  const lines     = [];

  if (p.id === 'monk') {
    if (p.monkProtectedHistory && p.monkProtectedHistory.length > 0) {
      p.monkProtectedHistory.forEach(name => {
        lines.push({ icon: '😇', text: 'Protected ' + name, faded: true });
      });
    }
    if (state.monkProtected !== null && state.monkProtected !== undefined) {
      const targetName = state.assigned[state.monkProtected]?.player;
      if (targetName) lines.push({ icon: '😇', text: 'Protecting ' + targetName, faded: false });
    }
  }

  if (p.id === 'farmer') {
    if (p.farmerWatchHistory && p.farmerWatchHistory.length > 0) {
      p.farmerWatchHistory.forEach(name => {
        lines.push({ icon: '🌾', text: 'Watched ' + name, faded: true });
      });
    }
    const currentTarget = state.farmerSelections[i];
    if (currentTarget !== undefined) {
      const targetName = state.assigned[currentTarget]?.player;
      if (targetName) lines.push({ icon: '🌾', text: 'Watching ' + targetName, faded: false });
    }
  }

  if (!historyEl) return;
  historyEl.innerHTML = '';
  if (lines.length === 0) { historyEl.style.display = 'none'; return; }
  historyEl.style.display = 'block';
  lines.forEach(line => {
    const row = document.createElement('div');
    row.className = 'role-history-row' + (line.faded ? ' faded' : '');
    row.innerHTML =
      '<span class="rh-icon">' + line.icon + '</span>' +
      '<span class="rh-text">' + escHtml(line.text) + '</span>';
    historyEl.appendChild(row);
  });
}

function closePlayerModal() {
  document.getElementById('modal-player').classList.remove('open');
  document.getElementById('pm-role-reveal').classList.remove('open');
  document.getElementById('pm-role-toggle').classList.remove('open');
  activePlayerIndex = null;
}

function toggleRoleReveal() {
  const reveal = document.getElementById('pm-role-reveal');
  const toggle = document.getElementById('pm-role-toggle');
  const isOpen = reveal.classList.contains('open');
  reveal.classList.toggle('open', !isOpen);
  toggle.classList.toggle('open', !isOpen);
  toggle.querySelector('span:first-child').textContent =
    isOpen ? '👁 Show Role Info' : '🙈 Hide Role Info';
}

function togglePlayerStatus() {
  if (activePlayerIndex === null) return;
  const p        = state.assigned[activePlayerIndex];
  const wasAlive = p.alive !== false;
  p.alive        = wasAlive ? false : true;

  if (wasAlive && p.id === 'monk' && state.monkProtected !== null) {
    const targetName = state.assigned[state.monkProtected]?.player;
    if (targetName) {
      if (!p.monkProtectedHistory) p.monkProtectedHistory = [];
      p.monkProtectedHistory.push(targetName);
    }
    state.monkProtected = null;
  }

  if (wasAlive && p.id === 'farmer') {
    const target = state.farmerSelections[activePlayerIndex];
    if (target !== undefined) {
      const targetName = state.assigned[target]?.player;
      if (targetName) {
        if (!p.farmerWatchHistory) p.farmerWatchHistory = [];
        p.farmerWatchHistory.push(targetName);
      }
      delete state.farmerSelections[activePlayerIndex];
    }
  }

  saveState();
  openPlayerModal(activePlayerIndex);
  renderArena();
}

function toggleMonkProtection() {
  if (activePlayerIndex === null) return;
  if (state.monkProtected === activePlayerIndex) {
    state.monkProtected = null;
  } else {
    if (state.monkProtected !== null) {
      const monkPlayer = state.assigned.find(p => p.id === 'monk');
      if (monkPlayer) {
        const oldTargetName = state.assigned[state.monkProtected]?.player;
        if (oldTargetName) {
          if (!monkPlayer.monkProtectedHistory) monkPlayer.monkProtectedHistory = [];
          monkPlayer.monkProtectedHistory.push(oldTargetName);
        }
      }
    }
    state.monkProtected = activePlayerIndex;
  }
  saveState();
  openPlayerModal(activePlayerIndex);
  renderArena();
}

function openFarmerTargetPicker() {
  if (activePlayerIndex === null) return;
  const picker = document.getElementById('modal-farmer-picker');
  const list   = document.getElementById('farmer-picker-list');
  list.innerHTML = '';

  state.assigned.forEach((p, i) => {
    if (i === activePlayerIndex) return;
    if (p.alive === false) return;
    const isCurrentTarget = state.farmerSelections[activePlayerIndex] === i;
    const row = document.createElement('button');
    row.className = 'farmer-pick-row' + (isCurrentTarget ? ' selected' : '');
    row.innerHTML =
      '<span class="fp-icon">' + p.icon + '</span>' +
      '<span class="fp-name">' + escHtml(p.player) + '</span>' +
      (isCurrentTarget ? '<span class="fp-check">✓</span>' : '');
    row.onclick = () => selectFarmerTarget(i);
    list.appendChild(row);
  });

  picker.classList.add('open');
}

function selectFarmerTarget(targetIndex) {
  if (activePlayerIndex === null) return;
  const farmer = state.assigned[activePlayerIndex];
  const prev   = state.farmerSelections[activePlayerIndex];

  if (prev !== undefined && prev !== targetIndex) {
    const prevName = state.assigned[prev]?.player;
    if (prevName) {
      if (!farmer.farmerWatchHistory) farmer.farmerWatchHistory = [];
      farmer.farmerWatchHistory.push(prevName);
    }
  }

  state.farmerSelections[activePlayerIndex] = targetIndex;
  saveState();
  closeFarmerTargetPicker();
  openPlayerModal(activePlayerIndex);
  renderArena();
}

function closeFarmerTargetPicker() {
  document.getElementById('modal-farmer-picker').classList.remove('open');
}

function openKnightTargetPicker() {
  if (activePlayerIndex === null) return;
  const picker = document.getElementById('modal-knight-picker');
  const list   = document.getElementById('knight-picker-list');
  list.innerHTML = '';

  state.assigned.forEach((p, i) => {
    if (i === activePlayerIndex) return;
    if (p.alive === false) return;
    const isCurrentTarget = state.knightTargets[activePlayerIndex] === i;
    const row = document.createElement('button');
    row.className = 'farmer-pick-row' + (isCurrentTarget ? ' selected' : '');
    row.innerHTML =
      '<span class="fp-icon">' + p.icon + '</span>' +
      '<span class="fp-name">' + escHtml(p.player) + '</span>' +
      (isCurrentTarget ? '<span class="fp-check">✓</span>' : '');
    row.onclick = () => selectKnightTarget(i);
    list.appendChild(row);
  });

  picker.classList.add('open');
}

function selectKnightTarget(targetIndex) {
  if (activePlayerIndex === null) return;
  state.knightTargets[activePlayerIndex] = targetIndex;
  saveState();
  document.getElementById('modal-knight-picker').classList.remove('open');
  openPlayerModal(activePlayerIndex);
  renderArena();
}

function toggleQuarantine(idx) {
  if (state.quarantined[idx]) {
    delete state.quarantined[idx];
  } else {
    state.quarantined[idx] = true;
    checkTaxCollectorReminder(idx);
  }
  saveState();
  closePlayerModal();
  renderArena();
}

function checkTaxCollectorReminder(targetIdx) {
  const collectors = [];
  Object.entries(state.taxCollectorTargets).forEach(([collectorIdx, tIdx]) => {
    if (parseInt(tIdx) === targetIdx) {
      const collector = state.assigned[collectorIdx];
      if (collector && collector.alive !== false) {
        collectors.push(collector.player);
      }
    }
  });
  if (collectors.length > 0) {
    const target = state.assigned[targetIdx];
    showReminder(
      '💰 Tax Collector Reminder',
      collectors.join(', ') + ' chose ' + target.player +
      ' — they are now quarantined. Remember to eliminate them before the next night phase.'
    );
  }
}

function showReminder(title, message) {
  document.getElementById('reminder-title').textContent   = title;
  document.getElementById('reminder-message').textContent = message;
  document.getElementById('reminder-overlay').classList.add('open');
}

function openTaxCollectorPicker(collectorIdx) {
  const list = document.getElementById('tax-picker-list');
  list.innerHTML = '';
  state.assigned.forEach((p, i) => {
    if (i === collectorIdx) return;
    if (p.alive === false) return;
    const current = state.taxCollectorTargets[collectorIdx];
    const row = document.createElement('button');
    row.className = 'farmer-pick-row' + (current === i ? ' selected' : '');
    row.innerHTML =
      '<span class="fp-icon">' + p.icon + '</span>' +
      '<span class="fp-name">'  + escHtml(p.player) + '</span>' +
      (current === i ? '<span class="fp-check">✓</span>' : '');
    row.onclick = () => {
      state.taxCollectorTargets[collectorIdx] = i;
      saveState();
      document.getElementById('tax-picker-overlay').classList.remove('open');
      openPlayerModal(collectorIdx);
      renderArena();
    };
    list.appendChild(row);
  });
  document.getElementById('tax-picker-overlay').classList.add('open');
}

function openWeaverPicker(weaverIdx) {
  const allRoles  = [...ROLES.monster, ...ROLES.minion];
  const inGame    = state.assigned.map(p => p.id);
  const notInGame = allRoles.filter(r => !inGame.includes(r.id));
  const monsters  = notInGame.filter(r => r.cat === 'Monster');
  const minions   = notInGame.filter(r => r.cat === 'Minion');

  const current     = state.weaverAssignments[weaverIdx] || {};
  let pickedMonster = current.monster || null;
  let pickedMinion  = current.minion  || null;

  const overlay = document.getElementById('weaver-picker-overlay');
  const list    = document.getElementById('weaver-picker-list');

  function renderList() {
    list.innerHTML = '<div class="weaver-section-label">Monsters not in game</div>';
    monsters.forEach(r => {
      const sel = pickedMonster && pickedMonster.id === r.id;
      const row = document.createElement('button');
      row.className = 'farmer-pick-row' + (sel ? ' selected' : '');
      row.innerHTML =
        '<span class="fp-icon">' + r.icon + '</span>' +
        '<span class="fp-name">' + escHtml(r.name) + '</span>' +
        (sel ? '<span class="fp-check">✓</span>' : '');
      row.onclick = () => { pickedMonster = r; renderList(); };
      list.appendChild(row);
    });

    const minionHeader = document.createElement('div');
    minionHeader.className = 'weaver-section-label';
    minionHeader.style.marginTop = '10px';
    minionHeader.textContent = 'Minions not in game';
    list.appendChild(minionHeader);

    minions.forEach(r => {
      const sel = pickedMinion && pickedMinion.id === r.id;
      const row = document.createElement('button');
      row.className = 'farmer-pick-row' + (sel ? ' selected' : '');
      row.innerHTML =
        '<span class="fp-icon">' + r.icon + '</span>' +
        '<span class="fp-name">' + escHtml(r.name) + '</span>' +
        (sel ? '<span class="fp-check">✓</span>' : '');
      row.onclick = () => { pickedMinion = r; renderList(); };
      list.appendChild(row);
    });

    document.getElementById('weaver-confirm-btn').disabled =
      !pickedMonster || !pickedMinion;
  }

  renderList();
  document.getElementById('weaver-confirm-btn').onclick = () => {
    state.weaverAssignments[weaverIdx] = { monster: pickedMonster, minion: pickedMinion };
    saveState();
    overlay.classList.remove('open');
    showWeaverReveal(pickedMonster, pickedMinion);
  };
  overlay.classList.add('open');
}

function showWeaverReveal(monster, minion) {
  document.getElementById('wr-monster-icon').textContent = monster.icon;
  document.getElementById('wr-monster-name').textContent = monster.name;
  document.getElementById('wr-minion-icon').textContent  = minion.icon;
  document.getElementById('wr-minion-name').textContent  = minion.name;
  document.getElementById('weaver-reveal-overlay').classList.add('open');
}

function openMatchmakerPicker(matchmakerIdx) {
  const list = document.getElementById('matchmaker-picker-list');
  let picks  = state.lovers.length === 2 ? [...state.lovers] : [];

  function renderList() {
    list.innerHTML = '';
    state.assigned.forEach((p, i) => {
      if (p.alive === false) return;
      const sel = picks.includes(i);
      const row = document.createElement('button');
      row.className = 'farmer-pick-row' + (sel ? ' selected' : '');
      row.innerHTML =
        '<span class="fp-icon">' + p.icon + '</span>' +
        '<span class="fp-name">'  + escHtml(p.player) + '</span>' +
        (sel ? '<span class="fp-check">💘</span>' : '');
      row.onclick = () => {
        if (sel) { picks = picks.filter(x => x !== i); }
        else if (picks.length < 2) { picks.push(i); }
        renderList();
      };
      list.appendChild(row);
    });
    document.getElementById('matchmaker-confirm-btn').disabled = picks.length !== 2;
  }

  renderList();
  document.getElementById('matchmaker-confirm-btn').onclick = () => {
    state.lovers = picks;
    saveState();
    document.getElementById('matchmaker-picker-overlay').classList.remove('open');
    openPlayerModal(matchmakerIdx);
    renderArena();
  };
  document.getElementById('matchmaker-picker-overlay').classList.add('open');
}

function openKillModal(idx) {
  const p = state.assigned[idx];
  document.getElementById('kill-modal-name').textContent = p.player;
  document.getElementById('kill-reminder').style.display = 'none';

  document.getElementById('kill-btn-execute').onclick = () => markPlayerDead(idx, 'executed');
  document.getElementById('kill-btn-kill').onclick    = () => markPlayerDead(idx, 'killed');

  document.getElementById('kill-modal-overlay').classList.add('open');
}

function markPlayerDead(idx, method) {
  state.assigned[idx].alive       = false;
  state.assigned[idx].deathMethod = method;
  delete state.quarantined[idx];
  delete state.taxCollectorTargets[idx];
  if (state.monkProtected === idx) state.monkProtected = null;

  const p = state.assigned[idx];
  if (p.id === 'monk' && state.monkProtected !== null) {
    const targetName = state.assigned[state.monkProtected]?.player;
    if (targetName) {
      if (!p.monkProtectedHistory) p.monkProtectedHistory = [];
      p.monkProtectedHistory.push(targetName);
    }
    state.monkProtected = null;
  }

  if (p.id === 'farmer') {
    const target = state.farmerSelections[idx];
    if (target !== undefined) {
      const targetName = state.assigned[target]?.player;
      if (targetName) {
        if (!p.farmerWatchHistory) p.farmerWatchHistory = [];
        p.farmerWatchHistory.push(targetName);
      }
      delete state.farmerSelections[idx];
    }
  }

  Object.entries(state.knightTargets).forEach(([knightIdx, targetIdx]) => {
    if (parseInt(targetIdx) === idx && method === 'executed') {
      const knight = state.assigned[knightIdx];
      if (knight && knight.alive !== false) {
        state.knightReminderPending = true;
      }
    }
  });

  if (state.lovers.includes(idx)) {
    const otherIdx = state.lovers.find(x => x !== idx);
    const other    = state.assigned[otherIdx];
    if (other && other.alive !== false) {
      showReminder(
        '💘 Lovers — ' + state.assigned[idx].player + ' has died',
        other.player + ' is their lover and must also die. Tap OK then mark them as dead.'
      );
      document.getElementById('reminder-ok-btn').onclick = () => {
        document.getElementById('reminder-overlay').classList.remove('open');
        document.getElementById('reminder-ok-btn').onclick =
          () => document.getElementById('reminder-overlay').classList.remove('open');
        openKillModal(otherIdx);
      };
    }
  }

  saveState();
  document.getElementById('kill-modal-overlay').classList.remove('open');
  closePlayerModal();
  checkEvilWin();
  renderArena();
}

function checkEvilWin() {
  const living = state.assigned.filter(p => p.alive !== false);
  const allEvil = living.length > 0 &&
    living.every(p => p.cat === 'Monster' || p.cat === 'Minion');
  if (allEvil) {
    showReminder(
      '😈 Evil Wins!',
      'All living players are monsters or minions. The village has fallen.'
    );
  }
}
