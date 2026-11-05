const SEASONS = ['Весна', 'Лето', 'Осень', 'Зима'];

class Item {
    constructor(name, icon, quality = 'Обычное') {
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

// Инициализация предметов
const ITEMS = {
    'fists': new Weapon('Кулаки', '✊', 0, 0, 1),
    'spear_stone': new Weapon('Каменное копье', '🗡️', 1, 1, 1),
    'axe_stone': new Weapon('Каменный топор', '🪓', 2, 0, 1),
    'bow': new Weapon('Лук', '🏹', 2, 1, 3),
    'spear_copper': new Weapon('Медное копье', '🗡️', 2, 2, 1),
    'axe_copper': new Weapon('Медный топор', '🪓', 3, 0, 1),
    'armor_leather': new Armor('Кожаный доспех', '🛡️', 2)
};

const WEAPONS = ITEMS; // Для обратной совместимости

function getMaxLevel() { return G.diff === 'easy' ? 3 : G.diff === 'normal' ? 5 : 7; }
function getNeededXp(lvl) { return [20, 40, 70, 110, 160, 220, 300][lvl] || 9999; }
function getBuildCost(type) {
    if(type === 'camp') return {w:0,s:0,turns:1};
    if(type === 'wall_wood') return {w:2,s:0,turns:1};
    if(type === 'wall_stone') return {w:3,s:2,turns:1};
    if(type === 'trap') return {w:1,s:1,turns:1};
    if(type === 'hearth') return {w:0,s:3,turns:1};
    if(type === 'field') return {w:2,s:0,turns:3};
    if(type === 'lazaret') return {w:3,s:2,turns:2};
    if(type === 'warehouse') return {w:3,s:2,turns:1};
    if(type === 'houses') return {w:4,s:3,turns:2};
    if(type === 'master') return {w:3,s:3,turns:2};
    if(type === 'great_hearth') return {w:15,s:15,turns:3, copper:8};
    return {w:0,s:0,turns:1};
}
