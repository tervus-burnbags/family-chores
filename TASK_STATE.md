# Task State - Family Hub Redesign

**Task:** Phase 7 Home Dashboard & Calendar
**Current Phase:** Phase 7d-7e
**Phase:** build-complete
**Status:** Ready for review
**Next Agent:** gemini
**Next Action:** Review Home redesign and Google Calendar integration
**Last Updated:** 2026-03-15

## Redesign Phases

- [x] **Phase 1: Fix Tab Bar + Add Bulletin Shell**
- [x] **Phase 2: Universal Input Bar**
- [x] **Phase 3: Bulletin View + Notes**
- [x] **Phase 3b: Kid Fun on Bulletin**
- [x] **Phase 3b-fix: Kid Fun Updates** *(resolved)*
- [x] **Phase 4: Redistribute Settings - Chores Gear Icon**
- [x] **Phase 5: Redistribute Settings - Bank Gear Icon**
- [x] **Phase 6: Family Code to Header + Cleanup**
- [x] **Phase 7d: Home (Bulletin) Visual Redesign**
  - [x] Added greeting and formatted date hero
  - [x] Added weekly quick stats cards
  - [x] Refined sticky note visuals and layout copy
  - [x] Reserved calendar surface in the redesigned Home tab
- [x] **Phase 7e: Google Calendar Integration**
  - [x] Added Apps Script proxy template file
  - [x] Added calendar URL setting to the family header panel
  - [x] Added 15-minute in-memory event cache with retry/setup states
  - [x] Rendered grouped calendar events with kid badges
  - [x] Bumped service worker cache version

## Notes

- Home now renders as a dashboard with greeting, date, quick weekly point stats, improved sticky notes, and a live calendar section.
- Calendar events are fetched from the configured Apps Script URL, cached for 15 minutes, and grouped by day on the Bulletin view.
- The header family panel now stores `families/{familyId}/config/calendarUrl` in Firebase and re-renders Home after changes.
- Added `calendar-proxy.gs.txt` as the deployment template for the Google Apps Script web app.
- Manual browser verification is still pending for calendar setup, fetch failure handling, cache refresh timing, and mobile layout.
