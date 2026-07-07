const ROLES = {
  monster: [
    { id:'alpha-wolf', name:'Alpha Wolf', icon:'🐺', cat:'Monster', min:1, max:1, note:'1 + Lone Wolf' },
    { id:'vampire',    name:'Vampire',    icon:'🧛', cat:'Monster', min:1, max:3, note:'1–3' },
    { id:'blob',       name:'The Blob',   icon:'🟢', cat:'Monster', min:2, max:3, note:'2–3, no minions' },
    { id:'zombie',     name:'Zombie',     icon:'🧟', cat:'Monster', min:1, max:1, note:'1' },
  ],
  minion: [
    { id:'snatcher',      name:'Snatcher',      icon:'🪤', cat:'Minion', min:1, max:2, note:'1–2' },
    { id:'tax-collector', name:'Tax Collector',  icon:'💰', cat:'Minion', min:1, max:3, note:'1–3' },
  ],
  outcast: [
    { id:'liar',       name:'Liar',       icon:'🎭', cat:'Outcast', min:1, max:2, note:'1–2' },
    { id:'matchmaker', name:'Matchmaker', icon:'💘', cat:'Outcast', min:1, max:2, note:'1–2' },
    { id:'tanner',     name:'Tanner',     icon:'🪵', cat:'Outcast', min:1, max:2, note:'1–2' },
  ],
  villager: [
    { id:'butcher',    name:'Butcher',    icon:'🔪', cat:'Villager', min:1, max:2, note:'1–2' },
    { id:'cobbler',    name:'Cobbler',    icon:'👞', cat:'Villager', min:1, max:4, note:'1–4' },
    { id:'farmer',     name:'Farmer',     icon:'🌾', cat:'Villager', min:1, max:3, note:'1–3' },
    { id:'fishmonger', name:'Fishmonger', icon:'🐟', cat:'Villager', min:1, max:4, note:'1–4' },
    { id:'hero',       name:'Hero',       icon:'🦸', cat:'Villager', min:1, max:2, note:'1–2' },
    { id:'hunter',     name:'Hunter',     icon:'🏹', cat:'Villager', min:1, max:2, note:'1–2' },
    { id:'knight',     name:'Knight',     icon:'⚔️', cat:'Villager', min:1, max:2, note:'1–2' },
    { id:'mason',      name:'Mason',      icon:'🧱', cat:'Villager', min:1, max:4, note:'1–4' },
    { id:'monk',       name:'Monk',       icon:'🧘', cat:'Villager', min:1, max:2, note:'1–2' },
    { id:'seer',       name:'Seer',       icon:'🔮', cat:'Villager', min:1, max:2, note:'1–2' },
    { id:'weaver',     name:'Weaver',     icon:'🕸️', cat:'Villager', min:1, max:2, note:'1–2' },
  ],
};

function getRolesInGame() {
  return state.assigned.map(p => p.id);
}

