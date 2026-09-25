const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../..', 'automaton_dynamic_grid.js'), 'utf8');

function loadAutomaton() {
  const context = { console };
  vm.createContext(context);
  vm.runInContext(source + `
    globalThis.__audit = {
      reset() {
        grid = create2DArray(cols, rows);
        nextGrid = create2DArray(cols, rows);
        fireTimers = create2DArray(cols, rows);
        history = [];
        generation = 0;
      },
      setCell(x, y, state, fireTimer) {
        grid[x][y] = state;
        fireTimers[x][y] = fireTimer;
      },
      setGeneration(value) { generation = value; },
      capture() {
        if (typeof createHistorySnapshot === 'function') {
          history[generation] = createHistorySnapshot();
        } else {
          history[generation] = encodeGrid(grid);
        }
      },
      rewind() {
        key = 'r';
        keyPressed();
      },
      stateAt(x, y) {
        return { grid: grid[x][y], fireTimer: fireTimers[x][y], generation, historyLength: history.length };
      },
      snapshotInfo(index) {
        const snapshot = history[index];
        return {
          type: typeof snapshot,
          gridBytes: snapshot && snapshot.grid && snapshot.grid.byteLength,
          timerBytes: snapshot && snapshot.fireTimers && snapshot.fireTimers.byteLength
        };
      }
    };
  `, context, { filename: 'automaton_dynamic_grid.js' });
  return context.__audit;
}

test('rewind restores grid and fire lifespan, then discards abandoned future', () => {
  const automaton = loadAutomaton();
  automaton.reset();

  automaton.setCell(10, 10, 3, 60);
  automaton.capture();

  automaton.setGeneration(1);
  automaton.setCell(10, 10, 2, 20);
  automaton.capture();

  automaton.rewind();
  assert.deepEqual(
    JSON.parse(JSON.stringify(automaton.stateAt(10, 10))),
    { grid: 3, fireTimer: 60, generation: 0, historyLength: 1 }
  );
});

test('complete snapshots use byte arrays for grid and fire timers', () => {
  const automaton = loadAutomaton();
  automaton.reset();
  automaton.setCell(10, 10, 3, 60);
  automaton.capture();

  assert.deepEqual(
    JSON.parse(JSON.stringify(automaton.snapshotInfo(0))),
    { type: 'object', gridBytes: 192 * 128, timerBytes: 192 * 128 }
  );
});
