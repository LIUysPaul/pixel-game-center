// ===== StarField =====
class StarField {
  constructor() {
    this.layers = [
      { stars: [], speed: 30, size: 1, color: C.star3 },
      { stars: [], speed: 60, size: 1, color: C.star2 },
      { stars: [], speed: 120, size: 2, color: C.star1 }
    ];
    for (const layer of this.layers) {
      for (let i = 0; i < 40; i++) {
        layer.stars.push({
          x: Math.random() * GAME.WIDTH,
          y: Math.random() * GAME.HEIGHT
        });
      }
    }
  }

  update(dt) {
    for (const layer of this.layers) {
      for (const s of layer.stars) {
        s.y += layer.speed * dt;
        if (s.y > GAME.HEIGHT) {
          s.y = 0;
          s.x = Math.random() * GAME.WIDTH;
        }
      }
    }
  }

  render(ctx) {
    for (const layer of this.layers) {
      ctx.fillStyle = layer.color;
      for (const s of layer.stars) {
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), layer.size, layer.size);
      }
    }
  }
}

// ===== BulletManager =====
class BulletManager {
  constructor() {
    this.playerBullets = [];
    this.enemyBullets = [];
  }

  addPlayerBullet(x, y, vx, vy, dmg = 1) {
    this.playerBullets.push({ x, y, vx, vy, dmg, life: 3, size: 4 });
  }

  addEnemyBullet(x, y, vx, vy, size = 5) {
    this.enemyBullets.push({ x, y, vx, vy, life: 5, size });
  }

  update(dt) {
    for (const b of this.playerBullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    this.playerBullets = this.playerBullets.filter(b =>
      b.life > 0 && b.y > -20 && b.y < GAME.HEIGHT + 20 && b.x > -20 && b.x < GAME.WIDTH + 20
    );

    for (const b of this.enemyBullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    this.enemyBullets = this.enemyBullets.filter(b =>
      b.life > 0 && b.y > -20 && b.y < GAME.HEIGHT + 20 && b.x > -20 && b.x < GAME.WIDTH + 20
    );
  }

  render(ctx) {
    // Player bullets - yellow with glow
    ctx.shadowBlur = 6;
    ctx.shadowColor = C.bulletGlow;
    ctx.fillStyle = C.bullet;
    for (const b of this.playerBullets) {
      ctx.fillRect(Math.floor(b.x - 2), Math.floor(b.y - 6), 4, 12);
    }
    ctx.shadowBlur = 0;

    // Enemy bullets - pink with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = C.enemyBulletGlow;
    ctx.fillStyle = C.enemyBullet;
    for (const b of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(Math.floor(b.x), Math.floor(b.y), b.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  clear() {
    this.enemyBullets = [];
  }
}

// ===== ParticleManager =====
class ParticleManager {
  constructor() {
    this.particles = [];
  }

  explode(x, y, color, count = 12, speed = 200) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const s = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
        size: 2 + Math.random() * 3
      });
    }
    // Ring
    this.particles.push({
      x, y, vx: 0, vy: 0,
      life: 0.3, maxLife: 0.3,
      color, size: 0,
      ring: true, ringMax: 40
    });
  }

  thrust(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y, vx: 0, vy: 100 + Math.random() * 50,
      life: 0.2, maxLife: 0.2,
      color: C.thrust, size: 2 + Math.random() * 2
    });
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.ring) p.size = p.ringMax * (1 - p.life / p.maxLife);
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      if (p.ring) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}
