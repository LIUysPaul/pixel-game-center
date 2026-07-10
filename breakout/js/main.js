const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const over = document.getElementById('over');
const win = document.getElementById('win');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const finalEl = document.getElementById('final');
const winScoreEl = document.getElementById('winScore');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const winRestartBtn = document.getElementById('winRestart');

const PADDLE_W = 80;
const PADDLE_H = 12;
const BALL_R = 6;
const BRICK_W = 40;
const BRICK_H = 12;
const BRICK_PAD = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;

let paddle = { x: 200, y: 380 };
let ball = { x: 240, y: 368, dx: 4, dy: -4, launched: false };
let bricks = [];
let score = 0;
let lives = 3;
let gameLoop = null;
let keys = { left: false, right: false };

const COLORS = ['#ff4444', '#ff8844', '#ffdd00', '#44ff44', '#44ffff'];

function initBricks() {
    bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            bricks.push({
                x: col * (BRICK_W + BRICK_PAD) + 20,
                y: row * (BRICK_H + BRICK_PAD) + 40,
                color: COLORS[row],
                hit: false,
                points: (BRICK_ROWS - row) * 10
            });
        }
    }
}

function resetBall() {
    ball.x = paddle.x + PADDLE_W / 2;
    ball.y = paddle.y - BALL_R - 2;
    ball.dx = (Math.random() - 0.5) * 6;
    ball.dy = -4;
    ball.launched = false;
}

function update() {
    if (keys.left) paddle.x -= 6;
    if (keys.right) paddle.x += 6;
    paddle.x = Math.max(0, Math.min(canvas.width - PADDLE_W, paddle.x));
    
    if (!ball.launched) {
        ball.x = paddle.x + PADDLE_W / 2;
        draw();
        return;
    }
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    if (ball.x <= BALL_R || ball.x >= canvas.width - BALL_R) {
        ball.dx *= -1;
    }
    if (ball.y <= BALL_R) {
        ball.dy *= -1;
    }
    
    if (ball.y + BALL_R >= paddle.y &&
        ball.y - BALL_R <= paddle.y + PADDLE_H &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + PADDLE_W) {
        ball.dy = -Math.abs(ball.dy);
        const hitPos = (ball.x - paddle.x) / PADDLE_W;
        ball.dx = (hitPos - 0.5) * 8;
    }
    
    if (ball.y > canvas.height) {
        lives--;
        livesEl.innerText = lives;
        if (lives <= 0) {
            gameOver();
            return;
        }
        resetBall();
    }
    
    for (let b of bricks) {
        if (b.hit) continue;
        if (ball.x + BALL_R >= b.x &&
            ball.x - BALL_R <= b.x + BRICK_W &&
            ball.y + BALL_R >= b.y &&
            ball.y - BALL_R <= b.y + BRICK_H) {
            b.hit = true;
            ball.dy *= -1;
            score += b.points;
            scoreEl.innerText = score;
            break;
        }
    }
    
    if (bricks.every(b => b.hit)) {
        gameWin();
        return;
    }
    
    draw();
}

function draw() {
    ctx.fillStyle = '#050515';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let b of bricks) {
        if (!b.hit) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
        }
    }
    
    ctx.fillStyle = '#ff8844';
    ctx.fillRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H);
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
}

function gameOver() {
    clearInterval(gameLoop);
    finalEl.innerText = score;
    over.style.display = 'flex';
}

function gameWin() {
    clearInterval(gameLoop);
    winScoreEl.innerText = score;
    win.style.display = 'flex';
}

function stopGame() {
    clearInterval(gameLoop);
    menu.style.display = 'flex';
    over.style.display = 'none';
    win.style.display = 'none';
}

function startGame() {
    initBricks();
    score = 0;
    lives = 3;
    scoreEl.innerText = '0';
    livesEl.innerText = '3';
    paddle.x = (canvas.width - PADDLE_W) / 2;
    resetBall();
    menu.style.display = 'none';
    over.style.display = 'none';
    win.style.display = 'none';
    gameLoop = setInterval(update, 1000 / 60);
}

startBtn.onclick = restartBtn.onclick = winRestartBtn.onclick = startGame;

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' && !ball.launched) ball.launched = true;
    if (e.key === 'Escape') stopGame();
});

document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});
