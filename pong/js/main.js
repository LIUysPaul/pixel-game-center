const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const winTip = document.getElementById('winTip');
const menu = document.getElementById('menu');
const btnAi = document.getElementById('btnAi');
const btnTwo = document.getElementById('btnTwo');

const W = canvas.width;
const H = canvas.height;
const PIXEL = 4;

let gameMode = "ai";
let gameStart = false;

const padW = 16;
const padH = 80;
const playerPad = {
    x:24,
    y:H/2-padH/2,
    targetY: H/2-padH/2,
    baseSpeed:4.2
};
const rightPad = {
    x: W - 40,
    y:H/2-padH/2,
    targetY: H/2-padH/2,
    baseSpeed:3.8
};

const ballSize = 12;
let ball = {
    x: W/2 - ballSize/2,
    y: H/2 - ballSize/2,
    dx: 7,
    dy: 4
};
const MAX_BALL_SPEED = 12;

let scoreP1 = 0;
let scoreP2 = 0;
const WIN_SCORE = 10;
let gameOver = false;
let winner = "";

const key = {};
document.addEventListener('keydown', e=>{
    key[e.key.toLowerCase()]=true;
    if(gameOver && e.key === ' '){
        resetAll();
    }
    if(e.key === 'Escape'){
        backToMenu();
    }
});
document.addEventListener('keyup', e=>key[e.key.toLowerCase()]=false);

let particles = [];

let audioCtx = null;
function initAudio(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playSound(type){
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    switch(type){
        case 'hit':
            osc.frequency.value = 440;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
            break;
        case 'score':
            osc.frequency.setValueAtTime(220, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.2);
            osc.type = 'square';
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
            break;
        case 'win':
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i)=>{
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.value = freq;
                o.type = 'square';
                g.gain.setValueAtTime(0.1, audioCtx.currentTime + i*0.12);
                g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i*0.12 + 0.15);
                o.start(audioCtx.currentTime + i*0.12);
                o.stop(audioCtx.currentTime + i*0.12 + 0.15);
            });
            break;
    }
}

btnAi.onclick = ()=>{
    gameMode = "ai";
    startGame();
};
btnTwo.onclick = ()=>{
    gameMode = "two";
    startGame();
};

function startGame(){
    initAudio();
    menu.style.display = "none";
    gameStart = true;
    resetAll();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function backToMenu(){
    gameStart = false;
    gameOver = false;
    menu.style.display = "flex";
    winTip.style.display = "none";
    particles = [];
}

function resetAll(){
    scoreP1 = 0;
    scoreP2 = 0;
    gameOver = false;
    winTip.style.display = "none";
    particles = [];
    playerPad.y = H/2-padH/2;
    playerPad.targetY = playerPad.y;
    rightPad.y = H/2-padH/2;
    rightPad.targetY = rightPad.y;
    resetBall(7);
}

function resetBall(dir){
    ball.x = W/2 - ballSize/2;
    ball.y = H/2 - ballSize/2;
    ball.dx = dir;
    ball.dy = (Math.random() - 0.5) * 6;
}

function smoothPadMove(pad){
    const diff = pad.targetY - pad.y;
    pad.y += diff * 0.14;
    pad.y = Math.max(0, Math.min(H - padH, pad.y));
}

function aiLogic(){
    if(gameOver) return;
    if(ball.dx > 0){
        const targetCenter = ball.y + ballSize / 2 + (Math.random() - 0.5) * 18;
        rightPad.targetY = targetCenter - padH / 2;
    }else{
        rightPad.targetY += (H/2 - padH/2 - rightPad.targetY) * 0.02;
    }
}

function updatePadTarget(){
    if(key['w']) playerPad.targetY -= playerPad.baseSpeed;
    if(key['s']) playerPad.targetY += playerPad.baseSpeed;
    playerPad.targetY = Math.max(0, Math.min(H - padH, playerPad.targetY));

    if(gameMode === "two"){
        if(key['i']) rightPad.targetY -= rightPad.baseSpeed;
        if(key['k']) rightPad.targetY += rightPad.baseSpeed;
        rightPad.targetY = Math.max(0, Math.min(H - padH, rightPad.targetY));
    }else{
        aiLogic();
        rightPad.targetY = Math.max(0, Math.min(H - padH, rightPad.targetY));
    }
}

function hitBallChangeSpeed(pad, isLeftPad){
    const padVel = pad.targetY - pad.y;
    ball.dy += padVel * 0.06;

    const speedBoost = Math.abs(padVel) * 0.045;
    if(isLeftPad){
        ball.dx = Math.abs(ball.dx) + speedBoost;
    }else{
        ball.dx = -Math.abs(ball.dx) - speedBoost;
    }

    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if(speed > MAX_BALL_SPEED){
        const ratio = MAX_BALL_SPEED / speed;
        ball.dx *= ratio;
        ball.dy *= ratio;
    }
    
    playSound('hit');
}

function createFirework(){
    particles = [];
    const colorList = ['#ff3333','#ffdd00','#33ff33','#33ccff','#ff66ff'];
    for(let i=0;i<150;i++){
        particles.push({
            x: W/2,
            y: H/2 - 80,
            vx: (Math.random()-0.5)*10,
            vy: (Math.random()-0.5)*10 - 4,
            color: colorList[Math.floor(Math.random()*colorList.length)],
            life: 140
        })
    }
}

function updateParticles(){
    for(let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14;
        p.life--;
        if(p.life <= 0) particles.splice(i,1);
    }
}

function drawParticles(){
    particles.forEach(p=>{
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, PIXEL*2, PIXEL*2);
    })
}

