class Enemy {
  constructor(type, tx, ty) {
    const data = ENEMIES[type];
    this.type = type;
    this.x = tx * GAME.TILE + GAME.TILE / 2;
    this.y = ty * GAME.TILE + GAME.TILE / 2;
    this.hp = data.hp;
    this.maxHp = data.hp;
    this.atk = data.atk;
    this.speed = data.speed;
    this.size = data.size;
    this.color = data.color;
    this.xpValue = data.xp;
    this.dead = false;
    this.flash = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.atkCooldown = 1.0;
    this.atkTimer = 0;
    this.state = 'idle';
    this.particles = [];
    this.pushX = 0;
    this.pushY = 0;
  }

  update(dt, player, dungeon) {
    if (this.dead) {
      for (let p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      this.particles = this.particles.filter(p => p.life > 0);
      return;
    }

    this.atkTimer -= dt;
    this.flash -= dt;
    this.animTimer += dt;

    if (this.animTimer > 0.2) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Knockback recovery
    this.pushX *= 0.9;
    this.pushY *= 0.9;

    const dist = Math.hypot(player.x - this.x, player.y - this.y);

    if (dist < 250) {
      this.state = 'chase';
      // Move toward player
      let dx = player.x - this.x;
      let dy = player.y - this.y;
      const len = Math.hypot(dx, dy);
      if (len > 0) { dx /= len; dy /= len; }

      const newX = this.x + dx * this.speed * dt + this.pushX * dt;
      const newY = this.y + dy * this.speed * dt + this.pushY * dt;

      if (!this.isSolid(newX, this.y, dungeon)) this.x = newX;
      if (!this.isSolid(this.x, newY, dungeon)) this.y = newY;

      // Attack if close
      if (dist < this.size + player.size + 8 && this.atkTimer <= 0) {
        this.atkTimer = this.atkCooldown;
        player.takeDamage(this.atk);
      }
    } else {
      this.state = 'idle';
    }
  }

  isSolid(x, y, dungeon) {
    const tx = Math.floor(x / GAME.TILE);
    const ty = Math.floor(y / GAME.TILE);
    if (tx < 0 || tx >= GAME.DUNGEON_W || ty < 0 || ty >= GAME.DUNGEON_H) return true;
    const tile = dungeon.tiles[ty][tx];
    return tile === TILE.WALL || tile === TILE.DOOR;
  }

  takeDamage(amount, fromX, fromY) {
    this.hp -= amount;
    this.flash = 0.15;
    // Pushback
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.pushX = (dx / len) * 200;
      this.pushY = (dy / len) * 200;
    }
    this.spawnParticles(this.x, this.y, this.color, 4);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.spawnParticles(this.x, this.y, this.color, 10);
    }
  }

  spawnParticles(px, py, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: px, y: py,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100 - 30,
        life: 0.4 + Math.random() * 0.3,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  render(ctx, camera) {
    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);

    // Skip if off screen
    if (sx < -50 || sx > GAME.WIDTH + 50 || sy < -50 || sy > GAME.HEIGHT + 50) return;

    if (this.dead) {
      for (let p of this.particles) {
        const psx = Math.floor(p.x - camera.x);
        const psy = Math.floor(p.y - camera.y);
        ctx.globalAlpha = p.life / 0.7;
        ctx.fillStyle = p.color;
        ctx.fillRect(psx, psy, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (this.flash > 0 && Math.floor(this.flash * 30) % 2 === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const bob = Math.sin(this.animFrame * Math.PI / 2) * (this.type === 'slime' ? 3 : 1);

    ctx.translate(sx, sy + bob);

    switch (this.type) {
      case 'slime':
        this.renderSlime(ctx);
        break;
      case 'skeleton':
        this.renderSkeleton(ctx);
        break;
      case 'bat':
        this.renderBat(ctx);
        break;
      case 'boss':
        this.renderBoss(ctx);
        break;
    }

    ctx.restore();

    // HP bar for non-slime enemies
    if (this.type !== 'slime') {
      const ratio = this.hp / this.maxHp;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - 12, sy - this.size / 2 - 8, 24, 4);
      ctx.fillStyle = ratio > 0.3 ? '#ff4444' : '#ff0000';
      ctx.fillRect(sx - 11, sy - this.size / 2 - 7, 22 * ratio, 2);
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
  }

  renderSlime(ctx) {
    const s = this.size / 2;
    ctx.fillStyle = this.color;
    ctx.fillRect(-s, -s + 2, s * 2, s * 2 - 2);
    ctx.fillStyle = '#66ee66';
    ctx.fillRect(-s + 2, -s + 4, s * 2 - 4, s * 2 - 6);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, -2, 2, 2);
    ctx.fillRect(2, -2, 2, 2);
  }

  renderSkeleton(ctx) {
    const s = this.size / 2;
    // Head
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-6, -10, 12, 10);
    ctx.fillStyle = '#bbb';
    ctx.fillRect(-4, -8, 8, 6);
    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-4, -6, 2, 2);
    ctx.fillRect(2, -6, 2, 2);
    // Body
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-4, 0, 8, 10);
    // Arms
    const armOff = this.state === 'chase' ? (this.animFrame % 2) * 2 : 0;
    ctx.fillRect(-8, 2 + armOff, 4, 8);
    ctx.fillRect(4, 2 - armOff, 4, 8);
  }

  renderBat(ctx) {
    const wing = this.animFrame % 2 === 0 ? 6 : 2;
    ctx.fillStyle = this.color;
    // Body
    ctx.fillRect(-3, -3, 6, 6);
    // Wings
    ctx.fillRect(-3 - wing, -2, wing, 3);
    ctx.fillRect(3, -2, wing, 3);
    // Eyes
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-2, -1, 1, 1);
    ctx.fillRect(1, -1, 1, 1);
  }

  renderBoss(ctx) {
    const s = this.size / 2;
    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.fillStyle = '#7722aa';
    ctx.fillRect(-s + 4, -s + 4, s * 2 - 8, s * 2 - 8);
    // Horns
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-s + 2, -s - 6, 4, 6);
    ctx.fillRect(s - 6, -s - 6, 4, 6);
    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(-8, -6, 4, 4);
    ctx.fillRect(4, -6, 4, 4);
    // Mouth
    ctx.fillStyle = '#000';
    ctx.fillRect(-6, 4, 12, 4);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-4, 5, 2, 2);
    ctx.fillRect(2, 5, 2, 2);
  }
}
