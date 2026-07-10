const GAME = {
  WIDTH: 800,
  HEIGHT: 600,
  TILE: 32,
  DUNGEON_W: 40,
  DUNGEON_H: 30,
  VIEW_W: 800,
  VIEW_H: 600
};

const TILE = {
  EMPTY: 0,
  WALL: 1,
  FLOOR: 2,
  DOOR: 3,
  STAIRS: 4
};

const COLORS = {
  wall: '#3d2b1f',
  wallDark: '#2a1d15',
  floor: '#1a2e1a',
  floorLight: '#223822',
  floorDark: '#142214',
  door: '#8b5a2b',
  stairs: '#ffd700',
  fog: '#000000',
  hpBar: '#ff4444',
  xpBar: '#4488ff',
  text: '#ffffff',
  textGold: '#ffd700'
};

const PLAYER = {
  size: 20,
  hp: 100,
  maxHp: 100,
  atk: 15,
  speed: 160,
  atkRange: 48,
  atkCooldown: 0.4,
  xpToLevel: [0, 50, 120, 210, 320, 450, 600, 770, 960, 1200]
};

const ENEMIES = {
  slime: { name: '史莱姆', hp: 30, atk: 8, speed: 60, size: 18, color: '#44cc44', xp: 15 },
  skeleton: { name: '骷髅兵', hp: 50, atk: 12, speed: 90, size: 20, color: '#dddddd', xp: 25 },
  bat: { name: '蝙蝠', hp: 20, atk: 6, speed: 130, size: 14, color: '#cc8844', xp: 12 },
  boss: { name: '地牢守卫', hp: 200, atk: 20, speed: 50, size: 36, color: '#aa44cc', xp: 200 }
};

const ITEMS = {
  potion: { name: '生命药水', heal: 30, color: '#ff4444', size: 10 },
  gem: { name: '经验宝石', xp: 50, color: '#4488ff', size: 8 },
  chest: { name: '宝箱', color: '#ffd700', size: 14 }
};
