# Task State - Family Hub

**Task:** Phase 10 - Chores Tab Redesign + Bonus Bug Fix
**Current Phase:** 10b
**Status:** Ready for review
**Next Agent:** gemini
**Next Action:** Review Phase 10a/10b bonus pay fix and chores redesign
**Last Updated:** 2026-03-16

## Completed

- [x] Phase 8a: Unified Header Settings
- [x] Phase 8b: Chores Tab Redesign - Daily Tracker
- [x] Phase 8c: Visual Polish & Calendar settings
- [x] Phase 9: Header/tab bar cleanup, Jameson calendar support
- [x] **Phase 10a: Fix Weekly Bonus Payment Bug** - `maybeRunWeeklyPay()` now includes bonus in payment amount
- [x] **Phase 10b: Chores Tab Redesign** - Added weekly progress card and updated checklist layout

## Pending User Action

- Redeploy calendar-proxy.gs.txt to Google Apps Script (new deployment for ?days= and Jameson)

## Notes

- `maybeRunWeeklyPay()` now uses the same bonus calculation path as the Bank card display and avoids duplicate weekly autopay by matching the week prefix in payment notes.
- Chores now shows weekly progress in-tab for Alex, Louisa, or Both, with quick-add buttons moved below the checklist.
- Static validation passed by parsing all inline scripts with Node.
- Manual browser verification is still required for bonus-credit behavior, Both-mode progress layout, and progress updates after quick-add / undo actions.
