class MenuScene {
  constructor(engine) {
    this.engine = engine;
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * GAME.WIDTH,
        y: Math.random() * GAME.HEIGHT,
        speed: 10 + Math.random() * 30,
        size: 1 + Math.random() * 2
      });
    }
    this.titlePulse = 0;
    this.demoMecha1 = new Mecha(200, COLORS.p1, COLORS.p1Dark, KEYS.p1, true);
    this.demoMecha2 = new Mecha(GAME.WIDTH - 248, COLORS.p2, COLORS.p2Dark, KEYS.p2, false);
    this.demoMecha1.y = GAME.GROUND_Y - MECHA.height;
    this.demoMecha2.y = GAME.GROUND_Y - MECHA.height;
  }

  update(dt, input) {
    this.titlePulse += dt;
    for (let s of this.stars) {
      s.x -= s.speed * dt;
      if (s.x < 0) s.x = GAME.WIDTH;
    }
    this.demoMecha1.animFrame = Math.floor(this.titlePulse * 8) % 4;
    this.demoMecha2.animFrame = Math.floor(this.titlePulse * 8) % 4;

    if (input.isPressed('Enter') || input.isPressed('Space')) {
      this.engine.setScene(new BattleScene(this.engine));
    }
  }

  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Stars
    for (let s of this.stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GAME.GROUND_Y, GAME.WIDTH, GAME.HEIGHT - GAME.GROUND_Y);
    for (let x = 0; x < GAME.WIDTH; x += 16) {
      ctx.fillStyle = (x / 16) % 2 === 0 ? COLORS.groundLight : COLORS.ground;
      ctx.fillRect(x, GAME.GROUND_Y, 16, 4);
    }

    // Demo mechas
    this.demoMecha1.render(ctx);
    this.demoMecha2.render(ctx);

    // Title
    const pulse = 1 + Math.sin(this.titlePulse * 3) * 0.05;
    ctx.save();
    ctx.translate(GAME.WIDTH / 2, 120);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#fff';
    ctx.font = '40px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MECHA BATTLE', 0, 0);
    ctx.fillStyle = COLORS.p1;
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText('PIXEL ARENA', 0, 30);
    ctx.restore();

    // Controls box
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(280, 200, 400, 180);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(280, 200, 400, 180);

    ctx.fillStyle = COLORS.p1;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P1 BLUE', 300, 230);
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('A/D: MOVE  W: JUMP', 300, 255);
    ctx.fillText('F: ATTACK  G: DEFEND', 300, 275);

    ctx.fillStyle = COLORS.p2;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('P2 RED', 660, 230);
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('LEFT/RIGHT: MOVE', 660, 255);
    ctx.fillText('UP: JUMP', 660, 270);
    ctx.fillText('NUM1: ATTACK  NUM2: DEFEND', 660, 285);

    // Start prompt
    const blink = Math.sin(this.titlePulse * 6) > 0;
    if (blink) {
      ctx.fillStyle = '#ffe600';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ENTER TO START', GAME.WIDTH / 2, 430);
    }
  }
}

class BattleScene {
  constructor(engine) {
    this.engine = engine;
    this.mecha1 = new Mecha(150, COLORS.p1, COLORS.p1Dark, KEYS.p1, true);
    this.mecha2 = new Mecha(GAME.WIDTH - 198, COLORS.p2, COLORS.p2Dark, KEYS.p2, false);
    this.mecha1.y = GAME.GROUND_Y - MECHA.height;
    this.mecha2.y = GAME.GROUND_Y - MECHA.height;
    this.timeLeft = GAME.MATCH_TIME;
    this.countdown = 3;
    this.countdownTimer = 0;
    this.started = false;
    this.finished = false;
    this.winner = null;
    this.shakeTimer = 0;
    this.effects = [];
    this.bgOffset = 0;
  }

