function doCraft(item, costW, costH, costS, costC, costArrows) {
    if(G.res.wood < costW || G.res.hide < costH || G.res.stone < costS || G.res.copper < costC) {
        return showToast("Не хватает ресурсов!", "danger");
    }
    let p = G.pawns[G.activePawnIndex];
    initInventory(p);
    if (p.inventory.length >= MAX_INVENTORY) return showToast("Рюкзак полон!", "danger");
    
    G.res.wood -= costW; G.res.hide -= costH; G.res.stone -= costS; G.res.copper -= costC;
    
    let baseItem = ITEMS[item];
    if (!baseItem) return;
    
    // Клонируем предмет
    let newItem = Object.assign(Object.create(Object.getPrototypeOf(baseItem)), baseItem);
    
    if (item === 'potion') {
        newItem.name = 'Зелье';
        newItem.heal = 5;
    } else if (item === 'arrows_stone') {
        newItem.name = 'Стрелы (x5)';
        newItem.ammo = 5;
    } else {
        // Генерируем качество для экипировки
        let qKey = getQuality(p.craft || 1);
        let q = QUALITY_TIERS[qKey];
        newItem.quality = qKey;
        
        // Применяем множители
        if (newItem.dmg !== undefined) newItem.dmg = Math.max(1, Math.round(newItem.dmg * q.mult));
        if (newItem.acc !== undefined) newItem.acc = Math.max(1, Math.round(newItem.acc * q.mult));
        if (newItem.defense !== undefined) newItem.defense = Math.max(1, Math.round(newItem.defense * q.mult));
        
        // Легендарное имя
        if (qKey === 'legendary') {
            let prefix = LEGENDARY_PREFIXES[Math.floor(Math.random() * LEGENDARY_PREFIXES.length)];
            newItem.name = newItem.name + ' ' + prefix;
        }
        
        // Прокачка ремесла
        p.craftXp = (p.craftXp || 0) + 1;
        if (p.craftXp >= 5) {
            p.craftXp = 0;
            if (!p.craft) p.craft = 1;
            p.craft++;
            addLog(`⚒️ ${p.name}: Ремесло повысилось до ${p.craft}!`, false, true);
            showToast(`⚒️ Ремесло: ${p.craft}!`, 'success');
        }
    }
    
    p.inventory.push(newItem);
    
    let qLabel = newItem.quality ? ` [${QUALITY_TIERS[newItem.quality].name}]` : '';
    addLog(`${p.name} крафтит: ${newItem.name}${qLabel}.`, false, true);
    showToast(`Создано: ${newItem.name}`, 'success');
    updateUI(); closeModal('craft-modal');
}