function buildNightActions(isFirstNight) {
  const assigned = state.assigned;

  const hasRole = (id) => assigned.some(p => p.alive !== false && p.id === id);

  const monsterIds = ['alpha-wolf', 'vampire', 'blob', 'zombie'];
  const minionIds  = ['snatcher', 'tax-collector'];

  const livingMonsters = assigned.filter(p => p.alive !== false && monsterIds.includes(p.id));
  const livingMinions  = assigned.filter(p => p.alive !== false && minionIds.includes(p.id));

  const hasAlphaWolf = hasRole('alpha-wolf');
  const hasLoneWolf  = hasRole('lone-wolf');

  const actions = [];

  // ── Always first ──
  actions.push({
    id: 'sleep',
    icon: '😴', title: 'Put Players to Sleep',
    desc: 'Ask all players to close their eyes and put their heads down.'
  });

  if (isFirstNight) {

    // Monsters wake and learn each other
    if (livingMonsters.length > 0 || hasLoneWolf) {
      let desc;
      if (hasAlphaWolf && hasLoneWolf) {
        desc = 'Wake all monsters. Alpha Wolf will see Lone Wolf but Lone Wolf will NOT see Alpha Wolf. All other monsters see each other normally.';
      } else if (livingMonsters.length > 1) {
        desc = 'Ask all monsters to open their eyes and look around.';
      } else {
        desc = 'Ask the monster to open their eyes.';
      }
      actions.push({ id: 'monsters-wake', icon: '😈', title: 'Wake Monsters', desc });
    }

    // Monsters learn minions
    if (livingMonsters.length > 0 && livingMinions.length > 0) {
      actions.push({
        id: 'monsters-learn-minions',
        icon: '🤝', title: 'Monsters Learn Minions',
        desc: 'Point to each minion so the monsters can learn who they are.'
      });
    }

    // Minions learn monsters — Lone Wolf is excluded
    if (livingMinions.length > 0) {
      actions.push({
        id: 'minions-wake',
        icon: '🪤', title: 'Wake Minions',
        desc: hasLoneWolf
          ? 'Ask all minions to open their eyes. Point to each monster except Lone Wolf.'
          : 'Ask all minions to open their eyes. Point to each monster.'
      });
    }

    // Tax Collector
    if (hasRole('tax-collector')) {
      actions.push({
        id: 'tax-collector-acts',
        icon: '💰', title: 'Tax Collector Chooses',
        desc: 'Wake Tax Collector(s). Ask each to point to a player. Mark their target in the app.'
      });
    }

    // Farmer
    if (hasRole('farmer')) {
      actions.push({
        id: 'farmer-acts',
        icon: '🌾', title: 'Farmers Choose',
        desc: 'Wake Farmer(s). Ask each to point to a player they will learn about on Night 3.'
      });
    }

    // Monk
    if (hasRole('monk')) {
      actions.push({
        id: 'monk-acts',
        icon: '🧘', title: 'Monks Choose',
        desc: 'Wake Monk(s). Ask each to point to a player to protect tonight.'
      });
    }

    // Knight
    if (hasRole('knight')) {
      actions.push({
        id: 'knight-acts',
        icon: '⚔️', title: 'Knights Choose',
        desc: 'Wake Knight(s). Ask each to point to a player to protect.'
      });
    }

    // Fishmonger
    if (hasRole('fishmonger')) {
      actions.push({
        id: 'fishmonger-acts',
        icon: '🐟', title: 'Fishmonger Acts',
        desc: 'Wake Fishmonger(s). Ask each to point to two players. Give a yes or no answer.'
      });
    }

    // Weaver
    if (hasRole('weaver')) {
      actions.push({
        id: 'weaver-acts',
        icon: '🕸️', title: 'Weaver Receives Info',
        desc: 'Wake Weaver(s). Show each one monster and one minion not in the game. Tap a Weaver token to assign their roles.'
      });
    }

    // Matchmaker
    if (hasRole('matchmaker')) {
      actions.push({
        id: 'matchmaker-acts',
        icon: '💘', title: 'Matchmaker Sets Lovers',
        desc: 'Wake Matchmaker(s). Ask them to point to two players to become lovers. Mark them in the app.'
      });
    }

  } else {
    // ── Night 2+ ──

    // Monsters raise hands (recurring)
    actions.push({
      id: 'monsters-check',
      icon: '😈', title: 'Monsters Raise Hands',
      desc: 'Ask all monsters to raise their hand. Check for any new monsters and update their characters in the app.'
    });

    // Seer announcement (recurring)
    if (hasRole('seer')) {
      actions.push({
        id: 'seer-acts',
        icon: '🔮', title: 'Seer Announcement',
        desc: 'Make the Seer announcement to the table.'
      });
    }

    // Fishmonger (recurring)
    if (hasRole('fishmonger')) {
      actions.push({
        id: 'fishmonger-acts',
        icon: '🐟', title: 'Fishmonger Acts',
        desc: 'Wake Fishmonger(s). Ask each to point to two players. Give a yes or no answer.'
      });
    }

    // Monk (recurring)
    if (hasRole('monk')) {
      actions.push({
        id: 'monk-acts',
        icon: '🧘', title: 'Monks Choose',
        desc: 'Wake Monk(s). Ask each to point to a player to protect tonight.'
      });
    }

    // Knight (recurring)
    if (hasRole('knight')) {
      actions.push({
        id: 'knight-acts',
        icon: '⚔️', title: 'Knights Choose',
        desc: 'Wake Knight(s). Ask each to point to a player to protect.'
      });
    }

    // Night 3+: Farmers learn
    if (state.round >= 3 && hasRole('farmer')) {
      actions.push({
        id: 'farmer-acts',
        icon: '🌾', title: 'Farmers Learn',
        desc: 'Wake Farmer(s). Inform each farmer of the character of the player they chose.'
      });
    }

    // Night 4+: Liar gets new character
    if (state.round >= 4 && hasRole('liar')) {
      actions.push({
        id: 'liar-acts',
        icon: '🎭', title: 'Liar Gets New Character',
        desc: 'Wake Liar(s). Assign each a new character card to bluff with.'
      });
    }

    // Created characters this round
    const newThisRound = assigned.filter(p =>
      p.alive !== false && p.createdOnRound === state.round
    );
    newThisRound.forEach(p => {
      if (p.id === 'farmer' && state.round >= 3) {
        actions.push({
          id: 'new-farmer-acts',
          icon: '🌾', title: 'New Farmer Chooses & Learns',
          desc: p.player + ' became a Farmer this round. Ask them to choose a player — then immediately tell them that player\'s character.'
        });
      }
      if (p.id === 'weaver') {
        actions.push({
          id: 'new-weaver-acts',
          icon: '🕸️', title: 'New Weaver Receives Info',
          desc: p.player + ' became a Weaver this round. Show them one monster and one minion not in the game.'
        });
      }
      if (p.id === 'matchmaker' && state.lovers.length === 0) {
        actions.push({
          id: 'new-matchmaker-acts',
          icon: '💘', title: 'New Matchmaker Sets Lovers',
          desc: p.player + ' became a Matchmaker this round. Ask them to choose two players as lovers.'
        });
      }
    });
  }

  // ── Always last ──
  actions.push({
    id: 'wake-all',
    icon: '☀️', title: 'Wake Everyone',
    desc: 'Ask all players to open their eyes.'
  });

  return actions;
}
