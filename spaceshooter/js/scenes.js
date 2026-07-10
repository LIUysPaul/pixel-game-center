class MenuScene {
  constructor(engine) {
    this.engine = engine;
    this.time = 0;
    this.stars = new StarField();
  }

  update(dt, input) {
    this.time += dt;
    this.stars.update(dt);
    if (input.isPressed('Enter') || input.isPressed('Space')) {
      this.engine.setScene(new PlayScene(this.engine));
    }
  }

  render(ctx) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    this.stars.render(ctx);

    // Title
    const pulse = 1 + Math.sin(this.time * 2) * 0.04;
    ctx.save();
    ctx.translate(GAME.WIDTH / 2, 180);
    ctx.scale(pulse, pulse);
    ctx.shadowBlur = 20;
    ctx.shadowColor = C.textCyan;
    ctx.fillStyle = C.textCyan;
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STAR', 0, 0);
    ctx.shadowColor = C.textPink;
    ctx.fillStyle = C.textPink;
    ctx.fillText('PIXEL', 0, 36);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Demo ship
    const bob = Math.sin(this.time * 3) * 4;
    ctx.save();
    ctx.translate(GAME.WIDTH / 2, 300 + bob);
    ctx.fillStyle = C.player;
    ctx.fillRect(-2, -10, 4, 4);
    ctx.fillRect(-6, -6, 12, 10);
    ctx.fillRect(-10, -2, 20, 6);
    ctx.fillStyle = C.playerDark;
    ctx.fillRect(-6, 0, 12, 4);
    ctx.fillStyle = C.playerCore;
    ctx.fillRect(-1, -4, 2, 4);
    ctx.fillStyle = `rgba(255,100,0,${0.5 + Math.sin(this.time * 20) * 0.3})`;
    ctx.fillRect(-3, 8, 6, 4);
    ctx.restore();

    // Controls
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(120, 380, 300, 120);
    ctx.strokeStyle = C.textCyan;
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 380, 300, 120);

    ctx.fillStyle = C.text;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: MOVE', GAME.WIDTH / 2, 410);
    ctx.fillText('AUTO: FIRE', GAME.WIDTH / 2, 435);
    ctx.fillText('SPACE: BOMB', GAME.WIDTH / 2, 460);
    ctx.fillStyle = C.textGold;
    ctx.fillText('COLLECT POWERUPS!', GAME.WIDTH / 2, 485);

    if (Math.sin(this.time * 5) > 0) {
      ctx.fillStyle = C.textCyan;
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('PRESS ENTER TO START', GAME.WIDTH / 2, 560);
    }
  }
}

class PlayScene {
  constructor(engine) {
    this.engine = engine;
    this.player = new Player();
    this.bullets = new BulletManager();
    this.particles = new ParticleManager();
    this.stars = new StarField();
    this.enemies = [];
    this.items = [];
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 2;
    this.spawnTimer = 0;
    this.enemiesThisWave = 0;
    this.maxEnemiesThisWave = 8;
    this.shakeTimer = 0;
    this.bossActive = false;
    this.bossSpawned = false;
    this.flashTimer = 0;
    this.messageText = '';
    this.messageTimer = 0;
  }

