const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const over = document.getElementById('over');
const scoreEl = document.querySelector('.score');
const highEl = document.querySelector('.high');
const finalEl = document.getElementById('final');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');

const GRID = 20;
const COLS = canvas.width / GRID;
const ROWS = canvas.height / GRID;

let snake = [{x: 10, y: 10}];
let food = {x: 15, y: 10};
let dx = 1, dy = 0;
let nextDx = 1, nextDy = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHigh')) || 0;
let gameLoop = null;
let paused = false;

highEl.innerText = '最高分: ' + highScore;

const keyMap = {
    'arrowup': {dx: 0, dy: -1}, 'w': {dx: 0, dy: -1},
    'arrowdown': {dx: 0, dy: 1}, 's': {dx: 0, dy: 1},
    'arrowleft': {dx: -1, dy: 0}, 'a': {dx: -1, dy: 0},
    'arrowright': {dx: 1, dy: 0}, 'd': {dx: 1, dy: 0}
};

document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (keyMap[k]) {
        const m = keyMap[k];
        if (m.dx !== -dx && m.dy !== -dy) {
            nextDx = m.dx;
            nextDy = m.dy;
        }
    }
    if (e.key === ' ' && !menu.style.display) {
        paused = !paused;
    }
    if (e.key === 'Escape') {
        stopGame();
    }
});

startBtn.onclick = restartBtn.onclick = () => {
    resetGame();
    menu.style.display = 'none';
    over.style.display = 'none';
    gameLoop = setInterval(update, 100);
};

function resetGame() {
    snake = [{x: 10, y: 10}];
    food = {x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS)};
    dx = 1; dy = 0;
    nextDx = 1; nextDy = 0;
    score = 0;
    paused = false;
    scoreEl.innerText = '分数: 0';
}

function stopGame() {
    clearInterval(gameLoop);
    menu.style.display = 'flex';
    over.style.display = 'none';
}

function update() {
    if (paused) return;
    dx = nextDx;
    dy = nextDy;
    
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver();
        return;
    }
    
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = '分数: ' + score;
        placeFood();
    } else {
        snake.pop();
    }
    
    draw();
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food = {x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS)};
        valid = !snake.some(s => s.x === food.x && s.y === food.y);
    }
}

function gameOver() {
    clearInterval(gameLoop);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHigh', highScore);
        highEl.innerText = '最高分: ' + highScore;
    }
    finalEl.innerText = score;
    over.style.display = 'flex';
}

function draw() {
    ctx.fillStyle = '#002200';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#44ff44';
    for (let i = 0; i < snake.length; i++) {
        const s = snake[i];
        ctx.fillRect(s.x * GRID, s.y * GRID, GRID - 1, GRID - 1);
        if (i === 0) {
            ctx.fillStyle = '#88ff88';
            ctx.fillRect(s.x * GRID + 6, s.y * GRID + 6, 3, 3);
            ctx.fillRect(s.x * GRID + 11, s.y * GRID + 6, 3, 3);
            ctx.fillStyle = '#44ff44';
        }
    }
    
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(food.x * GRID, food.y * GRID, GRID - 1, GRID - 1);
    ctx.fillStyle = '#ff8888';
    ctx.fillRect(food.x * GRID + 6, food.y * GRID + 4, 2, 2);
    ctx.fillRect(food.x * GRID + 12, food.y * GRID + 4, 2, 2);
    ctx.fillRect(food.x * GRID + 9, food.y * GRID + 12, 2, 2);
}
