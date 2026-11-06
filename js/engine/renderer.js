// ============================================================
// CANVAS RENDERER
// ============================================================

let _canvas = null;
let _ctx = null;
let _dpr = 1;
let _isDirty = true;
let _isPointerDown = false;
let _isDragging = false;
let _dragStartX = 0, _dragStartY = 0;
let _camStartX = 0, _camStartY = 0;

// Эффекты (частицы, вспышки, текст)
const effects = [];
function addEffect(eff) { effects.push(eff); }
function markDirty() { _isDirty = true; }

function getCanvas() { return _canvas; }
function getCtx() { return _ctx; }

function initRenderer() {
    _canvas = document.getElementById('game-canvas');
    if (!_canvas) {
        console.error('Canvas #game-canvas not found!');
        return;
    }
    _ctx = _canvas.getContext('2d');
    _dpr = window.devicePixelRatio || 1;
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Клик и панорама
    _canvas.addEventListener('pointerdown', (e) => {
        _isPointerDown = true;
        _isDragging = false;
        _dragStartX = e.clientX;
        _dragStartY = e.clientY;
        _camStartX = camera.x;
        _camStartY = camera.y;
        try { _canvas.setPointerCapture(e.pointerId); } catch(_) {}
    });
    _canvas.addEventListener('pointermove', (e) => {
        if (!_isPointerDown) return;
        const dx = e.clientX - _dragStartX;
        const dy = e.clientY - _dragStartY;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            _isDragging = true;
            camera.x = _camStartX - dx / camera.zoom;
            camera.y = _camStartY - dy / camera.zoom;
            markDirty();
        }
    });
    _canvas.addEventListener('pointerup', (e) => {
        if (!_isDragging && _isPointerDown) {
            const rect = _canvas.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const world = screenToWorld(sx, sy, _canvas, camera);
            const grid = worldToGrid(world.x, world.y);
            if (grid.gx >= 0 && grid.gx < GRID_W && grid.gy >= 0 && grid.gy < GRID_H) {
                handleCellClick(grid.gx, grid.gy);
            }
        }
        _isPointerDown = false;
        _isDragging = false;
    });
    _canvas.addEventListener('pointercancel', () => {
        _isPointerDown = false;
        _isDragging = false;
    });
    
    // Пинч-зум
    let _pinchStartDist = 0, _pinchStartZoom = 1;
    _canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            _pinchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            _pinchStartZoom = camera.zoom;
            _isPointerDown = false;
        }
    }, { passive: true });
    _canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (_pinchStartDist > 0) {
                camera.zoom = Math.max(0.3, Math.min(2.5, _pinchStartZoom * (dist / _pinchStartDist)));
                markDirty();
            }
        }
    }, { passive: false });
    _canvas.addEventListener('touchend', () => { _pinchStartDist = 0; });
    
    requestAnimationFrame(renderLoop);
}

function resizeCanvas() {
    if (!_canvas) return;
    const rect = _canvas.getBoundingClientRect();
    _dpr = window.devicePixelRatio || 1;
    _canvas.width = Math.max(1, Math.round(rect.width * _dpr));
    _canvas.height = Math.max(1, Math.round(rect.height * _dpr));
    markDirty();
}

function renderLoop() {
    if (_isDirty) {
        render();
        _isDirty = false;
    }
    requestAnimationFrame(renderLoop);
}

