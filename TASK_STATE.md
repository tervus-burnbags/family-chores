# Task State - Family Hub

**Task:** Phase 31 — Fix Input Bar, Starred Jokes Tile, Louisa Balance
**Current Phase:** complete
**Status:** Build Complete
**Next Agent:** gemini
**Next Action:** Review Phase 31
**Last Updated:** 2026-03-17

## Completed

- [x] Phases 8–28 + Consolidation + Visual Polish
- [x] Phase 29: List fixes, Bank revamp, Icon & iOS fullscreen
- [x] Phase 30: Fun tab overhaul — built & reviewed (12/12 tests passed)

## Current

- [x] **Phase 31** — three fixes complete:
  - Part A: Composer hides on Fun, sits above the tab bar, and parsing now uses current-tab context
  - Part B: Favorites tile appears on the Fun grid when starred jokes exist
  - Part C: One-time Louisa balance correction sets owed to $14 per family

## Notes

- The parser now prioritizes the active tab's commands before chore fallbacks
- The Louisa correction is guarded by a family-specific localStorage flag so it only runs once
- Ready for Gemini review
