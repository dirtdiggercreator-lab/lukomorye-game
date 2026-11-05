// ============================================================
// ИЗОМЕТРИЧЕСКАЯ МАТЕМАТИКА
// grid (gx,gy) → world (wx,wy) → screen (sx,sy)
// ============================================================

const TILE_W = 64;
const TILE_H = 32;
const GRID_W = 60;
const GRID_H = 60;

function gridToWorld(gx, gy) {
    return {
        x: (gx - gy) * (TILE_W / 2),
        y: (gx + gy) * (TILE_H / 2)
    };
}

function worldToGrid(wx, wy) {
    // Обратное преобразование
    const gx = (wy / (TILE_H / 2) + wx / (TILE_W / 2)) / 2;
    const gy = (wy / (TILE_H / 2) - wx / (TILE_W / 2)) / 2;
    return { gx: Math.floor(gx), gy: Math.floor(gy) };
}

function worldToScreen(wx, wy, canvas, camera) {
    const cw = canvas.getBoundingClientRect().width;
    const ch = canvas.getBoundingClientRect().height;
    return {
        x: (wx - camera.x) * camera.zoom + cw / 2,
        y: (wy - camera.y) * camera.zoom + ch / 2
    };
}

function screenToWorld(sx, sy, canvas, camera) {
    const cw = canvas.getBoundingClientRect().width;
    const ch = canvas.getBoundingClientRect().height;
    return {
        x: (sx - cw / 2) / camera.zoom + camera.x,
        y: (sy - ch / 2) / camera.zoom + camera.y
    };
}
