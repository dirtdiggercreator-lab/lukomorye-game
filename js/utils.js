function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function d6() { return rnd(1, 6); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function addLog(text, isDanger = false, isSuccess = false) {
    let colorClass = isDanger ? 'log-danger' : (isSuccess ? 'log-success' : '');
    logs.push({ turn: G.round, text });
    let box = document.getElementById('log-box');
    if (!box) return;
    box.innerHTML += `<div class="log-msg ${colorClass}">[Ход ${G.round}] ${text}</div>`;
    box.scrollTop = box.scrollHeight;
}

function downloadLogs() {
    if(logs.length === 0) return alert("Логов нет.");
    let data = JSON.stringify(logs, null, 2);
    let dl = document.createElement('a'); 
    dl.href = "data:text/json;charset=utf-8," + encodeURIComponent(data); 
    dl.download = "lukomorye_logs.json"; 
    dl.click();
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function saveGame() {
    if (isMoving || G.inCombat) {
        alert("Нельзя сохраняться во время боя или движения!");
        return;
    }
    let saveData = { G: G, logs: logs };
    localStorage.setItem('lukomorye_save', JSON.stringify(saveData));
    addLog("💾 Игра сохранена.");
}

function loadGame() {
    let saveStr = localStorage.getItem('lukomorye_save');
    if (!saveStr) return alert("Сохранение не найдено!");
    let saveData = JSON.parse(saveStr);
    G = saveData.G;
    
    migrateSave();
    logs = saveData.logs;
    
    closeModal('menu-modal');
    closeModal('diff-modal');
    
    document.getElementById('top-panel').style.display = 'flex';
    document.getElementById('pawn-bar').style.display = 'flex';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('zoom-controls').style.display = 'flex';
    document.getElementById('bottom-panel').style.display = 'flex';
    
    let box = document.getElementById('log-box');
    box.innerHTML = '';
    logs.forEach(l => {
        box.innerHTML += `<div class="log-msg">[Ход ${l.turn}] ${l.text}</div>`;
    });
    
    updateUI(); updateVision(); renderMap(); renderPawnBar();
    setTimeout(centerCameraOnPawn, 100);
    addLog("Игра загружена.");
}

function checkSaveExists() {
    if (localStorage.getItem('lukomorye_save')) {
        document.getElementById('btn-continue').style.display = 'block';
    }
}

window.addEventListener('load', checkSaveExists);

function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) return;
    let toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function migrateSave() {
    // Если загрузили старый сейв, где armor это число, а weapon - строка
    if (G.res.coins === undefined) G.res.coins = 5;
    if (G.res.iron === undefined) G.res.iron = 0;
    if (G.res.herbs === undefined) G.res.herbs = 0;
    G.pawns.forEach(p => {
        if (!p.inventory) p.inventory = [];
        p.craftXp = p.craftXp || 0;
        if (typeof p.armor === 'number') {
            p.armorItem = p.armor > 0 ? ITEMS['armor_leather'] : null;
            delete p.armor;
        }
        if (typeof p.weapon === 'string') {
            p.weapon = ITEMS[p.weapon] || ITEMS['fists'];
        }
    });
}
