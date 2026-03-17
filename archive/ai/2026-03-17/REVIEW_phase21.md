# Review — Phase 21: Context-Aware Voice/Chat Input

## Phase Scope and Commit Reference
- **Phase:** 21
- **Goal:** Scope voice/text input intents to the current active tab to avoid cross-tab accidents and improve UX.
- **Commit Reference:** [Local commit after Phase 21]

## Summary
Phase 21 successfully implements a context-aware input model. By gating non-global intents to their respective domains (Chores, Bank, Lists, Home), the app becomes more predictable and less prone to accidental side effects. The addition of dynamic placeholders in the input field provides a subtle but effective onboarding hint for each tab's specialized commands.

## Critical / Major / Minor Findings

### Critical
- **None.** The intent gating in `executeIntent()` correctly identifies the current view and restricts non-global intents as specified.

### Major
- **Intent Domain Separation:** The `VIEW_INTENTS` mapping clearly defines the boundaries for each tool. Intentions like `record_payment` are correctly blocked when initiated from the `chores` or `lists` views.
- **Global Intent Preservation:** Critical system intents like `undo`, `confirm_yes/no`, and `check_status` remain globally accessible, ensuring core navigation and error correction aren't hindered.
- **UX Redirection:** Instead of simply failing, the gated intents show a helpful toast ("Switch to [Tab] for that"), which guides the user toward the correct interaction model.

### Minor
- **Dynamic Placeholders:** The update to `elements.messageInput.placeholder` in `switchView` provides immediate visual feedback and guidance on the current tab's domain.

## Maintainability Findings
- **Clean Filter Logic:** Implementing the check at the top of `executeIntent()` is the most maintainable approach, as it leverages the existing parsing pipeline without requiring modifications to the complex `routeIntent` or regex-based `parseIntent` functions.
- **Standardized Labels:** The use of `VIEW_LABELS` ensures that redirection messages use consistent terminology matching the UI.

## Plan Alignment and Testing Assessment
- **Plan Alignment:** The implementation is 1:1 with the Phase 21 specification in `TASK.md`.
- **Testing Assessment:** Code verification confirms `sw.js` was bumped to `hub-v24`. Inline script parsing remains stable.

## Impact on Future Phases
- Future intents can easily be added to the appropriate category in `VIEW_INTENTS` without changing the core execution flow.
- The context-aware model paves the way for deeper tab-specific voice features (e.g., "add item to *this* list").

## Consolidation Recommendation
- **None.** The implementation is concise and follows the established project patterns.

## Push Readiness
- **Ready for push** — Correct, maintainable, and significantly improves the domain-specific experience for each tab.

## Visual Review Status
- **Pending manual verification.** Code-only review confirms the new `VIEW_INTENTS` mapping and the conditional logic in `executeIntent()`.
