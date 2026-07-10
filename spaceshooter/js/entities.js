// ===== Player =====
class Player {
  constructor() {
    this.x = GAME.WIDTH / 2;
    this.y = GAME.HEIGHT - 100;
    this.lives = 3;
    this.weaponLevel = 1;
    this.bombs = PLAYER.startBombs;
    this.fireTimer = 0;
    this.invuln = 0;
    this.dead = false;
    this.animTimer = 0;
  }

  update(dt, input, bullets, particles) {
    this.fireTimer -= dt;
    this.invuln -= dt;
    this.animTimer += dt;

    let dx = 0, dy = 0;
    if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) dx -= 1;
    if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) dx += 1;
    if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) dy -= 1;
    if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
    }
    this.x += dx * PLAYER.speed * dt;
    this.y += dy * PLAYER.speed * dt;

    // Bounds
    this.x = Math.max(PLAYER.size / 2, Math.min(GAME.WIDTH - PLAYER.size / 2, this.x));
    this.y = Math.max(PLAYER.size / 2, Math.min(GAME.HEIGHT - PLAYER.size / 2, this.y));

    // Auto fire
    if (this.fireTimer <= 0) {
      this.fireTimer = PLAYER.fireRate;
      this.shoot(bullets);
    }

    // Engine thrust particles
    particles.thrust(this.x, this.y + 8);
  }

  shoot(bullets) {
    const x = this.x, y = this.y - 10;
    const spd = 600;
    switch (this.weaponLevel) {
      case 1:
        bullets.addPlayerBullet(x, y, 0, -spd);
        break;
      case 2:
        bullets.addPlayerBullet(x - 6, y, 0, -spd);
        bullets.addPlayerBullet(x + 6, y, 0, -spd);
        break;
      case 3:
        bullets.addPlayerBullet(x, y, 0, -spd);
        bullets.addPlayerBullet(x - 8, y, -80, -spd);
        bullets.addPlayerBullet(x + 8, y, 80, -spd);
        break;
      case 4:
        bullets.addPlayerBullet(x - 6, y, 0, -spd);
        bullets.addPlayerBullet(x + 6, y, 0, -spd);
        bullets.addPlayerBullet(x - 10, y, -120, -spd);
        bullets.addPlayerBullet(x + 10, y, 120, -spd);
        break;
      case 5:
        bullets.addPlayerBullet(x, y, 0, -spd);
        bullets.addPlayerBullet(x - 6, y, -40, -spd);
        bullets.addPlayerBullet(x + 6, y, 40, -spd);
        bullets.addPlayerBullet(x - 12, y, -150, -spd);
        bullets.addPlayerBullet(x + 12, y, 150, -spd);
        break;
    }
  }

  hit() {
    if (this.invuln > 0) return false;
    this.lives--;
    this.invuln = PLAYER.invulnTime;
    if (this.weaponLevel > 1) this.weaponLevel--;
    if (this.lives <= 0) this.dead = true;
    return true;
  }

  render(ctx) {
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.floor(this.x), Math.floor(this.y));

    // Ship pixel art (20x20)
    // Body
    ctx.fillStyle = C.player;
    ctx.fillRect(-2, -10, 4, 4);
    ctx.fillRect(-6, -6, 12, 10);
    ctx.fillRect(-10, -2, 20, 6);
    ctx.fillRect(-4, 4, 8, 4);

    // Darker shading
    ctx.fillStyle = C.playerDark;
    ctx.fillRect(-6, 0, 12, 4);
    ctx.fillRect(-10, 0, 4, 4);
    ctx.fillRect(6, 0, 4, 4);

    // Core
    ctx.fillStyle = C.playerCore;
    ctx.fillRect(-1, -4, 2, 4);
    ctx.fillRect(-2, -2, 4, 2);

    // Wing tips
    ctx.fillStyle = C.player;
    ctx.fillRect(-12, 2, 4, 2);
    ctx.fillRect(8, 2, 4, 2);

    // Engine glow
    const glow = 0.5 + Math.sin(this.animTimer * 20) * 0.3;
    ctx.fillStyle = `rgba(255, 100, 0, ${glow})`;
    ctx.fillRect(-3, 8, 6, 4);
    ctx.fillStyle = `rgba(255, 200, 0, ${glow * 0.8})`;
    ctx.fillRect(-2, 8, 4, 2);

    ctx.restore();
  }
}

