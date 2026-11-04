import re
import sys

def replace_function(html, func_name, new_body):
    # Ищем начало функции
    pattern = re.compile(r'(async\s+)?function\s+' + func_name + r'\s*\([^)]*\)\s*\{')
    match = pattern.search(html)
    if not match:
        print("FATAL: Function not found:", func_name)
        sys.exit(1)
        
    start_idx = match.start()
    brace_count = 0
    end_idx = -1
    
    # Считаем скобки, чтобы найти конец функции
    for i in range(match.end() - 1, len(html)):
        if html[i] == '{':
            brace_count += 1
        elif html[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1
                break
                
    if end_idx == -1:
        print("FATAL: End not found:", func_name)
        sys.exit(1)
        
    return html[:start_idx] + new_body + html[end_idx:]

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# --- CSS ---
html = html.replace(".tile-ford { background-color: #a4b0be; border: 1px dashed #2980b9; }", ".tile-ford { background-color: #5dade2; border: none; }")
html = html.replace(".explored-fog { background-color: #2f3640 !important; opacity: 0.8; }", ".explored-fog { background-color: rgba(47, 54, 64, 0.6) !important; opacity: 0.8; }")

if ".action-btn" not in html:
    html = html.replace(".btn:active { background: #e67e22; }", ".btn:active { background: #e67e22; }\n.action-btn { width: 100%; padding: 15px; margin-bottom: 8px; font-size: 16px; }")

html = html.replace(".wheel-container { position: relative; width: 150px; height: 150px; margin: 10px auto; }", ".wheel-container { position: relative; width: 150px; height: 150px; margin: 20px auto; flex-shrink: 0; }")
html = html.replace("#wheel-modal .modal-content { height: 420px; display: flex; flex-direction: column; justify-content: space-between; }", "#wheel-modal .modal-content { height: 450px; display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 25px; }")

# --- ФУНКЦИИ ---

spawn_enemy = """function spawnEnemy(x, y, type) {
    let stats = { hp: 5, agi: 3, dmg: 1, armor: 0, icon: '🐺' };
    if(type === 'Кабан') stats = { hp: 6, agi: 2, dmg: 2, armor: 1, icon: '🐗' };
    if(type === 'Медведь') stats = { hp: 10, agi: 2, dmg: 3, armor: 2, icon: '🐻' };
    if(type === 'Змея') stats = { hp: 3, agi: 4, dmg: 1, armor: 0, icon: '🐍' };
    if(type === 'Водяной') stats = { hp: 6, agi: 1, dmg: 2, armor: 1, icon: '🧜' };
    
    G.enemies.push({ x, y, hp: stats.hp, maxHp: stats.hp, agi: stats.agi, dmg: stats.dmg, armor: stats.armor, icon: stats.icon, name: type });
    
    let arrow = '';
    if (x <= 1) arrow = '⬅️';
    else if (x >= 28) arrow = '➡️';
    else if (y <= 1) arrow = '⬆️';
    else if (y >= 28) arrow = '⬇️';
    
    if (arrow) {
        let div = document.createElement('div');
        div.style.cssText = `position:fixed; top:80px; left:0; width:100%; text-align:center; font-size:60px; z-index:5000; pointer-events:none; text-shadow: 0 0 20px red;`;
        div.innerText = arrow;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }
}"""
html = replace_function(html, "spawnEnemy", spawn_enemy)

handle_click = """async function handleCellClick(x, y) {
    if (G.inCombat) return alert("Нельзя двигаться во время боя!");
    let p = G.pawns[G.activePawnIndex];
    if (!p || p.x === -1) return alert("Нет активной пешки!");

    if (G.buildMode) { placeBuild(x, y); return; }
    if (x === p.x && y === p.y) return;
    
    let cell = G.map[y][x];
    if (cell.build) return alert("Клетка занята постройкой!");
    if (G.enemies.some(e => e.x === x && e.y === y)) return alert("Там враг!");
    
    let path = findPath(p.x, p.y, x, y);
    if (path.length === 0) return alert("Путь заблокирован!");
    
    let maxSteps = 5;
    if (G.enemies.length > 0) {
        if (G.combatSteps <= 0) {
            G.combatSteps = p.agi;
            addLog("Ход противника...", true);
            await new Promise(r => setTimeout(r, 800));
            moveEnemies();
            addLog("Твой ход!", false, true);
            updateUI();
            return;
        }
        if (path.length > G.combatSteps) path = path.slice(0, G.combatSteps);
    } else {
        if (path.length > maxSteps) path = path.slice(0, maxSteps);
    }

    for(let i=0; i<path.length; i++) {
        p.x = path[i].x; p.y = path[i].y;
        if (G.enemies.length > 0) G.combatSteps--;
        renderMap(); updateVision();
        await new Promise(r => setTimeout(r, 100));
    }
    updateSmartButton();
    updateUI();
}"""
html = replace_function(html, "handleCellClick", handle_click)

move_enemies = """function moveEnemies() {
    G.enemies.forEach(e => {
        let target = G.pawns.find(p => p.x !== -1);
        if(!target) return;
        let dx = Math.sign(target.x - e.x);
        let dy = Math.sign(target.y - e.y);
        
        let nx = e.x + dx;
        let ny = e.y + dy;
        
        let cell = G.map[ny] && G.map[ny][nx];
        if (cell && cell.build === 'trap') {
            cell.build = null;
            e.hp -= 3;
            addLog(`Враг наступил на ловушку! -3 HP`, false, true);
            renderMap();
        } else {
            e.x = nx; e.y = ny;
        }
        
        if(Math.abs(e.x - target.x) <= 1 && Math.abs(e.y - target.y) <= 1) {
            startCombat(e, target);
        }
    });
    updateVision();
}"""
html = replace_function(html, "moveEnemies", move_enemies)

update_smart = """function updateSmartButton() {
    let p = G.pawns[G.activePawnIndex];
    if(!p || p.x === -1) return;
    let cell = G.map[p.y][p.x];
    let btn = document.getElementById('btn-smart');
    
    if(G.inCombat) { btn.innerText = "В БОЮ"; return; }
    
    if(cell.type === 'forest') btn.innerText = "Действия (Лес)";
    else if(cell.type === 'water') btn.innerText = "Действия (Вода)";
    else if(cell.type === 'mountain') btn.innerText = "Действия (Горы)";
    else if(cell.build === 'lazaret') btn.innerText = "Лечиться (1🥩)";
    else if(cell.build === 'camp') btn.innerText = "Торговать / Нанять";
    else if(cell.type === 'grass' && !cell.build) btn.innerText = "Строить / Отдых";
    else btn.innerText = "Отдых";
}"""
html = replace_function(html, "updateSmartButton", update_smart)

spin_wheel = """function spinWheel() {
    document.getElementById('spin-btn').style.display = 'none';
    document.getElementById('wheel').style.transform = `rotate(${1440 + rnd(0,360)}deg)`;
    setTimeout(() => {
        let s = rnd(0,7);
        let msg = "Тишина.";
        if(s === 0) { msg = "Рейд!"; spawnEnemy(rnd(0,29), 0, 'Волк'); }
        else if(s === 1) { msg = "Ресурсы (+2🌲, +2🪨)"; G.res.wood += 2; G.res.stone += 2; }
        else if(s === 2) { msg = "Болезнь (-2HP)"; G.pawns[0].hp -= 2; }
        else if(s === 3) { msg = "Охота (+3🍖)"; G.res.meat += 3; }
        else if(s === 4) { msg = "Клад (+2🔶)"; G.res.copper += 2; }
        else if(s === 5) { msg = "Обмен (+5🌲, -2🍖)"; G.res.wood += 5; G.res.meat = Math.max(0, G.res.meat-2); }
        else if(s === 6) { msg = "Воры (-3🌲)"; G.res.wood = Math.max(0, G.res.wood-3); }
        
        document.getElementById('wheel-text').innerText = msg;
        updateUI();
        setTimeout(() => closeModal('wheel-modal'), 2000);
    }, 3000);
}"""
html = replace_function(html, "spinWheel", spin_wheel)

action_gather = """function actionGather() {
    if(G.ap <= 0) return alert("Нет ОД!");
    let p = G.pawns[G.activePawnIndex];
    let t = G.map[p.y][p.x].type;
    if(t === 'forest') G.res.wood += 2;
    else if(t === 'mountain') { G.res.stone += 2; G.res.copper += 1; }
    else if(t === 'water') G.res.meat += 2;
    else return alert("Тут нечего добывать!");
    
    G.ap--; 
    if(G.ap < 0) G.ap = 0;
    updateUI();
}"""
html = replace_function(html, "actionGather", action_gather)

do_smart = """function doSmartAction() {
    if(G.ap <= 0) return alert("Нет ОД!");
    let p = G.pawns[G.activePawnIndex];
    let cell = G.map[p.y][p.x];
    
    let actionsHTML = "";
    if (cell.type === 'forest') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('gather')">🌲 Собрать дерево (1 ОД)</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('hunt')">🏹 Охота (1 ОД)</button>`;
    } else if (cell.type === 'water') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('gather')">🐟 Собрать рыбу (1 ОД)</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('hunt')">🏹 Охота (1 ОД)</button>`;
    } else if (cell.type === 'mountain') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('gather')">⛏️ Добыть камень/медь (1 ОД)</button>`;
    } else if (cell.build === 'camp') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('trade')">🛒 Торговля</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('hire')">🧑‍🌾 Нанять поселенца (1 ОД)</button>`;
    } else if (cell.build === 'lazaret') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('heal')">⛑️ Лечиться (1🥩, 1 ОД)</button>`;
    } else if (cell.type === 'grass' && !cell.build) {
        actionsHTML += `<button class="btn action-btn" onclick="openModal('build-modal')">🏗️ Строить</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('rest')">💤 Отдых (1 ОД)</button>`;
    } else {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('rest')">💤 Отдых (1 ОД)</button>`;
    }
    actionsHTML += `<button class="btn btn-red action-btn" onclick="closeModal('action-modal')" style="margin-top:10px;">Отмена</button>`;
    document.getElementById('action-list').innerHTML = actionsHTML;
    openModal('action-modal');
}"""
html = replace_function(html, "doSmartAction", do_smart)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("SUCCESS: All functions replaced.")
