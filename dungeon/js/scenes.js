class MenuScene {
  constructor(engine) {
    this.engine = engine;
    this.time = 0;
    this.torches = [{ x: 100, y: 200 }, { x: 700, y: 200 }, { x: 200, y: 450 }, { x: 600, y: 450 }];
  }

  update(dt, input) {
    this.time += dt;
    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this.engine.setScene(new DungeonScene(this.engine));
    }
  }

  render(ctx) {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Brick pattern background
    for (let y = 0; y < GAME.HEIGHT; y += 32) {
      for (let x = 0; x < GAME.WIDTH; x += 32) {
        ctx.fillStyle = ((x + y) / 32) % 2 === 0 ? '#1a1410' : '#14100c';
        ctx.fillRect(x, y, 32, 32);
      }
    }

    // Torches
    for (const t of this.torches) {
      const flicker = 0.7 + Math.sin(this.time * 8 + t.x) * 0.3;
      ctx.fillStyle = `rgba(255, 160, 40, ${flicker * 0.3})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 200, 80, ${flicker * 0.6})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y - 5, 4 + flicker * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Title
    const pulse = 1 + Math.sin(this.time * 2) * 0.03;
    ctx.save();
    ctx.translate(GAME.WIDTH / 2, 140);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ffd700';
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DUNGEON', 0, 0);
    ctx.fillStyle = '#aa8800';
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillText('PIXEL', 0, 36);
    ctx.restore();

    // Player sprite demo
    const bob = Math.sin(this.time * 3) * 3;
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(GAME.WIDTH / 2 - 10, 260 + bob, 20, 20);
    ctx.fillStyle = '#cc8855';
    ctx.fillRect(GAME.WIDTH / 2 - 6, 256 + bob, 12, 8);
    ctx.fillStyle = '#3366cc';
    ctx.fillRect(GAME.WIDTH / 2 - 8, 270 + bob, 16, 8);

    // Controls
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(220, 320, 360, 140);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(220, 320, 360, 140);

    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROLS', GAME.WIDTH / 2, 345);
    ctx.fillText('WASD / ARROWS: MOVE', GAME.WIDTH / 2, 370);
    ctx.fillText('SPACE: ATTACK', GAME.WIDTH / 2, 395);
    ctx.fillText('AUTO-PICKUP ITEMS', GAME.WIDTH / 2, 420);

    // Blink start
    if (Math.sin(this.time * 5) > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('PRESS ENTER TO START', GAME.WIDTH / 2, 500);
    }
  }
}

class DungeonScene {
  constructor(engine) {
    this.engine = engine;
    this.level = 1;
    this.kills = 0;
    this.score = 0;
    this.gen = new DungeonGenerator();
    this.dungeon = this.gen.generate(this.level);
    this.player = new Player(this.dungeon.startX, this.dungeon.startY);
    this.camera = { x: 0, y: 0 };
    this.enemies = [];
    this.items = [];
    this.messages = [];
    this.fog = Array(GAME.DUNGEON_H).fill(null).map(() => Array(GAME.DUNGEON_W).fill(false));
    this.explored = Array(GAME.DUNGEON_H).fill(null).map(() => Array(GAME.DUNGEON_W).fill(false));

    this.spawnEntities();
  }

  spawnEntities() {
    this.enemies = [];
    this.items = [];
    for (const r of this.dungeon.rooms) {
      if (r.enemies) {
        for (const e of r.enemies) {
          this.enemies.push(new Enemy(e.type, e.x, e.y));
        }
      }
      if (r.items) {
        for (const item of r.items) {
          this.items.push({ ...item, x: item.x * GAME.TILE + GAME.TILE / 2, y: item.y * GAME.TILE + GAME.TILE / 2, collected: false });
        }
      }
    }
  }

  update(dt, input) {
    if (this.player.dead) {
      if (input.justPressed('Enter')) {
        this.engine.setScene(new GameOverScene(this.engine, this.level, this.kills, this.score));
      }
      return;
    }

    this.player.update(dt, input, this.dungeon);

    // Camera follow
    const targetX = this.player.x - GAME.WIDTH / 2;
    const targetY = this.player.y - GAME.HEIGHT / 2;
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;

    // Clamp camera
    const maxCamX = GAME.DUNGEON_W * GAME.TILE - GAME.WIDTH;
    const maxCamY = GAME.DUNGEON_H * GAME.TILE - GAME.HEIGHT;
    this.camera.x = Math.max(0, Math.min(this.camera.x, maxCamX));
    this.camera.y = Math.max(0, Math.min(this.camera.y, maxCamY));

    // Update fog
    this.updateFog();

    // Check stairs
    const ptx = Math.floor(this.player.x / GAME.TILE);
    const pty = Math.floor(this.player.y / GAME.TILE);
    if (this.dungeon.tiles[pty]?.[ptx] === TILE.STAIRS) {
      this.nextLevel();
      return;
    }

    // Update enemies
    for (const e of this.enemies) {
      e.update(dt, this.player, this.dungeon);
    }

    // Check player attack
    if (this.player.state === 'attack' && this.player.atkTimer > this.player.atkCooldown - 0.15) {
      const ab = this.player.getAttackBox();
      for (const e of this.enemies) {
        if (e.dead) continue;
        const ex = e.x - e.size / 2, ey = e.y - e.size / 2;
        const ew = e.size, eh = e.size;
        if (ab.x < ex + ew && ab.x + ab.w > ex && ab.y < ey + eh && ab.y + ab.h > ey) {
          e.takeDamage(this.player.atk, this.player.x, this.player.y);
          if (e.dead) {
            this.player.gainXp(e.xpValue);
            this.kills++;
            this.score += e.xpValue;
          }
        }
      }
    }

    // Check items
    for (const item of this.items) {
      if (item.collected) continue;
      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < 24) {
        item.collected = true;
        this.collectItem(item);
      }
    }

    // Update messages
    for (const m of this.messages) m.timer -= dt;
    this.messages = this.messages.filter(m => m.timer > 0);

    // Clean up dead enemies
    this.enemies = this.enemies.filter(e => !e.dead || e.particles.length > 0);
  }

  updateFog() {
    const cx = Math.floor(this.player.x / GAME.TILE);
    const cy = Math.floor(this.player.y / GAME.TILE);
    const radius = 5;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx >= 0 && tx < GAME.DUNGEON_W && ty >= 0 && ty < GAME.DUNGEON_H) {
          if (Math.hypot(dx, dy) <= radius) {
            this.fog[ty][tx] = true;
            this.explored[ty][tx] = true;
          }
        }
      }
    }
  }

  collectItem(item) {
    switch (item.type) {
      case 'potion':
        this.player.heal(ITEMS.potion.heal);
        this.addMessage('+HP', '#44ff44');
        break;
      case 'gem':
        this.player.gainXp(ITEMS.gem.xp);
        this.score += 5;
        this.addMessage('+XP', '#4488ff');
        break;
      case 'chest':
        const bonus = Math.floor(Math.random() * 3);
        if (bonus === 0) { this.player.maxHp += 10; this.player.hp += 10; this.addMessage('+MAX HP', '#ffd700'); }
        else if (bonus === 1) { this.player.atk += 5; this.addMessage('+ATK', '#ffd700'); }
        else { this.player.speed += 15; this.addMessage('+SPD', '#ffd700'); }
        break;
    }
  }

  addMessage(text, color) {
    this.messages.push({ text, color, timer: 1.5, y: 0 });
  }

  nextLevel() {
    this.level++;
    this.score += 100;
    this.dungeon = this.gen.generate(this.level);
    this.player.x = this.dungeon.startX;
    this.player.y = this.dungeon.startY;
    this.fog = Array(GAME.DUNGEON_H).fill(null).map(() => Array(GAME.DUNGEON_W).fill(false));
    this.explored = Array(GAME.DUNGEON_H).fill(null).map(() => Array(GAME.DUNGEON_W).fill(false));
    this.spawnEntities();
    this.addMessage('FLOOR ' + this.level, '#ffd700');
  }

  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Render map
    const startTX = Math.floor(this.camera.x / GAME.TILE);
    const startTY = Math.floor(this.camera.y / GAME.TILE);
    const endTX = Math.min(GAME.DUNGEON_W, startTX + Math.ceil(GAME.WIDTH / GAME.TILE) + 2);
    const endTY = Math.min(GAME.DUNGEON_H, startTY + Math.ceil(GAME.HEIGHT / GAME.TILE) + 2);

    for (let ty = Math.max(0, startTY); ty < endTY; ty++) {
      for (let tx = Math.max(0, startTX); tx < endTX; tx++) {
        const sx = Math.floor(tx * GAME.TILE - this.camera.x);
        const sy = Math.floor(ty * GAME.TILE - this.camera.y);
        const tile = this.dungeon.tiles[ty][tx];
        const visible = this.fog[ty][tx];
        const wasExplored = this.explored[ty][tx];

        if (!visible && !wasExplored) continue;

        if (tile === TILE.FLOOR || tile === TILE.STAIRS) {
          ctx.fillStyle = visible ? COLORS.floor : COLORS.floorDark;
          ctx.fillRect(sx, sy, GAME.TILE, GAME.TILE);
          // Floor detail
          if ((tx + ty) % 3 === 0) {
            ctx.fillStyle = visible ? COLORS.floorLight : COLORS.floorDark;
            ctx.fillRect(sx + 8, sy + 8, 4, 4);
          }
        } else if (tile === TILE.WALL) {
          ctx.fillStyle = visible ? COLORS.wall : COLORS.wallDark;
          ctx.fillRect(sx, sy, GAME.TILE, GAME.TILE);
          // Brick detail
          ctx.fillStyle = visible ? COLORS.wallDark : '#1a1008';
          ctx.fillRect(sx + 2, sy + 10, 12, 2);
          ctx.fillRect(sx + 18, sy + 10, 12, 2);
          ctx.fillRect(sx + 10, sy + 22, 12, 2);
        } else if (tile === TILE.DOOR) {
          ctx.fillStyle = COLORS.door;
          ctx.fillRect(sx, sy, GAME.TILE, GAME.TILE);
          ctx.fillStyle = '#5a3a1b';
          ctx.fillRect(sx + 4, sy + 4, 24, 24);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(sx + 14, sy + 14, 4, 4);
        }

        if (tile === TILE.STAIRS && visible) {
          ctx.fillStyle = COLORS.stairs;
          ctx.fillRect(sx + 8, sy + 8, 16, 16);
          ctx.fillStyle = '#cc9900';
          ctx.fillRect(sx + 10, sy + 12, 12, 3);
          ctx.fillRect(sx + 10, sy + 18, 12, 3);
        }

        if (!visible && wasExplored) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(sx, sy, GAME.TILE, GAME.TILE);
        }
      }
    }

    // Render items
    for (const item of this.items) {
      if (item.collected) continue;
      const sx = Math.floor(item.x - this.camera.x);
      const sy = Math.floor(item.y - this.camera.y);
      if (sx < -20 || sx > GAME.WIDTH + 20 || sy < -20 || sy > GAME.HEIGHT + 20) continue;

      const data = ITEMS[item.type];
      const bob = Math.sin(Date.now() / 300) * 2;

      if (item.type === 'potion') {
        ctx.fillStyle = data.color;
        ctx.fillRect(sx - 4, sy - 6 + bob, 8, 10);
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx - 2, sy - 8 + bob, 4, 3);
      } else if (item.type === 'gem') {
        ctx.fillStyle = data.color;
        const s = data.size;
        ctx.beginPath();
        ctx.moveTo(sx, sy - s + bob);
        ctx.lineTo(sx + s, sy + bob);
        ctx.lineTo(sx, sy + s + bob);
        ctx.lineTo(sx - s, sy + bob);
        ctx.closePath();
        ctx.fill();
      } else if (item.type === 'chest') {
        ctx.fillStyle = data.color;
        ctx.fillRect(sx - 7, sy - 5 + bob, 14, 10);
        ctx.fillStyle = '#cc9900';
        ctx.fillRect(sx - 5, sy - 3 + bob, 10, 6);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(sx - 1, sy - 1 + bob, 2, 2);
      }
    }

    // Render enemies
    for (const e of this.enemies) {
      e.render(ctx, this.camera);
    }

    // Render player
    this.player.render(ctx, this.camera);

    // Messages
    for (let i = 0; i < this.messages.length; i++) {
      const m = this.messages[i];
      m.y -= 20 * (1 / 60);
      ctx.fillStyle = m.color;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.text, GAME.WIDTH / 2, GAME.HEIGHT / 2 + m.y - 40);
    }

    // HUD
    this.renderHUD(ctx);

    // Death overlay
    if (this.player.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      ctx.fillStyle = '#ff4444';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('YOU DIED', GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20);
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('PRESS ENTER', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20);
    }
  }

  renderHUD(ctx) {
    // HP Bar
    const hpRatio = this.player.hp / this.player.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(12, 12, 204, 18);
    ctx.fillStyle = hpRatio > 0.3 ? '#ff4444' : '#aa0000';
    ctx.fillRect(14, 14, Math.max(0, 200 * hpRatio), 14);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 204, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP ' + Math.ceil(this.player.hp) + '/' + this.player.maxHp, 18, 24);

    // XP Bar
    const nextXp = PLAYER.xpToLevel[this.level] || 9999;
    const prevXp = PLAYER.xpToLevel[this.level - 1] || 0;
    const xpRatio = Math.min(1, (this.player.xp - prevXp) / (nextXp - prevXp));
    ctx.fillStyle = '#000';
    ctx.fillRect(12, 36, 154, 12);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(14, 38, Math.max(0, 150 * xpRatio), 8);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(12, 36, 154, 12);
    ctx.fillStyle = '#fff';
    ctx.fillText('LV' + this.player.level, 18, 44);

    // Stats
    ctx.fillStyle = '#ffd700';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('FLOOR ' + this.level, GAME.WIDTH - 16, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText('KILLS ' + this.kills, GAME.WIDTH - 16, 44);
    ctx.fillText('SCORE ' + this.score, GAME.WIDTH - 16, 64);

    // Attack cooldown indicator
    if (this.player.atkTimer > 0) {
      const ratio = this.player.atkTimer / this.player.atkCooldown;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(GAME.WIDTH / 2 - 20, GAME.HEIGHT - 20, 40 * ratio, 4);
    }
  }
}

class GameOverScene {
  constructor(engine, level, kills, score) {
    this.engine = engine;
    this.level = level;
    this.kills = kills;
    this.score = score;
    this.time = 0;
  }

  update(dt, input) {
    this.time += dt;
    if (input.justPressed('Enter') || input.justPressed('Space')) {
      this.engine.setScene(new DungeonScene(this.engine));
    }
    if (input.justPressed('Escape')) {
      this.engine.setScene(new MenuScene(this.engine));
    }
  }

  render(ctx) {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = '28px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME.WIDTH / 2, 120);

    ctx.fillStyle = '#ffd700';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText('FINAL SCORE: ' + this.score, GAME.WIDTH / 2, 180);

    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('DEEPEST FLOOR: ' + this.level, GAME.WIDTH / 2, 230);
    ctx.fillText('ENEMIES SLAIN: ' + this.kills, GAME.WIDTH / 2, 260);

    // Decorative line
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(250, 290);
    ctx.lineTo(550, 290);
    ctx.stroke();

    if (Math.sin(this.time * 4) > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('ENTER: PLAY AGAIN', GAME.WIDTH / 2, 340);
      ctx.fillText('ESC: MAIN MENU', GAME.WIDTH / 2, 365);
    }
  }
}
