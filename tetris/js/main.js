const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const menu = document.getElementById('menu');
const over = document.getElementById('over');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const finalEl = document.getElementById('final');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');

const GRID = 20;
const COLS = 10;
const ROWS = 20;

const SHAPES = {
    I: [[1,1,1,1]],
    O: [[1,1],[1,1]],
    T: [[0,1,0],[1,1,1]],
    S: [[0,1,1],[1,1,0]],
    Z: [[1,1,0],[0,1,1]],
    J: [[1,0,0],[1,1,1]],
    L: [[0,0,1],[1,1,1]]
};

const COLORS = {
    I: '#00ffff', O: '#ffdd00', T: '#aa44ff',
    S: '#44ff44', Z: '#ff4444', J: '#4488ff', L: '#ff8844'
};

let board = [];
let current = null;
let next = null;
let score = 0;
let level = 1;
let lines = 0;
let gameLoop = null;

function initBoard() {
    board = [];
    for (let y = 0; y < ROWS; y++) {
        board[y] = [];
        for (let x = 0; x < COLS; x++) {
            board[y][x] = null;
        }
    }
}

function randomPiece() {
    const keys = Object.keys(SHAPES);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return {
        shape: SHAPES[key],
        color: COLORS[key],
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[key][0].length / 2),
        y: 0
    };
}

function rotate(piece) {
    const rows = piece.shape.length;
    const cols = piece.shape[0].length;
    const rotated = [];
    for (let x = 0; x < cols; x++) {
        rotated[x] = [];
        for (let y = rows - 1; y >= 0; y--) {
            rotated[x][rows - 1 - y] = piece.shape[y][x];
        }
    }
    return rotated;
}

function isValid(piece, offsetX = 0, offsetY = 0, newShape = null) {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const nx = piece.x + x + offsetX;
                const ny = piece.y + y + offsetY;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                if (ny >= 0 && board[ny][nx]) return false;
            }
        }
    }
    return true;
}

function mergePiece() {
    for (let y = 0; y < current.shape.length; y++) {
        for (let x = 0; x < current.shape[y].length; x++) {
            if (current.shape[y][x]) {
                const ny = current.y + y;
                const nx = current.x + x;
                if (ny >= 0) board[ny][nx] = current.color;
            }
        }
    }
}

function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(c => c !== null)) {
            board.splice(y, 1);
            board.unshift(new Array(COLS).fill(null));
            cleared++;
            y++;
        }
    }
    if (cleared > 0) {
        lines += cleared;
        score += [0, 100, 300, 500, 800][cleared] * level;
        level = Math.floor(lines / 10) + 1;
        scoreEl.innerText = score;
        levelEl.innerText = level;
        linesEl.innerText = lines;
    }
}

function drawBoard() {
    ctx.fillStyle = '#050515';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * GRID, y * GRID, GRID - 1, GRID - 1);
            }
        }
    }
    
    if (current) {
        ctx.fillStyle = current.color;
        for (let y = 0; y < current.shape.length; y++) {
            for (let x = 0; x < current.shape[y].length; x++) {
                if (current.shape[y][x]) {
                    const nx = current.x + x;
                    const ny = current.y + y;
                    if (ny >= 0) {
                        ctx.fillRect(nx * GRID, ny * GRID, GRID - 1, GRID - 1);
                    }
                }
            }
        }
    }
}

function drawNext() {
    nextCtx.fillStyle = '#0a0a15';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (next) {
        nextCtx.fillStyle = next.color;
        const offsetX = (5 - next.shape[0].length) / 2;
        const offsetY = (5 - next.shape.length) / 2;
        for (let y = 0; y < next.shape.length; y++) {
            for (let x = 0; x < next.shape[y].length; x++) {
                if (next.shape[y][x]) {
                    nextCtx.fillRect((x + offsetX) * GRID, (y + offsetY) * GRID, GRID - 1, GRID - 1);
                }
            }
        }
    }
}

function update() {
    if (!current) {
        current = next || randomPiece();
        next = randomPiece();
        if (!isValid(current)) {
            gameOver();
            return;
        }
    }
    
    if (isValid(current, 0, 1)) {
        current.y++;
    } else {
        mergePiece();
        clearLines();
        current = null;
    }
    
    drawBoard();
    drawNext();
}

function gameOver() {
    clearInterval(gameLoop);
    finalEl.innerText = score;
    over.style.display = 'flex';
}

function stopGame() {
    clearInterval(gameLoop);
    menu.style.display = 'flex';
    over.style.display = 'none';
}

function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    scoreEl.innerText = '0';
    levelEl.innerText = '1';
    linesEl.innerText = '0';
    current = null;
    next = randomPiece();
    menu.style.display = 'none';
    over.style.display = 'none';
    gameLoop = setInterval(update, Math.max(100, 500 - (level - 1) * 50));
}

startBtn.onclick = restartBtn.onclick = startGame;

document.addEventListener('keydown', e => {
    if (!current) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (isValid(current, -1)) current.x--;
            break;
        case 'ArrowRight':
            if (isValid(current, 1)) current.x++;
            break;
        case 'ArrowDown':
            if (isValid(current, 0, 1)) current.y++;
            break;
        case 'ArrowUp':
            const rotated = rotate(current);
            if (isValid(current, 0, 0, rotated)) current.shape = rotated;
            break;
        case ' ':
            while (isValid(current, 0, 1)) current.y++;
            mergePiece();
            clearLines();
            current = null;
            break;
        case 'Escape':
            stopGame();
            break;
    }
    drawBoard();
});
