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
