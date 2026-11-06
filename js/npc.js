// ============================================================
// КЛАССЫ NPC
// ============================================================

class NPC {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.life = 15;
        this.name = 'NPC';
        this.icon = '❓';
    }
    
    move() {
        // Идет к лагерю (или центру карты)
        let tx = 30, ty = 30;
        for(let y=0; y<30; y++) for(let x=0; x<30; x++) {
            if(G.map[y][x] && G.map[y][x].build === 'camp') { tx = x; ty = y; }
        }
        if(this.x === tx && this.y === ty) return;
        let path = findPath(this.x, this.y, tx, ty);
        if(path.length > 0) { this.x = path[0].x; this.y = path[0].y; }
    }
    
    tick() {
        this.life--;
        if(this.life <= 0) {
            G.npcs = G.npcs.filter(n => n !== this);
            addLog(`${this.name} ушёл с карты.`);
            return false;
        }
        return true;
    }
    
    interact(pawn) {
        document.getElementById('npc-title').innerText = '🧔 Торговец';
        let html = '<p>Что желаешь, путник?</p>';
        
        html += '<div style="color:var(--accent); margin-bottom:5px; font-weight:bold;">Купить (за 🪙):</div>';
        html += `<button class="btn" onclick="buyRes('wood', 1)" style="width:100%; padding:8px; margin-bottom:5px;">🌲 Дерево (1🪙)</button>`;
        html += `<button class="btn" onclick="buyRes('stone', 2)" style="width:100%; padding:8px; margin-bottom:5px;">🪨 Камень (2🪙)</button>`;
        html += `<button class="btn" onclick="buyRes('meat', 3)" style="width:100%; padding:8px; margin-bottom:5px;">🍖 Мясо (3🪙)</button>`;
        html += `<button class="btn" onclick="buyRes('hide', 4)" style="width:100%; padding:8px; margin-bottom:5px;">🐻 Шкуры (4🪙)</button>`;
        html += `<button class="btn" onclick="buyRes('copper', 5)" style="width:100%; padding:8px; margin-bottom:5px;">🔶 Медь (5🪙)</button>`;
        html += `<button class="btn" onclick="buyRes('herbs', 2)" style="width:100%; padding:8px; margin-bottom:5px;">🌿 Травы (2🪙)</button>`;
        html += `<button class="btn" onclick="buyRes('iron', 8)" style="width:100%; padding:8px; margin-bottom:5px;">⚙️ Железо (8🪙)</button>`;
        
        html += '<div style="color:var(--accent); margin-top:10px; margin-bottom:5px; font-weight:bold;">Продать (за 🪙):</div>';
        html += `<button class="btn" onclick="sellRes('wood', 2)" style="width:100%; padding:8px; margin-bottom:5px;">2🌲 → 1🪙</button>`;
        html += `<button class="btn" onclick="sellRes('stone', 1)" style="width:100%; padding:8px; margin-bottom:5px;">1🪨 → 1🪙</button>`;
        html += `<button class="btn" onclick="sellRes('meat', 1)" style="width:100%; padding:8px; margin-bottom:5px;">1🍖 → 1🪙</button>`;
        html += `<button class="btn" onclick="sellRes('hide', 1)" style="width:100%; padding:8px; margin-bottom:5px;">1🐻 → 2🪙</button>`;
        html += `<button class="btn" onclick="sellRes('copper', 1)" style="width:100%; padding:8px; margin-bottom:5px;">1🔶 → 3🪙</button>`;
        
        document.getElementById('npc-body').innerHTML = html;
        openModal('npc-modal');
    }
}

function buyRes(type, cost) {
    if (G.res.coins >= cost) {
        G.res.coins -= cost;
        G.res[type] += 1;
        showToast("Куплено!", "success");
        updateUI();
    } else showToast("Мало монет!", "danger");
}

function sellRes(type, amount) {
    if (G.res[type] >= amount) {
        G.res[type] -= amount;
        let gain = (type === 'hide') ? 2 : (type === 'copper') ? 3 : 1;
        G.res.coins += gain;
        showToast(`Продано за ${gain}🪙`, "success");
        updateUI();
    } else showToast("Мало ресурсов!", "danger");
}