function update(){
    if(!gameStart) return;
    if(gameOver){
        updateParticles();
        return;
    }

    updatePadTarget();
    smoothPadMove(playerPad);
    smoothPadMove(rightPad);

    ball.x += ball.dx;
    ball.y += ball.dy;

    if(ball.y <= 0){
        ball.y = 0;
        ball.dy *= -1;
        playSound('hit');
    }
    if(ball.y + ballSize >= H){
        ball.y = H - ballSize;
        ball.dy *= -1;
        playSound('hit');
    }

    if(ball.x <= playerPad.x + padW
        && ball.y + ballSize >= playerPad.y
        && ball.y <= playerPad.y + padH
        && ball.dx < 0){
        ball.x = playerPad.x + padW;
        hitBallChangeSpeed(playerPad, true);
    }
    if(ball.x + ballSize >= rightPad.x
        && ball.y + ballSize >= rightPad.y
        && ball.y <= rightPad.y + padH
        && ball.dx > 0){
        ball.x = rightPad.x - ballSize;
        hitBallChangeSpeed(rightPad, false);
    }

    if(ball.x < 0){
        scoreP2++;
        playSound('score');
        resetBall(7);
        checkWin();
    }
    if(ball.x + ballSize > W){
        scoreP1++;
        playSound('score');
        resetBall(-7);
        checkWin();
    }
}

function checkWin(){
    if(scoreP1 >= WIN_SCORE){
        gameOver = true;
        winner = "P1玩家";
        winTip.innerText = winner + "获胜！";
        winTip.style.display = "block";
        createFirework();
        playSound('win');
    }else if(scoreP2 >= WIN_SCORE){
        gameOver = true;
        winner = gameMode === "ai" ? "AI电脑" : "P2玩家";
        winTip.innerText = winner + "获胜！";
        winTip.style.display = "block";
        createFirework();
        playSound('win');
    }
}

function draw(){
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0,0,W,H);

    if(!gameStart) return;

    ctx.fillStyle = '#226622';
    for(let y=0;y<H;y+=24){
        ctx.fillRect(W/2 - 2, y, 4, 12);
    }

    ctx.fillStyle = '#44ff44';
    ctx.fillRect(playerPad.x, playerPad.y, padW, padH);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(rightPad.x, rightPad.y, padW, padH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ball.x, ball.y, ballSize, ballSize);

    ctx.font = "32px Courier New";
    ctx.textAlign = "center";
    ctx.fillStyle = '#44ff44';
    ctx.fillText("P1: " + scoreP1, W*0.25, 48);
    ctx.fillStyle = '#ff4444';
    ctx.fillText((gameMode==="ai"?"AI":"P2") + ": " + scoreP2, W*0.75, 48);

    drawParticles();
}

function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
