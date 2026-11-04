function nextTurn() {
    if(G.inCombat) return;
    let hasHearth = false;
    for(let y=0; y<30; y++) for(let x=0; x<30; x++) if(G.map[y][x].build === 'hearth' && G.map[y][x].progress >= 1) hasHearth = true;

    G.pawns.forEach(p => {
        if(p.hp <= 0) return;
        if(p.x === -1) {
            p.caravanTimer--;
            if(p.caravanTimer <= 0) {
                p.x = 15; p.y = 15;
                G.res.copper += 3;
                addLog(`${p.name} вернулся из похода с 3 🔶!`, false, true);
            }
            return;
        }
        if(G.res.meat > 0) { G.res.meat--; } 
        else { p.hp -= 2; p.san -= 2; addLog(`${p.name} голодает! -2 HP`, true); }

        if (G.season === 'Зима') {
            if (!hasHearth) {
                p.hp -= 1;
                addLog(`${p.name} мёрзнет без Очага (-1 HP)`, true);
            } else if (G.res.wood > 0) {
                G.res.wood -= 1;
                addLog(`Очаг сжёг 1 🌲`);
            } else {
                p.hp -= 1;
                addLog(`Очаг погас (нет дров). ${p.name} мёрзнет (-1 HP)`, true);
            }
        }
        if(p.san <= 0) {
            p.san = 5;
            addLog(`БЕЗУМИЕ! ${p.name} теряет контроль!`, true);
            p.x = Math.max(0, Math.min(29, p.x + rnd(-1,1)));
            p.y = Math.max(0, Math.min(29, p.y + rnd(-1,1)));
        }
    });

    if(G.pawns.every(p => p.hp <= 0)) return gameOver("Все пешки погибли.");

    G.round++;
    if(G.round % 5 === 1 && G.round > 1) {
        let idx = SEASONS.indexOf(G.season);
        G.season = SEASONS[(idx+1)%4];
        addLog(`Наступил сезон: ${G.season}`);
    }

    G.pendingStandardSpawn = (G.round % 2 === 0);
    G.pendingWheelSpawn = false;
    
    G.ap = G.diff === 'easy' ? 4 : 3;
    if (G.pawns[G.activePawnIndex]) G.combatSteps = G.pawns[G.activePawnIndex].agi;
    updateUI(); updateVision();
    
    openModal('wheel-modal');
    document.getElementById('wheel').style.transform = 'rotate(0deg)';
    document.getElementById('spin-btn').style.display = 'block';
    document.getElementById('wheel-text').innerText = '';
}

function spinWheel() {
    document.getElementById('spin-btn').style.display = 'none';
    document.getElementById('wheel').style.transform = `rotate(${1440 + rnd(0,360)}deg)`;
    setTimeout(() => {
        let s = rnd(0,7);
        let msg = "Тишина.";
        if(s === 0) { 
            msg = "Рейд!"; 
            G.pendingWheelSpawn = true;
        }
        else if(s === 1) { msg = "Ресурсы (+2🌲, +2🪨)"; G.res.wood += 2; G.res.stone += 2; }
        else if(s === 2) { msg = "Болезнь (-2HP)"; if(G.pawns[0]) G.pawns[0].hp -= 2; }
        else if(s === 3) { msg = "Удачная охота (+3🍖)"; G.res.meat += 3; }
        else if(s === 4) { msg = "Клад (+2🔶)"; G.res.copper += 2; }
        else if(s === 5) { msg = "Обмен (+5🌲, -2🍖)"; G.res.wood += 5; G.res.meat = Math.max(0, G.res.meat-2); }
        else if(s === 6) { msg = "Воры (-3🌲)"; G.res.wood = Math.max(0, G.res.wood-3); }
        
        document.getElementById('wheel-text').innerText = msg;
        addLog(`Колесо: ${msg}`);
        updateUI();
        
        setTimeout(() => {
            closeModal('wheel-modal');
            let spawned = false;
            if (G.pendingStandardSpawn) {
                let side = rnd(0,3), ex, ey;
                if (side === 0) { ex = rnd(0,29); ey = 0; }
                else if (side === 1) { ex = rnd(0,29); ey = 29; }
                else if (side === 2) { ex = 0; ey = rnd(0,29); }
                else { ex = 29; ey = rnd(0,29); }
                spawnEnemyWithArrow(ex, ey, 'Волк');
                addLog("⚠️ На карте появился враг!", true);
                G.pendingStandardSpawn = false;
                spawned = true;
            }
            if (G.pendingWheelSpawn) {
                let side = rnd(0,3), ex, ey;
                if (side === 0) { ex = rnd(0,29); ey = 0; }
                else if (side === 1) { ex = rnd(0,29); ey = 29; }
                else if (side === 2) { ex = 0; ey = rnd(0,29); }
                else { ex = 29; ey = rnd(0,29); }
                spawnEnemyWithArrow(ex, ey, 'Волк');
                addLog("⚠️ РЕЙД! На карте появился враг!", true);
                G.pendingWheelSpawn = false;
                spawned = true;
            }
            if (spawned) { renderMap(); updateVision(); }
            if (G.enemies.length > 0 && !G.inCombat) {
                addLog("Ход врагов...", true);
                setTimeout(() => { moveEnemies(); addLog("Твой ход!", false, true); updateUI(); }, 1000);
            }
        }, 1500);
    }, 3000);
}

function gameOver(reason) {
    addLog(`☠️ GAME OVER: ${reason}`, true);
    downloadLogs();
    setTimeout(() => {
        alert("ИГРА ОКОНЧЕНА: " + reason);
        location.reload();
    }, 500);
}
