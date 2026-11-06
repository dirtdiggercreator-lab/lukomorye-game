// ============================================================
// ИНВЕНТАРЬ И РАЗБОР
// ============================================================

const MAX_INVENTORY = 10;

function initInventory(p) {
    if (!p.inventory) p.inventory = [];
}

function addItemToInventory(p, item) {
    initInventory(p);
    if (p.inventory.length >= MAX_INVENTORY) {
        showToast("Рюкзак полон!", "danger");
        return false;
    }
    p.inventory.push(item);
    return true;
}

function openInventoryModal() {
    let p = G.pawns[G.activePawnIndex];
    initInventory(p);
    
    let html = '';
    
    // Экипировано
    html += `<div style="margin-bottom: 10px; padding: 5px; background: #222; border-radius: 5px;">`;
    html += `<div style="color: var(--accent); font-weight: bold; margin-bottom: 5px;">Надето:</div>`;
    let wColor = p.weapon && p.weapon.quality ? QUALITY_TIERS[p.weapon.quality].color : '#fff';
    let aColor = p.armorItem && p.armorItem.quality ? QUALITY_TIERS[p.armorItem.quality].color : '#fff';
    html += `<div style="color: ${wColor};">🗡️ Оружие: ${p.weapon ? p.weapon.name : 'Кулаки'}</div>`;
    html += `<div style="color: ${aColor};">🛡️ Броня: ${p.armorItem ? p.armorItem.name : 'Нет'}</div>`;
    html += `</div>`;
    
    // Рюкзак
    html += `<div style="color: var(--accent); font-weight: bold; margin-bottom: 5px;">Рюкзак (${p.inventory.length}/${MAX_INVENTORY}):</div>`;
    
    if (p.inventory.length === 0) {
        html += `<div style="color: #888; font-style: italic; text-align: center; padding: 10px;">Пусто</div>`;
    } else {
        p.inventory.forEach((item, i) => {
            let color = item.quality ? QUALITY_TIERS[item.quality].color : '#ecf0f1';
            let isLegend = item.quality === 'legendary' ? ' ✨' : '';
            let fw = item.quality === 'legendary' ? 'bold' : 'normal';
            
            html += `<div style="display: flex; justify-content: space-between; align-items: center; background: #333; padding: 8px; margin-bottom: 5px; border-radius: 5px;">`;
            html += `<div style="color: ${color}; font-weight: ${fw};">${item.icon || '📦'} ${item.name}${isLegend}</div>`;
            html += `<div style="display: flex; gap: 5px;">`;
            
            if (item instanceof Weapon || item instanceof Armor) {
                html += `<button class="btn" style="padding: 4px 8px; font-size: 12px; background: #2980b9;" onclick="equipItem(${i})">Надеть</button>`;
            }
            
            if (item.costW !== undefined || item.costH !== undefined || item.costS !== undefined) {
                html += `<button class="btn" style="padding: 4px 8px; font-size: 12px; background: #c0392b;" onclick="disassembleItem(${i})">Разобрать</button>`;
            }
            html += `</div></div>`;
        });
    }
    
    document.getElementById('inv-body').innerHTML = html;
    openModal('inventory-modal');
}

function equipItem(index) {
    let p = G.pawns[G.activePawnIndex];
    let item = p.inventory[index];
    if (!item) return;
    
    if (item instanceof Weapon) {
        if (p.weapon && p.weapon.name !== 'Кулаки') {
            p.inventory.push(p.weapon); // Старое оружие в рюкзак
        }
        p.weapon = item;
        p.inventory.splice(index, 1);
    } else if (item instanceof Armor) {
        if (p.armorItem) {
            p.inventory.push(p.armorItem);
        }
        p.armorItem = item;
        p.inventory.splice(index, 1);
    }
    showToast("Экипировано!", "success");
    openInventoryModal();
}

function disassembleItem(index) {
    let p = G.pawns[G.activePawnIndex];
    let item = p.inventory[index];
    if (!item) return;
    if (G.ap <= 0) return showToast("Нет ОД!", "danger");
    
    G.ap--;
    // Возврат 50% ресурсов
    if (item.costW > 0) G.res.wood += Math.max(1, Math.floor(item.costW * 0.5));
    if (item.costS > 0) G.res.stone += Math.max(1, Math.floor(item.costS * 0.5));
    if (item.costH > 0) G.res.hide += Math.max(1, Math.floor(item.costH * 0.5));
    if (item.costC > 0) G.res.copper += Math.max(1, Math.floor(item.costC * 0.5));
    
    p.inventory.splice(index, 1);
    showToast(`Разобрано: ${item.name}`, "success");
    addLog(`${p.name} разобрал ${item.name}`);
    updateUI();
    openInventoryModal();
}

function demolishBuilding(id) {
    let b = G.buildings.find(bb => bb.id === id);
    if (!b) return;
    let p = G.pawns[G.activePawnIndex];
    if (!isNearBuilding(p.x, p.y, b)) return showToast("Слишком далеко!", "danger");
    if (G.ap <= 0) return showToast("Нет ОД!", "danger");
    
    G.ap--;
    let def = BUILDINGS[b.type] || { w: 0, s: 0 };
    let cost = getBuildCost(b.type);
    
    // Возврат 50%
    G.res.wood += Math.max(1, Math.floor(cost.w * 0.5));
    G.res.stone += Math.max(1, Math.floor(cost.s * 0.5));
    
    // Удаляем тайлы
    for(let dy=0; dy<b.h; dy++) {
        for(let dx=0; dx<b.w; dx++) {
            G.map[b.y+dy][b.x+dx].buildingId = undefined;
            G.map[b.y+dy][b.x+dx].isDoor = undefined;
        }
    }
    
    G.buildings = G.buildings.filter(bb => bb.id !== id);
    showToast(`${def.name || b.type} снесено!`, "success");
    addLog(`Снесено: ${def.name || b.type}`);
    document.getElementById('action-modal').style.display = 'none';
    updateUI(); markDirty(); updateVision();
}
