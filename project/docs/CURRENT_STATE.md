# Current State

Base version: `0.3.8`

Last verified: 2026-09-26 — rewind-state maintenance audit

## Implemented

- Repository-local KiNoTch Base v0.3.8 and Project Overlay
- `web-app` Surface declaration
- Existing static HTML, JavaScript, and experiment media retained
- Rewind history snapshots preserve both grid state and fire-lifespan state
- Rewinding discards the abandoned future timeline so generation and history position remain aligned when execution resumes
- Complete snapshots use compact byte arrays for grid and fire timers
- Rewind history is bounded by a configurable 5 MiB raw snapshot payload budget
- History tracks the absolute first retained generation after oldest snapshots are trimmed
- Project-owned rewind regression verification is registered for `knt test` / `knt verify`
- Existing Domain files remain at their original root paths; no bulk move was performed

## Default state

- `web-app`: `OVERRIDE` — existing browser experiment is authoritative

## Known constraints

- Automaton rules, visualization, experiment data, and rewind-retention policy remain Project-owned.
- The default rewind-history raw snapshot budget is `5 * 1024 * 1024` bytes; JS object/array overhead is outside this approximate budget.
- The Project regression check uses Node built-ins and a VM harness around the existing browser script; it verifies rewind state representation/restoration but is not a p5/browser rendering suite.
- This repository still has no Project-owned setup/build/deploy command.
- No PWA or Runtime Default is inferred from the static files alone.

## Next work

1. Preserve the existing browser implementation and automaton rules as Project overrides.
2. Keep future rewind-retention policy changes behind the named budget/accounting helper boundary.
3. Extend verification only for concrete reproduced behavior defects.

## Verification

- `knt doctor`
- `knt base-check`
- `knt test`
- `knt verify`
- Project command: `node --test project/tests/rewind-state.test.cjs`
