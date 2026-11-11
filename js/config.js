const GAME_VERSION = '61.4';

const SEASONS = ['Весна', 'Лето', 'Осень', 'Зима'];

class Item {
    constructor(name, icon, quality = null) {
        this.name = name;
        this.icon = icon;
        this.quality = quality;
    }
}

class Weapon extends Item {
    constructor(name, icon, dmg, acc, range = 1) {
        super(name, icon);
        this.dmg = dmg;
        this.acc = acc;
        this.range = range;
    }
}

class Armor extends Item {
    constructor(name, icon, defense) {
        super(name, icon);
        this.defense = defense;
    }
}

class Resource extends Item {
    constructor(name, icon, amount = 0) {
        super(name, icon);
        this.amount = amount;
    }
}

const ITEMS = {
    'fists': new Weapon('Кулаки', '✊', 0, 0, 1),
    'spear_stone': Object.assign(new Weapon('Каменное копье', '🗡️', 1, 1, 1), { costW: 1, costS: 1 }),
    'axe_stone': Object.assign(new Weapon('Каменный топор', '🪓', 2, 0, 1), { costW: 1, costS: 2 }),
    'bow': Object.assign(new Weapon('Лук', '🏹', 2, 1, 3), { costW: 2, costH: 1 }),
    'spear_copper': Object.assign(new Weapon('Медное копье', '🗡️', 2, 2, 1), { costW: 1, costC: 1 }),
    'axe_copper': Object.assign(new Weapon('Медный топор', '🪓', 3, 0, 1), { costW: 1, costC: 2 }),
    'armor_leather': Object.assign(new Armor('Кожаный доспех', '🛡️', 2), { costH: 2, costC: 1 }),
    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'iron_sword': Object.assign(new Weapon('Железный меч', '⚔️', 4, 1, 1), { costW: 1, costI: 2 }),
    'iron_armor': Object.assign(new Armor('Железный доспех', '🛡️', 4), { costC: 1, costI: 3 }),
    'herbal_potion': Object.assign(new Item('Травяное зелье', '🧪'), { costH: 1, costHerbs: 1, heal: 10 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};

const WEAPONS = ITEMS;

const QUALITY_TIERS = {
    'poor':     { name: 'Плохое',     color: '#7f8c8d', mult: 0.8 },
    'normal':   { name: 'Нормальное', color: '#ecf0f1', mult: 1.0 },
    'good':     { name: 'Хорошее',    color: '#2ecc71', mult: 1.2 },
    'excellent':{ name: 'Отличное',   color: '#3498db', mult: 1.5 },
    'legendary':{ name: 'Легендарное',color: '#f1c40f', mult: 2.0 }
};

const LEGENDARY_PREFIXES = ['Перуна', 'Велеса', 'Стрибога', 'Сварога', 'Даждьбога', 'Мокоши', 'Ярило', 'Чернобога'];

const BUILDINGS = {
    'camp':         { name: 'Лагерь',        w: 2, h: 2, icon: '🏕️', color: '#8e44ad', maxProgress: 1, vision: 5 },
    'lazaret':      { name: 'Лазарет',       w: 2, h: 3, icon: '🏥', color: '#c0392b', maxProgress: 2, vision: 3 },
    'warehouse':    { name: 'Склад',         w: 2, h: 2, icon: '🏬', color: '#7f8c8d', maxProgress: 2, vision: 3 },
    'houses':       { name: 'Хоромы',        w: 3, h: 3, icon: '🏘️', color: '#8e44ad', maxProgress: 3, vision: 4 },
    'master':       { name: 'Мастерская',    w: 2, h: 2, icon: '🏭', color: '#34495e', maxProgress: 2, vision: 3 },
    'great_hearth': { name: 'Великий Очаг',  w: 3, h: 3, icon: '🏆', color: '#f1c40f', maxProgress: 3, vision: 8 },
    'watchtower':   { name: 'Вышка',         w: 2, h: 2, icon: '🗼', color: '#8b6f47', maxProgress: 2, vision: 4, visionNight: 8 },
    'campfire':     { name: 'Костёр',        w: 1, h: 1, icon: '🔥', color: '#e67e22', maxProgress: 1, vision: 2, visionNight: 5 },
    'hearth':       { name: 'Очаг',          w: 1, h: 1, icon: '🔥', color: '#d35400', maxProgress: 1, vision: 3 },
    'trap':         { name: 'Ловушка',       w: 1, h: 1, icon: '🕳️', color: '#2c3e50', maxProgress: 1, vision: 0 },
    'road':         { name: 'Дорога',        w: 1, h: 1, icon: '🛤️', color: '#7f6f5f', maxProgress: 1, vision: 0 },
    'wall_wood':    { name: 'Ограда',        w: 1, h: 1, icon: '🪵', color: '#a0522d', maxProgress: 1, vision: 0 },
    'wall_stone':   { name: 'Ограда',        w: 1, h: 1, icon: '🪨', color: '#95a5a6', maxProgress: 1, vision: 0 }
};

function getMaxLevel() { return G.diff === 'easy' ? 3 : G.diff === 'normal' ? 5 : 7; }
function getNeededXp(lvl) { return [20, 40, 70, 110, 160, 220, 300][lvl] || 9999; }

function getBuildCost(type) {
    if(type === 'camp') return {w:0,s:0,turns:1};
    if(type === 'wall_wood') return {w:2,s:0,turns:1};
    if(type === 'wall_stone') return {w:3,s:2,turns:1};
    if(type === 'trap') return {w:1,s:1,turns:1};
    if(type === 'hearth') return {w:0,s:3,turns:1};
    if(type === 'field') return {w:2,s:0,turns:3};
    if(type === 'lazaret') return {w:5,s:3,turns:2};
    if(type === 'warehouse') return {w:4,s:2,turns:2};
    if(type === 'houses') return {w:8,s:6,turns:3};
    if(type === 'master') return {w:4,s:4,turns:2};
    if(type === 'great_hearth') return {w:15,s:15,turns:3, copper:8};
    if(type === 'road') return {w:0,s:1,turns:1};
    if(type === 'watchtower') return {w:4,s:3,turns:2};
    if(type === 'campfire') return {w:1,s:2,turns:1};
    return {w:0,s:0,turns:1};
}

function getMoveCost(cell) {
    if (!cell) return 999;
    if (cell.type === 'water' || cell.type === 'mountain' || cell.type === 'water_empty') return 999;
    if (cell.build === 'wall_wood' || cell.build === 'wall_stone') return 999;
    if (cell.buildingId !== undefined && !cell.isDoor && G.buildings.find(b => b.id === cell.buildingId)?.type !== 'road') return 999;
    if (cell.build === 'road') return 0.33;
    if (cell.type === 'ford') return 2.0;
    let isMuddy = (G.weather === 'Паводок' || G.weather === 'Мороз');
    if (isMuddy && (cell.type === 'grass' || cell.type === 'forest')) return 2.0;
    return 1.0;
}

function isNight() { return ((G.round - 1) % 4) >= 2; }

function isNearBuilding(px, py, b) {
    for (let dy = 0; dy < b.h; dy++) {
        for (let dx = 0; dx < b.w; dx++) {
            let bx = b.x + dx;
            let by = b.y + dy;
            if (Math.max(Math.abs(px - bx), Math.abs(py - by)) <= 1) return true;
        }
    }
    return false;
}

function getQuality(craftStat) {
    let roll = Math.random() * 100;
    let quality = 'normal';
    
    if (craftStat <= 2) {
        quality = roll < 50 ? 'poor' : 'normal';
    } else if (craftStat <= 4) {
        if (roll < 20) quality = 'poor';
        else if (roll < 80) quality = 'normal';
        else quality = 'good';
    } else if (craftStat <= 6) {
        if (roll < 40) quality = 'normal';
        else if (roll < 80) quality = 'good';
        else quality = 'excellent';
    } else if (craftStat <= 8) {
        if (roll < 40) quality = 'good';
        else if (roll < 80) quality = 'excellent';
        else quality = 'legendary';
    } else {
        quality = roll < 50 ? 'excellent' : 'legendary';
    }
    
    return quality;
}

const DISEASES = ['Кровотечение', 'Простуда', 'Отравление', 'Перелом'];

function hasDisease(p, name) {
    return p.diseases && p.diseases.includes(name);
}

function getEffectiveAgi(p) {
    let agi = p.agi || 0;
    if (hasDisease(p, 'Простуда')) agi -= 1;
    return Math.max(0, agi);
}
