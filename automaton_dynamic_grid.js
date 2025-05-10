// automaton_dynamic_grid.js
// p5.js + Node.js 互換用 (VSCode Live Server対応)

let grid;
let nextGrid;
const cols = 128;
const rows = 64;
const cellSize = 8;
const spontaneousRate = 0.002; // 00->01の自然発現確率

// 4状態: 0=空白, 1=受容体, 2=拡張体, 3=発火体
let ruleset = Array(64).fill(0);

function setupRuleset() {
  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 4; b++) {
      for (let c = 0; c < 4; c++) {
        let i = a * 16 + b * 4 + c;
        if (b === 3) {
          ruleset[i] = 0; // 発火体は必ず次で崩壊
        } else if (b === 2) {
          ruleset[i] = (a === 3 || c === 3) ? 3 : 2; // 拡張体→発火 or 維持
        } else if (b === 1) {
          ruleset[i] = (a === 3 || c === 3) ? 2 : 1; // 受容体→拡張 or 維持
        } else {
          ruleset[i] = (a === 3 || c === 3) ? 1 : 0; // 空白→受容体 or 維持
        }
      }
    }
  }
}

function setup() {
  createCanvas(cols * cellSize, rows * cellSize);
  noStroke();
  grid = create2DArray(cols, rows);
  nextGrid = create2DArray(cols, rows);
  setupRuleset();

  // 初期配置（中央に発火体）
  grid[floor(cols/2)][floor(rows/2)] = 3;
}

function draw() {
  background(0);
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      drawCell(x, y, grid[x][y]);
    }
  }
  updateGrid();
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
      let left = grid[x - 1][y];
      let me = grid[x][y];
      let right = grid[x + 1][y];

      // 自然発現
      if (me === 0 && random() < spontaneousRate) {
        nextGrid[x][y] = 1;
      } else {
        let index = left * 16 + me * 4 + right;
        nextGrid[x][y] = ruleset[index];
      }
    }
  }
  // グリッドを更新
  let temp = grid;
  grid = nextGrid;
  nextGrid = temp;
}

function drawCell(x, y, state) {
  switch (state) {
    case 0: fill(0); break;               // 空白: 黒
    case 1: fill(50, 50, 200); break;     // 受容体: 青
    case 2: fill(100, 200, 100); break;   // 拡張体: 緑
    case 3: fill(255, 0, 0); break;       // 発火体: 赤
  }
  rect(x * cellSize, y * cellSize, cellSize, cellSize);
}
