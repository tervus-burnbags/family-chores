# Task State - Family Hub Redesign

**Task:** Phase 6 Completion - Offline Persistence & Cleanup
**Current Phase:** Phase 6 (remaining scope)
**Phase:** build-complete
**Status:** Ready for review
**Next Agent:** gemini
**Next Action:** Review Phase 6 offline persistence and cleanup implementation
**Last Updated:** 2026-03-15

## Redesign Phases

- [x] **Phase 1: Fix Tab Bar + Add Bulletin Shell**
- [x] **Phase 2: Universal Input Bar**
- [x] **Phase 3: Bulletin View + Notes**
- [x] **Phase 3b: Kid Fun on Bulletin**
- [x] **Phase 3b-fix: Kid Fun Updates** *(resolved)*
- [x] **Phase 4: Redistribute Settings - Chores Gear Icon**
- [x] **Phase 5: Redistribute Settings - Bank Gear Icon**
- [x] **Phase 6: Family Code to Header + Cleanup**
  - [x] Move Family Code display to header
  - [x] Update header layout
  - [x] Remove stale `settingsContent` and `viewSettings` JS references
  - [x] Implement `keepPathsSynced()` for Firebase offline persistence
  - [x] Investigate/resolve `safeName()` helper
  - [x] Bump service worker cache version
- [ ] **Phase 7: Google Calendar Integration**

## Notes

- Added `keepPathsSynced()` in `index.html` and invoked it from `loadFamilyConfigV2()` so create, join, and reload flows all warm the same critical family paths.
- The sync helper uses `ref.keepSynced(true)` when available and falls back to attached `value` listeners for the Firebase Realtime Database web runtime.
- `safeName()` has no references in `index.html`, `TASK.md`, `PLAN.md`, `TASK_STATE.md`, or `REVIEW.md` beyond planning notes, so no helper was added.
- Service worker cache version was bumped in `sw.js` to force clients onto the updated app shell.
- Manual browser verification is still pending for offline behavior and service worker activation.