// ===== Enemy =====
class Enemy {
  constructor(type, x, y) {
    const data = ENEMY_TYPES[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.size = data.size;
    this.speed = data.speed;
    this.score = data.score;
    this.color = data.color;
    this.shootRate = data.shootRate;
    this.dropChance = data.dropChance;
    this.shootTimer = 0.5 + Math.random();
    this.dead = false;
    this.animTimer = 0;
    this.t = 0;
    this.startX = x;
    this.bossPhase = 0;
    this.bossTimer = 0;
  }

  update(dt, player, bullets) {
    this.t += dt;
    this.animTimer += dt;
    this.shootTimer -= dt;

    if (this.type === 'boss') {
      // Boss movement: stay near top, move side to side
      if (this.y < 100) {
        this.y += this.speed * dt;
      } else {
        this.x = GAME.WIDTH / 2 + Math.sin(this.t * 0.5) * 180;
      }
      // Boss shooting - multiple patterns
      if (this.shootTimer <= 0 && this.y >= 80) {
        this.bossTimer += 1;
        this.bossPhase = Math.floor(this.bossTimer / 5) % 3;
        const px = player.x, py = player.y;
        const dx = px - this.x, dy = py - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (this.bossPhase === 0) {
          // Spread shot
          for (let i = -2; i <= 2; i++) {
            const angle = Math.PI / 2 + i * 0.25;
            bullets.addEnemyBullet(this.x, this.y + 30, Math.cos(angle) * 180, Math.sin(angle) * 180);
          }
          this.shootTimer = 0.5;
        } else if (this.bossPhase === 1) {
          // Aimed shot
          bullets.addEnemyBullet(this.x - 20, this.y + 20, (dx / dist) * 250, (dy / dist) * 250);
          bullets.addEnemyBullet(this.x + 20, this.y + 20, (dx / dist) * 250, (dy / dist) * 250);
          this.shootTimer = 0.3;
        } else {
          // Circular burst
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + this.t;
            bullets.addEnemyBullet(this.x, this.y, Math.cos(angle) * 150, Math.sin(angle) * 150, 4);
          }
          this.shootTimer = 0.6;
        }
      }
    } else if (this.type === 'shooter') {
      // S-curve movement
      this.y += this.speed * dt;
      this.x = this.startX + Math.sin(this.t * 2) * 60;
      if (this.shootTimer <= 0 && this.y > 0 && this.y < GAME.HEIGHT - 100) {
        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        bullets.addEnemyBullet(this.x, this.y + 10, (dx / dist) * 200, (dy / dist) * 200);
        this.shootTimer = this.shootRate;
      }
    } else if (this.type === 'heavy') {
      // Slow descent
      this.y += this.speed * dt;
      if (this.shootTimer <= 0 && this.y > 20 && this.y < GAME.HEIGHT - 100) {
        // Fan shot
        for (let i = -2; i <= 2; i++) {
          const angle = Math.PI / 2 + i * 0.2;
          bullets.addEnemyBullet(this.x, this.y + 15, Math.cos(angle) * 160, Math.sin(angle) * 160);
        }
        this.shootTimer = this.shootRate;
      }
    } else {
      // Small enemy - straight down
      this.y += this.speed * dt;
    }

    // Off screen
    if (this.y > GAME.HEIGHT + 50) this.dead = true;
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.dead = true;
  }

