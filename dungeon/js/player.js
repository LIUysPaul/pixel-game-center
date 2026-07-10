class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hp = PLAYER.hp;
    this.maxHp = PLAYER.maxHp;
    this.atk = PLAYER.atk;
    this.speed = PLAYER.speed;
    this.atkRange = PLAYER.atkRange;
    this.atkCooldown = PLAYER.atkCooldown;
    this.atkTimer = 0;
    this.xp = 0;
    this.level = 1;
    this.size = PLAYER.size;
    this.animFrame = 0;
    this.animTimer = 0;
    this.state = 'idle';
    this.flash = 0;
    this.dead = false;
    this.facing = 'down';
    this.particles = [];
    this.levelUpTimer = 0;
  }

  update(dt, input, dungeon) {
    if (this.dead) return;

    this.atkTimer -= dt;
    this.flash -= dt;
    this.animTimer += dt;
    this.levelUpTimer -= dt;

    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Movement
    let dx = 0, dy = 0;
    if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) dy -= 1;
    if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) dy += 1;
    if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) dx -= 1;
    if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.vx = dx * this.speed;
      this.vy = dy * this.speed;
      this.state = 'move';
      if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? 'right' : 'left';
      else this.facing = dy > 0 ? 'down' : 'up';
    } else {
      this.vx = 0;
      this.vy = 0;
      this.state = 'idle';
    }

    // Collision with walls
    const newX = this.x + this.vx * dt;
    const newY = this.y + this.vy * dt;

    if (!this.isSolid(newX, this.y, dungeon)) this.x = newX;
    if (!this.isSolid(this.x, newY, dungeon)) this.y = newY;

    // Attack
    if ((input.isPressed('Space') || input.isPressed('Enter')) && this.atkTimer <= 0) {
      this.attack();
    }

    // Update particles
    for (let p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  isSolid(x, y, dungeon) {
    const tx = Math.floor(x / GAME.TILE);
    const ty = Math.floor(y / GAME.TILE);
    if (tx < 0 || tx >= GAME.DUNGEON_W || ty < 0 || ty >= GAME.DUNGEON_H) return true;
    const tile = dungeon.tiles[ty][tx];
    return tile === TILE.WALL || tile === TILE.DOOR;
  }

  attack() {
    this.atkTimer = this.atkCooldown;
    this.state = 'attack';
    this.animFrame = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flash = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    this.spawnParticles(this.x, this.y, '#ff4444', 5);
  }

  gainXp(amount) {
    this.xp += amount;
    const next = PLAYER.xpToLevel[this.level] || 9999;
    if (this.xp >= next && this.level < 10) {
      this.level++;
      this.maxHp += 20;
      this.hp = Math.min(this.hp + 20, this.maxHp);
      this.atk += 3;
      this.speed += 10;
      this.atkRange += 5;
      this.atkCooldown = Math.max(0.2, this.atkCooldown - 0.02);
      this.levelUpTimer = 2.0;
      this.spawnParticles(this.x, this.y, '#ffd700', 12);
    }
  }

  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHp);
    this.spawnParticles(this.x, this.y, '#44ff44', 4);
  }

  spawnParticles(px, py, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: px, y: py,
        vx: (Math.random() - 0.5) * 120,
        vy: (Math.random() - 0.5) * 120 - 30,
        life: 0.4 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  getAttackBox() {
    const ax = this.x, ay = this.y;
    const r = this.atkRange;
    switch (this.facing) {
      case 'right': return { x: ax, y: ay - r/2, w: r, h: r };
      case 'left': return { x: ax - r, y: ay - r/2, w: r, h: r };
      case 'up': return { x: ax - r/2, y: ay - r, w: r, h: r };
      case 'down': return { x: ax - r/2, y: ay, w: r, h: r };
      default: return { x: ax - r/2, y: ay, w: r, h: r };
    }
  }

  render(ctx, camera) {
    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);

    if (this.flash > 0 && Math.floor(this.flash * 30) % 2 === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const bob = this.state === 'idle' ? Math.sin(this.animFrame * Math.PI / 2) * 1 : 0;
    const yb = bob;

    // Pixel art player (20x20)
    const c = '#4488ff'; // cloak
    const cd = '#3366cc'; // dark
    const s = '#cc8855'; // skin

    ctx.save();
    ctx.translate(sx - 10, sy - 10 + yb);

    // Body
    ctx.fillStyle = c;
    ctx.fillRect(6, 8, 8, 10);
    ctx.fillStyle = cd;
    ctx.fillRect(7, 9, 6, 8);

    // Head
    ctx.fillStyle = s;
    ctx.fillRect(7, 2, 6, 6);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(7, 0, 6, 3);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(8, 4, 1, 1);
    ctx.fillRect(11, 4, 1, 1);

    // Sword (shows when attacking)
    if (this.state === 'attack' && this.atkTimer > this.atkCooldown - 0.2) {
      const swing = (this.atkCooldown - this.atkTimer) / 0.2;
      ctx.fillStyle = '#cccccc';
      if (this.facing === 'right') {
        ctx.fillRect(14, 8, 10 * swing, 2);
        ctx.fillRect(14 + 10 * swing, 7, 2, 4);
      } else if (this.facing === 'left') {
        ctx.fillRect(4 - 10 * swing, 8, 10 * swing, 2);
        ctx.fillRect(4 - 10 * swing, 7, 2, 4);
      } else if (this.facing === 'up') {
        ctx.fillRect(9, 2 - 10 * swing, 2, 10 * swing);
      } else {
        ctx.fillRect(9, 14, 2, 10 * swing);
      }
    } else {
      // Idle sword
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(14, 10, 2, 6);
      ctx.fillRect(13, 15, 4, 2);
    }

    // Legs
    const legOff = this.state === 'move' ? (this.animFrame % 2) * 3 : 0;
    ctx.fillStyle = c;
    ctx.fillRect(6, 18, 3, 4 - legOff);
    ctx.fillRect(11, 18 + legOff, 3, 4 - legOff);

    ctx.restore();

    // Level up effect
    if (this.levelUpTimer > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.levelUpTimer / 2})`;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL UP!', sx, sy - 24);
    }

    // Particles
    for (let p of this.particles) {
      const psx = Math.floor(p.x - camera.x);
      const psy = Math.floor(p.y - camera.y);
      ctx.globalAlpha = p.life / 0.7;
      ctx.fillStyle = p.color;
      ctx.fillRect(psx, psy, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
