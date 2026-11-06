const GAME_VERSION = '53.0';
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
    'spear_stone': Object.assign(new Weapon('Каменное копье', '🗡️', 1, 1, 1), { costW: 1, costS: 1 }),
    'axe_stone': Object.assign(new Weapon('Каменный топор', '🪓', 2, 0, 1), { costW: 1, costS: 2 }),
    'bow': Object.assign(new Weapon('Лук', '🏹', 2, 1, 3), { costW: 2, costH: 1 }),
    'spear_copper': Object.assign(new Weapon('Медное копье', '🗡️', 2, 2, 1), { costW: 1, costC: 1 }),
    'axe_copper': Object.assign(new Weapon('Медный топор', '🪓', 3, 0, 1), { costW: 1, costC: 2 }),
    'armor_leather': Object.assign(new Armor('Кожаный доспех', '🛡️', 2), { costH: 2, costC: 1 }),
    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};

const WEAPONS = ITEMS; // Для обратной совместимости

function getMaxLevel() { return G.diff === 'easy' ? 3 : G.diff === 'normal' ? 5 : 7; }
function getNeededXp(lvl) { return [20, 40, 70, 110, 160, 220, 300][lvl] || 9999; }
function getBuildCost(type) {
    if(type === 'camp') return {w:0,s:0,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'wall_wood') return {w:2,s:0,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'wall_stone') return {w:3,s:2,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'trap') return {w:1,s:1,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'hearth') return {w:0,s:3,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'field') return {w:2,s:0,turns:3    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'lazaret') return {w:3,s:2,turns:2    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'warehouse') return {w:3,s:2,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'houses') return {w:4,s:3,turns:2    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'master') return {w:3,s:3,turns:2    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'great_hearth') return {w:15,s:15,turns:3, copper:8    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'road') return {w:0,s:1,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'watchtower') return {w:4,s:3,turns:2    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'campfire') return {w:1,s:2,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'wall_multi_wood') return {w:1,s:0,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    if(type === 'wall_multi_stone') return {w:6,s:4,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
    return {w:0,s:0,turns:1    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};
}


function getMoveCost(cell) {
    if (!cell) return 999;
    if (cell.type === 'water' || cell.type === 'mountain' || cell.type === 'water_empty') return 999;
    if (cell.build === 'wall_wood' || cell.build === 'wall_stone' || cell.build === 'trap') return 999;
    if (cell.buildingId !== undefined && !cell.isDoor) return 999;
    if (cell.build === 'road') return 0.33;
    if (cell.type === 'ford') return 2.0;
    let isMuddy = (G.weather === 'Паводок' || G.weather === 'Мороз');
    if (isMuddy && (cell.type === 'grass' || cell.type === 'forest')) return 2.0;
    return 1.0;
}

function isNight() {
    return ((G.round - 1) % 4) >= 2;
}

const BUILDINGS = {
    'camp': { name: 'Лагерь', w: 1, h: 1, icon: '🏕️', color: '#8e44ad' },
    'lazaret': { name: 'Лазарет', w: 2, h: 3, icon: '🏥', color: '#c0392b' },
    'warehouse': { name: 'Склад', w: 2, h: 2, icon: '🏬', color: '#7f8c8d' },
    'houses': { name: 'Хоромы', w: 3, h: 3, icon: '🏘️', color: '#8e44ad' },
    'master': { name: 'Мастерская', w: 2, h: 2, icon: '🏭', color: '#34495e' },
    'great_hearth': { name: 'Великий Очаг', w: 1, h: 1, icon: '🏆', color: '#f1c40f' }
    'potion': Object.assign(new Item('Зелье', '🧪'), { costW: 1, costH: 1, heal: 5 }),
    'arrows_stone': Object.assign(new Item('Стрелы (x5)', '🏹'), { costW: 1, costS: 1, ammo: 5 })
};

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
