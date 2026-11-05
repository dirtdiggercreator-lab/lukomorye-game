function setupGen(diff) {
    G.diff = diff;
    closeModal('diff-modal');
    openModal('gen-modal');
    document.getElementById('btn-roll').style.display = 'block';
    document.getElementById('btn-accept').style.display = 'none';
    document.getElementById('btn-reroll').style.display = 'none';
    document.getElementById('gen-name').innerText = '-';
    ['str', 'agi', 'craft', 'wits', 'trait'].forEach(f => document.getElementById('gen-' + f).innerText = '-');
}

function rollStats() {
    const names = ["Ратмир", "Ольга", "Илья", "Деяна", "Святозар", "Лада"];
    const traits = ["Силач", "Ловкач", "Умелец", "Стойкий", "Тугодум", "Везунчик"];
    tempPawn = {
        name: names[rnd(0, names.length-1)],
        str: d6(), agi: d6(), craft: d6(), wits: d6(), stam: d6(),
        trait: traits[rnd(0, traits.length-1)],
        hp: 10, maxHp: 10, san: 10, xp: 0, lvl: 0, arrows: 0, weapon: 'fists', armor: 0, x: 15, y: 15,
        diseases: [], active: true, maxArrows: 2
    };
    if(tempPawn.trait === 'Силач') tempPawn.str += 1;
    if(tempPawn.trait === 'Ловкач') tempPawn.agi += 1;
    if(tempPawn.trait === 'Умелец') tempPawn.craft += 1;
    if(tempPawn.trait === 'Стойкий') { tempPawn.san += 2; }
    tempPawn.maxHp = 10 + tempPawn.stam; tempPawn.hp = tempPawn.maxHp;
    
    document.getElementById('gen-name').innerText = tempPawn.name;
    document.getElementById('gen-str').innerText = tempPawn.str;
    document.getElementById('gen-agi').innerText = tempPawn.agi;
    document.getElementById('gen-craft').innerText = tempPawn.craft;
    document.getElementById('gen-wits').innerText = tempPawn.wits;
    document.getElementById('gen-stam').innerText = tempPawn.stam;
    document.getElementById('gen-trait').innerText = tempPawn.trait;
    
    document.getElementById('btn-roll').style.display = 'none';
    document.getElementById('btn-accept').style.display = 'block';
    document.getElementById('btn-reroll').style.display = 'block';
}

function renderPawnBar() {
    let bar = document.getElementById('pawn-bar');
    if (!bar) return;
    bar.innerHTML = '';
    G.pawns.forEach((p, i) => {
        if(p.x === -1 || p.hp <= 0) return; 
        let d = document.createElement('div');
        d.className = `pawn-icon ${i === G.activePawnIndex ? 'active' : ''}`;
        d.innerHTML = `🧑‍🌾 <span class="pawn-hp">${p.hp}</span>`;
        if(p.xp >= getNeededXp(p.lvl) && p.lvl < getMaxLevel()) {
            d.innerHTML += `<span class="pawn-lvl-up">+</span>`;
        }
        d.onclick = () => { G.activePawnIndex = i; renderPawnBar(); openPawnCard(); };
        bar.appendChild(d);
    });
}

function updateUI() {
    let se = document.getElementById('ui-season');
    if (se) se.innerText = G.season;
    document.getElementById('ui-round').innerText = G.round;
    document.getElementById('ui-ap').innerText = G.ap;
    document.getElementById('ui-steps').innerText = (G.enemies.length > 0 || G.inCombat) ? G.combatSteps : 0;
    document.getElementById('ui-wood').innerText = G.res.wood;
    document.getElementById('ui-stone').innerText = G.res.stone;
    document.getElementById('ui-meat').innerText = G.res.meat;
    document.getElementById('ui-hide').innerText = G.res.hide;
    document.getElementById('ui-copper').innerText = G.res.copper;
    document.getElementById('ui-arrows').innerText = G.pawns.reduce((sum, p) => sum + (p.arrows || 0), 0);
    updateSmartButton();
}

function updateSmartButton() {
    let p = G.pawns[G.activePawnIndex];
    if(!p || p.x === -1) return;
    let cell = G.map[p.y][p.x];
    let btn = document.getElementById('btn-smart');
    if (!btn) return;
    if(G.inCombat) { btn.innerText = "В БОЮ"; return; }
    if(cell.type === 'forest') btn.innerText = "Действия (Лес)";
    else if(cell.type === 'water') btn.innerText = "Действия (Вода)";
    else if(cell.type === 'mountain') btn.innerText = "Действия (Горы)";
    else if(cell.build === 'lazaret' && cell.progress >= 2) btn.innerText = "Лечиться (1🍖)";
    else if((cell.build === 'camp') || (cell.build === 'houses' && cell.progress >= 2)) btn.innerText = "Нанять";
    else if(cell.type === 'grass' && !cell.build) btn.innerText = "Строить / Отдых";
    else btn.innerText = "Отдых";
}

function openPawnCard() {
    let p = G.pawns[G.activePawnIndex];
    if(!p) return;
    document.getElementById('pc-name').innerText = p.name;
    document.getElementById('pc-hp').innerText = p.hp;
    document.getElementById('pc-san').innerText = p.san;
    document.getElementById('pc-xp').innerText = p.xp;
    document.getElementById('pc-lvl').innerText = p.lvl;
    document.getElementById('pc-arr').innerText = p.arrows;
    document.getElementById('pc-weap').innerText = (WEAPONS[p.weapon] || WEAPONS['fists']).name;
    document.getElementById('pc-armor').innerText = p.armor;
    document.getElementById('pc-stam').innerText = p.stam || 0;
    document.getElementById('pc-trait').innerText = p.trait;
    if(p.xp >= getNeededXp(p.lvl) && p.lvl < getMaxLevel()) document.getElementById('btn-levelup').style.display = 'block';
    else document.getElementById('btn-levelup').style.display = 'none';
    openModal('pawn-card-modal');
}

function levelUp() {
    let p = G.pawns[G.activePawnIndex];
    if (!p) return;
    p.lvl++; p.xp = 0; p.str += 1; p.agi += 1;
    addLog(`${p.name} достиг ${p.lvl} уровня! (+1 Сила, +1 Ловкость)`, false, true);
    closeModal('pawn-card-modal');
    updateUI(); renderPawnBar();
}
