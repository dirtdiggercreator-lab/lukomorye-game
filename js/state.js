let G = { 
    diff: 'normal', round: 1, ap: 3, season: 'Весна', 
    res: { wood: 15, stone: 15, meat: 5, hide: 0, copper: 5 },
    pawns: [], enemies: [], npcs: [], map: [],
    buildMode: null, buildCost: {w:0, s:0, turns:0},
    inCombat: false, activeEnemy: null, activePawnIndex: 0, combatSteps: 0,
    fledThisCombat: false, npcDaysSince: 0, pendingStandardSpawn: false, pendingWheelSpawn: false
};
let logs = [];
let isMoving = false;
// currentScale удалён, теперь camera.zoom
let tempPawn = {};
let currentEnemy = null, currentPawn = null;
