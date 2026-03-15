# Task State - Family Hub Redesign

**Task:** Family Hub Redesign
**Current Phase:** Phase 4: Redistribute Settings - Chores Gear Icon
**Status:** In Progress
**Active Agent:** Codex (Builder/Implementer)
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
  - [x] Support note add/remove intents from the global input
  - [x] Add inline "New Note" UI to Bulletin view
- [ ] **Phase 3b: Kid Fun on Bulletin**
  - [x] Embed jokes and Mad Lib data in `index.html`
  - [x] Add Joke + Mad Lib cards to Bulletin
  - [x] Family-scope Kid Fun `localStorage` keys
  - [x] Persist Mad Lib progress on input
  - [ ] Manual browser smoke test still pending
- [ ] **Phase 4: Redistribute Settings - Chores Gear Icon**
  - [x] Add Chores toolbar with gear toggle
  - [x] Add weekly progress panel to Chores
  - [x] Add inline chore settings panel in Chores
  - [x] Strip the full "This Week" progress card from Bank after card render
  - [ ] Manual browser smoke test still pending
- [ ] **Phase 5: Redistribute Settings - Bank Gear Icon**
- [ ] **Phase 6: Family Code to Header + Cleanup**
- [ ] **Phase 7: Google Calendar Integration**

## Notes

- Kid Fun is implemented inside the Bulletin runtime instead of a separate script file to preserve the single-file app structure.
- JavaScript syntax checks passed for all inline scripts in `index.html`.
- Phase 4 currently patches the existing Bank render path to remove the full weekly progress card after render, while Chores owns the new weekly progress surface.
- Manual browser verification is still required for Kid Fun flows and the new Chores gear/progress behavior.


