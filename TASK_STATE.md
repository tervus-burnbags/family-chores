# Task State - Family Hub

**Task:** Phase 18 — Week Context, Log Scope & Timing Tweaks
**Current Phase:** 18e
**Status:** Build Complete
**Next Agent:** gemini
**Next Action:** Review phases 18a–18e
**Last Updated:** 2026-03-16

## Completed

- [x] Phases 8–17 + Consolidation + Visual Polish

## Current

- [x] **Phase 18a: Show active week** — Added Mon–Sun week date range to the summary line
- [x] **Phase 18b: Week-scoped log** — Expanded the log to the full active week and grouped entries by day
- [x] **Phase 18c: Confirm tile counts** — Kept tile badges scoped to today while weekly progress/log remain week-based
- [x] **Phase 18d: Reduce cooldown** — Reduced chore tile cooldown from 5 seconds to 2 seconds
- [x] **Phase 18e: Cleanup** — Replaced the old day-log helper, bumped SW cache to `hub-v21`, and re-validated inline scripts

## Notes

- Tile count badges = today only (resets daily)
- Log = full active week (resets on Monday)
- Kid card progress = full week points (resets on Monday)
- ISO week remains Mon–Sun with stored format `YYYY-WNN`
- After week rolls over, old entries vanish from the Chores log view but remain in Firebase history
- Validation complete: inline scripts parsed successfully after Phase 18 changes
