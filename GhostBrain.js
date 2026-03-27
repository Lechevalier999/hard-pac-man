/****************************************************
 *  PAC‑MAN GHOST AI — EVOLVING TEAM EDITION
 ****************************************************/

/***********************
 * 1. HOOKS YOU FILL IN
 ***********************/
function getPlayer() {
    // TODO: CONNECT YOUR PLAYER HERE
    // Example:
    // return { x: player.xTile, y: player.yTile, dir: player.direction };
    return { x: 0, y: 0, dir: 'LEFT' };
}

function getGhosts() {
    // TODO: CONNECT YOUR GHOSTS HERE
    // Must return array of ghost objects with x, y, lastDir, id (string or number)
    // Example:
    // return [redGhost, pinkGhost, blueGhost, orangeGhost];
    return [];
}

const levelGrid = [
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
   [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
   [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
   [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
   [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
   [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
   [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
   [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
   [0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
   [1,1,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,1,1],
   [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0], 
   [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
   [0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
   [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
   [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
   [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
   [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
   [1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
   [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
   [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
   [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function getGrid() {    
  return levelGrid;
}

class NeuralNetwork {
    constructor(inputSize = 13, hiddenSize = 20, hiddenNum = 2, outputSize = 4) {
        this.layers = [];
        this.layers.push(this.randomMatrix(hiddenSize, inputSize));
        for (let i = 1; i < hiddenNum; i++) {
            this.layers.push(this.randomMatrix(hiddenSize, hiddenSize));
        }
        this.layers.push(this.randomMatrix(outputSize, hiddenSize));
    }

    randomMatrix(rows, cols) {
        const m = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                row.push(Math.random() * 2 - 1);
            }
            m.push(row);
        }
        return m;
    }

    relu(x) { return x > 0 ? x : 0; }

    dot(mat, vec) {
        const out = new Array(mat.length).fill(0);
        for (let i = 0; i < mat.length; i++) {
            let sum = 0;
            for (let j = 0; j < vec.length; j++) {
                sum += mat[i][j] * vec[j];
            }
            out[i] = sum;
        }
        return out;
    }

    predict(inputArray) {
        let out = inputArray;
        for (let i = 0; i < this.layers.length; i++) {
            out = this.dot(this.layers[i], out);
            if (i < this.layers.length - 1) out = out.map(v => this.relu(v));
        }
        return out; // [UP, DOWN, RIGHT, LEFT]
    }

    clone() {
        const nn = new NeuralNetwork();
        nn.layers = this.layers.map(layer =>
            layer.map(row => row.slice())
        );
        return nn;
    }
}

function mutateNetwork(nn, rate = 0.1, magnitude = 0.3) {
    for (let l = 0; l < nn.layers.length; l++) {
        const layer = nn.layers[l];
        for (let i = 0; i < layer.length; i++) {
            for (let j = 0; j < layer[i].length; j++) {
                if (Math.random() < rate) {
                    layer[i][j] += (Math.random() * 2 - 1) * magnitude;
                }
            }
        }
    }
}

function crossoverNetworks(parentA, parentB) {
    const child = parentA.clone();
    for (let l = 0; l < child.layers.length; l++) {
        for (let i = 0; i < child.layers[l].length; i++) {
            for (let j = 0; j < child.layers[l][i].length; j++) {
                if (Math.random() < 0.5) {
                    child.layers[l][i][j] = parentB.layers[l][i][j];
                }
            }
        }
    }
    return child;
}

const ROLES = ['AMBUSH', 'PINCER', 'HERD', 'CORNER_TRAP'];

class GhostBrain {
    constructor(role) {
        this.nn = new NeuralNetwork();
        this.role = role || 'AMBUSH';
        this.memory = []; // recent player positions
        this.maxMemory = 30;
        this.fitness = 0;
    }

    remember(player) {
        this.memory.push({ x: player.x, y: player.y });
        if (this.memory.length > this.maxMemory) {
            this.memory.shift();
        }
    }

    getLastSeenPlayer() {
        if (this.memory.length === 0) return null;
        return this.memory[this.memory.length - 1];
    }
}

const ghostBrains = new Map(); // ghost.id -> GhostBrain

function getOrCreateGhostBrain(ghost, index) {
    if (!ghostBrains.has(ghost.id)) {
        const role = ROLES[index % ROLES.length];
        ghostBrains.set(ghost.id, new GhostBrain(role));
    }
    return ghostBrains.get(ghost.id);
}

function chooseTargetForGhost(ghost, ghosts, player, grid) {
    const brain = ghostBrains.get(ghost.id);
    const role = brain.role;

    let target = { x: player.x, y: player.y };

    const lastSeen = brain.getLastSeenPlayer();
    if (lastSeen) {
        target = lastSeen;
    }

    if (role === 'AMBUSH') {
        const lookAhead = 4;
        let dx = 0, dy = 0;
        if (player.dir === 'UP') dy = -1;
        else if (player.dir === 'DOWN') dy = 1;
        else if (player.dir === 'LEFT') dx = -1;
        else if (player.dir === 'RIGHT') dx = 1;
        target = {
            x: player.x + dx * lookAhead,
            y: player.y + dy * lookAhead
        };
    } else if (role === 'PINCER') {
        const other = ghosts.find(g => g !== ghost) || player;
        const mx = player.x + (player.x - other.x);
        const my = player.y + (player.y - other.y);
        target = { x: mx, y: my };
    } else if (role === 'HERD') {
        const corners = [
            { x: 1, y: 1 },
            { x: grid[0].length - 2, y: 1 },
            { x: 1, y: grid.length - 2 },
            { x: grid[0].length - 2, y: grid.length - 2 }
        ];
        let best = corners[0];
        let bestDist = Infinity;
        for (const c of corners) {
            const d = Math.abs(player.x - c.x) + Math.abs(player.y - c.y);
            if (d < bestDist) {
                bestDist = d;
                best = c;
            }
        }
        target = best;
    } else if (role === 'CORNER_TRAP') {
        const idx = ROLES.indexOf('CORNER_TRAP');
        const corners = [
            { x: 1, y: 1 },
            { x: grid[0].length - 2, y: 1 },
            { x: 1, y: grid.length - 2 },
            { x: grid[0].length - 2, y: grid.length - 2 }
        ];
        target = corners[(ghost.id || 0) % corners.length] || corners[0];
    }

    target.x = Math.max(0, Math.min(grid[0].length - 1, target.x));
    target.y = Math.max(0, Math.min(grid.length - 1, target.y));

    return target;
}

function buildInputs(ghost, ghosts, player) {
    const others = ghosts.filter(g => g !== ghost);
    const g1 = others[0] || { x: 0, y: 0 };
    const g2 = others[1] || { x: 0, y: 0 };
    const g3 = others[2] || { x: 0, y: 0 };

    return [
        player.x, player.y,   // 0–1
        ghost.x, ghost.y,     // 2–3
        g1.x, g1.y,           // 4–5
        g2.x, g2.y,           // 6–7
        g3.x, g3.y,           // 8–9
        0,                    // 10 (power pellet flag if you want)
        0,                    // 11 (extra feature)
        Math.random()         // 12 (noise)
    ];
}

function findNextStep(grid, start, target) {
    const h = grid.length;
    const w = grid[0].length;

    const visited = Array.from({ length: h }, () => Array(w).fill(false));
    const queue = [];
    const parent = new Map();

    queue.push(start);
    visited[start.y][start.x] = true;

    const dirs = [
        { dx: 0, dy: -1, dir: 'UP' },
        { dx: 0, dy: 1,  dir: 'DOWN' },
        { dx: 1, dy: 0,  dir: 'RIGHT' },
        { dx: -1, dy: 0, dir: 'LEFT' }
    ];

    while (queue.length) {
        const cur = queue.shift();
        if (cur.x === target.x && cur.y === target.y) break;

        for (const d of dirs) {
            const nx = cur.x + d.dx;
            const ny = cur.y + d.dy;

            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (grid[ny][nx] === 1) continue;
            if (visited[ny][nx]) continue;

            visited[ny][nx] = true;
            queue.push({ x: nx, y: ny });
            parent.set(`${nx},${ny}`, `${cur.x},${cur.y}`);
        }
    }

    const targetKey = `${target.x},${target.y}`;
    if (!parent.has(targetKey)) return null;

    let curKey = targetKey;
    let prevKey = parent.get(curKey);

    while (prevKey && prevKey !== `${start.x},${start.y}`) {
        curKey = prevKey;
        prevKey = parent.get(curKey);
    }

    const [nx, ny] = curKey.split(',').map(Number);
    return { x: nx, y: ny };
}

const DIRS = {
    UP:    { dx: 0, dy: -1 },
    DOWN:  { dx: 0, dy: 1 },
    RIGHT: { dx: 1, dy: 0 },
    LEFT:  { dx: -1, dy: 0 }
};

function opposite(dir) {
    return { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }[dir] || null;
}

function chooseDirection(ghost, outputs, grid, player, ghosts) {
    const [up, down, right, left] = outputs;
    const scores = [
        { dir: 'UP', score: up },
        { dir: 'DOWN', score: down },
        { dir: 'RIGHT', score: right },
        { dir: 'LEFT', score: left }
    ].sort((a, b) => b.score - a.score);

    const forbidden = opposite(ghost.lastDir);

    const target = chooseTargetForGhost(ghost, ghosts, player, grid);
    const nextStep = findNextStep(grid, { x: ghost.x, y: ghost.y }, target);
    let pathDir = null;

    if (nextStep) {
        const dx = nextStep.x - ghost.x;
        const dy = nextStep.y - ghost.y;
        if (dx === 0 && dy === -1) pathDir = 'UP';
        if (dx === 0 && dy === 1)  pathDir = 'DOWN';
        if (dx === 1 && dy === 0)  pathDir = 'RIGHT';
        if (dx === -1 && dy === 0) pathDir = 'LEFT';
    }

    for (const cand of scores) {
        if (cand.dir === forbidden) continue;
        const d = DIRS[cand.dir];
        if (grid[ghost.y + d.dy]?.[ghost.x + d.dx] === 0) return cand.dir;
    }

    if (pathDir && pathDir !== forbidden) return pathDir;

    return ghost.lastDir || 'UP';
}

function moveGhost(ghost, dir) {
    const d = DIRS[dir];
    ghost.x += d.dx;
    ghost.y += d.dy;
    ghost.lastDir = dir;
}


function evolveGhosts(fitnessMap) {
    const entries = [];
    for (const [id, brain] of ghostBrains.entries()) {
        const fitness = fitnessMap[id] || 0;
        brain.fitness = fitness;
        entries.push({ id, brain });
    }
    if (entries.length === 0) return;

    entries.sort((a, b) => b.brain.fitness - a.brain.fitness);

    const best = entries[0].brain;
    const second = entries[1]?.brain || best;

    for (let i = 0; i < entries.length; i++) {
        const { id, brain } = entries[i];
        let childNN;
        if (i === 0) {
            // Keep best as is
            childNN = best.nn.clone();
        } else {
            // Crossover + mutation
            childNN = crossoverNetworks(best.nn, second.nn);
            mutateNetwork(childNN, 0.2, 0.4);
        }
        brain.nn = childNN;
        brain.memory = [];
        brain.fitness = 0;
    }
}

let ghostAIStarted = false;

function startGhostAI() {
    if (ghostAIStarted) return;
    ghostAIStarted = true;

    function loop() {
        const ghosts = getGhosts();
        const player = getPlayer();
        const grid = getGrid();

        ghosts.forEach((ghost, index) => {
            const brain = getOrCreateGhostBrain(ghost, index);
            brain.remember(player);

            const inputs = buildInputs(ghost, ghosts, player);
            const outputs = brain.nn.predict(inputs);
            const dir = chooseDirection(ghost, outputs, grid, player, ghosts);
            moveGhost(ghost, dir);

            // Simple fitness: closer to player = better
            const dist = Math.abs(ghost.x - player.x) + Math.abs(ghost.y - player.y);
            brain.fitness += Math.max(0, 50 - dist);
        });

        requestAnimationFrame(loop);
    }

    loop();
}
