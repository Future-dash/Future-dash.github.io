const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

PlayFab.settings.titleId = "114A51";
const TILE = 50; 
const obstacles = JSON.parse(localStorage.getItem("playLevel")) || [];
const player = { x: 100, y: 100, width: 40, height: 40, velX: 0, velY: 0, onGround: false };
let cameraX = 0, startTime = Date.now(), gameOver = false, gameWin = false;
const keys = {};

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function saveScore(s) {
    const request = { Statistics: [{ StatisticName: "General", Value: Math.round(s * 100) }] };
    PlayFabClientSDK.UpdatePlayerStatistics(request, () => console.log("Cloud Saved!"));
}

function update() {
    if (gameOver || gameWin) return;
    player.velX = keys["d"] || keys["arrowright"] ? 7 : (keys["a"] || keys["arrowleft"] ? -7 : 0);
    if ((keys["w"] || keys[" "]) && player.onGround) { player.velY = -16; player.onGround = false; }
    player.velY += 0.8; player.x += player.velX; player.y += player.velY;
    
    obstacles.forEach(t => {
        if (player.x < t.x + TILE && player.x + 40 > t.x && player.y < t.y + TILE && player.y + 40 > t.y) {
            if (t.type === "block") {
                if (player.velY > 0) { player.y = t.y - 40; player.onGround = true; player.velY = 0; }
                else { player.x -= player.velX; }
            } else if (t.type === "spike") gameOver = true;
            else if (t.type === "finish") { gameWin = true; saveScore((Date.now() - startTime)/1000); }
        }
    });
    if (player.y > canvas.height) gameOver = true;
    cameraX = player.x - canvas.width / 2;
}

function draw() {
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    obstacles.forEach(t => {
        ctx.fillStyle = t.type === "block" ? "white" : (t.type === "spike" ? "red" : "gold");
        ctx.fillRect(t.x - cameraX, t.y, TILE, TILE);
    });
    ctx.fillStyle = localStorage.getItem("temp_playerColor") || "#67ffff";
    ctx.fillRect(player.x - cameraX, player.y, 40, 40);
    if (gameOver || gameWin) {
        ctx.fillStyle = "white"; ctx.font = "40px Arial";
        ctx.fillText(gameWin ? "WIN! Space to Menu" : "DEAD! Enter to Restart", canvas.width/2 - 150, canvas.height/2);
        if (keys[" "]) window.location.href="index.html";
        if (keys["enter"]) location.reload();
    }
    requestAnimationFrame(() => { update(); draw(); });
}
draw();
