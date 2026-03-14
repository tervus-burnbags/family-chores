# Claude Handoff Notes

Date: 2026-03-14
Commit: e74bc26 (`highlight bonus progress on kid cards`)

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
- Removed the old `Score` view and made kid cards the primary dashboard.
- Moved balance, debts, and recent activity into each kid card.
- Removed redundant startup chat noise and kept a single ready message.
- Improved speech input to listen longer, accumulate transcript, and submit on pause.
- Added parent-owes-kid parsing for phrases like `I owe Louisa 10`.
- Expanded historical activity visibility and added carried-forward opening balance rows when old balances predate transaction tracking.
- Fixed multiple runtime helper-scope regressions in card and settings rendering.
- Updated weekly progress so bonus-mode progress switches to green and tracks toward the next bonus chunk.

## Current State
- Repo branch: `master`
- Remote push completed to `origin/master`
- `.claude/` intentionally left untracked
- GitHub Pages reflects the card-based dashboard UI, with `A` and `L` opening kid cards and Settings behind the gear.

## Likely Remaining Risks
- This is still a large single-file app with multiple additive script layers; browser-level testing is still required.
- `keepSynced()` is only guarded, not validated as the right long-term offline strategy for web.
- Some old balances may still exist only as carried-forward totals rather than full historical rows, depending on what was stored before transaction tracking was added.
- Speech recognition quality is still limited by the browser Web Speech API.

## Suggested Next Checks
1. Fresh load with no localStorage: create family, reload, confirm startup state is clean.
2. Join via copied `?family=` link in a second browser/device.
3. Type `add 3 points for alex` and verify Firebase log write plus card update.
4. Test `Alex fed the dog`, `both kids made beds`, `undo`, and a duplicate chore prompt.
5. Test settings edits: change chore points, add/remove chore, change pay tier, change bonus.
6. Test balance/debt actions from kid cards: Pay, Spent, and Settle.
7. Test speech input on actual target browsers/devices.
8. Verify a kid over the top tier shows green bonus progress and advances toward the next bonus chunk.

## Known Design Debt
- `index.html` should eventually be split up or at least refactored into smaller modules/functions.
- The app mixes optimistic layering with wrapper scripts; cleanup should consolidate phase-added behavior into a single coherent runtime.
- There is still significant coupling between parser, Firebase write paths, and UI rendering in one file.
