// ============================================================
// КАМЕРА
// ============================================================

const camera = {
    x: 0,      // центр экрана в мировых координатах
    y: 960,    // спавн пешки (30,30) = wx=0, wy=960
    zoom: 1.0
};

function centerCameraOnPawn() {
    const p = G.pawns[G.activePawnIndex];
    if (!p || p.x === -1) return;
    const w = gridToWorld(p.x, p.y);
    camera.x = w.x;
    camera.y = w.y;
    markDirty();
}

function zoomCamera(amount) {
    camera.zoom = Math.max(0.3, Math.min(2.5, camera.zoom + amount));
    markDirty();
}

// Обёртка для совместимости со старым кодом
function zoomMap(amount) { zoomCamera(amount); }
