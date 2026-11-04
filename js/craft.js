function doCraft(item, costW, costH, costS, costC, costArrows) {
    if(G.res.wood < costW || G.res.hide < costH || G.res.stone < costS || G.res.copper < costC) {
        return alert("Не хватает ресурсов!");
    }
    let p = G.pawns[G.activePawnIndex];
    G.res.wood -= costW; G.res.hide -= costH; G.res.stone -= costS; G.res.copper -= costC;
    if(item === 'armor') { p.armor += 2; p.maxHp += 2; p.hp += 2; }
    else if(item === 'arrows_stone') { p.arrows = Math.min(p.maxArrows || 2, (p.arrows || 0) + 5); }
    else if(item === 'quiver') { p.maxArrows = 5; }
    else if(item === 'potion') { p.hp = Math.min(p.maxHp, p.hp + 5); }
    else if (WEAPONS[item]) { p.weapon = item; }
    addLog(`${p.name} крафтит ${item}.`, false, true);
    updateUI(); closeModal('craft-modal');
}
