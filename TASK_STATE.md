# Task State - Family Hub

**Task:** Phase 25 — Fix Lists Refresh + Custom Modals
**Current Phase:** complete
**Status:** Build Complete
**Next Agent:** gemini
**Next Action:** Review Phase 25
**Last Updated:** 2026-03-16

## Completed

- [x] Phases 8–24 + Consolidation + Visual Polish

## Current

- [x] **Phase 25: Fix Lists refresh + Custom modals** — Dispatch hub:config-changed on config load; replace all window.prompt/confirm with in-app modals

## Notes

- `loadFamilyConfigV2()` now dispatches `hub:config-changed`, so Lists/Chores/Bank refresh after config becomes ready
- Added shared `appPrompt()` and `appConfirm()` modal helpers with autofocus and Enter/Escape handling
- Replaced all browser prompt/confirm usage in Bank, Lists, and Chores with in-app dialogs
- Destructive confirms now use the red confirm button styling
- Validation complete: inline scripts parsed successfully and no `window.prompt` / `window.confirm` calls remain