class Trader extends NPC {
    constructor(x, y) {
        super('trader', x, y);
        this.name = 'Торговец';
        this.icon = '🧔';
    }
    
    interact(pawn) {
        document.getElementById('npc-title').innerText = '🧔 Торговец';
        let html = '<p>Что желаешь, путник?</p>';
        html += `<button class="btn" onclick="npcTrade('wood_to_stone')" style="width:100%; padding:8px; margin-bottom:5px;">Обменять 2🌲 → 1🪨</button>`;
        html += `<button class="btn" onclick="npcTrade('stone_to_wood')" style="width:100%; padding:8px; margin-bottom:5px;">Обменять 1🪨 → 2🌲</button>`;
        html += `<button class="btn" onclick="npcTrade('stone_to_meat')" style="width:100%; padding:8px; margin-bottom:5px;">Обменять 2🪨 → 1🍖</button>`;
        html += `<button class="btn" onclick="npcTrade('meat_to_stone')" style="width:100%; padding:8px; margin-bottom:5px;">Обменять 1🍖 → 2🪨</button>`;
        html += `<button class="btn" onclick="npcTrade('meat_to_copper')" style="width:100%; padding:8px; margin-bottom:5px;">Обменять 3🍖 → 1🔶</button>`;
        html += `<button class="btn" onclick="npcTrade('copper_to_meat')" style="width:100%; padding:8px; margin-bottom:5px;">Обменять 1🔶 → 3🍖</button>`;
        document.getElementById('npc-body').innerHTML = html;
        openModal('npc-modal');
    }
}

class Shaman extends NPC {
    constructor(x, y) {
        super('shaman', x, y);
        this.name = 'Шаман';
        this.icon = '🧙';
    }
    
    interact(pawn) {
        document.getElementById('npc-title').innerText = '🧙 Шаман';
        let html = `<p>Духи шепчут мне о твоих ранах.</p>`;
        html += `<button class="btn" onclick="npcHeal()" style="width:100%; padding:10px; margin-bottom:5px; background:#27ae60;">Вылечить болезни (2🍖)</button>`;
        document.getElementById('npc-body').innerHTML = html;
        openModal('npc-modal');
    }
}

// ============================================================
// СПАВН И ЛОГИКА
// ============================================================

function trySpawnNPC() {
    if (!G.npcs) G.npcs = [];
    if (!G.npcDaysSince) G.npcDaysSince = 0;
    
    G.npcDaysSince++;
    let chance = G.npcDaysSince * 10; // 10% за день
    if (rnd(1, 100) <= chance) {
        let side = rnd(0, 3), ex, ey;
        if (side === 0) { ex = rnd(0,59); ey = 0; }
        else if (side === 1) { ex = rnd(0,59); ey = 59; }
        else if (side === 2) { ex = 0; ey = rnd(0,59); }
        else { ex = 59; ey = rnd(0,59); }
        
        let type = rnd(0, 1) === 0 ? 'trader' : 'shaman';
        let npc = type === 'trader' ? new Trader(ex, ey) : new Shaman(ex, ey);
        G.npcs.push(npc);
        addLog(`✨ На карте появился ${npc.name}!`, false, true);
        G.npcDaysSince = 0;
    }
}

function updateNPCs() {
    if (!G.npcs) return;
    G.npcs.forEach(npc => {
        npc.move();
        npc.tick();
    });
}



function npcHeal() {
    let p = G.pawns[G.activePawnIndex];
    if (G.res.meat < 2) return showToast('Нужно 2🍖!', 'danger');
    G.res.meat -= 2;
    p.hp = Math.min(p.maxHp, p.hp + 3);
    p.diseases = [];
    showToast('Шаман исцелил тебя!', 'success');
    addLog(`${p.name} излечен Шаманом (+3 HP, болезни сняты).`, false, true);
    updateUI();
    document.getElementById('npc-modal').style.display = 'none';
}
