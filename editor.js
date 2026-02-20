const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const blockSize = 50; // Matched to Game TILE size
let cameraX = 0;
let currentTool = "block";
let currentLevelName = null;
const STORAGE_KEY = "FD_LEVELS_V2";

let levelData = { name:"", blocks: [] };

// UI Toggle logic
const buttons = ["blockBtn", "spikeBtn", "finishBtn", "deleteBtn"];
function setActive(id) {
    buttons.forEach(b => document.getElementById(b).classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// Buttons
document.getElementById("blockBtn").onclick = () => { currentTool = "block"; setActive("blockBtn"); };
document.getElementById("spikeBtn").onclick = () => { currentTool = "spike"; setActive("spikeBtn"); };
document.getElementById("finishBtn").onclick = () => { currentTool = "finish"; setActive("finishBtn"); };
document.getElementById("deleteBtn").onclick = () => { currentTool = "delete"; setActive("deleteBtn"); };
document.getElementById("saveBtn").onclick = saveLevel;
document.getElementById("loadBtn").onclick = loadLevel;
document.getElementById("newBtn").onclick = newLevel;

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Grid
    ctx.strokeStyle="#222";
    for(let x=0; x<canvas.width + cameraX; x+=blockSize){
        ctx.beginPath();
        ctx.moveTo(x - (cameraX % blockSize), 0);
        ctx.lineTo(x - (cameraX % blockSize), canvas.height);
        ctx.stroke();
    }
    for(let y=0; y<canvas.height; y+=blockSize){
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Drawing Elements
    levelData.blocks.forEach(obj => {
        const drawX = obj.x - cameraX;
        if(drawX + blockSize < 0 || drawX > canvas.width) return;

        if (obj.type === "block") {
            ctx.fillStyle = "#67ffff";
            ctx.fillRect(drawX, obj.y, blockSize, blockSize);
        } else if (obj.type === "spike") {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.moveTo(drawX, obj.y + blockSize);
            ctx.lineTo(drawX + blockSize / 2, obj.y);
            ctx.lineTo(drawX + blockSize, obj.y + blockSize);
            ctx.fill();
        } else if (obj.type === "finish") {
            ctx.fillStyle = "gold";
            ctx.fillRect(drawX, obj.y, blockSize, blockSize);
            // Add a little trophy icon look
            ctx.strokeStyle = "black";
            ctx.strokeRect(drawX + 10, obj.y + 10, blockSize - 20, blockSize - 20);
        }
    });

    requestAnimationFrame(draw);
}
draw();

canvas.addEventListener("click",(e)=>{
    const rect = canvas.getBoundingClientRect();
    const worldX = Math.floor((e.clientX - rect.left + cameraX) / blockSize) * blockSize;
    const worldY = Math.floor((e.clientY - rect.top) / blockSize) * blockSize;

    if(currentTool === "delete"){
        levelData.blocks = levelData.blocks.filter(b => !(b.x === worldX && b.y === worldY));
        return;
    }

    if(currentTool === "finish"){
        levelData.blocks = levelData.blocks.filter(b => b.type !== "finish");
    }

    const exists = levelData.blocks.find(b => b.x === worldX && b.y === worldY);
    if(!exists){
        levelData.blocks.push({ x: worldX, y: worldY, type: currentTool });
    }
});

document.addEventListener("keydown",(e)=>{
    if(e.key === "ArrowRight") cameraX += blockSize;
    if(e.key === "ArrowLeft") { cameraX -= blockSize; if(cameraX < 0) cameraX = 0; }
});

function saveLevel(){
    if(!currentLevelName) currentLevelName = prompt("Enter level name:");
    if(!currentLevelName) return;
    levelData.name = currentLevelName;
    let levels = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    levels[currentLevelName] = levelData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    alert("Level Saved!");
}

function loadLevel(){
    let levels = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    let names = Object.keys(levels);
    if(names.length === 0) { alert("No saved levels."); return; }
    let choice = prompt("Available levels:\n" + names.join("\n"));
    if(!choice || !levels[choice]) return;
    currentLevelName = choice;
    levelData = levels[choice];
}

function newLevel(){
    currentLevelName = null;
    levelData = { name: "", blocks: [] };

}
