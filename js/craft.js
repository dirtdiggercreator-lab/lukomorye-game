function doCraft(item, costW, costH, costS, costC, costArrows) {
    if(G.res.wood < costW || G.res.hide < costH || G.res.stone < costS || G.res.copper < costC) {
        return showToast("Не хватает ресурсов!", "danger");
    }
    let p = G.pawns[G.activePawnIndex];
    G.res.wood -= costW; G.res.hide -= costH; G.res.stone -= costS; G.res.copper -= costC;
    
    let itemNames = {
        'spear_stone': 'каменное копье', 'axe_stone': 'каменный топор', 'bow': 'лук',
        'arrows_stone': 'каменные стрелы', 'armor_leather': 'кожаный доспех', 'quiver': 'колчан',
        'potion': 'зелье', 'spear_copper': 'медное копье', 'axe_copper': 'медный топор'
    };
    
    if(item === 'armor_leather') { p.armorItem = ITEMS['armor_leather']; }
    else if(item === 'arrows_stone') { p.arrows = Math.min(p.maxArrows || 2, (p.arrows || 0) + 5); }
    else if(item === 'quiver') { p.maxArrows = 5; }
    else if(item === 'potion') { p.hp = Math.min(p.maxHp, p.hp + 5); p.diseases = []; }
    else if (ITEMS[item]) { p.weapon = ITEMS[item]; }
    
    let itemName = itemNames[item] || item;
    addLog(`${p.name} крафтит: ${itemName}.`, false, true);
    showToast(`Создано: ${itemName}`, 'success');
    updateUI(); closeModal('craft-modal');
}
