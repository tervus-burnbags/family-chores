# Claude Handoff Notes

Date: 2026-03-13
Commit: d125530 (`fix app startup and interaction bugs`)

## What Changed
- Implemented Phases 1 through 5 in `index.html`.
- Restored `firebase-config.js` as the active Firebase config source.
- Fixed visible `??` label corruption by replacing header/mic button labels with plain text.
- Restored a visible mobile text submit path by no longer hiding the `Send` button.
- Fixed parser ordering so free-point commands like `add 3 points for alex` are evaluated before generic status checks.
- Fixed startup race by loading family config on demand in `handleUserInput()`.
- Restored message action rendering in `addMessage()` and re-added delegated click handling for message buttons.
- Added support for `?family=` URL startup parsing.
- Corrected debt semantics for `lent` phrasing.
- Guarded `keepSynced()` calls so unsupported environments do not blow up immediately.

## Current State
- Repo branch: `master`
- Remote push completed to `origin/master`
- `.claude/` intentionally left untracked

## Likely Remaining Risks
- This is still a large single-file app with multiple additive script layers; browser-level testing is still required.
- `keepSynced()` is only guarded, not validated as the right long-term offline strategy for web.
- Scoreboard/settings behavior needs real interaction testing, especially around startup timing and repeated drawer toggles.
- Message-action UX is functional again in code, but the interaction model still needs cleanup/polish.
- The copied family link now parses on startup, but should be verified end to end on a fresh device/browser.

## Suggested Next Checks
1. Fresh load with no localStorage: create family, reload, confirm startup state is clean.
2. Join via copied `?family=` link in a second browser/device.
3. Type `add 3 points for alex` and verify Firebase log write plus scoreboard update.
4. Test `Alex fed the dog`, `both kids made beds`, `undo`, and a duplicate chore prompt.
5. Test settings edits: change chore points, add/remove chore, change pay tier, change bonus.
6. Test scoreboard actions: Pay and Settle.
7. Test speech input on actual target browsers/devices.

## Known Design Debt
- `index.html` should eventually be split up or at least refactored into smaller modules/functions.
- There are old placeholder/handoff messages in parts of the UI that no longer reflect the current implemented state.
- The app mixes optimistic layering with wrapper scripts; cleanup should consolidate phase-added behavior into a single coherent runtime.
