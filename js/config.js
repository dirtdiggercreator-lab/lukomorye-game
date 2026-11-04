const SEASONS = ['Весна', 'Лето', 'Осень', 'Зима'];
const WEAPONS = {
    'fists': { name: 'Кулаки', acc: 0, dmg: 0 },
    'spear_stone': { name: 'Каменное копье', acc: 1, dmg: 1 },
    'axe_stone': { name: 'Каменный топор', acc: 0, dmg: 2 },
    'bow': { name: 'Лук', acc: 1, dmg: 2, ranged: true },
    'spear_copper': { name: 'Медное копье', acc: 2, dmg: 2 },
    'axe_copper': { name: 'Медный топор', acc: 0, dmg: 3 }
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
    if(type === 'lazaret') return {w:3,s:2,turns:2};
    if(type === 'warehouse') return {w:3,s:2,turns:1};
    if(type === 'houses') return {w:4,s:3,turns:2};
    if(type === 'master') return {w:3,s:3,turns:2};
    if(type === 'great_hearth') return {w:15,s:15,turns:3, copper:8};
    return {w:0,s:0,turns:1};
}
