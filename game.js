/**
 * FUTURE DASH - CORE GAME ENGINE
 * Supports: Azure PlayFab Cloud Saves, Level Loading, & Camera System
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 1. INITIALIZE CANVAS
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. AZURE PLAYFAB CONFIG
// Ensure this matches your Title ID from the PlayFab Dashboard
if (typeof PlayFab !== 'undefined') {
    PlayFab.settings.titleId = "114A51";
}

// 3. GAME CONSTANTS
const TILE = 50;
const GRAVITY = 0.8;
const MOVE_SPEED = 7;
const JUMP_POWER = 16;

// 4. GAME STATE
// Check 'playLevel' (from Level Select) or fallback to 'FD_LEVELS' (from Editor)
let obstacles = JSON.parse(localStorage.getItem("playLevel")) || [];
let currentLevelName = localStorage.getItem("currentLevelName") || "General";

let startTime = Date.now();
let finalTime = 0;
let gameOver = false;
let gameWin = false;

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

// 5. INPUT HANDLING
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    
    // Restart on Enter
    if ((gameOver || gameWin) && e.key === "Enter") {
        restart();
    }
    // Menu on Space
    if ((gameOver || gameWin) && e.key === " ") {
        window.location.href = "index.html";
    }
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// 6. CORE FUNCTIONS
function restart() {
    player.x = 100;
    player.y = 100;
    player.velX = 0;
    player.velY = 0;
    gameOver = false;
    gameWin = false;
    startTime = Date.now();
}

function getPlayerColor() {
    const cloudColor = localStorage.getItem("temp_playerColor");
    return (cloudColor && cloudColor.startsWith("#")) ? cloudColor : "#67ffff";
}

function saveToPlayFab(score) {
    if (!localStorage.getItem("loggedInUser")) return;

    // Convert decimal time (10.55) to Integer (1055) for PlayFab Statistics
    const scoreAsInt = Math.round(parseFloat(score) * 100);

    const updateRequest = {
        Statistics: [{
            StatisticName: currentLevelName,
            Value: scoreAsInt
        }]
    };

    console.log(`Sending score ${scoreAsInt} to PlayFab for level: ${currentLevelName}`);
    
    if (typeof PlayFabClientSDK !== 'undefined') {
        PlayFabClientSDK.UpdatePlayerStatistics(updateRequest, (result, error) => {
            if (result) {
                console.log("Successfully synced to Azure!");
            } else {
                console.error("PlayFab Sync Error:", error.errorMessage);
            }
        });
    }
}

function rectCollision(a, b) {
    return (
        a.x < b.x + TILE &&
        a.x + a.width > b.x &&
        a.y < b.y + TILE &&
        a.y + a.height > b.y
    );
}

// 7. GAME LOOP: UPDATE
function update() {
    if (gameOver || gameWin) return;

    // Movement Logic
    if (keys["a"] || keys["arrowleft"]) player.velX = -MOVE_SPEED;
    else if (keys["d"] || keys["arrowright"]) player.velX = MOVE_SPEED;
    else player.velX = 0;

    if ((keys["w"] || keys["arrowup"] || keys[" "]) && player.onGround) {
        player.velY = -JUMP_POWER;
        player.onGround = false;
    }

    // Apply Physics
    player.velY += GRAVITY;
    player.x += player.velX;

    // Collision X
    for (let tile of obstacles) {
        if (tile.type === "block" && rectCollision(player, tile)) {
            if (player.velX > 0) player.x = tile.x - player.width;
            if (player.velX < 0) player.x = tile.x + TILE;
        }
    }

    player.y += player.velY;
    player.onGround = false;

    // Collision Y & Tile Events
    for (let tile of obstacles) {
        if (rectCollision(player, tile)) {
            if (tile.type === "block") {
                if (player.velY > 0) {
                    player.y = tile.y - player.height;
                    player.onGround = true;
                } else if (player.velY < 0) {
                    player.y = tile.y + TILE;
                }
                player.velY = 0;
            } 
            else if (tile.type === "spike") {
                gameOver = true;
            } 
            else if (tile.type === "finish") {
                gameWin = true;
                finalTime = ((Date.now() - startTime) / 1000).toFixed(2);
                saveToPlayFab(finalTime);
            }
        }
    }

    // Death by falling
    if (player.y > canvas.height + 200) {
        gameOver = true;
    }

    // Smooth Camera Follow
    cameraX = player.x - canvas.width / 2 + player.width / 2;
}

// 8. GAME LOOP: DRAW
function draw() {
    // Clear Screen
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Level Tiles
    for (let tile of obstacles) {
        let drawX = tile.x - cameraX;

        if (tile.type === "block") {
            ctx.fillStyle = "white";
            ctx.fillRect(drawX, tile.y, TILE, TILE);
        } else if (tile.type === "spike") {
            ctx.fillStyle = "#ff3333";
            ctx.beginPath();
            ctx.moveTo(drawX, tile.y + TILE);
            ctx.lineTo(drawX + TILE / 2, tile.y);
            ctx.lineTo(drawX + TILE, tile.y + TILE);
            ctx.fill();
        } else if (tile.type === "finish") {
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(drawX, tile.y, TILE, TILE);
        }
    }

    // Draw Player
    ctx.fillStyle = getPlayerColor();
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    // HUD: Timer
    if (!gameOver && !gameWin) {
        ctx.fillStyle = "white";
        ctx.font = "20px Monospace";
        ctx.textAlign = "left";
        ctx.fillText(`TIME: ${((Date.now() - startTime) / 1000).toFixed(2)}s`, 20, 40);
        ctx.fillText(`LEVEL: ${currentLevelName}`, 20, 70);
    }

    // DEATH / WIN OVERLAY
    if (gameOver || gameWin) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        
        // Main Message
        ctx.font = "bold 70px Arial";
        ctx.fillStyle = gameWin ? "#00ffcc" : "#ff4444";
        ctx.fillText(gameWin ? "LEVEL CLEARED" : "GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

        // Score Message
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        if (gameWin) {
            ctx.fillText(`Final Time: ${finalTime}s`, canvas.width / 2, canvas.height / 2 + 40);
        } else {
            ctx.fillText("You hit a hazard!", canvas.width / 2, canvas.height / 2 + 40);
        }

        // Instructions
        ctx.font = "20px Arial";
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText("Press ENTER to Try Again", canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText("Press SPACE for Level Selection", canvas.width / 2, canvas.height / 2 + 130);
    }
}

// 9. START THE LOOP
function main() {
    update();
    draw();
    requestAnimationFrame(main);
}

main();
