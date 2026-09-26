const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'automaton_dynamic_grid.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function loadAutomaton() {
  const context = {
    console,
    min: Math.min,
    max: Math.max,
    key: '',
  };
  vm.createContext(context);
  vm.runInContext(source + `
    globalThis.__controlsAudit = {
      reset() {
        grid = create2DArray(cols, rows);
        nextGrid = create2DArray(cols, rows);
        fireTimers = create2DArray(cols, rows);
        history = [];
        generation = 0;
        historyStartGeneration = 0;
        isRunning = true;
        if (typeof generationsPerFrame !== 'undefined') generationsPerFrame = 1;
      },
      contract() {
        return {
          hasCommandBoundary: typeof executeControlCommand === 'function',
          generationsPerFrame: typeof generationsPerFrame !== 'undefined' ? generationsPerFrame : null,
          min: typeof MIN_GENERATIONS_PER_FRAME !== 'undefined' ? MIN_GENERATIONS_PER_FRAME : null,
          max: typeof MAX_GENERATIONS_PER_FRAME !== 'undefined' ? MAX_GENERATIONS_PER_FRAME : null,
        };
      },
      command(name) {
        if (typeof executeControlCommand !== 'function') return null;
        return executeControlCommand(name);
      },
      running() { return isRunning; },
      speed() { return typeof generationsPerFrame !== 'undefined' ? generationsPerFrame : null; },
      prepareRewind() {
        grid = create2DArray(cols, rows);
        nextGrid = create2DArray(cols, rows);
        fireTimers = create2DArray(cols, rows);
        history = [];
        generation = 0;
        historyStartGeneration = 0;
        recordHistorySnapshot(0, createHistorySnapshot());
        generation = 1;
        grid[10][10] = 2;
        recordHistorySnapshot(1, createHistorySnapshot());
        isRunning = true;
      },
      generation() { return generation; },
      press(value) {
        key = value;
        return keyPressed();
      },
    };
  `, context, {filename: 'automaton_dynamic_grid.js'});
  return context.__controlsAudit;
}

test('speed is an explicit integer generations-per-frame model bounded to 1..10', () => {
  const automaton = loadAutomaton();
  automaton.reset();
  assert.deepEqual(JSON.parse(JSON.stringify(automaton.contract())), {
    hasCommandBoundary: true,
    generationsPerFrame: 1,
    min: 1,
    max: 10,
  });

  automaton.command('faster');
  assert.equal(automaton.speed(), 2);
  for (let i = 0; i < 20; i++) automaton.command('faster');
  assert.equal(automaton.speed(), 10);
  for (let i = 0; i < 20; i++) automaton.command('slower');
  assert.equal(automaton.speed(), 1);
});

test('successful rewind auto-pauses and leaves the restored generation visible', () => {
  const automaton = loadAutomaton();
  automaton.reset();
  automaton.prepareRewind();
  const changed = automaton.command('rewind');
  assert.equal(changed, true);
  assert.equal(automaton.generation(), 0);
  assert.equal(automaton.running(), false);
});

test('keyboard shortcuts use the same command boundary and suppress browser defaults', () => {
  const automaton = loadAutomaton();
  automaton.reset();

  assert.equal(automaton.press(' '), false);
  assert.equal(automaton.running(), false);
  assert.equal(automaton.press('ArrowRight'), false);
  assert.equal(automaton.speed(), 2);
  assert.equal(automaton.press('ArrowLeft'), false);
  assert.equal(automaton.speed(), 1);
  assert.equal(automaton.press('a'), false);
  assert.notEqual(automaton.press('x'), false);
});

test('visible controls and responsive canvas presentation are available without keyboard discovery', () => {
  assert.match(html, /<meta\s+name="viewport"/i);
  assert.match(html, /id="automaton-controls"/);
  assert.match(html, /data-command="toggle-run"/);
  assert.match(html, /data-command="slower"/);
  assert.match(html, /data-command="faster"/);
  assert.match(html, /data-command="rewind"/);
  assert.match(html, /data-command="toggle-alpha"/);
  assert.match(html, /id="automaton-status"/);
  assert.match(html, /canvas[^}]*max-width:\s*100%/s);
  assert.match(html, /canvas[^}]*height:\s*auto/s);
});
