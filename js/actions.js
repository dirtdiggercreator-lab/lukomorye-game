function doSmartAction() {
    if(G.ap <= 0) return showToast("Нет ОД!", "danger");
    let p = G.pawns[G.activePawnIndex];
    let cell = G.map[p.y][p.x];
    
    let actionsHTML = "";
    if (cell.type === 'forest') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('gather')">🌲 Собрать дерево</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('hunt')">🏹 Охота</button>`;
    } else if (cell.type === 'water') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('gather')">🐟 Поймать рыбу</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('hunt')">🏹 Охота</button>`;
    } else if (cell.type === 'mountain') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('gather')">⛏️ Добыть камень/медь</button>`;
    } else if (cell.build === 'camp') {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('hire')">🧑‍🌾 Нанять поселенца</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('rest')">💤 Отдых</button>`;
    } else if (cell.type === 'grass' && !cell.build) {
        actionsHTML += `<button class="btn action-btn" onclick="document.getElementById('action-modal').style.display='none'; openModal('build-modal')">🏗️ Строить</button>`;
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('rest')">💤 Отдых</button>`;
    } else {
        actionsHTML += `<button class="btn action-btn" onclick="executeAction('rest')">💤 Отдых</button>`;
    }
    
    // Проверка зданий рядом
    let _b = null;
    let _bCell = G.map[p.y][p.x];
    if (_bCell.buildingId !== undefined) {
        _b = G.buildings.find(b => b.id === _bCell.buildingId);
    } else {
        for (let i = 0; i < G.buildings.length; i++) {
            if (isNearBuilding(p.x, p.y, G.buildings[i])) {
                _b = G.buildings[i];
                break;
            }
        }
    }
    
    if (_b) {
        if (_b.progress >= _b.maxProgress) {
            if (_b.type === 'lazaret') actionsHTML += `<button class="btn action-btn" onclick="executeAction('heal')" style="background: #c0392b; grid-column: span 2;">🏥 Лечиться (1🍖)</button>`;
            else if (_b.type === 'houses') actionsHTML += `<button class="btn action-btn" onclick="executeAction('hire')" style="background: #8e44ad; grid-column: span 2;">🏘️ Нанять поселенца</button>`;
            else if (_b.type === 'master') actionsHTML += `<button class="btn action-btn" onclick="document.getElementById('action-modal').style.display='none'; openModal('craft-modal')" style="background: #34495e; grid-column: span 2;">🏭 Крафт в Мастерской</button>`;
            else if (_b.type === 'warehouse') actionsHTML += `<div style="grid-column: span 2; padding: 8px; text-align: center; color: #fbc531;">🏬 Склад (расширяет лимит)</div>`;
        } else {
            let def = BUILDINGS[_b.type] || { name: _b.type };
            actionsHTML += `<div style="grid-column: span 2; padding: 8px; text-align: center; color: #aaa;">🏗️ ${def.name} (${_b.progress}/${_b.maxProgress})</div>`;
            if (G.ap > 0) {
                actionsHTML += `<button class="btn action-btn" onclick="demolishBuilding(${_b.id})" style="background: #c0392b; grid-column: span 2;">🔨 Снести здание (1 ОД, 50% возврат)</button>`;
                actionsHTML += `<button class="btn action-btn" onclick="continueBuilding(${_b.id})" style="background: #2980b9; grid-column: span 2;">🏗️ Достроить (1 ОД)</button>`;
            }
        }
    }
    
    let p2 = G.pawns[G.activePawnIndex];
    // Проверка на NPC рядом
    if (G.npcs) {
        G.npcs.forEach(npc => {
            if (Math.max(Math.abs(npc.x - p2.x), Math.abs(npc.y - p2.y)) <= 1) {
                actionsHTML += `<button class="btn action-btn" onclick="npcInteraction(${G.npcs.indexOf(npc)})" style="background: #8e44ad; grid-column: span 2;">🗣️ Поговорить с ${npc.name}</button>`;
            }
        });
    }
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            let nx = p2.x + dx, ny = p2.y + dy;
            if (nx < 0 || nx >= 30 || ny < 0 || ny >= 30) continue;
            let c = G.map[ny][nx];
            if (c.build && c.progress < getBuildCost(c.build).turns) {
                actionsHTML += `<button class="btn action-btn" onclick="executeContinueBuild(${nx},${ny})" style="background: #2980b9;">🏗️ Достроить (${c.progress}/${getBuildCost(c.build).turns})</button>`;
            }
        }
    }
    
    document.getElementById('action-list').innerHTML = actionsHTML;
    document.getElementById('action-modal').style.display = 'block';
}

