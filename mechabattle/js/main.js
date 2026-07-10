class InputManager {
  constructor() {
    this.keys = new Set();
    this.prevKeys = new Set();
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      // Prevent scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  isPressed(code) {
    return this.keys.has(code);
  }

  wasPressed(code) {
    return this.keys.has(code) && !this.prevKeys.has(code);
  }

  update() {
    this.prevKeys = new Set(this.keys);
  }
}

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new InputManager();
    this.scene = new MenuScene(this);
    this.lastTime = 0;
    this.running = false;
  }

  setScene(scene) {
    this.scene = scene;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.input.update();
    this.scene.update(dt, this.input);
    this.scene.render(this.ctx);

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  // Fix canvas resolution for crisp pixels
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = GAME.WIDTH * dpr;
  canvas.height = GAME.HEIGHT * dpr;
  canvas.style.width = GAME.WIDTH + 'px';
  canvas.style.height = GAME.HEIGHT + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;

  // Reset canvas for engine
  canvas.width = GAME.WIDTH;
  canvas.height = GAME.HEIGHT;

  const engine = new GameEngine(canvas);
  engine.start();
});
