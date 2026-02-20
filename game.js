// ===============================
// CANVAS & INITIALIZATION
// ===============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===============================
// SETTINGS
// ===============================
const TILE = 50; 
const GRAVITY = 0.8;
const MOVE_SPEED = 7;
const JUMP_POWER = 16;

// ===============================
// LEVEL DATA & STATE
// ===============================
let obstacles = JSON.parse(localStorage.getItem("playLevel")) || [];
let currentLevelName = localStorage.getItem("currentLevelName") || "Unnamed Level";

// Timer Variables
let startTime = Date.now();
let finalTime = 0;

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
let gameOver = false;
let gameWin = false;
const keys = {};

// ===============================
// INPUT HANDLING
// ===============================
document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    // Restart logic
    if ((gameOver || gameWin) && e.key === "Enter") {
        restart();
    }

    // Back to Menu logic using Space Bar
    if ((gameOver || gameWin) && e.key === " ") {
        window.location.href = "index.html";
    }
});

document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

// ===============================
// UTILITIES & SAVE LOGIC
// ===============================
function rectCollision(a, b) {
    return (
        a.x < b.x + TILE &&
        a.x + a.width > b.x &&
        a.y < b.y + TILE &&
        a.y + a.height > b.y
    );
}

function restart() {
    player.x = 100;
    player.y = 100;
    player.velX = 0;
    player.velY = 0;
    gameOver = false;
    gameWin = false;
    startTime = Date.now(); // Reset timer on death or restart
}

function getPlayerColor() {
    const user = localStorage.getItem("loggedInUser");
    const userSettings = JSON.parse(localStorage.getItem("FD_USER_SETTINGS")) || {};
    
    // Check if logged in user has a saved color
    if (user && userSettings[user] && userSettings[user].color) {
        return userSettings[user].color;
    }
    
    // Fallback to guest color or default cyan
    return localStorage.getItem("temp_playerColor") || "#67ffff";
}

function saveToLeaderboard(score) {
    const user = localStorage.getItem("loggedInUser");
    if (!user) return; // Only save if the player is logged in

    let leaderboards = JSON.parse(localStorage.getItem("FD_LEADERBOARDS")) || {};
    
    // Create section for this specific level if it doesn't exist
    if (!leaderboards[currentLevelName]) {
        leaderboards[currentLevelName] = [];
    }

    leaderboards[currentLevelName].push({ 
        username: user, 
        time: parseFloat(score), 
        date: new Date().toLocaleDateString() 
    });

    // Sort: Fastest (lowest time) first
    leaderboards[currentLevelName].sort((a, b) => a.time - b.time);
    
    // Keep only Top 10
    leaderboards[currentLevelName] = leaderboards[currentLevelName].slice(0, 10);

    localStorage.setItem("FD_LEADERBOARDS", JSON.stringify(leaderboards));
}

// ===============================
// GAME LOGIC (UPDATE)
// ===============================
function update() {
    if (gameOver || gameWin) return;

    // Movement
    if (keys["a"] || keys["arrowleft"]) player.velX = -MOVE_SPEED;
    else if (keys["d"] || keys["arrowright"]) player.velX = MOVE_SPEED;
    else player.velX = 0;

    if ((keys["w"] || keys["arrowup"] || keys[" "]) && player.onGround) {
        player.velY = -JUMP_POWER;
        player.onGround = false;
    }

    player.velY += GRAVITY;
    player.x += player.velX;

    // X Collision
    for (let tile of obstacles) {
        if (tile.type === "block" && rectCollision(player, tile)) {
            if (player.velX > 0) player.x = tile.x - player.width;
            if (player.velX < 0) player.x = tile.x + TILE;
        }
    }

    player.y += player.velY;
    player.onGround = false;

    // Y Collision & Hazards
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
                saveToLeaderboard(finalTime);
            }
        }
    }

    if (player.y > canvas.height) gameOver = true;
    cameraX = player.x - canvas.width / 2 + player.width / 2;
}

// ===============================
// RENDERING (DRAW)
// ===============================
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let tile of obstacles) {
        let drawX = tile.x - cameraX;
        let drawY = tile.y;

        if (tile.type === "block") {
            ctx.fillStyle = "white";
            ctx.fillRect(drawX, drawY, TILE, TILE);
        } else if (tile.type === "spike") {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(drawX, drawY + TILE);
            ctx.lineTo(drawX + TILE / 2, drawY);
            ctx.lineTo(drawX + TILE, drawY + TILE);
            ctx.closePath();
            ctx.fill();
        } else if (tile.type === "finish") {
            ctx.fillStyle = "gold";
            ctx.fillRect(drawX, drawY, TILE, TILE);
        }
    }

    // Draw player with dynamic color
    ctx.fillStyle = getPlayerColor();
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    // Live Timer
    if (!gameOver && !gameWin) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Level: " + currentLevelName + " | Time: " + ((Date.now() - startTime) / 1000).toFixed(2) + "s", 20, 40);
    }

    // UI Overlay
    if (gameOver || gameWin) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.fillStyle = gameWin ? "#00ffcc" : "red";
        ctx.font = "bold 60px Arial";
        ctx.fillText(gameWin ? "CLEARED: " + finalTime + "s" : "YOU DIED", canvas.width / 2, canvas.height / 2);

        ctx.font = "24px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("Press ENTER to Restart", canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText("Press SPACE for Menu", canvas.width / 2, canvas.height / 2 + 100);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();