function render() {
    if (!_ctx || !_canvas || !G.map || G.map.length === 0) return;
    
    const cw = _canvas.getBoundingClientRect().width;
    const ch = _canvas.getBoundingClientRect().height;
    
    _ctx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
    _ctx.clearRect(0, 0, cw, ch);
    _ctx.fillStyle = '#000';
    _ctx.fillRect(0, 0, cw, ch);
    
    _ctx.save();
    _ctx.translate(cw / 2, ch / 2);
    _ctx.scale(camera.zoom, camera.zoom);
    _ctx.translate(-camera.x, -camera.y);
    
    // Видимая область в мировых координатах
    const viewLeft = camera.x - cw / (2 * camera.zoom) - TILE_W;
    const viewRight = camera.x + cw / (2 * camera.zoom) + TILE_W;
    const viewTop = camera.y - ch / (2 * camera.zoom) - TILE_H;
    const viewBottom = camera.y + ch / (2 * camera.zoom) + TILE_H;
    
    // Собираем всё для отрисовки (тайлы + существа), сортируем по глубине
    const drawList = [];
    
    for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
            const w = gridToWorld(gx, gy);
            if (w.x + TILE_W < viewLeft || w.x > viewRight) continue;
            if (w.y + TILE_H < viewTop || w.y > viewBottom) continue;
            drawList.push({ gx, gy, depth: gx + gy, type: 'tile' });
        }
    }
    
    G.pawns.forEach(p => {
        if (p.x >= 0 && p.hp > 0) {
            drawList.push({ gx: p.x, gy: p.y, depth: p.x + p.y + 0.5, type: 'pawn', data: p });
        }
    });
    
    G.enemies.forEach(en => {
        const cell = G.map[en.y] && G.map[en.y][en.x];
        if (cell && cell.currentVision) {
            drawList.push({ gx: en.x, gy: en.y, depth: en.x + en.y + 0.5, type: 'enemy', data: en });
        }
    });
    
    if (G.npcs) G.npcs.forEach(n => {
        const cell = G.map[n.y] && G.map[n.y][n.x];
        if (cell && cell.currentVision) {
            drawList.push({ gx: n.x, gy: n.y, depth: n.x + n.y + 0.5, type: 'npc', data: n });
        }
    });
    
    drawList.sort((a, b) => a.depth - b.depth);
    
    for (const item of drawList) {
        if (item.type === 'tile') drawTile(item.gx, item.gy);
        else if (item.type === 'pawn') drawEntity(item.gx, item.gy, '🧑‍🌾', '#fbc531');
        else if (item.type === 'enemy') drawEntity(item.gx, item.gy, item.data.icon, '#e84118');
        else if (item.type === 'npc') drawEntity(item.gx, item.gy, item.data.icon, '#8e44ad');
    }
    
    // Затемнение ночью
    if (typeof isNight === 'function' && isNight()) {
        _ctx.fillStyle = 'rgba(10, 20, 60, 0.45)';
        const vl = camera.x - cw / (2 * camera.zoom);
        const vt = camera.y - ch / (2 * camera.zoom);
        _ctx.fillRect(vl, vt, cw / camera.zoom, ch / camera.zoom);
    }
    
    // Превью постройки (Ghost)
    if (G.currentBuild && _isPointerDown === false) {
        let def = BUILDINGS[G.currentBuild.type] || { w: 1, h: 1, color: '#fff' };
        let bw = G.buildRotation ? def.h : def.w;
        let bh = G.buildRotation ? def.w : def.h;
        
        let mouseW = screenToWorld(_dragStartX - _canvas.getBoundingClientRect().left, _dragStartY - _canvas.getBoundingClientRect().top, _canvas, camera);
        let mouseG = worldToGrid(mouseW.x, mouseW.y);
        
        if (mouseG.gx >= 0 && mouseG.gx < 60 && mouseG.gy >= 0 && mouseG.gy < 60) {
            for(let dy=0; dy<bh; dy++) {
                for(let dx=0; dx<bw; dx++) {
                    let nx = mouseG.gx + dx, ny = mouseG.gy + dy;
                    if (nx < 60 && ny < 60) {
                        let ww = gridToWorld(nx, ny);
                        _ctx.beginPath();
                        _ctx.moveTo(ww.x, ww.y - TILE_H / 2);
                        _ctx.lineTo(ww.x + TILE_W / 2, ww.y);
                        _ctx.lineTo(ww.x, ww.y + TILE_H / 2);
                        _ctx.lineTo(ww.x - TILE_W / 2, ww.y);
                        _ctx.closePath();
                        _ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        _ctx.fill();
                        _ctx.strokeStyle = '#fff';
                        _ctx.stroke();
                    }
                }
            }
        }
    }
    
    // Эффекты
    for (let i = effects.length - 1; i >= 0; i--) {
        const eff = effects[i];
        eff.life -= 0.016;
        if (eff.life <= 0) { effects.splice(i, 1); continue; }
        const w = gridToWorld(eff.gx, eff.gy);
        drawEffect(w.x, w.y, eff);
    }
    
    _ctx.restore();
}