function executeAction(type) {
    document.getElementById('action-modal').style.display = 'none';
    let p = G.pawns[G.activePawnIndex];
    let cell = G.map[p.y][p.x];
    
    if (G.ap <= 0 && type !== 'rest') return showToast("Нет ОД!", "danger");
    
    if (type === 'gather') {
        G.ap--;
        let roll = d6() + p.craft;
        let res = roll >= 7 ? 3 : roll >= 4 ? 2 : 1;
        
        if (G.weather === 'Обилие') res += 1;
        if (cell.type === 'forest') { 
            G.res.wood += res; 
            if(Math.random() < 0.15) { G.res.herbs += 1; addLog('🌿 Найдены травы!', false, true); } 
            addLog(`${p.name} рубит лес: +${res} 🌲 (Кубик: ${roll})`, false, true); 
            cell.type = 'grass';
        }
        else if (cell.type === 'water') { 
            if (G.weather === 'Засуха') {
                addLog(`${p.name} не может ловить рыбу в засуху.`, true);
            } else {
                G.res.meat += res; 
                addLog(`${p.name} ловит рыбу: +${res} 🍖 (Кубик: ${roll})`, false, true); 
                cell.type = 'water_empty';
            }
        }
        else if (cell.type === 'mountain') { 
            G.res.stone += res; 
            if(res>=2) G.res.copper += 1; 
            if(p.craft >= 4 && Math.random() < 0.1) { G.res.iron += 1; addLog('⚙️ Найдено железо!', false, true); } 
            addLog(`${p.name} добывает камень: +${res} 🪨 (Кубик: ${roll})`, false, true); 
            cell.type = 'grass';
        }
        updateUI(); renderMap();
    } else if (type === 'hunt') {
        G.ap--;
        let roll1 = d6(), roll2 = d6();
        let sum = roll1 + roll2;
        
        if(sum <= 5) {
            addLog(`${p.name} охотится: ${roll1}+${roll2}=${sum}. Неудача.`, true);
        } else if (sum <= 9) {
            if(cell.type === 'forest') { G.res.meat += 3; G.res.hide += 1; addLog(`${p.name}: +3 🍖, +1 🐻`, false, true); }
            else { G.res.meat += 3; addLog(`${p.name}: +3 🍖`, false, true); }
        } else {
            if(cell.type === 'forest') { G.res.meat += 5; G.res.hide += 2; addLog(`${p.name}: +5 🍖, +2 🐻`, false, true); }
            else { G.res.meat += 5; addLog(`${p.name}: +5 🍖`, false, true); }
        }

        if (G.weather === 'Засуха' && cell.type === 'water') { addLog(`${p.name} не может охотиться в засуху.`, true); updateUI(); return; }
        
        if(roll1 === roll2) {
            addLog("ДУБЛЬ! Из засады выходит зверь!", true);
            let enemiesList = cell.type === 'forest' ? ['Волк', 'Кабан', 'Медведь'] : ['Змея', 'Водяной'];
            let enemyName = enemiesList[rnd(0, enemiesList.length-1)];
            spawnEnemy(p.x + 1, p.y, enemyName);
            startCombat(G.enemies[G.enemies.length-1], p);
        }
        updateUI(); renderMap();
    } else if (type === 'rest') {
        p.hp = Math.min(p.maxHp, p.hp + 2);
        p.san = Math.min(10, p.san + 1);
        G.ap--; if (G.ap < 0) G.ap = 0;
        addLog(`${p.name} отдыхает (+2 HP, +1 Рассудок).`);
        updateUI();
    } else if (type === 'heal') {
        if(G.res.meat >= 1) {
             // Фикс
            G.res.meat--; p.hp = Math.min(p.maxHp, p.hp + 4);
            G.ap--; if (G.ap < 0) G.ap = 0;
            addLog(`${p.name} лечится в Лазарете (+4 HP).`, false, true);
            updateUI();
        } else showToast("Нужна еда!", "danger");
    } else if (type === 'hire') {
        if(G.ap < 1) return showToast("Нет ОД!", "danger");
        if(G.pawns.length >= 4) return alert("Максимум 4 пешки!");
        G.ap--;
        let newStam = d6();
        let newP = { name: "Поселенец", str: d6(), agi: d6(), craft: d6(), wits: d6(), stam: newStam, trait: "Нет", hp: 10 + newStam, maxHp: 10 + newStam, san: 10, xp: 0, lvl: 0, arrows: 0, weapon: ITEMS['fists'], armorItem: null, x: p.x, y: p.y, diseases: [], active: true, maxArrows: 2 };
        G.pawns.push(newP);
        addLog(`Нанят новый поселенец!`);
        updateUI(); renderPawnBar();
    }
}

