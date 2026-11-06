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
    }
    
    p.inventory.push(newItem);
    addLog(`${p.name} крафтит: ${newItem.name}.`, false, true);
    showToast(`В рюкзак: ${newItem.name}`, 'success');
    updateUI(); closeModal('craft-modal');
}
