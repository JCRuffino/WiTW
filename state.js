let state = {
  players: [],
  selections: {
    monster:  { role: null, count: 1 },
    minion:   {},
    outcast:  {},
    villager: {},
    loneWolf: 0,
  },
  assigned: [],
  gameInProgress: false,
  round: 1,
  phase: 'night',
  monkProtected: null,
  farmerSelections: {}, // key: farmer player index, value: target player index
  knightTargets: {}, // { knightAssignedIndex: targetAssignedIndex }
knightReminderPending: false,
taxCollectorTargets: {},  // { assignedIndex: targetAssignedIndex }
quarantined: {},          // { assignedIndex: true }
lovers: [],               // [indexA, indexB]
weaverAssignments: {},    // { assignedIndex: { monster: roleObj, minion: roleObj } }

};

function resetState() {
  state.players = [];
  state.selections = {
    monster:  { role: null, count: 1 },
    minion:   {},
    outcast:  {},
    villager: {},
    loneWolf: 0,
  };
  state.assigned             = [];
  state.gameInProgress       = false;
  state.round                = 1;
  state.phase                = 'night';
  state.monkProtected        = null;
  state.farmerSelections     = {};
  state.knightTargets        = {};
  state.knightReminderPending = false;
  state.taxCollectorTargets  = {};
  state.quarantined          = {};
  state.lovers               = [];
  state.weaverAssignments    = {};
}


function assignedCountSingle(type) {
  const sel = state.selections[type];
  return (sel && sel.role) ? sel.count : 0;
}

function assignedCountMulti(type) {
  return Object.values(state.selections[type]).reduce((s, c) => s + c, 0);
}

function assignedCountVillager() {
  return assignedCountMulti('villager');
}

function totalAssigned() {
  return assignedCountSingle('monster')  +
         assignedCountMulti('minion')    +
         assignedCountMulti('outcast')   +
         assignedCountMulti('villager')  +
         (state.selections.loneWolf || 0);
}

function updateCounter(type) {
  const el = document.getElementById('counter-' + type);
  if (el) el.textContent = totalAssigned() + '/' + state.players.length;
}

(function init() {
  const restored = loadState();
  if (restored && state.gameInProgress) {
    document.getElementById('btn-continue').style.display = 'flex';
  }
})();

