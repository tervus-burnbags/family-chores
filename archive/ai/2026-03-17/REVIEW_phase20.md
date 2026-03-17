# Review — Phase 20: Require Kid Selection (No "Both" Default)

## Phase Scope and Commit Reference
- **Phase:** 20
- **Goal:** Remove the "Everyone/Both" mode from the Chores tab, defaulting to the first kid and requiring explicit single-kid selection.
- **Commit Reference:** [Local commit after Phase 20]

## Summary
Phase 20 simplifies the Chores tab's mental model by eliminating the ambiguous "Both" mode. By requiring the selection of a single kid, the app ensures that every logged chore is explicitly attributed to one individual, reducing errors and making the logging process more deliberate. The implementation successfully transitions the `choreSelectedKid` state to a single-kid model, with a robust first-render initialization to the first configured kid.

## Critical / Major / Minor Findings

### Critical
- **None.** The transition to single-kid selection was correctly applied to all relevant functions: `selectedChoreKids`, `renderKidCards`, and the document click handler.

### Major
- **Explicit Selection Model:** The removal of the "Both" state from the click handler (`choreSelectedKid = kidId`) correctly implements the new requirement that tapping an already-selected kid does nothing, and tapping a different kid switches the selection.
- **Default State Initialization:** `renderChoreProgress` correctly handles the first-render case by defaulting `choreSelectedKid` to the first available kid from the config, ensuring the UI is never in an unselected/broken state.
- **Selection Label Polish:** The "Logging for" label now always reflects a specific kid's name, providing clear feedback on who will receive the points.

### Minor
- **index.html:5638-5639**: The card class logic was simplified to a binary `isSelected` / `isDimmed` state, which perfectly matches the new single-selection UI requirement.

## Maintainability Findings
- **Logical Simplification:** Removing the `if (choreSelectedKid === 'both')` branches throughout the code significantly reduces the complexity of the rendering and logging paths.
- **State Consistency:** By centralizing the selection logic in `selectedChoreKids`, all downstream consumers (chore tiles, quick-add) automatically benefit from the Phase 20 changes without further modification.

## Plan Alignment and Testing Assessment
- **Plan Alignment:** The implementation is 1:1 with the Phase 20 specification in `TASK.md`.
- **Testing Assessment:** Code verification confirms `sw.js` was bumped to `hub-v23`. Inline script parsing remains stable.

## Impact on Future Phases
- The single-selection model provides a predictable baseline for any future kid-specific features on the Chores tab.
- The elimination of "Both" mode removes a significant source of edge cases in the logging and progress calculation logic.

## Consolidation Recommendation
- **None.** The codebase is cleaner following the removal of the multi-selection logic.

## Push Readiness
- **Ready for push** — Correct, maintainable, and directly addresses user feedback regarding the confusing "Everyone" option.

## Visual Review Status
- **Pending manual verification.** Code-only review confirms the updated `renderKidCards` logic and the simplified selection click handler.
