// automaton_dynamic_grid_v2.js
// p5.js + Node.js 互換用 (VSCode Live Server対応)

let grid;
let nextGrid;
let fireTimers;
const cols = 192;
const rows = 128;
const cellSize = 5;
const spontaneousRate = 0.0001;
let generation = 0;
let isRunning = true;
const MIN_GENERATIONS_PER_FRAME = 1;
const MAX_GENERATIONS_PER_FRAME = 10;
let generationsPerFrame = 1;
const FIRE_LIFESPAN = 75;
let showAlpha = false; // 発火体の透明度表示切り替え

const HISTORY_MEMORY_BUDGET_BYTES = 5 * 1024 * 1024;
let history = [];
let historyStartGeneration = 0;
let lastControlSurfaceSignature = '';

function setup() {
  const canvas = createCanvas(cols * cellSize, rows * cellSize);
  if (canvas && typeof canvas.parent === 'function' && typeof document !== 'undefined' && document.getElementById('canvas-container')) {
    canvas.parent('canvas-container');
  }
  noStroke();
  grid = create2DArray(cols, rows);
  nextGrid = create2DArray(cols, rows);
  fireTimers = create2DArray(cols, rows);

  grid[floor(cols/2)][floor(rows/2)] = 3;
  fireTimers[floor(cols/2)][floor(rows/2)] = FIRE_LIFESPAN;
  history = [];
  historyStartGeneration = generation;
  recordHistorySnapshot(generation, createHistorySnapshot());
  setupControlSurface();
  updateControlSurface(true);
}

function draw() {
  background(0);
  drawGrid();

  if (isRunning) {
    for (let i = 0; i < generationsPerFrame; i++) {
      updateGrid();
      generation++;
      recordHistorySnapshot(generation, createHistorySnapshot());
    }
  }
  drawUI();
  updateControlSurface();
}

function drawGrid() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      drawCell(x, y, grid[x][y]);
    }
  }
}

function drawUI() {
  fill(255);
  textSize(14);
  textAlign(LEFT);
  const runLabel = isRunning ? 'RUN' : 'PAUSE';
  text(
    "t = " + generation + " | " + runLabel + " | " + generationsPerFrame + " gen/frame" +
      (showAlpha ? " | alpha ON" : " | alpha OFF"),
    10,
    height - 10
  );
}

function executeControlCommand(command) {
  let changed = false;

  if (command === 'toggle-run') {
    isRunning = !isRunning;
    changed = true;
  } else if (command === 'faster') {
    const next = min(generationsPerFrame + 1, MAX_GENERATIONS_PER_FRAME);
    changed = next !== generationsPerFrame;
    generationsPerFrame = next;
  } else if (command === 'slower') {
    const next = max(generationsPerFrame - 1, MIN_GENERATIONS_PER_FRAME);
    changed = next !== generationsPerFrame;
    generationsPerFrame = next;
  } else if (command === 'rewind') {
    if (generation > historyStartGeneration) {
      const targetGeneration = generation - 1;
      const snapshot = getHistorySnapshot(targetGeneration);
      if (snapshot) {
        generation = targetGeneration;
        restoreHistorySnapshot(snapshot);
        truncateHistoryAfterGeneration(generation);
        isRunning = false;
        changed = true;
      }
    }
  } else if (command === 'toggle-alpha') {
    showAlpha = !showAlpha;
    changed = true;
  }

  if (changed) updateControlSurface(true);
  return changed;
}

function keyPressed() {
  let command = null;
  if (key === ' ') {
    command = 'toggle-run';
  } else if (key === 'ArrowRight') {
    command = 'faster';
  } else if (key === 'ArrowLeft') {
    command = 'slower';
  } else if (key === 'r' || key === 'R') {
    command = 'rewind';
  } else if (key === 'a' || key === 'A') {
    command = 'toggle-alpha';
  }

  if (!command) return undefined;
  executeControlCommand(command);
  return false;
}

function setupControlSurface() {
  if (typeof document === 'undefined') return;
  const controls = document.getElementById('automaton-controls');
  if (!controls) return;

  controls.querySelectorAll('[data-command]').forEach((button) => {
    button.addEventListener('click', () => executeControlCommand(button.dataset.command));
  });
}

function getControlSurfaceState() {
  return {
    generation,
    isRunning,
    generationsPerFrame,
    canRewind: generation > historyStartGeneration,
    showAlpha,
  };
}

function updateControlSurface(force = false) {
  if (typeof document === 'undefined') return;
  const status = document.getElementById('automaton-status');
  const runButton = document.querySelector('[data-command="toggle-run"]');
  const rewindButton = document.querySelector('[data-command="rewind"]');
  const alphaButton = document.querySelector('[data-command="toggle-alpha"]');
  if (!status) return;

  const state = getControlSurfaceState();
  const signature = JSON.stringify(state);
  if (!force && signature === lastControlSurfaceSignature) return;
  lastControlSurfaceSignature = signature;

  status.textContent =
    `世代 ${state.generation} ・ ${state.isRunning ? '実行中' : '一時停止'} ・ ` +
    `${state.generationsPerFrame} 世代/frame ・ 巻戻し ${state.canRewind ? '可' : '不可'} ・ ` +
    `Alpha ${state.showAlpha ? 'ON' : 'OFF'}`;

  if (runButton) {
    runButton.textContent = state.isRunning ? '一時停止' : '実行';
    runButton.setAttribute('aria-pressed', state.isRunning ? 'true' : 'false');
  }
  if (rewindButton) rewindButton.disabled = !state.canRewind;
  if (alphaButton) alphaButton.setAttribute('aria-pressed', state.showAlpha ? 'true' : 'false');
}

