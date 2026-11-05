// ============================================================
// СИСТЕМА ПОМЕЩЕНИЙ
// ============================================================

function isBlockingForFlood(cell) {
    if (!cell) return true;
    if (cell.type === 'water' || cell.type === 'mountain' || cell.type === 'water_empty') return true;
    if (cell.build === 'wall_wood' || cell.build === 'wall_stone') return true;
    if (cell.build === 'wall_multi_wood' || cell.build === 'wall_multi_stone') return true;
    if (cell.build === 'door') return true;
    return false;
}

function checkForRooms() {
    let oldRooms = G.rooms || [];
    
    // 1. Сброс старых полов
    for(let y=0; y<60; y++) for(let x=0; x<60; x++) {
        G.map[y][x].isFloor = false;
    }
    
    // 2. Flood fill от краёв — всё достижимое = снаружи
    let outside = new Set();
    let queue = [];
    for(let x=0; x<60; x++) {
        if (!isBlockingForFlood(G.map[0][x])) queue.push({x, y:0});
        if (!isBlockingForFlood(G.map[59][x])) queue.push({x, y:59});
    }
    for(let y=0; y<60; y++) {
        if (!isBlockingForFlood(G.map[y][0])) queue.push({x:0, y});
        if (!isBlockingForFlood(G.map[y][59])) queue.push({x:59, y});
    }
    
    while(queue.length > 0) {
        let cur = queue.shift();
        let key = `${cur.x},${cur.y}`;
        if (outside.has(key)) continue;
        if (cur.x < 0 || cur.x >= 60 || cur.y < 0 || cur.y >= 60) continue;
        if (isBlockingForFlood(G.map[cur.y][cur.x])) continue;
        outside.add(key);
        queue.push({x:cur.x+1, y:cur.y});
        queue.push({x:cur.x-1, y:cur.y});
        queue.push({x:cur.x, y:cur.y+1});
        queue.push({x:cur.x, y:cur.y-1});
    }
    
    // 3. Находим все закрытые клетки
    let enclosed = new Set();
    for(let y=0; y<60; y++) {
        for(let x=0; x<60; x++) {
            let key = `${x},${y}`;
            if (outside.has(key)) continue;
            if (isBlockingForFlood(G.map[y][x])) continue;
            enclosed.add(key);
        }
    }
    
    // 4. Группируем в помещения (связные компоненты)
    let visited = new Set();
    let newRooms = [];
    for(let key of enclosed) {
        if (visited.has(key)) continue;
        let [sx, sy] = key.split(',').map(Number);
        let roomCells = [];
        let q = [{x:sx, y:sy}];
        while(q.length > 0) {
            let cur = q.shift();
            let k = `${cur.x},${cur.y}`;
            if (visited.has(k)) continue;
            if (!enclosed.has(k)) continue;
            visited.add(k);
            roomCells.push({x: cur.x, y: cur.y});
            q.push({x:cur.x+1, y:cur.y});
            q.push({x:cur.x-1, y:cur.y});
            q.push({x:cur.x, y:cur.y+1});
            q.push({x:cur.x, y:cur.y-1});
        }
        
        if (roomCells.length < 1) continue; // разрешаем 1x1
        
        // Проверка на размер 6x6 = 36 макс
        if (roomCells.length > 36) continue;
        
        // 5. Ищем место для двери
        let door = null;
        for(let cell of roomCells) {
            let dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
            for(let d of dirs) {
                let nx = cell.x + d.dx, ny = cell.y + d.dy;
                if(nx<0 || nx>=60 || ny<0 || ny>=60) continue;
                let ncell = G.map[ny][nx];
                if (ncell.build === 'wall_multi_wood' || ncell.build === 'wall_multi_stone') {
                    let ox = nx + d.dx, oy = ny + d.dy;
                    if(ox>=0 && ox<60 && oy>=0 && oy<60 && outside.has(`${ox},${oy}`)) {
                        door = {x: nx, y: ny};
                        break;
                    }
                }
            }
            if (door) break;
        }
        
        if (!door) continue;
        
        // 6. Ставим дверь
        let doorCell = G.map[door.y][door.x];
        let doorWasNew = doorCell.build !== 'door';
        doorCell.build = 'door';
        
        // 7. Помечаем пол
        roomCells.forEach(c => {
            G.map[c.y][c.x].isFloor = true;
        });
        
        // 8. Восстанавливаем purpose из старого помещения (если клетки совпадают)
        let oldRoom = oldRooms.find(o => 
            o.cells.length === roomCells.length &&
            o.cells.every(oc => roomCells.some(rc => rc.x === oc.x && rc.y === oc.y))
        );
        
        newRooms.push({
            cells: roomCells,
            door: door,
            purpose: oldRoom ? oldRoom.purpose : null,
            progress: oldRoom ? oldRoom.progress : 0
        });
        
        if (doorWasNew) {
            addLog(`🏠 Обнаружено помещение (${roomCells.length} клеток)`, false, true);
            showToast(`Помещение готово к назначению!`, 'success');
        }
    }
    
    G.rooms = newRooms;
}

function getRoomAt(x, y) {
    if (!G.rooms) return null;
    return G.rooms.find(r => r.cells.some(c => c.x === x && c.y === y));
}

function getRoomCenter(room) {
    let minX = Math.min(...room.cells.map(c=>c.x));
    let maxX = Math.max(...room.cells.map(c=>c.x));
    let minY = Math.min(...room.cells.map(c=>c.y));
    let maxY = Math.max(...room.cells.map(c=>c.y));
    return { x: Math.floor((minX+maxX)/2), y: Math.floor((minY+maxY)/2) };
}

const ROOM_PURPOSES = {
    'warehouse': { name: 'Склад', icon: '📦', w: 3, s: 2 },
    'lazaret':   { name: 'Лазарет', icon: '⛑️', w: 3, s: 2 },
    'houses':    { name: 'Хоромы', icon: '🏠', w: 4, s: 3 },
    'master':    { name: 'Мастерская', icon: '🛠️', w: 3, s: 3 }
};

function assignRoomPurpose(room, purpose) {
    let p = ROOM_PURPOSES[purpose];
    if (!p) return false;
    if (G.res.wood < p.w || G.res.stone < p.s) {
        showToast("Не хватает ресурсов!", "danger");
        return false;
    }
    G.res.wood -= p.w;
    G.res.stone -= p.s;
    room.purpose = purpose;
    addLog(`Помещение: ${p.name}`, false, true);
    showToast(`${p.name} назначен!`, 'success');
    updateUI();
    return true;
}
