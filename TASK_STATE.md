# Task State - Family Hub

**Task:** Phase 12 — Header Polish, Fullscreen PWA, Data Extraction
**Current Phase:** Queued (waiting for Phase 11 review to complete)
**Status:** Plan ready, waiting for Gemini to finish Phase 11 review
**Next Agent:** gemini (finishing Phase 11 review) → codex (Phase 12)
**Next Action:** After Gemini's Phase 11 review completes, Codex starts Phase 12
**Last Updated:** 2026-03-16

## Completed

- [x] Phase 8a-c: Unified Header Settings + Visual Polish
- [x] Phase 9: Header/tab bar cleanup, Jameson calendar support
- [x] Phase 10a-b: Bonus bug fix + Chores redesign
- [x] Phase 11a-c: Chores tab rendering bugs (in Gemini review)

## Queued

- [ ] **Phase 12a: Settings text + family name** — "Update code" button, customizable header name in DB
- [ ] **Phase 12b: Fullscreen PWA** — Apple meta tags, safe area padding
- [ ] **Phase 12c: Extract fun data** — Move jokes/madlibs to kid-fun-data.js (~855 lines out of index.html)

## Pending User Action

- Redeploy calendar-proxy.gs.txt to Google Apps Script (new deployment for ?days= and Jameson)

## Notes

- Gemini is actively reviewing Phase 11 — do NOT modify index.html until that review completes
- Phase 12c is the most impactful: reduces index.html from ~6773 to ~5918 lines, improving AI agent performance
- kid-fun-data.js already exists but may have fewer items than what's currently embedded — Codex must sync content
