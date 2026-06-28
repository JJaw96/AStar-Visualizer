let cells = [];
let start = null;
let goal = null;
let obstacles = new Set();
let currentMode = 'obstacle';

let frontier = [];
let closedSet = new Set();
let cameFrom = {};
let gScore = {};
let fScore = {};
let animationTimeout = null;
let isRunning = false;

// Constants
const GRID_SIZE = 32;
const gridElement = document.getElementById('grid');

function createGrid() {
    gridElement.innerHTML = '';
    cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            cell.addEventListener('mousedown', handleCellClick);
            cell.addEventListener('mouseover', handleMouseOver);
            
            gridElement.appendChild(cell);
            cells.push(cell);
        }
    }
}

function handleCellClick(e) {
    if (isRunning) return;

    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    const key = `${x},${y}`;

    if (currentMode === 'start') {
        if (start) cells[start.y * GRID_SIZE + start.x].classList.remove('start');
        start = { x, y };
        e.target.classList.add('start');
    } else if (currentMode === 'goal') {
        if (goal) cells[goal.y * GRID_SIZE + goal.x].classList.remove('goal');
        goal = { x, y };
        e.target.classList.add('goal');
    } else if (currentMode === 'obstacle') {
        if (obstacles.has(key)) {
            obstacles.delete(key);
            e.target.classList.remove('obstacle');
        } else {
            obstacles.add(key);
            e.target.classList.add('obstacle');
        }
    }
}

function handleMouseOver(e) {
    if (e.buttons === 1 && currentMode === 'obstacle') {
        handleCellClick(e);
    }
}

// Button functionality
document.getElementById('startBtn').addEventListener('click', () => currentMode = 'start');
document.getElementById('goalBtn').addEventListener('click', () => currentMode = 'goal');
document.getElementById('obstacleBtn').addEventListener('click', () => currentMode = 'obstacle');
document.getElementById('clearBtn').addEventListener('click', () => {
    obstacles.clear();
    start = goal = null;
    resetVisualization();
    createGrid();
});
document.getElementById('runBtn').addEventListener('click', () => runAStar(true));
document.getElementById('stepBtn').addEventListener('click', () => runAStar(false));
document.getElementById('resetBtn').addEventListener('click', resetVisualization);

function resetVisualization() {
    if (animationTimeout) clearTimeout(animationTimeout);
    isRunning = false;
    frontier = [];
    closedSet.clear();
    cameFrom = {};
    gScore = {};
    fScore = {};
    cells.forEach(cell => {
        cell.classList.remove('open', 'closed', 'path');
    });
    document.getElementById('status').textContent = '';
}

function heuristic(a, b) {
    // Use Euclidean distance
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

async function runAStar(autoRun = true) {
    if (!start || !goal || isRunning) return;
    resetVisualization();
    isRunning = true;

    // A* initialization
    frontier = [{x: start.x, y: start.y}];
    gScore[`${start.x},${start.y}`] = 0;
    fScore[`${start.x},${start.y}`] = heuristic(start, goal);

    const statusEl = document.getElementById('status');

    while (frontier.length > 0) {

        // Get node with lowest fScore
        frontier.sort((a, b) => (fScore[`${a.x},${a.y}`] || Infinity) - (fScore[`${b.x},${b.y}`] || Infinity));
        
        const current = frontier.shift();
        const currentKey = `${current.x},${current.y}`;

        // Found the path!
        if (current.x === goal.x && current.y === goal.y) {
            reconstructPath(current);
            statusEl.textContent = 'Path found!';
            isRunning = false;
            return;
        }

        closedSet.add(currentKey);
        const cellIndex = current.y * GRID_SIZE + current.x;
        cells[cellIndex].classList.add('closed');

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const nKey = `${neighbor.x},${neighbor.y}`;
            if (closedSet.has(nKey)) continue;

            const tentativeG = gScore[currentKey] + 1;

            if (!frontier.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                frontier.push(neighbor);
            } else if (tentativeG >= (gScore[nKey] || Infinity)) {
                continue;
            }

            cameFrom[nKey] = current;
            gScore[nKey] = tentativeG;
            fScore[nKey] = tentativeG + heuristic(neighbor, goal);

            const nIndex = neighbor.y * GRID_SIZE + neighbor.x;
            cells[nIndex].classList.add('open');
        }

        if (!autoRun) {
            statusEl.textContent = `Exploring... (${frontier.length} open)`;
            await new Promise(resolve => animationTimeout = setTimeout(resolve, 30));
        }
    }

    statusEl.textContent = 'No path found';
    isRunning = false;
}

// Gets neighbors in 8 directions
function getNeighbors(node) {
    const dirs = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
    const neighbors = [];
    for (const [dx, dy] of dirs) {
        const nx = node.x + dx;
        const ny = node.y + dy;
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        if (obstacles.has(`${nx},${ny}`)) continue;
        neighbors.push({x: nx, y: ny});
    }
    return neighbors;
}

function reconstructPath(current) {
    let path = [];
    let curr = current;
    while (curr) {
        const key = `${curr.x},${curr.y}`;
        path.unshift(curr);
        curr = cameFrom[key];
    }

    // Animate the path
    path.forEach((node, i) => {
        setTimeout(() => {
            const idx = node.y * GRID_SIZE + node.x;
            cells[idx].classList.add('path');
        }, i * 40);
    });
}

createGrid();