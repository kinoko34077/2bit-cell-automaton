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
        if (typeof historyStartGeneration !== 'undefined') historyStartGeneration = 0;
      },
      setCell(x, y, state, fireTimer) {
        grid[x][y] = state;
        fireTimers[x][y] = fireTimer;
      },
      setGeneration(value) { generation = value; },
      capture() {
        const snapshot = createHistorySnapshot();
        if (typeof recordHistorySnapshot === 'function') {
          recordHistorySnapshot(generation, snapshot);
        } else {
          history[generation] = snapshot;
        }
      },
      rewind() {
        key = 'r';
        keyPressed();
      },
      stateAt(x, y) {
        return {
          grid: grid[x][y],
          fireTimer: fireTimers[x][y],
          generation,
          historyLength: history.length,
          historyStartGeneration: typeof historyStartGeneration !== 'undefined' ? historyStartGeneration : 0
        };
      },
      snapshotInfo(index) {
        const snapshot = history[index];
        return {
          type: typeof snapshot,
          gridBytes: snapshot && snapshot.grid && snapshot.grid.byteLength,
          timerBytes: snapshot && snapshot.fireTimers && snapshot.fireTimers.byteLength
        };
      },
      retentionApi() {
        return {
          budgetBytes: typeof HISTORY_MEMORY_BUDGET_BYTES === 'number' ? HISTORY_MEMORY_BUDGET_BYTES : null,
          hasSnapshotSizer: typeof getHistorySnapshotByteSize === 'function',
          hasTrimmer: typeof trimHistoryToBudget === 'function',
          hasRecorder: typeof recordHistorySnapshot === 'function',
          hasLookup: typeof getHistorySnapshot === 'function'
        };
      },
      historyMetrics() {
        const totalBytes = history.reduce((total, snapshot) => {
          if (!snapshot) return total;
          const gridBytes = snapshot.grid && snapshot.grid.byteLength || 0;
          const timerBytes = snapshot.fireTimers && snapshot.fireTimers.byteLength || 0;
          return total + gridBytes + timerBytes;
        }, 0);
        return {
          totalBytes,
          historyLength: history.length,
          historyStartGeneration: typeof historyStartGeneration !== 'undefined' ? historyStartGeneration : 0,
          generation,
          budgetBytes: typeof HISTORY_MEMORY_BUDGET_BYTES === 'number' ? HISTORY_MEMORY_BUDGET_BYTES : null
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
    { grid: 3, fireTimer: 60, generation: 0, historyLength: 1, historyStartGeneration: 0 }
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

test('rewind retention policy is factored behind configurable helpers', () => {
  const automaton = loadAutomaton();
  const api = JSON.parse(JSON.stringify(automaton.retentionApi()));

  assert.deepEqual(api, {
    budgetBytes: 5 * 1024 * 1024,
    hasSnapshotSizer: true,
    hasTrimmer: true,
    hasRecorder: true,
    hasLookup: true
  });
});

test('history stays within the 5 MiB budget and advances its absolute start generation', () => {
  const automaton = loadAutomaton();
  automaton.reset();

  for (let generation = 0; generation < 110; generation++) {
    automaton.setGeneration(generation);
    automaton.setCell(10, 10, generation % 4, generation % 76);
    automaton.capture();
  }

  const metrics = JSON.parse(JSON.stringify(automaton.historyMetrics()));
  assert.equal(metrics.budgetBytes, 5 * 1024 * 1024);
  assert.ok(metrics.totalBytes <= metrics.budgetBytes);
  assert.ok(metrics.historyStartGeneration > 0);
  assert.equal(metrics.historyLength, metrics.generation - metrics.historyStartGeneration + 1);

  for (let i = 0; i < 200; i++) automaton.rewind();
  const oldest = JSON.parse(JSON.stringify(automaton.stateAt(10, 10)));
  assert.equal(oldest.generation, metrics.historyStartGeneration);
  assert.equal(oldest.historyStartGeneration, metrics.historyStartGeneration);
});
