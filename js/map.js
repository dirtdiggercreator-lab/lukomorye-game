function zoomMap(amount) {
    currentScale += amount;
    if (currentScale < 0.2) currentScale = 0.2;
    if (currentScale > 2.0) currentScale = 2.0;
    let grid = document.getElementById('grid');
    let wrapper = document.getElementById('grid-wrapper');
    if (!grid || !wrapper) return;
    grid.style.transform = 'scale(' + currentScale + ')';
    wrapper.style.width = (4000 * currentScale) + 'px';
    wrapper.style.height = (2400 * currentScale) + 'px';
    centerCameraOnPawn();
}

function centerCameraOnPawn() {
    const area = document.getElementById('game-area');
    const p = G.pawns[G.activePawnIndex];
    if (!p || p.x === -1 || !area) return;
    const px = ((p.x - p.y) * 32 + 2000) * currentScale;
    const py = ((p.x + p.y) * 16 + 100) * currentScale;
    area.scrollLeft = px - area.clientWidth / 2;
    area.scrollTop = py - area.clientHeight / 2;
}

function drawMinimap() {
    let cvs = document.getElementById('minimap');
    if (!cvs) return;
    let ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 90, 90);
    for (let y = 0; y < 60; y++) {
        for (let x = 0; x < 60; x++) {
            let c = G.map[y][x];
            if (!c || !c.explored) continue;
            let color = '#a4b0be';
            if (c.type === 'forest') color = '#27ae60';
            else if (c.type === 'mountain') color = '#7f8c8d';
            else if (c.type === 'water') color = '#2980b9';
            if (c.build) color = '#fff';
            ctx.fillStyle = color;
            ctx.fillRect(x * 1.5, y * 1.5, 1.5, 1.5);
        }
    }
    G.enemies.forEach(e => { ctx.fillStyle = '#e84118'; ctx.fillRect(e.x * 1.5, e.y * 1.5, 1.5, 1.5); });
    G.pawns.forEach(p => { if (p.x !== -1) { ctx.fillStyle = '#fbc531'; ctx.fillRect(p.x * 1.5, p.y * 1.5, 1.5, 1.5); } });
}

function startGame() {
    closeModal('gen-modal');
    G.map = [];
    G.combatSteps = tempPawn.agi;
    G.pendingStandardSpawn = false;
    G.pendingWheelSpawn = false;
    
    for(let y=0; y<60; y++) {
        let row = [];
        for(let x=0; x<60; x++) {
            let type = 'grass';
            if (x < 4 || x > 25) type = Math.random() < 0.6 ? 'forest' : 'grass';
            else if (y < 4 || y > 25) type = Math.random() < 0.4 ? 'mountain' : 'grass';
            else if (x >= 28 && x <= 31) {
                type = 'water';
                if (y === 10 || y === 50) type = 'ford';
            }
            row.push({ type, build: null, explored: false, currentVision: false, progress: 0 });
        }
        G.map.push(row);
    }
    
    let spawnX = 30, spawnY = 30;
    if (G.map[spawnY][spawnX].type !== 'grass') {
        let found = false;
        for(let r=1; r<30 && !found; r++) {
            for(let dy=-r; dy<=r && !found; dy++) {
                for(let dx=-r; dx<=r && !found; dx++) {
                    let nx = 30+dx, ny = 30+dy;
                    if(nx>=0 && nx<60 && ny>=0 && ny<60 && G.map[ny][nx].type === 'grass') {
                        spawnX = nx; spawnY = ny; found = true;
                    }
                }
            }
        }
    }
    tempPawn.x = spawnX;
    tempPawn.y = spawnY;
    G.pawns.push(tempPawn);
    
    document.getElementById('top-panel').style.display = 'flex';
    document.getElementById('pawn-bar').style.display = 'flex';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('zoom-controls').style.display = 'flex';
    document.getElementById('bottom-panel').style.display = 'flex';
    
    updateUI(); updateVision(); renderMap(); renderPawnBar();
    addLog("Версия v45.2. Игра началась!");
    
    setTimeout(() => { centerCameraOnPawn(); }, 100);
}

function renderMap() {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';
    for(let y=0; y<60; y++) {
        for(let x=0; x<60; x++) {
            let cell = G.map[y][x];
            let d = document.createElement('div');
            d.className = `cell tile-${cell.type}`;
            // Магия изометрии: (x - y) и (x + y)
            d.style.left = ((x - y) * 32 + 2000) + 'px';
            d.style.top = ((x + y) * 16 + 100) + 'px';
            d.style.zIndex = x + y + 10; // Передние клетки рисуются поверх задних
            
            let isVisible = cell.currentVision;
            let isExplored = cell.explored;
            
            if(!isExplored) d.classList.add('fog');
            else if(!isVisible) d.classList.add('explored-fog');

            let content = '';
            if (cell.type === 'forest') content = '🌲';
            else if (cell.type === 'mountain') content = '⛰️';
            else if (cell.type === 'water') content = '🌊';
            else if (cell.type === 'ford') content = '💧';
            else if (cell.type === 'water_empty') content = '';
            
            if(cell.build === 'camp') content = '🏕️';
            if(cell.build === 'wall_wood') content = '🪵';
            if(cell.build === 'wall_stone') content = '🪨';
            if(cell.build === 'trap') content = '🕳️';
            if(cell.build === 'hearth') content = '🔥';
            if(cell.build === 'field') content = '🌾';
            if(cell.build === 'lazaret') content = '⛑️';
            if(cell.build === 'warehouse') content = '📦';
            if(cell.build === 'houses') content = '🏠';
            if(cell.build === 'master') content = '🛠️';
            if(cell.build === 'great_hearth') content = '🏆';
            
            if(cell.build && cell.progress < getBuildCost(cell.build).turns) {
                content = `<span class="build-progress">${cell.progress}/${getBuildCost(cell.build).turns}</span>`;
            }

            let n = G.npcs && G.npcs.find(nn => nn.x === x && nn.y === y);
            if(n && isVisible) { content = n.icon; }
            
            let e = G.enemies.find(en => en.x === x && en.y === y);
            if(e && isVisible) { content = e.icon; d.classList.add('enemy-unit'); }

            let p = G.pawns.find(pw => pw.x === x && pw.y === y && pw.hp > 0);
            if(p) { content = '🧑‍🌾'; d.classList.add('pawn-unit'); }

            d.innerHTML = '<div class="cell-bg"></div><div class="cell-content">' + content + '</div>';
            d.onclick = () => handleCellClick(x, y);
            grid.appendChild(d);
        }
    }
    renderPawnBar();
    drawMinimap();
}