function getTileColor(cell) {
    if (!cell.explored) return '#000';
    if (cell.build === 'camp') return '#8e44ad';
    if (cell.build === 'wall_wood') return '#a0522d';
    if (cell.build === 'wall_stone') return '#95a5a6';
    if (cell.build === 'trap') return '#2c3e50';
    if (cell.build === 'hearth') return '#d35400';
    if (cell.build === 'field') return '#d4ac0d';
    if (cell.build === 'lazaret') return '#c0392b';
    if (cell.build === 'warehouse') return '#7f8c8d';
    if (cell.build === 'houses') return '#8e44ad';
    if (cell.build === 'master') return '#34495e';
    if (cell.build === 'great_hearth') return '#f1c40f';
    if (cell.build === 'road') return '#7f6f5f';
    if (cell.build === 'watchtower') return '#8b6f47';
    if (cell.build === 'campfire') return '#e67e22';
    if (cell.type === 'forest') return '#27ae60';
    if (cell.type === 'mountain') return '#7f8c8d';
    if (cell.type === 'water') return '#2980b9';
    if (cell.type === 'ford') return '#5dade2';
    if (cell.type === 'water_empty') return '#1b4f72';
    return '#a4b0be';
}

function getTileEmoji(cell) {
    if (!cell.explored) return '';
    if (cell.build === 'camp') return '🏕️';
    if (cell.build === 'wall_wood') return '🪵';
    if (cell.build === 'wall_stone') return '🪨';
    if (cell.build === 'trap') return '🕳️';
    if (cell.build === 'hearth') return '🔥';
    if (cell.build === 'field') return '🌾';
    if (cell.build === 'lazaret') return '⛑️';
    if (cell.build === 'warehouse') return '📦';
    if (cell.build === 'houses') return '🏠';
    if (cell.build === 'master') return '🛠️';
    if (cell.build === 'great_hearth') return '🏆';
    if (cell.build === 'road') return '🛤️';
    if (cell.build === 'watchtower') return '🗼';
    if (cell.build === 'campfire') return '🔥';
    if (cell.build === 'wall_multi_wood') return '🧱';
    if (cell.type === 'forest') return '🌲';
    if (cell.type === 'mountain') return '⛰️';
    if (cell.type === 'water') return '🌊';
    if (cell.type === 'ford') return '💧';
    return '';
}

