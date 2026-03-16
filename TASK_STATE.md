# Task State - Family Hub Redesign

**Task:** Family Hub Redesign
**Current Phase:** Phase 6: Family Code to Header + Cleanup
**Status:** In Progress
**Active Agent:** Codex (Builder) - Verification pending for Phase 3b-fix + Phase 6
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
- [x] **Phase 3b-fix: Kid Fun Updates** *(prerequisite for Phase 6)*
  - [x] Replace 100 jokes with 250 from `kid-fun-data.js`
  - [x] Jokes: random selection (not sequential) - Math.floor(Math.random() * KID_JOKES.length)
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
- [x] **Phase 6: Family Code to Header + Cleanup**
  - [x] Move Family Code display to header
  - [x] Update header layout
  - [x] Final CSS cleanup and "monolith" removal
- [ ] **Phase 7: Google Calendar Integration**

## Notes

- Phase 5 completed (by Gemini). Verified correct â€” bank toolbar, inline settings for pay tiers/bonus/history/transactions all working.
- Bank now owns its financial history and configuration.
- Old settings tab has been removed; family code/share now lives in the header panel.
- Phase 3b-fix and Phase 6 are implemented in the workspace. The local `kid-fun-data.js` source currently contains 235 jokes, so the embedded set now matches that file rather than the planned 250-item target.
- Kid Fun is already in its own tab (viewFun) â€” that's correct, keep it.

