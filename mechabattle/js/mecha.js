class Mecha {
  constructor(x, color, darkColor, controls, facingRight = true) {
    this.x = x;
    this.y = GAME.GROUND_Y - MECHA.height;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.darkColor = darkColor;
    this.controls = controls;
    this.facingRight = facingRight;
    this.hp = MECHA.maxHp;
    this.maxHp = MECHA.maxHp;
    this.state = 'idle';
    this.stateTimer = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.onGround = true;
    this.attackCooldownTimer = 0;
    this.defendTimer = 0;
    this.hitTimer = 0;
    this.blinkTimer = 0;
    this.flashRed = 0;
    this.dead = false;
    this.attackBox = null;
    this.particles = [];
  }

  update(dt, input, other) {
    if (this.dead) {
      this.state = 'dead';
      this.updateParticles(dt);
      return;
    }

    this.stateTimer += dt;
    this.animTimer += dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
    if (this.hitTimer > 0) this.hitTimer -= dt;
    if (this.flashRed > 0) this.flashRed -= dt;
    if (this.blinkTimer > 0) this.blinkTimer -= dt;

    // Physics
    this.vy += GAME.GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ground collision
    if (this.y >= GAME.GROUND_Y - MECHA.height) {
      this.y = GAME.GROUND_Y - MECHA.height;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Wall bounds
    if (this.x < 0) this.x = 0;
    if (this.x > GAME.WIDTH - MECHA.width) this.x = GAME.WIDTH - MECHA.width;

    // State machine
    if (this.hitTimer > 0) {
      this.state = 'hit';
      this.vx = 0;
    } else if (this.state === 'attack' && this.stateTimer < 0.25) {
      // Attacking, freeze movement
      this.vx = 0;
    } else if (this.state === 'dead') {
      this.vx = 0;
    } else {
      // Normal controls
      this.handleInput(dt, input, other);
    }

    // Animation frame
    if (this.animTimer > 0.125) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    this.updateParticles(dt);
  }

  handleInput(dt, input, other) {
    let moveLeft = input.isPressed(this.controls.left);
    let moveRight = input.isPressed(this.controls.right);
    let jump = input.isPressed(this.controls.jump);
    let attack = input.isPressed(this.controls.attack);
    let defend = input.isPressed(this.controls.defend);

    // Auto face opponent
    if (other.x > this.x) this.facingRight = true;
    else this.facingRight = false;

    if (defend && this.onGround) {
      this.state = 'defend';
      this.defendTimer += dt;
      this.vx = 0;
      if (this.defendTimer > MECHA.defendMaxTime) {
        // Break guard
        this.hitTimer = 1.0;
        this.defendTimer = 0;
      }
      this.attackBox = null;
      return;
    } else {
      this.defendTimer = 0;
    }

    if (attack && this.attackCooldownTimer <= 0 && this.onGround) {
      this.state = 'attack';
      this.stateTimer = 0;
      this.attackCooldownTimer = MECHA.attackCooldown;
      this.vx = 0;
      // Setup attack hitbox
      const ax = this.facingRight ? this.x + MECHA.width : this.x - 36;
      this.attackBox = { x: ax, y: this.y + 16, w: 36, h: 32 };
      return;
    }

    // Clear attack box after attack window
    if (this.state === 'attack' && this.stateTimer > 0.15) {
      this.attackBox = null;
    }
    if (this.state === 'attack' && this.stateTimer > 0.25) {
      this.state = 'idle';
    }

    // Movement
    this.vx = 0;
    if (moveLeft) {
      this.vx = -MECHA.speed;
      if (this.onGround) this.state = 'move';
    }
    if (moveRight) {
      this.vx = MECHA.speed;
      if (this.onGround) this.state = 'move';
    }
    if (!moveLeft && !moveRight && this.onGround && this.state !== 'attack') {
      this.state = 'idle';
    }

    if (jump && this.onGround) {
      this.vy = -MECHA.jumpForce;
      this.onGround = false;
      this.state = 'jump';
    }
    if (!this.onGround) {
      this.state = 'jump';
    }
  }

  takeDamage(amount, fromRight) {
    if (this.dead) return;
    if (this.state === 'defend') {
      amount = Math.floor(amount * (1 - MECHA.defendReduction));
      this.spawnParticles(this.x + MECHA.width / 2, this.y + 20, COLORS.shield, 4);
    } else {
      this.spawnParticles(this.x + MECHA.width / 2, this.y + 20, '#ff5555', 6);
      this.flashRed = 0.15;
    }
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.state = 'dead';
      this.stateTimer = 0;
      this.spawnParticles(this.x + MECHA.width / 2, this.y + 30, this.color, 15);
    } else {
      this.hitTimer = MECHA.hitStun;
      // Knockback
      this.vx = fromRight ? 180 : -180;
      this.vy = -120;
    }
  }

  spawnParticles(px, py, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200 - 50,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.3 + Math.random() * 0.3,
        color: color,
        size: 2 + Math.random() * 3
      });
    }
  }

  updateParticles(dt) {
    for (let p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  getHitbox() {
    return { x: this.x + 8, y: this.y + 4, w: MECHA.width - 16, h: MECHA.height - 8 };
  }

  render(ctx) {
    if (this.blinkTimer > 0 && Math.floor(this.blinkTimer * 20) % 2 === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Flash red when hit
    if (this.flashRed > 0) {
      ctx.globalCompositeOperation = 'source-atop';
    }

    const px = Math.floor(this.x);
    const py = Math.floor(this.y);
    const c = this.color;
    const d = this.darkColor;

    // Facing transform
    ctx.save();
    if (!this.facingRight) {
      ctx.translate(px + MECHA.width, py);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(px, py);
    }

    const bob = this.state === 'idle' ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
    const legOffset = this.state === 'move' ? (this.animFrame % 2) * 4 : 0;
    const armExtend = this.state === 'attack' && this.stateTimer < 0.15 ? 8 : 0;
    const squat = this.state === 'defend' ? 4 : 0;
    const yb = bob - squat;

    // Draw mecha pixel art (48x64 base)
    // Body
    this.drawRect(ctx, 12, 16 + yb, 24, 20, c);
    this.drawRect(ctx, 14, 18 + yb, 20, 16, d);
    // Chest core
    this.drawRect(ctx, 20, 22 + yb, 8, 8, '#ffffff');
    this.drawRect(ctx, 22, 24 + yb, 4, 4, c);

    // Head
    this.drawRect(ctx, 14, yb, 20, 16, c);
    this.drawRect(ctx, 16, 2 + yb, 16, 10, d);
    // Eyes
    this.drawRect(ctx, 18, 6 + yb, 4, 4, '#fff');
    this.drawRect(ctx, 26, 6 + yb, 4, 4, '#fff');
    this.drawRect(ctx, 19, 7 + yb, 2, 2, '#000');
    this.drawRect(ctx, 27, 7 + yb, 2, 2, '#000');
    // Antenna
    this.drawRect(ctx, 22, -4 + yb, 4, 4, c);
    this.drawRect(ctx, 23, -8 + yb, 2, 4, '#fff');

    // Left arm
    this.drawRect(ctx, 4, 18 + yb, 8, 16, c);
    this.drawRect(ctx, 4, 18 + yb, 6, 12, d);
    // Right arm (attack extends)
    this.drawRect(ctx, 36 + armExtend, 18 + yb, 8, 16, c);
    this.drawRect(ctx, 38 + armExtend, 18 + yb, 6, 12, d);

    // Weapon when attacking
    if (this.state === 'attack' && this.stateTimer < 0.15) {
      this.drawRect(ctx, 44, 20 + yb, 12, 6, '#fff');
      this.drawRect(ctx, 46, 22 + yb, 8, 2, c);
    }

    // Legs
    const l1 = this.state === 'move' ? legOffset : 0;
    const l2 = this.state === 'move' ? 4 - legOffset : 0;
    this.drawRect(ctx, 12, 36 + yb + l1, 8, 20 - l1, c);
    this.drawRect(ctx, 28, 36 + yb + l2, 8, 20 - l2, c);
    this.drawRect(ctx, 12, 52 + yb, 10, 4, d);
    this.drawRect(ctx, 26, 52 + yb, 10, 4, d);

    // Shield when defending
    if (this.state === 'defend') {
      ctx.globalAlpha = 0.6 + Math.sin(this.stateTimer * 10) * 0.2;
      this.drawRect(ctx, -4, 8 + yb, 4, 40, COLORS.shield);
      this.drawRect(ctx, -2, 12 + yb, 2, 32, '#fff');
      ctx.globalAlpha = 1;
    }

    ctx.restore(); // facing transform

    // Particles
    for (let p of this.particles) {
      ctx.globalAlpha = p.life / p.maxLife;
      this.drawRect(ctx, p.x, p.y, p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }
}
