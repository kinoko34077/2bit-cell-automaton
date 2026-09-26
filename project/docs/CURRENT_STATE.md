# Current State

Base version: `0.3.8`

Last verified: 2026-09-27 — interaction-control maintenance

## Implemented

- Repository-local KiNoTch Base v0.3.8 and Project Overlay
- `web-app` Surface declaration
- Existing static HTML, JavaScript, and experiment media retained
- Rewind history snapshots preserve both grid state and fire-lifespan state
- Rewinding discards the abandoned future timeline so generation and history position remain aligned when execution resumes
- Successful rewind auto-pauses so the restored generation remains visible until explicit resume
- Complete snapshots use compact byte arrays for grid and fire timers
- Rewind history is bounded by a configurable 5 MiB raw snapshot payload budget
- History tracks the absolute first retained generation after oldest snapshots are trimmed
- Runtime speed is an explicit integer `1..10` generations/frame model; default `1` preserves the former effective one-update-per-frame behavior
- Keyboard and visible pointer/touch controls share one named command boundary for run/pause, speed, rewind and Alpha display
- Consumed keyboard shortcuts suppress browser default scrolling
- The control surface exposes generation, run/pause, effective speed, rewind availability and Alpha state
- The existing logical 960×640 canvas is responsively scaled for narrow viewports without changing the 192×128 automaton grid
- Project-owned rewind, transition-buffer and interaction-control regressions are registered for `knt test` / `knt verify`
- Existing Domain files remain at their original root paths; no bulk move was performed

## Default state

- `web-app`: `OVERRIDE` — existing browser experiment is authoritative

## Known constraints

- Automaton rules, visualization, experiment data, and rewind-retention policy remain Project-owned.
- The default rewind-history raw snapshot budget is `5 * 1024 * 1024` bytes; JS object/array overhead is outside this approximate budget.
- The Project regression checks use Node built-ins and VM/source-contract harnesses around the existing browser script; they are not a p5/browser rendering suite.
- Responsive canvas behavior is deterministic at the CSS/DOM contract level; physical touch target feel and browser rendering remain real-device smoke boundaries.
- This repository still has no Project-owned setup/build/deploy command.
- No PWA or Runtime Default is inferred from the static files alone.

## Next work

1. Preserve the existing browser implementation and automaton rules as Project overrides.
2. Keep future rewind-retention policy changes behind the named budget/accounting helper boundary.
3. Keep interaction commands behind `executeControlCommand()` so keyboard and visible controls cannot drift independently.
4. Extend verification only for concrete reproduced behavior defects.

## Verification

- `knt doctor`
- `knt base-check`
- `knt test`
- `knt verify`
- Project command: `node --test project/tests/rewind-state.test.cjs project/tests/transition-buffer.test.cjs project/tests/interaction-controls.test.cjs`
