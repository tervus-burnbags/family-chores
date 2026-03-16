# Task State - Family Hub Redesign

**Task:** Fix Review Findings (Phase 3b-fix & Phase 6 remnants)
**Current Phase:** Review-fix
**Phase:** build-complete
**Status:** Ready for review
**Next Agent:** gemini
**Next Action:** Review review-fix implementation
**Last Updated:** 2026-03-15

## Redesign Phases

- [x] **Phase 1: Fix Tab Bar + Add Bulletin Shell**
  - [x] Fixed bottom nav
  - [x] Bulletin placeholder view
  - [x] Reordered tabs (Bulletin, Chores, Lists, Bank)
  - [x] Settings reachable from header gear
- [x] **Phase 2: Universal Input Bar**
  - [x] Move `#composer` to persistent location
  - [x] Update CSS for fixed composer above tab bar
  - [x] Implement `intentRegistry` and `routeIntent` extensible router
  - [x] Migrate core intent types to new router
  - [x] Implement toast notification system for feedback
  - [x] Remove chat messages from global flow (except in Chores history)
- [x] **Phase 3: Bulletin View + Notes**
  - [x] Implement family "Sticky Notes" module
  - [x] Support `log_note` intent
  - [x] Add "New Note" UI to Bulletin view
- [x] **Phase 3b: Kid Fun on Bulletin**
  - [x] Jokes module with reveal/cycle
  - [x] Mad Libs module with step-by-step entry
  - [x] LocalStorage persistence for kid fun state
- [x] **Phase 3b-fix: Kid Fun Updates** *(review fixes resolved)*
  - [x] Replace 100 jokes with 250 from `kid-fun-data.js`
  - [x] Jokes: random selection on initial load (not always index 0)
  - [x] Mad Libs: random selection, avoid immediate repeats
  - [x] Remove "Joke X of Y" counter
  - [x] Jokes designed for verbal delivery (parent reads aloud to young kids)
- [x] **Phase 4: Redistribute Settings - Chores Gear Icon**
  - [x] Chores toolbar with gear button
  - [x] Weekly progress dashboard moved from Bank to Chores
  - [x] Chore management (add/edit/remove) moved to Chores
- [x] **Phase 5: Redistribute Settings - Bank Gear Icon**
  - [x] Bank toolbar with gear button
  - [x] Pay tiers and bonus settings moved to Bank
  - [x] History and transactions moved to Bank
  - [x] Simplified monolithic settings tab
- [x] **Phase 6: Family Code to Header + Cleanup** *(review fixes resolved)*
  - [x] Move Family Code display to header
  - [x] Update header layout
  - [x] Remove stale `settingsContent` and `viewSettings` JS references
- [ ] **Phase 7: Google Calendar Integration**

## Notes

- Codex applied the three review fixes in `index.html`: random initial joke selection, counter removal, and stale settings reference cleanup.
- Manual browser verification is still pending in line with the task testing strategy.
- Next step is Gemini re-review of the review-fix implementation.
