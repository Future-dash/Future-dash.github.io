const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

PlayFab.settings.titleId = "114A51";

const TILE = 50; 
const GRAVITY = 0.8;
const MOVE_SPEED = 7;
const JUMP_POWER = 16;

let obstacles = JSON.parse(localStorage.getItem("playLevel")) || [];
let currentLevelName = localStorage.getItem("currentLevelName") || "General";
let startTime = Date.now();
let finalTime = 0;
let gameOver = false;
let gameWin = false;

const player = { x: 100, y: 100, width: 40, height: 40, velX: 0, velY: 0, onGround: false };
let cameraX = 0;
const keys = {};

document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if ((gameOver || gameWin) && e.key === "Enter") restart();
    if ((gameOver || gameWin) && e.key === " ") window.location.href = "index.html";
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function restart() {
    player.x = 100; player.y = 100; player.velX = 0; player.velY = 0;
    gameOver = false; gameWin = false; startTime = Date.now();
}

function getPlayerColor() {
    return localStorage.getItem("temp_playerColor") || "#67ffff";
}

function saveToLeaderboard(score) {
    if (!localStorage.getItem("loggedInUser")) return;

    const scoreAsInt = Math.round(parseFloat(score) * 100);
    const updateRequest = {
        Statistics: [{
            StatisticName: currentLevelName,
            Value: scoreAsInt
        }]
    };

    PlayFabClientSDK.UpdatePlayerStatistics(updateRequest, (result, error) => {
        if (result) console.log("Cloud Score Saved!");
        else console.error("Cloud Save Error:", error.errorMessage);
    });
}

function update() {
    if (gameOver || gameWin) return;
    if (keys["a"] || keys["arrowleft"]) player.velX = -MOVE_SPEED;
    else if (keys["d"] || keys["arrowright"]) player.velX = MOVE_SPEED;
    else player.velX = 0;

    if ((keys["w"] || keys["arrowup"] || keys[" "]) && player.onGround) {
        player.velY = -JUMP_POWER;
        player.onGround = false;
    }

    player.velY += GRAVITY;
    player.x += player.velX;

    for (let tile of obstacles) {
        if (tile.type === "block" && rectCollision(player, tile)) {
            if (player.velX > 0) player.x = tile.x - player.width;
            if (player.velX < 0) player.x = tile.x + TILE;
        }
    }

    player.y += player.velY;
    player.onGround = false;

    for (let tile of obstacles) {
        if (rectCollision(player, tile)) {
            if (tile.type === "block") {
                if (player.velY > 0) { player.y = tile.y - player.height; player.onGround = true; }
                else if (player.velY < 0) { player.y = tile.y + TILE; }
                player.velY = 0;
            } else if (tile.type === "spike") {
                gameOver = true;
            } else if (tile.type === "finish") {
                gameWin = true;
                finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
                saveToLeaderboard(finalTime);
            }
        }
    }
    if (player.y > canvas.height) gameOver = true;
    cameraX = player.x - canvas.width / 2 + player.width / 2;
}

function rectCollision(a, b) {
    return a.x < b.x + TILE && a.x + a.width > b.x && a.y < b.y + TILE && a.y + a.height > b.y;
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let tile of obstacles) {
        let drawX = tile.x - cameraX;
        if (tile.type === "block") { ctx.fillStyle = "white"; ctx.fillRect(drawX, tile.y, TILE, TILE); }
        else if (tile.type === "spike") {
            ctx.fillStyle = "red"; ctx.beginPath();
            ctx.moveTo(drawX, tile.y + TILE); ctx.lineTo(drawX + TILE / 2, tile.y);
            ctx.lineTo(drawX + TILE, tile.y + TILE); ctx.fill();
        }
        else if (tile.type === "finish") { ctx.fillStyle = "gold"; ctx.fillRect(drawX, tile.y, TILE, TILE); }
    }
    ctx.fillStyle = getPlayerColor();
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    if (gameOver || gameWin) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = gameWin ? "#00ffcc" : "red";
        ctx.textAlign = "center"; ctx.font = "60px Arial";
        ctx.fillText(gameWin ? "CLEARED: " + finalTime + "s" : "YOU DIED", canvas.width / 2, canvas.height / 2);
    }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
