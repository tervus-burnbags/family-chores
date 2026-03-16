# Task State - Family Hub

**Task:** Phase 13 — Chores Tab Overhaul
**Current Phase:** 13a
**Status:** Ready for Codex
**Next Agent:** codex
**Next Action:** Fix critical toDateString bug (13a), then quick tasks (13b), then visual polish (13c)
**Last Updated:** 2026-03-16

## Completed

- [x] Phases 8–12 + Consolidation

## Current

- [ ] **Phase 13a: Critical bug fix** — `toDateString` ReferenceError kills Block 6 IIFE, breaks all chores + bank
- [ ] **Phase 13b: Quick tasks** — Configurable pinned chore buttons with one-tap logging
- [ ] **Phase 13c: Visual polish** — SVG icons, animations, design consistency

## Notes

- ROOT CAUSE FOUND: Line ~5324 calls `toDateString()` which is scoped to Block 3's IIFE (line ~2748). Block 6's IIFE crashes on load with ReferenceError, so `window.renderChoreProgress`, `window.renderChoreSettings`, `window.renderBankSettings`, and `window.refreshPhase4` are never assigned. This explains blank chores, "Lists" in settings, and missing quick-add.
- 13a is the critical fix — if chores tab still broken after 13a, Codex should halt and report