  getHitbox() {
    const s = this.type === 'boss' ? this.size * 0.8 : this.size * 0.7;
    return { x: this.x - s / 2, y: this.y - s / 2, w: s, h: s };
  }

  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.floor(this.x), Math.floor(this.y));

    if (this.type === 'boss') {
      this.renderBoss(ctx);
    } else if (this.type === 'shooter') {
      this.renderShooter(ctx);
    } else if (this.type === 'heavy') {
      this.renderHeavy(ctx);
    } else {
      this.renderSmall(ctx);
    }

    ctx.restore();

    // HP bar for multi-hp enemies
    if (this.maxHp > 1 && !this.dead) {
      const ratio = this.hp / this.maxHp;
      const bw = this.type === 'boss' ? 200 : 24;
      const bx = this.x - bw / 2;
      const by = this.y - this.size / 2 - 8;
      ctx.fillStyle = '#000';
      ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = ratio > 0.3 ? '#ff4444' : '#ff0000';
      ctx.fillRect(bx, by, bw * ratio, 4);
    }
  }

  renderSmall(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = '#666';
    ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(-3, -2, 2, 2);
    ctx.fillRect(1, -2, 2, 2);
  }

  renderShooter(ctx) {
    const wobble = Math.sin(this.animTimer * 10) * 1;
    ctx.fillStyle = this.color;
    ctx.fillRect(-10, -8, 20, 16);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(-5, -3, 3, 3);
    ctx.fillRect(2, -3, 3, 3);
    // Wings
    ctx.fillStyle = this.color;
    ctx.fillRect(-14, 0 + wobble, 4, 6);
    ctx.fillRect(10, 0 - wobble, 4, 6);
  }

  renderHeavy(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-14, -12, 28, 24);
    ctx.fillStyle = '#8822cc';
    ctx.fillRect(-12, -10, 24, 20);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(-8, -6, 4, 4);
    ctx.fillRect(4, -6, 4, 4);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-4, 2, 8, 4);
    // Cannons
    ctx.fillStyle = this.color;
    ctx.fillRect(-16, 4, 4, 8);
    ctx.fillRect(12, 4, 4, 8);
  }

  renderBoss(ctx) {
    const pulse = Math.sin(this.animTimer * 5) * 0.1;
    // Main body
    ctx.fillStyle = this.color;
    ctx.fillRect(-40, -30, 80, 60);
    ctx.fillStyle = C.bossDark;
    ctx.fillRect(-36, -26, 72, 52);
    // Core
    ctx.fillStyle = '#ff0044';
    ctx.beginPath();
    ctx.arc(0, 0, 12 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    // Wings
    ctx.fillStyle = this.color;
    ctx.fillRect(-50, -10, 12, 30);
    ctx.fillRect(38, -10, 12, 30);
    // Cannons
    ctx.fillStyle = C.bossDark;
    ctx.fillRect(-30, 20, 8, 12);
    ctx.fillRect(22, 20, 8, 12);
    // Horns
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(-30, -40, 8, 10);
    ctx.fillRect(22, -40, 8, 10);
  }
}

// ===== Item =====
class Item {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vy = 80;
    this.vx = 0;
    this.dead = false;
    this.animTimer = 0;
    const data = ITEM_TYPES[type];
    this.color = data.color;
    this.size = data.size;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    this.animTimer += dt;
    if (this.y > GAME.HEIGHT + 20) this.dead = true;
  }

  render(ctx) {
    const sx = Math.floor(this.x);
    const sy = Math.floor(this.y + Math.sin(this.animTimer * 4) * 2);
    const s = this.size;

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    if (this.type === 'power') {
      // Star shape
      ctx.fillStyle = this.color;
      ctx.fillRect(sx - 2, sy - 6, 4, 12);
      ctx.fillRect(sx - 6, sy - 2, 12, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 1, sy - 4, 2, 8);
    } else if (this.type === 'life') {
      // Heart
      ctx.fillStyle = this.color;
      ctx.fillRect(sx - 5, sy - 4, 4, 4);
      ctx.fillRect(sx + 1, sy - 4, 4, 4);
      ctx.fillRect(sx - 6, sy - 2, 12, 4);
      ctx.fillRect(sx - 4, sy + 2, 8, 2);
      ctx.fillRect(sx - 2, sy + 4, 4, 2);
    } else if (this.type === 'bomb') {
      // Diamond
      ctx.fillStyle = this.color;
      ctx.fillRect(sx - 2, sy - 6, 4, 12);
      ctx.fillRect(sx - 6, sy - 2, 12, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(sx - 1, sy - 3, 2, 2);
    }

    ctx.shadowBlur = 0;
  }
}
