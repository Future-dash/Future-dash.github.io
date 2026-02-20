const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ensure canvas fills the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Azure PlayFab Config
PlayFab.settings.titleId = "114A51";

const TILE = 50; 
const GRAVITY = 0.8;
const MOVE_SPEED = 7;
const JUMP_POWER = 16;

// Level and State
let obstacles = JSON.parse(localStorage.getItem("playLevel")) || [];
let currentLevelName = localStorage.getItem("currentLevelName") || "General";
let startTime = Date.now();
let finalTime = 0;
let gameOver = false;
let gameWin = false;

// Initial Player Setup
const player = { 
    x: 100, 
    y: 100, 
    width: 40, 
    height: 40, 
    velX: 0, 
    velY: 0, 
    onGround: false 
};

let cameraX = 0;
const keys = {};

// Input Listeners
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if ((gameOver || gameWin) && e.key === "Enter") restart();
    if ((gameOver || gameWin) && e.key === " ") window.location.href = "index.html";
});
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function restart() {
    player.x = 100; 
    player.y = 100; 
    player.velX = 0; 
    player.velY = 0;
    gameOver = false; 
    gameWin = false; 
    startTime = Date.now();
}

// THE FIX: Added a strong fallback color so player is never invisible
function getPlayerColor() {
    let savedColor = localStorage.getItem("temp_playerColor");
    if (savedColor && savedColor.startsWith("#")) {
        return savedColor;
    }
    return "#67ffff"; // Default Neon Blue if nothing is found
}

function saveToLeaderboard(score) {
    if (!localStorage.getItem("loggedInUser")) return;

    // Convert seconds (10.55) to integer (1055) for PlayFab
    const scoreAsInt = Math.round(parseFloat(score) * 100);
    const updateRequest = {
        Statistics: [{
            StatisticName: currentLevelName,
            Value: scoreAsInt
        }]
    };

    PlayFabClientSDK.UpdatePlayerStatistics(updateRequest, (result, error) => {
        if (result) console.log("Cloud Score Saved!");
        else console.error("Cloud Save Error:", error ? error.errorMessage : "Unknown Error");
    });
}

function rectCollision(a, b) {
    return (
        a.x < b.x + TILE &&
        a.x + a.width > b.x &&
        a.y < b.y + TILE &&
        a.y + a.height > b.y
    );
}

function update() {
    if (gameOver || gameWin) return;

    // Left/Right Movement
    if (keys["a"] || keys["arrowleft"]) player.velX = -MOVE_SPEED;
    else if (keys["d"] || keys["arrowright"]) player.velX = MOVE_SPEED;
    else player.velX = 0;

    // Jump
    if ((keys["w"] || keys["arrowup"] || keys[" "]) && player.onGround) {
        player.velY = -JUMP_POWER;
        player.onGround = false;
    }

    // Apply Gravity and X-Movement
    player.velY += GRAVITY;
    player.x += player.velX;

    // X-Collision
    for (let tile of obstacles) {
        if (tile.type === "block" && rectCollision(player, tile)) {
            if (player.velX > 0) player.x = tile.x - player.width;
            if (player.velX < 0) player.x = tile.x + TILE;
        }
    }

    // Y-Movement
    player.y += player.velY;
    player.onGround = false;

    // Y-Collision & Hazard detection
    for (let tile of obstacles) {
        if (rectCollision(player, tile)) {
            if (tile.type === "block") {
                if (player.velY > 0) { 
                    player.y = tile.y - player.height; 
                    player.onGround = true; 
                }
                else if (player.velY < 0) { 
                    player.y = tile.y + TILE; 
                }
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

    // Fall out of world
    if (player.y > canvas.height + 500) gameOver = true;

    // Camera follow (Centered on player)
    cameraX = player.x - canvas.width / 2 + player.width / 2;
}

function draw() {
    // Clear background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Blocks/Hazards
    for (let tile of obstacles) {
        let drawX = tile.x - cameraX;
        
        if (tile.type === "block") { 
            ctx.fillStyle = "white"; 
            ctx.fillRect(drawX, tile.y, TILE, TILE); 
        }
        else if (tile.type === "spike") {
            ctx.fillStyle = "red"; 
            ctx.beginPath();
            ctx.moveTo(drawX, tile.y + TILE); 
            ctx.lineTo(drawX + TILE / 2, tile.y);
            ctx.lineTo(drawX + TILE, tile.y + TILE); 
            ctx.fill();
        }
        else if (tile.type === "finish") { 
            ctx.fillStyle = "gold"; 
            ctx.fillRect(drawX, tile.y, TILE, TILE); 
        }
    }

    // Draw Player
    ctx.fillStyle = getPlayerColor();
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    // UI Overlay (Death or Win)
    if (gameOver || gameWin) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = gameWin ? "#00ffcc" : "red";
        ctx.textAlign = "center"; 
        ctx.font = "bold 60px Arial";
        ctx.fillText(gameWin ? "CLEARED: " + finalTime + "s" : "YOU DIED", canvas.width / 2, canvas.height / 2);
        
        ctx.font = "20px Arial"; 
        ctx.fillStyle = "white";
        ctx.fillText("ENTER to Restart | SPACE for Menu", canvas.width / 2, canvas.height / 2 + 60);
    }
}

function loop() { 
    update(); 
    draw(); 
    requestAnimationFrame(loop); 
}

loop();
