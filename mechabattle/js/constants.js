const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  GROUND_Y: 460,
  GRAVITY: 1800,
  MATCH_TIME: 99
};

const COLORS = {
  bg: '#1a1c2c',
  ground: '#2a2d3e',
  groundLight: '#3a3d52',
  p1: '#00d4ff',
  p1Dark: '#0099cc',
  p2: '#ff3864',
  p2Dark: '#cc2244',
  shield: '#ffe600',
  text: '#ffffff',
  textDim: '#8899aa'
};

const KEYS = {
  p1: { left: 'KeyA', right: 'KeyD', jump: 'KeyW', attack: 'KeyF', defend: 'KeyG' },
  p2: { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', attack: 'Numpad1', defend: 'Numpad2' }
};

const MECHA = {
  width: 48,
  height: 64,
  speed: 220,
  jumpForce: 520,
  maxHp: 100,
  attackDmg: 12,
  attackCooldown: 0.5,
  defendReduction: 0.7,
  defendMaxTime: 3.0,
  hitStun: 0.3
};