function executeContinueBuild(bx, by) {
    document.getElementById('action-modal').style.display = 'none';
    let c = G.map[by][bx];
    if (!c.build) return;
    let cost = getBuildCost(c.build);
    if (c.progress >= cost.turns) return alert("Уже достроено!");
    if (G.ap <= 0) return showToast("Нет ОД!", "danger");
    
    let pp = G.pawns[G.activePawnIndex];
    if (Math.max(Math.abs(pp.x - bx), Math.abs(pp.y - by)) > 1) return showToast("Слишком далеко!", "danger");
    
    G.ap--;
    c.progress++;
    
    if (c.progress >= cost.turns) {
        addLog(`✅ Достроено: ${c.build}`, false, true);
        if (c.build === 'great_hearth') {
            downloadLogs();
            setTimeout(() => { alert("ВЫ ПОБЕДИЛИ!"); location.reload(); }, 300);
            return;
        }
    } else {
        addLog(`🏗️ ${c.build} (${c.progress}/${cost.turns})`);
    }
    updateVision(); updateUI(); renderMap();
}

function doBuild(type, costW, costS, turns) {
    if(G.ap <= 0) return showToast("Нет ОД!", "danger");
    if(type === 'great_hearth' && G.diff === 'hard') {
        costW = Math.floor(15 * 2.5);
        costS = Math.floor(15 * 2.5);
    }
    if(G.res.wood < costW || G.res.stone < costS) return showToast("Не хватает ресурсов!", "danger");
    if(type === 'great_hearth' && G.res.copper < 8) return alert("Нужно 8 меди!");
    
    G.currentBuild = type; G.buildCost = {w:costW, s:costS, turns:turns};
    closeModal('build-modal');
    addLog(`Выбрана постройка: ${type}. Кликните на траву.`);
}

function placeBuild(x, y) {
    if(G.map[y][x].type !== 'grass') return alert("Строить можно только на траве!");
    if(G.map[y][x].build) return showToast("Уже занято!", "danger");
    
    let p = G.pawns[G.activePawnIndex];
    let dist = Math.max(Math.abs(p.x - x), Math.abs(p.y - y));
    if(dist > 1) return alert("Строить можно только рядом с собой (макс 1 клетка)!");
    
    if(G.res.wood < G.buildCost.w || G.res.stone < G.buildCost.s) return showToast("Не хватает ресурсов!", "danger");
    
    G.res.wood -= G.buildCost.w; G.res.stone -= G.buildCost.s;
    if (G.currentBuild === 'great_hearth') G.res.copper -= 8;
    
    G.map[y][x].build = G.currentBuild;
    let __tot = getBuildCost(G.currentBuild).turns;
    G.map[y][x].progress = 1;
    G.ap--; if (G.ap < 0) G.ap = 0;
    
    if (__tot > 1) {
        addLog(`🏗️ Начато: ${G.currentBuild} (1/${__tot})`);
    } else {
        addLog(`Построено: ${G.currentBuild}`);
        if (G.currentBuild === 'great_hearth') {
            addLog("ПОБЕДА. Построен Великий Очаг.", false, true);
            downloadLogs();
            setTimeout(() => { alert("ВЫ ПОБЕДИЛИ!"); location.reload(); }, 300);
            return;
        }
    }
    G.currentBuild = null;
    updateVision(); updateUI(); renderMap();
}

function npcInteraction(idx) {
    let npc = G.npcs[idx];
    if (!npc) return;
    document.getElementById('action-modal').style.display = 'none';
    let p = G.pawns[G.activePawnIndex];
    npc.interact(p);
}



function continueBuilding(id) {
    let b = G.buildings.find(bb => bb.id === id);
    if (!b) { showToast("Здание не найдено!", "danger"); return; }
    if (G.ap <= 0) { showToast("Нет ОД!", "danger"); return; }
    G.ap--;
    b.progress++;
    let def = BUILDINGS[b.type] || { name: b.type };
    addLog(`🏗️ ${def.name} (${b.progress}/${b.maxProgress})`);
    if (b.progress >= b.maxProgress) {
        showToast(`${def.name} достроен!`, 'success');
        if (b.type === 'great_hearth') {
            downloadLogs();
            setTimeout(() => { alert("ВЫ ПОБЕДИЛИ!"); location.reload(); }, 300);
        }
    }
    document.getElementById('action-modal').style.display = 'none';
    updateUI(); markDirty();
}