  update(dt, input) {
    if (this.finished) {
      if (input.isPressed('Enter') || input.isPressed('Space')) {
        this.engine.setScene(new BattleScene(this.engine));
      }
      if (input.isPressed('Escape')) {
        this.engine.setScene(new MenuScene(this.engine));
      }
      return;
    }

    if (!this.started) {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 1) {
        this.countdown--;
        this.countdownTimer = 0;
        if (this.countdown <= 0) this.started = true;
      }
      return;
    }

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endMatch();
    }

    this.mecha1.update(dt, input, this.mecha2);
    this.mecha2.update(dt, input, this.mecha1);

    // Attack collisions
    this.checkAttack(this.mecha1, this.mecha2);
    this.checkAttack(this.mecha2, this.mecha1);

    // Check HP
    if (this.mecha1.hp <= 0 && !this.finished) {
      this.finished = true;
      this.winner = 'P2';
    }
    if (this.mecha2.hp <= 0 && !this.finished) {
      this.finished = true;
      this.winner = 'P1';
    }

    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // Effects
    for (let e of this.effects) {
      e.timer -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
    this.effects = this.effects.filter(e => e.timer > 0);

    this.bgOffset += 10 * dt;
  }

  checkAttack(attacker, defender) {
    if (attacker.attackBox && !defender.dead) {
      const hb = defender.getHitbox();
      const ab = attacker.attackBox;
      if (ab.x < hb.x + hb.w && ab.x + ab.w > hb.x &&
          ab.y < hb.y + hb.h && ab.y + ab.h > hb.y) {
        // Hit!
        const fromRight = attacker.x > defender.x;
        let dmg = MECHA.attackDmg;
        if (defender.state === 'defend') {
          dmg = Math.floor(dmg * (1 - MECHA.defendReduction));
          this.addEffect(hb.x + hb.w / 2, hb.y + 10, 'block');
        } else {
          this.addEffect(hb.x + hb.w / 2, hb.y + 10, 'hit');
          this.shakeTimer = 0.15;
        }
        defender.takeDamage(dmg, fromRight);
        attacker.attackBox = null; // One hit per attack
      }
    }
  }

  addEffect(x, y, type) {
    const count = type === 'hit' ? 6 : 3;
    for (let i = 0; i < count; i++) {
      this.effects.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 150,
        vy: (Math.random() - 0.5) * 150 - 50,
        timer: 0.3,
        color: type === 'hit' ? '#ff5555' : COLORS.shield,
        size: 2 + Math.random() * 3
      });
    }
  }

  endMatch() {
    this.finished = true;
    if (this.mecha1.hp > this.mecha2.hp) this.winner = 'P1';
    else if (this.mecha2.hp > this.mecha1.hp) this.winner = 'P2';
    else this.winner = 'DRAW';
  }

  render(ctx) {
    ctx.save();
    if (this.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // Parallax background buildings
    ctx.fillStyle = '#12131f';
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 100) - this.bgOffset * 0.3) % (GAME.WIDTH + 100);
      const x = bx < -50 ? bx + GAME.WIDTH + 150 : bx;
      const h = 150 + (i % 4) * 40;
      ctx.fillRect(x, GAME.GROUND_Y - h, 60, h);
      ctx.fillRect(x + 10, GAME.GROUND_Y - h - 20, 40, 20);
    }

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GAME.GROUND_Y, GAME.WIDTH, GAME.HEIGHT - GAME.GROUND_Y);
    for (let x = 0; x < GAME.WIDTH; x += 16) {
      ctx.fillStyle = (Math.floor((x + this.bgOffset) / 16)) % 2 === 0 ? COLORS.groundLight : COLORS.ground;
      ctx.fillRect(x, GAME.GROUND_Y, 16, 4);
    }
    // Ground detail
    ctx.fillStyle = '#222436';
    for (let x = 0; x < GAME.WIDTH; x += 48) {
      ctx.fillRect(x, GAME.GROUND_Y + 8, 32, 4);
    }

    // Mechas
    this.mecha1.render(ctx);
    this.mecha2.render(ctx);

    // Effects
    for (let e of this.effects) {
      ctx.globalAlpha = e.timer / 0.3;
      ctx.fillStyle = e.color;
      ctx.fillRect(Math.floor(e.x), Math.floor(e.y), e.size, e.size);
    }
    ctx.globalAlpha = 1;

    // HUD
    this.renderHUD(ctx);

    // Countdown
    if (!this.started) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      if (this.countdown > 0) {
        ctx.fillStyle = '#ffe600';
        ctx.font = '64px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(this.countdown), GAME.WIDTH / 2, GAME.HEIGHT / 2);
      } else {
        ctx.fillStyle = '#ff3864';
        ctx.font = '48px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FIGHT!', GAME.WIDTH / 2, GAME.HEIGHT / 2);
      }
    }

    // Result overlay
    if (this.finished) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

      ctx.fillStyle = this.winner === 'P1' ? COLORS.p1 : (this.winner === 'P2' ? COLORS.p2 : '#fff');
      ctx.font = '36px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const text = this.winner === 'DRAW' ? 'DRAW!' : this.winner + ' WINS!';
      ctx.fillText(text, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 30);

      ctx.fillStyle = '#fff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText('ENTER: REMATCH  ESC: MENU', GAME.WIDTH / 2, GAME.HEIGHT / 2 + 30);
    }

    ctx.restore();
  }

  renderHUD(ctx) {
    // P1 HP Bar
    const p1Ratio = this.mecha1.hp / this.mecha1.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(20, 16, 300, 20);
    ctx.fillStyle = p1Ratio > 0.3 ? COLORS.p1 : '#ff0000';
    ctx.fillRect(22, 18, Math.max(0, 296 * p1Ratio), 16);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 16, 300, 20);

    // P2 HP Bar
    const p2Ratio = this.mecha2.hp / this.mecha2.maxHp;
    ctx.fillStyle = '#000';
    ctx.fillRect(GAME.WIDTH - 320, 16, 300, 20);
    ctx.fillStyle = p2Ratio > 0.3 ? COLORS.p2 : '#ff0000';
    ctx.fillRect(GAME.WIDTH - 318, 18, Math.max(0, 296 * p2Ratio), 16);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(GAME.WIDTH - 320, 16, 300, 20);

    // Names
    ctx.fillStyle = COLORS.p1;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P1', 20, 14);
    ctx.fillStyle = COLORS.p2;
    ctx.textAlign = 'right';
    ctx.fillText('P2', GAME.WIDTH - 20, 14);

    // Timer
    const timerStr = Math.ceil(this.timeLeft).toString().padStart(2, '0');
    ctx.fillStyle = '#fff';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timerStr, GAME.WIDTH / 2, 36);

    // HP numbers
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(Math.ceil(this.mecha1.hp) + '/' + this.mecha1.maxHp, 20, 52);
    ctx.textAlign = 'right';
    ctx.fillText(Math.ceil(this.mecha2.hp) + '/' + this.mecha2.maxHp, GAME.WIDTH - 20, 52);
  }
}
