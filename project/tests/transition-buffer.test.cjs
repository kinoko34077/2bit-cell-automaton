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
    max: Math.max
  };
  vm.createContext(context);
  vm.runInContext(source + `
    globalThis.__transitionAudit = {
      reset() {
        grid = create2DArray(cols, rows);
        nextGrid = create2DArray(cols, rows);
        fireTimers = create2DArray(cols, rows);
      },
      setCell(x, y, state, timer = 0) {
        grid[x][y] = state;
        fireTimers[x][y] = timer;
      },
      step() { updateGrid(); },
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
