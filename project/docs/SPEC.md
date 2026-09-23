# Project Specification

Status: active — first repository-local Base adoption

## Purpose

`2bit-cell-automaton` is a static browser experiment for exploring a two-bit
cell automaton and its visualization.

## Acceptance

1. Existing static Web behavior remains unchanged.
2. `knt doctor` validates the local Project Overlay and Base.
3. `knt base-check` detects changes to common Base files.
4. No Domain file is moved merely to satisfy the Base structure.

## Ownership boundary

- Automaton rules, visualization, experiment media, and release behavior remain
  in the existing repository root.
- KiNoTch Base files and repository operations live under `.kinotch/`.
- The Project Manifest, contracts, and adoption state live under `project/`.
- No generated Surface or Tool helper is added without a concrete Project need.

## Commands

This static repository currently has no Project-owned setup, test, build, or
deploy command registered. `knt verify` therefore completes without invoking a
toolchain command.

## Constraints

The Base does not impose a framework, PWA structure, data model, or browser
storage format on this Project. Existing implementation boundaries remain
authoritative.
