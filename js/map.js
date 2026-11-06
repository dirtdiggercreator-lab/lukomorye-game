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
    try {
    closeModal('gen-modal');
    G.map = [];
    G.combatSteps = tempPawn.agi;
    G.pendingStandardSpawn = false;
    G.pendingWheelSpawn = false;
    
    for(let y=0; y<60; y++) {
        let row = [];
        for(let x=0; x<60; x++) {
            let type = 'grass';
            if (x < 8 || x > 51) type = Math.random() < 0.6 ? 'forest' : 'grass';
            else if (y < 8 || y > 51) type = Math.random() < 0.4 ? 'mountain' : 'grass';
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
    
    updateUI(); updateVision(); renderPawnBar();
    
    // Инициализация canvas
    initRenderer();
    centerCameraOnPawn();
    
    addLog("Версия " + GAME_VERSION + " (Canvas)");
    } catch(e) { alert("ОШИБКА СТАРТА: " + e.message); console.error(e); }
}

function renderMap() {
    // Теперь просто триггерит перерисовку следующего кадра
    markDirty();
    drawMinimap();
    renderPawnBar();
}

function updateVision() {
    for(let y=0; y<60; y++) for(let x=0; x<60; x++) G.map[y][x].currentVision = false;

    let night = isNight();
    G.pawns.forEach(p => {
        if(p.x === -1 || p.hp <= 0) return;
        let rad = night ? 2 : 3;
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
            let rad = 0;
            if (b === 'camp') rad = 5;
            else if (b === 'lazaret' || b === 'wall_stone') rad = 3;
            else if (b === 'wall_wood' || b === 'hearth' || b === 'field') rad = 2;
            else if (b === 'watchtower') rad = night ? 8 : 4;
            else if (b === 'campfire') rad = night ? 5 : 2;
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

function ensurePawnVisible() {
    const p = G.pawns[G.activePawnIndex];
    if (!p || p.x === -1) return;
    const canvas = getCanvas();
    if (!canvas) return;
    const cw = canvas.getBoundingClientRect().width;
    const ch = canvas.getBoundingClientRect().height;
    const w = gridToWorld(p.x, p.y);
    const screen = worldToScreen(w.x, w.y, canvas, camera);
    const margin = 120;
    
    if (screen.x < margin) camera.x -= (margin - screen.x) / camera.zoom;
    else if (screen.x > cw - margin) camera.x += (screen.x - cw + margin) / camera.zoom;
    if (screen.y < margin) camera.y -= (margin - screen.y) / camera.zoom;
    else if (screen.y > ch - margin) camera.y += (screen.y - ch + margin) / camera.zoom;
    markDirty();
}

function startBuilding(type, costW, costS) {
    if (G.ap <= 0) return showToast("Нет ОД!", "danger");
    if (G.res.wood < costW || G.res.stone < costS) return showToast("Не хватает ресурсов!", "danger");
    
    G.currentBuild = { type, costW, costS };
    G.buildRotation = 0;
    
    let def = BUILDINGS[type] || { w: 1, h: 1 };
    document.getElementById('build-status-text').innerText = `Постройка: ${def.name || type} (${G.buildRotation ? def.h+'x'+def.w : def.w+'x'+def.h})`;
    document.getElementById('build-control-panel').style.display = 'block';
    document.getElementById('build-modal').style.display = 'none';
    showToast("Укажите место на карте", "info");
}

function rotateBuild() {
    if (!G.currentBuild) return;
    G.buildRotation = G.buildRotation === 0 ? 1 : 0;
    let def = BUILDINGS[G.currentBuild.type] || { w: 1, h: 1 };
    document.getElementById('build-status-text').innerText = `Постройка: ${def.name || G.currentBuild.type} (${G.buildRotation ? def.h+'x'+def.w : def.w+'x'+def.h})`;
}

function cancelBuild() {
    G.currentBuild = null;
    document.getElementById('build-control-panel').style.display = 'none';
    showToast("Постройка отменена");
}

function tryPlaceBuilding(x, y) {
    if (!G.currentBuild) return;
    let type = G.currentBuild.type;
    let def = BUILDINGS[type] || { w: 1, h: 1 };
    let w = G.buildRotation ? def.h : def.w;
    let h = G.buildRotation ? def.w : def.h;
    
    // Проверка на траву и свободность
    for(let dy=0; dy<h; dy++) {
        for(let dx=0; dx<w; dx++) {
            let nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= 60 || ny < 0 || ny >= 60) return showToast("Выход за карту", "danger");
            let c = G.map[ny][nx];
            if (c.type !== 'grass' || c.build || c.buildingId !== undefined) return showToast("Место занято или не трава", "danger");
        }
    }
    
    // Списываем ресурсы
    G.res.wood -= G.currentBuild.costW;
    G.res.stone -= G.currentBuild.costS;
    G.ap--;
    
    // Создаем здание
    let bid = Date.now();
    let building = {
        id: bid, type: type, x: x, y: y, w: w, h: h,
        progress: 1, maxProgress: (type === 'great_hearth') ? 3 : (type === 'lazaret' || type === 'houses' || type === 'master') ? 2 : 1,
        door: { x: x, y: y + h - 1 } // Дверь всегда внизу
    };
    
    // Записываем тайлы
    for(let dy=0; dy<h; dy++) {
        for(let dx=0; dx<w; dx++) {
            G.map[y+dy][x+dx].buildingId = bid;
            G.map[y+dy][x+dx].isDoor = (dx === 0 && dy === h - 1); // Левая нижняя клетка = дверь
        }
    }
    
    G.buildings.push(building);
    G.currentBuild = null;
    document.getElementById('build-control-panel').style.display = 'none';
    
    if (building.progress >= building.maxProgress) {
        addLog(`Построено: ${def.name}`, false, true);
        if (type === 'great_hearth') {
            downloadLogs();
            setTimeout(() => { alert("ВЫ ПОБЕДИЛИ!"); location.reload(); }, 300);
        }
    } else {
        addLog(`Начато: ${def.name} (1/${building.maxProgress})`);
    }
    
    updateVision(); updateUI(); markDirty();
}

function handleCellClick(x, y) {
    if (isMoving) return;
    if (G.inCombat) return showToast("Нельзя двигаться в бою!", "danger");
    let p = G.pawns[G.activePawnIndex];
    if (!p || p.x === -1) return;

    if (G.currentBuild) { tryPlaceBuilding(x, y); return; }
    if (x === p.x && y === p.y) return;
    
    let enemy = G.enemies.find(e => e.x === x && e.y === y);
    if (enemy) {
        if (Math.max(Math.abs(p.x-x), Math.abs(p.y-y)) <= 1) startCombat(enemy, p);
        else showToast("Слишком далеко до врага.", "danger");
        return;
    }

    let path = findPath(p.x, p.y, x, y);
    if (path.length === 0) return showToast("Путь заблокирован.", "danger");
    
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

    // Обрезаем путь по сумме moveCost
    let realPath = [];
    let totalCost = 0;
    for (let step of path) {
        let c = getMoveCost(G.map[step.y][step.x]);
        if (totalCost + c > maxSteps + 0.001) break;
        realPath.push(step);
        totalCost += c;
    }
    if (realPath.length === 0) { 
        isMoving = false; 
        return showToast("Нет доступных шагов.", "danger"); 
    }

    (async () => {
        for(let step of realPath) {
            p.x = step.x; p.y = step.y;
            let c = getMoveCost(G.map[step.y][step.x]);
            if (G.enemies.length > 0) G.combatSteps -= c;
            updateVision();
            ensurePawnVisible();
            updateUI();
            // Анимация: по дороге быстрее, по грязи медленнее
            let delay = c === 0.33 ? 60 : (c >= 2 ? 240 : 120);
            await sleep(delay);
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
    let openList = [{x: sx, y: sy, cost: 0, path: []}];
    let visited = new Set();
    let visitedCosts = {};
    visitedCosts[`${sx},${sy}`] = 0;
    
    while (openList.length > 0) {
        openList.sort((a, b) => a.cost - b.cost);
        let cur = openList.shift();
        if (cur.x === tx && cur.y === ty) return cur.path;
        let key = `${cur.x},${cur.y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        
        for(let dx=-1; dx<=1; dx++) {
            for(let dy=-1; dy<=1; dy++) {
                if(dx===0 && dy===0) continue;
                let nx = cur.x + dx, ny = cur.y + dy;
                if(nx<0 || nx>=60 || ny<0 || ny>=60) continue;
                let nkey = `${nx},${ny}`;
                if (visited.has(nkey)) continue;
                let cell = G.map[ny][nx];
                let cellCost = getMoveCost(cell);
                if (cellCost >= 999) continue;
                let newCost = cur.cost + cellCost;
                if (visitedCosts[nkey] === undefined || newCost < visitedCosts[nkey]) {
                    visitedCosts[nkey] = newCost;
                    openList.push({x: nx, y: ny, cost: newCost, path: [...cur.path, {x:nx, y:ny}]});
                }
            }
        }
    }
    return [];
}
