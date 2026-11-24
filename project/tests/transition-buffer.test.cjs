const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../..', 'automaton_dynamic_grid.js'), 'utf8');

function loadAutomaton() {
  const context = {
    console,
    random: () => 1,
    shuffle: values => values,
    min: Math.min,
    max: Math.max,
    background() {},
    fill() {},
    rect() {},
    textSize() {},
    textAlign() {},
    text(value) { this.lastHud = value; },
    LEFT: 'left',
    height: 640,
  };
  vm.createContext(context);
  vm.runInContext(source + `
    globalThis.__transitionAudit = {
      reset() {
        grid = create2DArray(cols, rows);
        nextGrid = create2DArray(cols, rows);
        fireTimers = create2DArray(cols, rows);
        generation = 0;
        history = [];
        historyStartGeneration = 0;
      },
      setCell(x, y, state, timer = 0) {
        grid[x][y] = state;
        fireTimers[x][y] = timer;
      },
      step() { updateGrid(); },
      frame(speed, running) {
        generationsPerFrame = speed;
        isRunning = running;
        recordHistorySnapshot(generation, createHistorySnapshot());
        let drawn;
        const originalDrawCell = drawCell;
        const originalText = text;
        let hud;
        drawCell = function (x, y, state) {
          if (x === 10 && y === 10) drawn = { generation, state, timer: fireTimers[x][y] };
          originalDrawCell(x, y, state);
        };
        text = value => { hud = value; };
        try {
          draw();
        } finally {
          drawCell = originalDrawCell;
          text = originalText;
        }
        const snapshot = getHistorySnapshot(generation);
        return {
          drawn,
          generation,
          hud,
          state: grid[10][10],
          timer: fireTimers[10][10],
          historyState: snapshot.grid[10 * rows + 10],
          historyTimer: snapshot.fireTimers[10 * rows + 10],
        };
      },
      stateAt(x, y) { return grid[x][y]; }
    };
  `, context, { filename: 'automaton_dynamic_grid.js' });
  return context.__transitionAudit;
}

test('an expired fire cell stays empty on the next generation', () => {
  const automaton = loadAutomaton();
  automaton.reset();
  automaton.setCell(10, 10, 3, 1);

  automaton.step();
  assert.equal(automaton.stateAt(10, 10), 0, 'fire should expire to empty');

  automaton.step();
  assert.equal(
    automaton.stateAt(10, 10),
    0,
    'empty cell must not resurrect from stale next-generation buffer contents'
  );
});

test('the rendered board, HUD and history describe the same generation at both speed limits and while paused', () => {
  for (const [speed, running, expectedGeneration, expectedState, expectedTimer] of [
    [1, true, 1, 0, 0],
    [10, true, 10, 0, 0],
    [10, false, 0, 3, 1],
  ]) {
    const automaton = loadAutomaton();
    automaton.reset();
    automaton.setCell(10, 10, 3, 1);
    const frame = JSON.parse(JSON.stringify(automaton.frame(speed, running)));
    assert.equal(frame.generation, expectedGeneration);
    assert.deepEqual(frame.drawn, {
      generation: expectedGeneration, state: expectedState, timer: expectedTimer,
    });
    assert.equal(frame.state, expectedState);
    assert.equal(frame.timer, expectedTimer);
    assert.equal(frame.historyState, expectedState);
    assert.equal(frame.historyTimer, expectedTimer);
    assert.match(frame.hud, new RegExp('^t = ' + expectedGeneration + ' \\| '));
  }
});