  update(dt, input) {
    if (this.player.dead) {
      if (input.isPressed('Enter')) {
        this.engine.setScene(new GameOverScene(this.engine, this.score, this.wave));
      }
      return;
    }

    this.stars.update(dt);
    this.player.update(dt, input, this.bullets, this.particles);
    this.bullets.update(dt);
    this.particles.update(dt);

    // Wave management
    if (!this.bossActive) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0 && this.enemiesThisWave < this.maxEnemiesThisWave) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnEnemy();
          this.spawnTimer = 0.6 + Math.random() * 0.8;
          this.enemiesThisWave++;
        }
      }

      // All enemies spawned for wave, wait for clear
      if (this.enemiesThisWave >= this.maxEnemiesThisWave && this.enemies.length === 0) {
        if (this.wave % 3 === 0 && !this.bossSpawned) {
          // Spawn boss
          this.spawnBoss();
          this.bossSpawned = true;
          this.bossActive = true;
          this.showMessage('WARNING! BOSS!', C.textPink, 2);
        } else if (!this.bossSpawned || this.wave % 3 !== 0) {
          this.nextWave();
        }
      }
    }

    // Update enemies
    for (const e of this.enemies) {
      e.update(dt, this.player, this.bullets);
    }

    // Update items
    for (const item of this.items) {
      item.update(dt);
    }

    // Collisions: player bullets vs enemies
    for (const b of this.bullets.playerBullets) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const hb = e.getHitbox();
        if (b.x > hb.x && b.x < hb.x + hb.w && b.y > hb.y && b.y < hb.y + hb.h) {
          e.takeDamage(b.dmg);
          b.life = 0;
          if (e.dead) {
            this.score += e.score;
            this.particles.explode(e.x, e.y, e.color, e.type === 'boss' ? 30 : 10, e.type === 'boss' ? 300 : 200);
            if (e.type === 'boss') {
              this.shakeTimer = 0.5;
              this.flashTimer = 0.3;
              this.bossActive = false;
              this.bossSpawned = false;
              this.nextWave();
            }
            // Drop item
            if (Math.random() < e.dropChance) {
              const types = ['power', 'power', 'bomb', 'life'];
              this.items.push(new Item(types[Math.floor(Math.random() * types.length)], e.x, e.y));
            }
          } else {
            this.particles.explode(b.x, b.y, e.color, 3, 80);
          }
          break;
        }
      }
    }

    // Collisions: enemy bullets vs player
    for (const b of this.bullets.enemyBullets) {
      const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      if (dist < PLAYER.hitRadius + b.size) {
        if (this.player.hit()) {
          b.life = 0;
          this.particles.explode(this.player.x, this.player.y, C.player, 15, 250);
          this.shakeTimer = 0.3;
          this.flashTimer = 0.15;
          if (this.player.dead) {
            this.particles.explode(this.player.x, this.player.y, C.player, 25, 300);
          }
        }
      }
    }

    // Collisions: enemies vs player
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (dist < PLAYER.hitRadius + e.size / 2) {
        if (this.player.hit()) {
          this.particles.explode(this.player.x, this.player.y, C.player, 15, 250);
          this.shakeTimer = 0.3;
          if (e.type !== 'boss') {
            e.dead = true;
            this.particles.explode(e.x, e.y, e.color, 10);
          }
        }
      }
    }

    // Collisions: items vs player
    for (const item of this.items) {
      if (item.dead) continue;
      const dist = Math.hypot(item.x - this.player.x, item.y - this.player.y);
      if (dist < 20) {
        item.dead = true;
        this.collectItem(item);
      }
    }

    // Bomb
    if (input.isPressed('Space') && this.player.bombs > 0) {
      this.player.bombs--;
      this.bullets.clear();
      this.flashTimer = 0.4;
      this.shakeTimer = 0.3;
      for (const e of this.enemies) {
        if (e.type === 'boss') {
          e.takeDamage(10);
          if (e.dead) {
            this.score += e.score;
            this.particles.explode(e.x, e.y, e.color, 30, 300);
            this.bossActive = false;
            this.bossSpawned = false;
            this.nextWave();
          }
        } else {
          e.dead = true;
          this.score += e.score;
          this.particles.explode(e.x, e.y, e.color, 10, 200);
        }
      }
      this.showMessage('BOMB!', C.textGold, 1);
    }

    // Cleanup
    this.enemies = this.enemies.filter(e => !e.dead);
    this.items = this.items.filter(i => !i.dead);

    if (this.shakeTimer > 0) this.shakeTimer -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;
  }

  spawnEnemy() {
    const types = ['small', 'small', 'small', 'shooter'];
    if (this.wave >= 2) types.push('shooter');
    if (this.wave >= 3) types.push('heavy');
    if (this.wave >= 5) types.push('shooter', 'heavy');
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 40 + Math.random() * (GAME.WIDTH - 80);
    this.enemies.push(new Enemy(type, x, -30));
  }

  spawnBoss() {
    this.enemies.push(new Enemy('boss', GAME.WIDTH / 2, -80));
  }

  nextWave() {
    this.wave++;
    this.waveTimer = 2;
    this.enemiesThisWave = 0;
    this.maxEnemiesThisWave = 6 + this.wave * 2;
    this.bossSpawned = false;
    this.showMessage('WAVE ' + this.wave, C.textCyan, 1.5);
  }

  collectItem(item) {
    switch (item.type) {
      case 'power':
        if (this.player.weaponLevel < PLAYER.maxWeaponLevel) {
          this.player.weaponLevel++;
          this.showMessage('POWER UP!', C.textGold, 1);
        } else {
          this.score += 500;
        }
        break;
      case 'life':
        if (this.player.lives < PLAYER.maxLives) this.player.lives++;
        else this.score += 500;
        this.showMessage('+1 LIFE', C.itemLife, 1);
        break;
      case 'bomb':
        this.player.bombs++;
        this.showMessage('+1 BOMB', C.itemBomb, 1);
        break;
    }
    this.particles.explode(item.x, item.y, item.color, 6, 100);
  }

  showMessage(text, color, time) {
    this.messageText = text;
    this.messageColor = color;
    this.messageTimer = time;
  }

  render(ctx) {
    ctx.save();
    if (this.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    this.stars.render(ctx);

    // Items
    for (const item of this.items) item.render(ctx);

    // Enemies
    for (const e of this.enemies) e.render(ctx);

    // Bullets
    this.bullets.render(ctx);

    // Player
    if (!this.player.dead) this.player.render(ctx);

    // Particles
    this.particles.render(ctx);

    // Flash
    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashTimer * 0.5})`;
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    }

    ctx.restore();

    // HUD
    this.renderHUD(ctx);

    // Message
    if (this.messageTimer > 0) {
      ctx.fillStyle = this.messageColor;
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, this.messageTimer);
      ctx.fillText(this.messageText, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50);
      ctx.globalAlpha = 1;
    }

    // Death
    if (this.player.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      ctx.fillStyle = C.textPink;
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20);
      ctx.fillStyle = C.text;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS ENTER', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20);
    }
  }

  renderHUD(ctx) {
    // Score
    ctx.fillStyle = C.text;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + this.score, 12, 22);

    // Wave
    ctx.fillStyle = C.textCyan;
    ctx.textAlign = 'right';
    ctx.fillText('WAVE ' + this.wave, GAME.WIDTH - 12, 22);

    // Lives
    ctx.textAlign = 'left';
    ctx.fillStyle = C.itemLife;
    for (let i = 0; i < this.player.lives; i++) {
      ctx.fillRect(14 + i * 14, 32, 10, 10);
      ctx.fillStyle = '#fff';
      ctx.fillRect(16 + i * 14, 34, 6, 4);
      ctx.fillStyle = C.itemLife;
    }

    // Weapon level
    ctx.fillStyle = C.textGold;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('PWR', 14, 56);
    for (let i = 0; i < PLAYER.maxWeaponLevel; i++) {
      ctx.fillStyle = i < this.player.weaponLevel ? C.textGold : '#333';
      ctx.fillRect(40 + i * 10, 50, 8, 8);
    }

    // Bombs
    ctx.fillStyle = C.itemBomb;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('BOMB x' + this.player.bombs, GAME.WIDTH - 12, 40);
  }
}

class GameOverScene {
  constructor(engine, score, wave) {
    this.engine = engine;
    this.score = score;
    this.wave = wave;
    this.time = 0;
    this.stars = new StarField();
  }

  update(dt, input) {
    this.time += dt;
    this.stars.update(dt);
    if (input.isPressed('Enter') || input.isPressed('Space')) {
      this.engine.setScene(new PlayScene(this.engine));
    }
    if (input.isPressed('Escape')) {
      this.engine.setScene(new MenuScene(this.engine));
    }
  }

  render(ctx) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    this.stars.render(ctx);

    ctx.fillStyle = C.textPink;
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME.WIDTH / 2, 200);

    ctx.fillStyle = C.textGold;
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('SCORE: ' + this.score, GAME.WIDTH / 2, 280);

    ctx.fillStyle = C.text;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('WAVE: ' + this.wave, GAME.WIDTH / 2, 320);

    ctx.strokeStyle = C.textCyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(160, 360);
    ctx.lineTo(380, 360);
    ctx.stroke();

    if (Math.sin(this.time * 4) > 0) {
      ctx.fillStyle = C.textCyan;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('ENTER: PLAY AGAIN', GAME.WIDTH / 2, 420);
      ctx.fillText('ESC: MAIN MENU', GAME.WIDTH / 2, 450);
    }
  }
}
