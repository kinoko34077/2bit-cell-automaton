# Project Specification

Status: active — static browser experiment with Project-owned rewind and interaction verification

## Purpose

`2bit-cell-automaton` is a static browser experiment for exploring a two-bit
cell automaton and its visualization.

## Acceptance

1. Existing automaton transition rules and static Web behavior remain Project-owned.
2. The `r` / visible rewind control restores every mutable state component required to reproduce the selected generation, including fire lifespan state.
3. A successful rewind auto-pauses before returning, keeps the restored generation visible until explicit resume, and discards abandoned future snapshots; resuming execution produces a coherent new timeline aligned with the displayed generation number.
4. Runtime speed is an integer generations-per-frame value from `1` through `10`; the default is `1` generation/frame and the displayed speed is the effective update count used by the draw loop.
5. Visible controls and keyboard shortcuts route through the same named command boundary. The visible surface exposes run/pause, speed decrease/increase, rewind availability, Alpha toggle, generation and effective speed.
6. Consumed Space/Arrow/R/A shortcuts suppress the browser/p5 default action while unhandled keys remain unconsumed.
7. The fixed logical 960×640 canvas may be responsively scaled for narrow viewports without changing the 192×128 grid, cell size, transition rules, or history representation.
8. Complete rewind snapshots use a compact representation that does not materially increase per-generation payload compared with the former encoded-grid history where avoidable.
9. Rewind history retains complete snapshots within an approximate raw payload budget of `5 * 1024 * 1024` bytes, trimming the oldest snapshots first.
10. The first retained absolute generation is tracked, rewind stops at that boundary, and abandoned future history is truncated after rewind.
11. Budget, byte accounting, generation indexing, record/lookup, and trimming policy are isolated behind named constants/functions.
12. `knt test` and `knt verify` run the Project-owned rewind, transition-buffer, and interaction-control regression checks.
13. `knt doctor` validates the local Project Overlay and Base.
14. `knt base-check` detects changes to common Base files.
15. No Domain file is moved merely to satisfy the Base structure.

## Ownership boundary

- Automaton rules, visualization, experiment media, history-retention policy, interaction controls, and release behavior remain in the existing repository root.
- Project-owned regression checks live under `project/tests/`.
- KiNoTch Base files and repository operations live under `.kinotch/`.
- The Project Manifest, contracts, and adoption state live under `project/`.
- No generated Surface or Tool helper is added without a concrete Project need.

## Commands

- `knt test` -> `node --test project/tests/rewind-state.test.cjs project/tests/transition-buffer.test.cjs project/tests/interaction-controls.test.cjs`
- `knt verify` -> the same Project-owned regression set
- no Project-owned setup, build, or deploy command is registered

The tests use Node built-ins only and evaluate the existing browser script with
minimal VM harnesses; no package manager or test framework is introduced.

## Constraints

The Base does not impose a framework, PWA structure, data model, browser storage
format, or history-retention depth on this Project. Existing implementation
boundaries remain authoritative.

Rewind depth is derived from the configurable raw snapshot budget rather than a fixed
generation count. The current default budget is 5 MiB; changing that policy must not
require rewriting the rewind event handler or snapshot representation.

The responsive presentation may scale the existing canvas visually, but must not change
the automaton's logical grid dimensions, cell addressing, generation transitions, or snapshot data.
