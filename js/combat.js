function startCombat(enemy, pawn) {
    if (!enemy || !pawn || G.inCombat) return;
    G.inCombat = true;
    currentEnemy = enemy;
    currentPawn = pawn;
    G.fledThisCombat = false;
    let info = document.getElementById('combat-info');
    info.innerHTML = `<p>${enemy.icon} ${enemy.name} | HP: <span id="c-ehp">${enemy.hp}</span></p><p>🧑‍🌾 ${pawn.name} | HP: <span id="c-php">${pawn.hp}</span></p>`;
    document.getElementById('c-log').innerHTML = "Бой начался!<br>";
    openModal('combat-modal');
    updateUI();
}

function combatAttack() {
    if (!currentEnemy || !currentPawn) return;
    let logBox = document.getElementById('c-log');
    let pInit = d6() + currentPawn.agi;
    let eInit = d6() + currentEnemy.agi;
    let attacker = pInit >= eInit ? 'player' : 'enemy';
    logBox.innerHTML += `<br>Инициатива: Вы ${pInit} vs Враг ${eInit} (${attacker === 'player' ? 'Вы первый' : 'Враг первый'}).<br>`;
    if (attacker === 'player') {
        doPlayerHit(logBox);
        if (currentEnemy.hp > 0) doEnemyHit(logBox);
    } else {
        doEnemyHit(logBox);
        if (currentPawn.hp > 0) doPlayerHit(logBox);
    }
    checkCombatEnd();
}

function doPlayerHit(logBox) {
    let w = WEAPONS[currentPawn.weapon] || WEAPONS['fists'];
    let pHit = d6() + currentPawn.agi + w.acc;
    let eDodge = d6() + currentEnemy.agi;
    if(pHit >= eDodge) {
        let pDmg = d6() + currentPawn.str + w.dmg - currentEnemy.armor;
        if (pDmg < 1) pDmg = 1;
        currentEnemy.hp -= pDmg;
        logBox.innerHTML += `Вы попали (${pHit} vs ${eDodge})! Урон: ${pDmg}<br>`;
        if(currentPawn.agi - currentEnemy.agi >= 2 && d6() >= 5) {
            currentEnemy.hp -= pDmg;
            logBox.innerHTML += `КРИТ! Двойной урон!<br>`;
        }
    } else {
        logBox.innerHTML += `Вы промахнулись (${pHit} vs ${eDodge}).<br>`;
    }
    let ehp = document.getElementById('c-ehp');
    if(ehp) ehp.innerText = Math.max(0, currentEnemy.hp);
}

function doEnemyHit(logBox) {
    let eHit = d6() + currentEnemy.agi;
    let pDodge = d6() + currentPawn.agi;
    if(eHit >= pDodge) {
        let eDmg = d6() + currentEnemy.dmg - currentPawn.armor;
        if (eDmg < 1) eDmg = 1;
        currentPawn.hp -= eDmg;
        logBox.innerHTML += `Враг попал (${eHit} vs ${pDodge})! Урон: ${eDmg}<br>`;
    } else {
        logBox.innerHTML += `Враг промахнулся (${eHit} vs ${pDodge}).<br>`;
    }
    let php = document.getElementById('c-php');
    if(php) php.innerText = Math.max(0, currentPawn.hp);
}

function checkCombatEnd() {
    if(currentEnemy.hp <= 0) {
        document.getElementById('c-log').innerHTML += "Враг мертв!<br>";
        let strongNames = ['Медведь', 'Отряд Кощея', 'Костяной страж', 'Шаман', 'Водяной'];
        let xp = strongNames.includes(currentEnemy.name) ? 5 : 2;
        currentPawn.xp += xp;
        addLog(`${currentPawn.name} победил ${currentEnemy.name}! +${xp} XP`, false, true);
        G.enemies = G.enemies.filter(e => e !== currentEnemy);
        setTimeout(() => { 
            closeModal('combat-modal'); 
            G.inCombat = false; 
            currentEnemy = null; currentPawn = null;
            updateUI(); renderMap(); 
        }, 1000);
    } else if(currentPawn.hp <= 0) {
        document.getElementById('c-log').innerHTML += "Вы погибли...<br>";
        let deadPawn = currentPawn;
        addLog(`${deadPawn.name} погиб в бою!`, true);
        G.pawns = G.pawns.filter(p => p !== deadPawn);
        setTimeout(() => { 
            closeModal('combat-modal'); 
            G.inCombat = false; 
            currentEnemy = null; currentPawn = null;
            if (G.pawns.length === 0) gameOver("Все пешки погибли.");
            else { G.activePawnIndex = 0; updateUI(); renderMap(); }
        }, 1500);
    }
}

function combatFlee() {
    if (!currentPawn || !currentEnemy) return;
    if (G.fledThisCombat) return alert("Нельзя отступать дважды!");
    let eAtk = d6() + currentEnemy.agi + 2;
    let pDef = d6() + currentPawn.agi;
    if (eAtk >= pDef) {
        let dmg = (d6() + currentEnemy.dmg - currentPawn.armor) * 2;
        if (dmg < 1) dmg = 1;
        currentPawn.hp -= dmg;
        currentPawn.san = Math.max(0, currentPawn.san - 2);
        addLog(`${currentPawn.name} отступает и получает ${dmg} в спину!`, true);
    } else {
        addLog(`${currentPawn.name} успешно отступил!`, false, true);
    }
    G.fledThisCombat = true;
    closeModal('combat-modal');
    G.inCombat = false;
    currentEnemy = null; currentPawn = null;
    updateUI(); renderMap();
}
