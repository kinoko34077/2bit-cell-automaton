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
let speed = 0.2;
const FIRE_LIFESPAN = 75;
let showAlpha = false; // 発火体の透明度表示切り替え

let history = [];

function setup() {
  createCanvas(cols * cellSize, rows * cellSize);
  noStroke();
  grid = create2DArray(cols, rows);
  nextGrid = create2DArray(cols, rows);
  fireTimers = create2DArray(cols, rows);

  grid[floor(cols/2)][floor(rows/2)] = 3;
  fireTimers[floor(cols/2)][floor(rows/2)] = FIRE_LIFESPAN;
  history.push(encodeGrid(grid));
}

function draw() {
  background(0);
  drawGrid();

  if (isRunning) {
    for (let i = 0; i < speed; i++) {
      updateGrid();
      generation++;
      history.push(encodeGrid(grid));
    }
  }
  drawUI();
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
  text("t = " + generation + (showAlpha ? " (alpha ON)" : " (alpha OFF)"), 10, height - 10);
}

function keyPressed() {
  if (key === ' ') {
    isRunning = !isRunning;
  } else if (key === 'ArrowRight') {
    speed = min(speed + 1, 10);
  } else if (key === 'ArrowLeft') {
    speed = max(speed - 1, 1);
  } else if (key === 'r') {
    if (generation > 0) {
      generation--;
      grid = decodeGrid(history[generation]);
    }
  } else if (key === 'a') {
    showAlpha = !showAlpha;
  }
}

function create2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < cols; i++) {
    arr[i] = new Array(rows).fill(0);
  }
  return arr;
}

function updateGrid() {
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

function encodeGrid(grid) {
  return grid.flat().join("");
}

function decodeGrid(str) {
  let arr = str.split("").map(Number);
  let newGrid = create2DArray(cols, rows);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      newGrid[i][j] = arr[i * rows + j];
    }
  }
  return newGrid;
}