function updateVision() {
    for(let y=0; y<60; y++) for(let x=0; x<60; x++) G.map[y][x].currentVision = false;

    G.pawns.forEach(p => {
        if(p.x === -1 || p.hp <= 0) return;
        let rad = 2;
        for(let dy=-rad; dy<=rad; dy++) {
            for(let dx=-rad; dx<=rad; dx++) {
                let nx = p.x + dx, ny = p.y + dy;
                if(nx>=0 && nx<60 && ny>=0 && ny<60 && (Math.abs(dx) + Math.abs(dy) <= rad)) {
                    G.map[ny][nx].currentVision = true;
                    G.map[ny][nx].explored = true;
                }
            }
        }
    });

    for(let y=0; y<60; y++) {
        for(let x=0; x<60; x++) {
            let b = G.map[y][x].build;
            if(!b || G.map[y][x].progress < getBuildCost(b).turns) continue;
            let rad = b === 'camp' ? 5 : (b === 'lazaret' || b === 'wall_stone') ? 3 : (b === 'wall_wood' || b === 'hearth' || b === 'field') ? 2 : 0;
            if(rad === 0) continue;
            for(let dy=-rad; dy<=rad; dy++) {
                for(let dx=-rad; dx<=rad; dx++) {
                    let nx = x + dx, ny = y + dy;
                    if(nx>=0 && nx<60 && ny>=0 && ny<60 && (Math.abs(dx) + Math.abs(dy) <= rad)) {
                        G.map[ny][nx].currentVision = true;
                        G.map[ny][nx].explored = true;
                    }
                }
            }
        }
    }
    renderMap();
}

function handleCellClick(x, y) {
    if (isMoving) return;
    if (G.inCombat) return alert("Нельзя двигаться в бою!");
    let p = G.pawns[G.activePawnIndex];
    if (!p || p.x === -1) return;

    if (G.buildMode) { placeBuild(x, y); return; }
    if (x === p.x && y === p.y) return;
    
    let cell = G.map[y][x];
    let enemy = G.enemies.find(e => e.x === x && e.y === y);
    if (enemy) {
        if (Math.max(Math.abs(p.x-x), Math.abs(p.y-y)) <= 1) startCombat(enemy, p);
        else addLog("Слишком далеко до врага.", true);
        return;
    }

    let path = findPath(p.x, p.y, x, y);
    if (path.length === 0) return addLog("Путь заблокирован.", true);
    
    isMoving = true;
    let maxSteps = G.enemies.length > 0 ? G.combatSteps : 5;
    if (G.enemies.length > 0 && maxSteps <= 0) {
        addLog("Ход врага...", true);
        setTimeout(() => {
            moveEnemies();
            G.combatSteps = p.agi;
            addLog("Твой ход!", false, true);
            isMoving = false;
            updateUI();
        }, 800);
        return;
    }

    if (path.length > maxSteps) path = path.slice(0, maxSteps);

    (async () => {
        for(let step of path) {
            p.x = step.x; p.y = step.y;
            if (G.enemies.length > 0) G.combatSteps--;
            updateVision(); renderMap(); updateUI();
            await sleep(100);
        }
        isMoving = false;
        updateUI();
        if (G.enemies.length > 0) {
            let adj = G.enemies.find(e => Math.max(Math.abs(e.x-p.x), Math.abs(e.y-p.y)) <= 1);
            if (adj) startCombat(adj, p);
        }
    })();
}

function findPath(sx, sy, tx, ty) {
    let queue = [{x:sx, y:sy, path:[]}];
    let visited = new Set([`${sx},${sy}`]);
    while(queue.length > 0) {
        let cur = queue.shift();
        if(cur.x === tx && cur.y === ty) return cur.path;
        for(let dx=-1; dx<=1; dx++) {
            for(let dy=-1; dy<=1; dy++) {
                if(dx===0 && dy===0) continue;
                let nx = cur.x + dx, ny = cur.y + dy;
                if(nx>=0 && nx<60 && ny>=0 && ny<60 && !visited.has(`${nx},${ny}`)) {
                    let cell = G.map[ny][nx];
                    let isWalkable = (cell.type !== 'water' && cell.type !== 'mountain' && cell.type !== 'water_empty');
                    if (['wall_wood', 'wall_stone', 'trap'].includes(cell.build)) isWalkable = false;
                    if (isWalkable) {
                        visited.add(`${nx},${ny}`);
                        queue.push({x:nx, y:ny, path:[...cur.path, {x:nx, y:ny}]});
                    }
                }
            }
        }
    }
    return [];
}
