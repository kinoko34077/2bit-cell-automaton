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
- Project-owned rewind regression verification is registered for `knt test` / `knt verify`
- Existing Domain files remain at their original root paths; no bulk move was performed

## Default state

- `web-app`: `OVERRIDE` — existing browser experiment is authoritative

## Known constraints

- Automaton rules, visualization, experiment data, and rewind-retention policy remain Project-owned.
- History retention is still unbounded; the repository does not yet define an allowed rewind depth or memory budget. This is tracked separately in Issue #4 rather than silently capped by maintenance.
- The Project regression check uses Node built-ins and a VM harness around the existing browser script; it verifies rewind state representation/restoration but is not a p5/browser rendering suite.
- This repository still has no Project-owned setup/build/deploy command.
- No PWA or Runtime Default is inferred from the static files alone.

## Next work

1. Preserve the existing browser implementation and automaton rules as Project overrides.
2. Decide a bounded rewind-history retention policy in Issue #4 before changing available rewind depth.
3. Extend verification only for concrete reproduced behavior defects.

## Verification

- `knt doctor`
- `knt base-check`
- `knt test`
- `knt verify`
- Project command: `node --test project/tests/rewind-state.test.cjs`
