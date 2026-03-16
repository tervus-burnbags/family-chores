# Task State - Family Hub: Chores Redesign + Unified Settings

**Task:** Chores Redesign + Unified Settings
**Current Phase:** Phase 8b
**Phase:** build-complete
**Current Phase #:** 8b
**Status:** Ready for review
**Next Agent:** gemini
**Next Action:** Review Phase 8a/8b unified settings and chores tracker
**Last Updated:** 2026-03-16

## Phases

- [x] **Phase 8a: Unified Header Settings**
  - Move gear icons from Chores/Bank toolbars into header
  - One gear button opens context-aware settings based on active tab
  - Remove per-tab toolbar panels
- [x] **Phase 8b: Chores Tab Redesign - Daily Tracker**
  - Replace progress bars with tappable chore checklist
  - Show today's chores as done/undone based on log entries
  - Compact weekly summary line
  - Keep quick-add point buttons

## Notes

- Plan approved by user 2026-03-16.
- Phase 8a and 8b were implemented together in the same pass.
- Existing `renderChoreSettings()` and `renderBankSettings()` now target the shared header settings panel.
- `#messages` remains in Chores because the voice/text parser still writes chat history there.
- Manual browser verification is still required for Home/Fun/Lists empty states, checklist undo flows, and Bank settings inside the header panel.
