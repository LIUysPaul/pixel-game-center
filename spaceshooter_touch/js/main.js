class InputManager {
  constructor(canvas) {
    this.keys = new Set();
    this.canvas = canvas;
    this.touchX = null;
    this.touchY = null;
    this.touchActive = false;
    this.bombPressed = false;
    this.tapStart = false;
    this.bombQueued = false;

    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code) && e.code === 'Space') {
        this.bombQueued = true;
      }
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.setupTouchControls();
  }

  setupTouchControls() {
    const canvas = this.canvas;

    const getTouchPos = (touch) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    };

    const onTouchStart = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const pos = getTouchPos(touch);
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.id === 'bomb-btn') {
          this.bombPressed = true;
        } else {
          this.touchX = pos.x;
          this.touchY = pos.y;
          this.touchActive = true;
          this.tapStart = true;
        }
      }
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const pos = getTouchPos(touch);
        if (this.touchActive) {
          this.touchX = pos.x;
          this.touchY = pos.y;
          this.tapStart = false;
        }
      }
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.id === 'bomb-btn') {
          this.bombPressed = false;
        } else {
          this.touchActive = false;
          this.touchX = null;
          this.touchY = null;
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

    const bombBtn = document.getElementById('bomb-btn');
    if (bombBtn) {
      bombBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.bombPressed = true;
        this.bombQueued = true;
      }, { passive: false });
      bombBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.bombPressed = false;
      }, { passive: false });
    }
  }

  isPressed(code) {
    return this.keys.has(code);
  }

  consumeBomb() {
    if (this.bombQueued || (this.bombPressed && !this._bombConsumed)) {
      this.bombQueued = false;
      this._bombConsumed = true;
      return true;
    }
    if (!this.bombPressed) this._bombConsumed = false;
    return false;
  }

  getTouchPos() {
    if (!this.touchActive) return null;
    return { x: this.touchX, y: this.touchY };
  }

  consumeTap() {
    if (this.tapStart) {
      this.tapStart = false;
      return true;
    }
    return false;
  }
}

class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new InputManager(canvas);
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