function drawTile(gx, gy) {
    const cell = G.map[gy] && G.map[gy][gx];
    if (!cell) return;
    
    const w = gridToWorld(gx, gy);
    
    _ctx.beginPath();
    _ctx.moveTo(w.x, w.y - TILE_H / 2);
    _ctx.lineTo(w.x + TILE_W / 2, w.y);
    _ctx.lineTo(w.x, w.y + TILE_H / 2);
    _ctx.lineTo(w.x - TILE_W / 2, w.y);
    _ctx.closePath();
    
    // Если это часть здания
    if (cell.buildingId !== undefined) {
        let b = G.buildings.find(b => b.id === cell.buildingId);
        if (b) {
            let def = BUILDINGS[b.type] || { color: '#aaa' };
            _ctx.fillStyle = def.color || '#aaa';
            if (b.progress < b.maxProgress) _ctx.fillStyle = '#555'; // Строится
            _ctx.fill();
        } else {
            _ctx.fillStyle = getTileColor(cell);
            _ctx.fill();
        }
    } else {
        _ctx.fillStyle = getTileColor(cell);
        _ctx.fill();
    }
    
    // Пол внутри помещения
    if (cell.isFloor) {
        _ctx.fillStyle = '#c9b896';
        _ctx.fill();
    }
    
    if (cell.explored) {
        _ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        _ctx.lineWidth = 1;
        _ctx.stroke();
    }
    
    // Туман на разведанных, но невидимых
    if (cell.explored && !cell.currentVision) {
        _ctx.fillStyle = 'rgba(0,0,0,0.55)';
        _ctx.fill();
    }
    
    // Контент
    const emoji = getTileEmoji(cell);
    if (emoji && cell.currentVision !== false) {
        _ctx.font = '22px Arial';
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText(emoji, w.x, w.y);
    }
    
    // Иконка комнаты в центре
    if (G.rooms && cell.isFloor) {
        let room = G.rooms.find(r => r.cells.some(c => c.x === gx && c.y === gy));
        if (room && room.purpose) {
            let center = getRoomCenter(room);
            if (center.x === gx && center.y === gy) {
                _ctx.font = '28px Arial';
                _ctx.textAlign = 'center';
                _ctx.textBaseline = 'middle';
                _ctx.fillText(ROOM_PURPOSES[room.purpose].icon, w.x, w.y);
            }
        }
    }
    
    // Рендер двери
    if (cell.isDoor) {
        _ctx.font = '22px Arial';
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillText('🚪', w.x, w.y);
    }
    
    // Прогресс постройки
    if (cell.build) {
        const cost = getBuildCost(cell.build);
        if (cell.progress < cost.turns) {
            _ctx.font = 'bold 10px Arial';
            _ctx.fillStyle = '#fff';
            _ctx.textAlign = 'center';
            _ctx.textBaseline = 'middle';
            _ctx.fillText(`${cell.progress}/${cost.turns}`, w.x, w.y + 8);
        }
    }
}

function drawEntity(gx, gy, emoji, outlineColor) {
    const w = gridToWorld(gx, gy);
    _ctx.font = '24px Arial';
    _ctx.textAlign = 'center';
    _ctx.textBaseline = 'middle';
    
    // Тень под существом
    _ctx.fillStyle = 'rgba(0,0,0,0.4)';
    _ctx.beginPath();
    _ctx.ellipse(w.x, w.y + 8, 14, 6, 0, 0, Math.PI * 2);
    _ctx.fill();
    
    // Обводка
    if (outlineColor) {
        _ctx.strokeStyle = outlineColor;
        _ctx.lineWidth = 3;
        _ctx.strokeText(emoji, w.x, w.y);
    }
    
    _ctx.fillStyle = '#fff';
    _ctx.fillText(emoji, w.x, w.y);
}

function drawEffect(wx, wy, eff) {
    if (eff.type === 'boom') {
        const progress = 1 - (eff.life / eff.maxLife);
        const scale = 1 + progress * 2;
        _ctx.font = `${Math.round(32 * scale)}px Arial`;
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.globalAlpha = eff.life / eff.maxLife;
        _ctx.fillText('💥', wx, wy);
        _ctx.globalAlpha = 1;
    } else if (eff.type === 'text') {
        const progress = 1 - (eff.life / eff.maxLife);
        const y = wy - 20 - progress * 30;
        _ctx.font = 'bold 18px Arial';
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.globalAlpha = eff.life / eff.maxLife;
        _ctx.fillStyle = eff.color || '#e84118';
        _ctx.strokeStyle = '#000';
        _ctx.lineWidth = 3;
        _ctx.strokeText(eff.text, wx, y);
        _ctx.fillText(eff.text, wx, y);
        _ctx.globalAlpha = 1;
    }
}
