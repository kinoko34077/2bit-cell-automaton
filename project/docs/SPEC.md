# Project Specification

Status: active — static browser experiment with Project-owned rewind verification

## Purpose

`2bit-cell-automaton` is a static browser experiment for exploring a two-bit
cell automaton and its visualization.

## Acceptance

1. Existing automaton transition rules and static Web behavior remain Project-owned.
2. The existing `r` rewind control restores every mutable state component required to reproduce the selected generation, including fire lifespan state.
3. After rewind, abandoned future snapshots are not reused; resuming execution produces a coherent new timeline aligned with the displayed generation number.
4. Complete rewind snapshots use a compact representation that does not materially increase per-generation payload compared with the former encoded-grid history where avoidable.
5. `knt test` and `knt verify` run the Project-owned rewind regression check.
6. `knt doctor` validates the local Project Overlay and Base.
7. `knt base-check` detects changes to common Base files.
8. No Domain file is moved merely to satisfy the Base structure.

## Ownership boundary

- Automaton rules, visualization, experiment media, history-retention policy, and release behavior remain in the existing repository root.
- Project-owned regression checks live under `project/tests/`.
- KiNoTch Base files and repository operations live under `.kinotch/`.
- The Project Manifest, contracts, and adoption state live under `project/`.
- No generated Surface or Tool helper is added without a concrete Project need.

## Commands

- `knt test` -> `node --test project/tests/rewind-state.test.cjs`
- `knt verify` -> the same Project-owned rewind regression check
- no Project-owned setup, build, or deploy command is registered

The test uses Node built-ins only and evaluates the existing browser script with
a minimal VM harness; no package manager or test framework is introduced.

## Constraints

The Base does not impose a framework, PWA structure, data model, browser storage
format, or history-retention depth on this Project. Existing implementation
boundaries remain authoritative.

The maximum retained rewind depth / memory budget is currently unspecified and
must be decided separately before history is capped. Issue #4 tracks that policy
decision; maintenance of rewind correctness must not silently reduce available
history.
