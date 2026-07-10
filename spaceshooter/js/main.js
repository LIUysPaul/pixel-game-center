class InputManager {
  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
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
    this.scene.update(dt, this.input);
    this.scene.render(this.ctx);
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  canvas.width = GAME.WIDTH;
  canvas.height = GAME.HEIGHT;
  const engine = new GameEngine(canvas);
    window.__engine = engine;
    engine.start();
});
