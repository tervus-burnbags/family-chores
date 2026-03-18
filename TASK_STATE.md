# Task State - Family Hub

**Task:** Phase 38 — UI Refresh, Trivia Calibration, Battleship Grid, Template Save, Pin Routing
**Current Phase:** ready
**Status:** Approved
**Next Role:** Builder
**Next Action:** Implement Phase 38 (6 parts, A-F)
**Last Updated:** 2026-03-17

## Completed

- [x] Phases 8-37

## Current

- [ ] **Phase 38** — 6 parts:
  - A: Bank view auto-refresh after all transaction types
  - B: Trivia questions recalibrated for 2nd-grade difficulty
  - C: Battleship grid fix (flatten layout, expand to 10x10, 5 ships)
  - D: Save template button fix (silent failure on lakehouse)
  - E: Pin command routes from any tab to bulletin
  - F: Chore logging error handling and refresh verification

## Notes

- Phase 37 reviewed and push-ready (human push pending).
- Part A affects all bank intent handlers — systematic fix needed.
- Part C is a structural rewrite of Battleship grid rendering and CSS.
- Part D requires debugging why `saveTemplateForList` returns early.