function create2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < cols; i++) {
    arr[i] = new Array(rows).fill(0);
  }
  return arr;
}

function updateGrid() {
  for (let x = 0; x < cols; x++) {
    nextGrid[x].fill(0);
  }

  for (let x = 1; x < cols - 1; x++) {
    for (let y = 1; y < rows - 1; y++) {
      let me = grid[x][y];

      if (me === 0 && random() < spontaneousRate) {
        nextGrid[x][y] = 1;
      } else if (me === 1) {
        let directions = shuffle([[0,-1],[0,1],[1,0],[-1,0]]);
        let [dx, dy] = directions[0];
        let nx = x + dx;
        let ny = y + dy;
        if (grid[nx][ny] < 3) nextGrid[nx][ny] = min(grid[nx][ny] + 1, 3);
        nextGrid[x][y] = 1;
      } else if (me === 2) {
        let pairs = shuffle([
          [[0, -1], [1, 0]], // 上右
          [[1, 0], [0, 1]],  // 右下
          [[0, 1], [-1, 0]], // 下左
          [[-1, 0], [0, -1]] // 左上
        ]);
        for (let [dx, dy] of pairs[0]) {
          let nx = x + dx;
          let ny = y + dy;
          if (grid[nx][ny] < 3) nextGrid[nx][ny] = min(grid[nx][ny] + 1, 3);
        }
        nextGrid[x][y] = 2;
      } else if (me === 3) {
        fireTimers[x][y] = (fireTimers[x][y] || FIRE_LIFESPAN) - 1;
        if (fireTimers[x][y] <= 0) {
          nextGrid[x][y] = 0;
          fireTimers[x][y] = 0;
        } else {
          nextGrid[x][y] = 3;
        }
      }
    }
  }
  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
}

function drawCell(x, y, state) {
  switch (state) {
    case 0: fill(0); break;
    case 1: fill(50, 50, 200); break;
    case 2: fill(100, 200, 100); break;
    case 3:
      if (showAlpha) {
        let alpha = map(fireTimers[x][y] || FIRE_LIFESPAN, 0, FIRE_LIFESPAN, 0, 255);
        fill(150, 150, 150, alpha);
      } else {
        fill(150);
      }
      break;
  }
  rect(x * cellSize, y * cellSize, cellSize, cellSize);
}

function encodeByteGrid(source) {
  const values = new Uint8Array(cols * rows);
  let index = 0;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      values[index++] = source[x][y] || 0;
    }
  }
  return values;
}

function decodeByteGrid(values) {
  const restored = create2DArray(cols, rows);
  let index = 0;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      restored[x][y] = values[index++];
    }
  }
  return restored;
}

function getHistorySnapshotByteSize(snapshot) {
  if (!snapshot) return 0;
  return (snapshot.grid?.byteLength || 0) + (snapshot.fireTimers?.byteLength || 0);
}

function getHistoryTotalByteSize() {
  return history.reduce((total, snapshot) => total + getHistorySnapshotByteSize(snapshot), 0);
}

function historyIndexForGeneration(targetGeneration) {
  return targetGeneration - historyStartGeneration;
}

function getHistorySnapshot(targetGeneration) {
  const index = historyIndexForGeneration(targetGeneration);
  return index >= 0 && index < history.length ? history[index] : null;
}

function trimHistoryToBudget(budgetBytes = HISTORY_MEMORY_BUDGET_BYTES) {
  let totalBytes = getHistoryTotalByteSize();
  while (history.length > 1 && totalBytes > budgetBytes) {
    totalBytes -= getHistorySnapshotByteSize(history.shift());
    historyStartGeneration++;
  }
}

function truncateHistoryAfterGeneration(targetGeneration) {
  const keepLength = historyIndexForGeneration(targetGeneration) + 1;
  if (keepLength >= 0 && keepLength < history.length) {
    history.length = keepLength;
  }
}

function recordHistorySnapshot(snapshotGeneration, snapshot) {
  if (history.length === 0) {
    historyStartGeneration = snapshotGeneration;
    history.push(snapshot);
  } else {
    const index = historyIndexForGeneration(snapshotGeneration);
    if (index < 0) return;
    if (index < history.length) history.length = index;
    history[index] = snapshot;
    history.length = index + 1;
  }
  trimHistoryToBudget();
}

function createHistorySnapshot() {
  return {
    grid: encodeByteGrid(grid),
    fireTimers: encodeByteGrid(fireTimers)
  };
}

function restoreHistorySnapshot(snapshot) {
  grid = decodeByteGrid(snapshot.grid);
  fireTimers = decodeByteGrid(snapshot.fireTimers);
}
