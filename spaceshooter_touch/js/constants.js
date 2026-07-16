const GAME = {
  WIDTH: 540,
  HEIGHT: 720,
  FPS: 60
};

const C = {
  bg: '#0a0015',
  bg2: '#13002a',
  player: '#00ffff',
  playerDark: '#0099bb',
  playerCore: '#ffffff',
  thrust: '#ff6600',
  bullet: '#ffff00',
  bulletGlow: '#ffaa00',
  enemyBullet: '#ff00aa',
  enemyBulletGlow: '#ff0066',
  enemy1: '#888888',
  enemy2: '#ff4444',
  enemy3: '#aa44ff',
  boss: '#ff0066',
  bossDark: '#990033',
  itemPower: '#ffd700',
  itemLife: '#ff4444',
  itemBomb: '#4488ff',
  text: '#ffffff',
  textCyan: '#00ffff',
  textGold: '#ffd700',
  textPink: '#ff00aa',
  star1: '#ffffff',
  star2: '#aaaaff',
  star3: '#555588',
  laserOrange: '#ff8800',
  laserYellow: '#ffdd00'
};

const PLAYER = {
  size: 20,
  speed: 300,
  fireRate: 0.15,
  maxLives: 5,
  maxWeaponLevel: 5,
  startBombs: 3,
  invulnTime: 1.5,
  hitRadius: 6,
  laserWidth: 8,
  laserDamage: 10,
  laserRange: 200
};

const ENEMY_TYPES = {
  small: { hp: 1, size: 16, speed: 150, score: 100, color: C.enemy1, shootRate: 0, dropChance: 0.05 },
  shooter: { hp: 3, size: 22, speed: 100, score: 250, color: C.enemy2, shootRate: 1.5, dropChance: 0.15 },
  heavy: { hp: 6, size: 30, speed: 60, score: 500, color: C.enemy3, shootRate: 1.0, dropChance: 0.30 },
  boss: { hp: 100, size: 80, speed: 30, score: 5000, color: C.boss, shootRate: 0.4, dropChance: 1.0 },
  back_small: { hp: 2, size: 14, speed: 200, score: 200, color: '#ff8844', shootRate: 0, dropChance: 0.10 },
  minion_orange: { hp: 2, size: 16, speed: 100, score: 150, color: '#ff8844', shootRate: 2.0, dropChance: 0.05 },
  minion_purple: { hp: 3, size: 20, speed: 80, score: 200, color: '#cc66ff', shootRate: 1.5, dropChance: 0.08 }
};

const ITEM_TYPES = {
  power: { color: C.itemPower, size: 12 },
  life: { color: C.itemLife, size: 12 },
  bomb: { color: C.itemBomb, size: 12 }
};
