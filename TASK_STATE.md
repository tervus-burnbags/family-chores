# Task State - Family Hub: Fix Remaining Tabs

**Task:** Fix Remaining Broken Tabs (Bank, Fun Trackers, Lists)
**Current Phase:** Phase 7a-7c
**Phase:** complete
**Status:** Review complete
**Next Agent:** gemini
**Next Action:** Review Bank cards, Fun trackers, and Lists restoration
**Last Updated:** 2026-03-15

## Phases

- [x] **Phase 7a: Restore Bank Kid Cards**
- [x] **Phase 7b: Fun Tab Trackers**
- [x] **Phase 7c: Fix Lists Tab**

## Notes

- Restored `window.renderCardView` and card actions before the Phase 4 bank patch runs, so Bank renders again and the weekly card can still be stripped.
- Added Kid Fun progress tracking in localStorage: unique jokes discovered and completed Mad Lib stories.
- Rebuilt `window.renderListsHome` and `window.familyLists` with Firebase-backed shared checklists, default lists, templates, and real-time updates.
- Bumped `sw.js` cache version to `hub-v9`.
- Manual browser verification is still pending for Bank actions, Fun counter persistence, Lists real-time sync, and parser-driven list actions.
