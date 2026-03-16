# Task State - Family Hub: Chores Redesign + Unified Settings

**Task:** Chores Redesign + Unified Settings
**Current Phase:** Phase 8a
**Phase:** plan-review
**Current Phase #:** 8a
**Status:** Awaiting user approval
**Next Agent:** user
**Next Action:** Approve plan in TASK.md, then hand to Codex
**Last Updated:** 2026-03-16

## Phases

- [ ] **Phase 8a: Unified Header Settings** ← START HERE
  - Move gear icons from Chores/Bank toolbars into header
  - One gear button opens context-aware settings based on active tab
  - Remove per-tab toolbar panels
- [ ] **Phase 8b: Chores Tab Redesign — Daily Tracker**
  - Replace progress bars with tappable chore checklist
  - Show today's chores as done/undone based on log entries
  - Compact weekly summary line
  - Keep quick-add point buttons

## Notes

- Phase 8a must come first (removes per-tab toolbars that 8b eliminates).
- Chore checklist matches config chores against today's log entries by choreId.
- Existing renderChoreSettings() and renderBankSettings() are reused, just re-targeted to header panel.
- sw.js cache bump + Lists placeholder text fix already staged (hub-v10).
