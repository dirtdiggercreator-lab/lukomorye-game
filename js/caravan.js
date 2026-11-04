function sendCaravan(distance) {
    if(G.ap < 1 || G.res.meat < distance) return alert("Нужно " + distance + " ОД и " + distance + " еды!");
    if(G.pawns.filter(pw => pw.x !== -1 && pw.hp > 0).length === 1) return alert("Нельзя отправить последнюю пешку!");
    G.ap -= distance; if (G.ap < 0) G.ap = 0;
    G.res.meat -= distance;
    let p = G.pawns[G.activePawnIndex];
    p.x = -1; p.caravanTimer = distance;
    addLog(`${p.name} отправляется в караван на ${distance} ходов.`);
    closeModal('caravan-modal');
    updateUI(); renderMap();
}
