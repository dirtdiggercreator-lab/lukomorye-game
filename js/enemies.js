function spawnEnemyWithArrow(x, y, type) {
    spawnEnemy(x, y, type);
    let arrowDir = '';
    let posStyle = '';
    if (y === 0) { arrowDir = '⬆️'; posStyle = 'top: 100px; left: 50%; transform: translateX(-50%);'; }
    else if (y === 29) { arrowDir = '⬇️'; posStyle = 'bottom: 200px; left: 50%; transform: translateX(-50%);'; }
    else if (x === 0) { arrowDir = '⬅️'; posStyle = 'left: 10px; top: 50%; transform: translateY(-50%);'; }
    else if (x === 29) { arrowDir = '➡️'; posStyle = 'right: 10px; top: 50%; transform: translateY(-50%);'; }
    
    if (arrowDir) {
        let arrowEl = document.createElement('div');
        arrowEl.style.cssText = 'position:fixed; ' + posStyle + ' font-size:60px; z-index:9999; pointer-events:none; text-shadow: 0 0 15px red;';
        arrowEl.innerText = arrowDir;
        document.body.appendChild(arrowEl);
        setTimeout(function() { arrowEl.remove(); }, 3000);
    }
}

function spawnEnemy(x, y, type) {
    let stats = { hp: 5, agi: 3, dmg: 1, armor: 0, icon: '🐺' };
    if(type === 'Кабан') stats = { hp: 6, agi: 2, dmg: 2, armor: 1, icon: '🐗' };
    if(type === 'Медведь') stats = { hp: 10, agi: 2, dmg: 3, armor: 2, icon: '🐻' };
    if(type === 'Змея') stats = { hp: 3, agi: 4, dmg: 1, armor: 0, icon: '🐍' };
    if(type === 'Водяной') stats = { hp: 6, agi: 1, dmg: 2, armor: 1, icon: '🧜' };
    G.enemies.push({ x, y, hp: stats.hp, maxHp: stats.hp, agi: stats.agi, dmg: stats.dmg, armor: stats.armor, icon: stats.icon, name: type });
}

function moveEnemies() {
    if(G.inCombat) return;
    G.enemies.forEach(e => {
        let best = null, bestDist = Infinity;
        G.pawns.forEach(p => {
            if(p.x === -1 || p.hp <= 0) return;
            let d = Math.max(Math.abs(p.x - e.x), Math.abs(p.y - e.y));
            if(d < bestDist) { bestDist = d; best = p; }
        });
        if(!best) return;
        if(bestDist <= 1) { startCombat(e, best); return; }

        let path = findPath(e.x, e.y, best.x, best.y);
        if (path.length > 0) {
            let step = path[0];
            let cell = G.map[step.y][step.x];
            if (cell.build === 'trap') {
                cell.build = null;
                e.hp -= 3;
                addLog(`${e.name} наступил на ловушку! -3 HP`, true);
                if (e.hp <= 0) {
                    G.enemies = G.enemies.filter(en => en !== e);
                    addLog(`${e.name} погиб в ловушке!`, false, true);
                }
            } else {
                e.x = step.x; e.y = step.y;
            }
        }
    });
    renderMap(); updateVision();
}
