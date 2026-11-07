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
    try {
    const names = ["Ратмир", "Ольга", "Илья", "Деяна", "Святозар", "Лада"];
    const traits = ["Силач", "Ловкач", "Умелец", "Стойкий", "Тугодум", "Везунчик"];
    tempPawn = {
        name: names[rnd(0, names.length-1)],
        str: d6(), agi: d6(), craft: d6(), wits: d6(), stam: d6(),
        trait: traits[rnd(0, traits.length-1)],
        hp: 10, maxHp: 10, san: 10, xp: 0, lvl: 0, arrows: 0, weapon: ITEMS['fists'], armorItem: null, x: 15, y: 15,
        diseases: [], active: true, maxArrows: 2
    };
    if(tempPawn.trait === 'Силач') tempPawn.str += 1;
    if(tempPawn.trait === 'Ловкач') tempPawn.agi += 1;
    if(tempPawn.trait === 'Умелец') tempPawn.craft += 1;
    if(tempPawn.trait === 'Стойкий') { tempPawn.san += 2; }
    tempPawn.maxHp = 10 + tempPawn.stam; tempPawn.hp = tempPawn.maxHp; tempPawn.inventory = [];
    
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
    } catch(e) { alert('Ошибка: ' + e.message); }
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
    function setText(id, value) {
        let el = document.getElementById(id);
        if (el) el.innerText = value;
    }
    setText('ui-season', G.season);
    setText('ui-timeofday', (typeof isNight === 'function' && isNight()) ? '🌙' : '☀️');
    setText('ui-round', G.round);
    setText('ui-ap', G.ap);
    setText('ui-steps', (G.enemies.length > 0 || G.inCombat) ? G.combatSteps : 0);
    setText('ui-wood', G.res.wood || 0);
    setText('ui-stone', G.res.stone || 0);
    setText('ui-meat', G.res.meat || 0);
    setText('ui-hide', G.res.hide || 0);
    setText('ui-copper', G.res.copper || 0);
    setText('ui-coins', G.res.coins || 0);
    setText('ui-iron', G.res.iron || 0);
    setText('ui-herbs', G.res.herbs || 0);
    setText('ui-arrows', G.pawns.reduce((sum, p) => sum + (p.arrows || 0), 0));
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
    
    else if(cell.build === 'camp') btn.innerText = "Нанять";
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
    document.getElementById('pc-weap').innerText = p.weapon ? p.weapon.name : 'Кулаки';
    document.getElementById('pc-armor').innerText = p.armorItem ? p.armorItem.defense : 0;
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
