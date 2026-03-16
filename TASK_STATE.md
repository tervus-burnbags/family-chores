# Task State - Family Hub

**Task:** Consolidation — index.html Cleanup
**Task Type:** consolidation
**Current Phase:** C1
**Status:** Ready for Codex
**Next Agent:** codex
**Next Action:** Implement consolidation phases C1 through C5
**Last Updated:** 2026-03-16

## Completed

- [x] Phase 8a-c: Unified Header Settings + Visual Polish
- [x] Phase 9: Header/tab bar cleanup, Jameson calendar support
- [x] Phase 10a-b: Bonus bug fix + Chores redesign
- [x] Phase 11: Chores tab rendering bugs (fixes applied, review flagged fragility)

## Current — Consolidation

- [ ] **C1: Replace spread operators** — 7 instances of `...` → `Object.assign()`
- [ ] **C2: Eliminate monkey-patching** — Replace `patchRuntimeHooks`/`patchBankRender`/`stripWeeklyCard` with custom events + direct guards
- [ ] **C3: Deduplicate `runtime()`** — 3 copies → 1 global
- [ ] **C4: Extract fun data** — Move jokes/madlibs to kid-fun-data.js (~855 lines out)
- [ ] **C5: Minor cleanups** — Remove dead family panel code, inline function wrappers

## Queued (after consolidation)

- [ ] Phase 12a: Settings text + family name
- [ ] Phase 12b: Fullscreen PWA
- [ ] Phase 12c: (folded into C4)

## Notes

- Consolidation triggered by Gemini review of Phase 11 flagging patch accumulation
- Audit confirmed: no true duplicate state vars, no stale DOM refs, no dead functions — but monkey-patching and spread operators are real problems
- This is a refactor-only task — zero UI or behavior changes
