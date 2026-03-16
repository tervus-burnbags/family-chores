# Gemini Instructions — Family Chores (chores)

## Shared Instructions

Before starting any work, read and follow:
- `../AI_COMMAND/BOOT.md` — quick-start context (roles, workflow, file map)
- `../AI_COMMAND/core/roles.md` — roles and override rules
- `../AI_COMMAND/core/workflow.md` — collaboration pipeline
- `../AI_COMMAND/core/coding_standards.md` — standards
- `../AI_COMMAND/core/review_checklist.md` — review checklist

Your default role is **Reviewer / Analyst**. See `../AI_COMMAND/templates/GEMINI.md` for full instructions.

**User overrides always apply.** If told to go beyond review, do so.

## Handoff Artifacts

- Read task definitions from `TASK.md`
- Read plans from `PLAN.md` (if present)
- Write review findings to `REVIEW.md`
- Track status in `TASK_STATE.md`

## Project Overview

Voice-first family chore tracking PWA. Parents log chores via speech/text, points accumulate toward weekly pay and monthly bonuses. Firebase Realtime Database syncs across devices. See `PLAN.md` for full spec.

## Tech Stack

- Vanilla JS, single-file (`index.html`), no build step
- Firebase Realtime Database + Anonymous Auth (CDN)
- Web Speech API, rule-based intent parser
- GitHub Pages hosting

## Project Structure

All runtime code in `index.html`. Supporting files: `firebase-config.js`, `manifest.json`, `sw.js`, `icons/`. See `PLAN.md` for data model.

## Known Risks

- **Single-file complexity**: `index.html` contains the entire app — multiple additive script layers with significant coupling between parser, Firebase writes, and UI rendering. Easy to introduce regressions.
- **Parser fragility**: The intent parser handles 9 intent types via regex/token-matching. Order of pattern evaluation matters — parser ordering bugs have occurred before (see CLAUDE_HANDOFF.md).
- **Firebase offline**: `keepSynced()` is guarded but not validated as a long-term offline strategy.
- **Speech API limitations**: Browser Web Speech API quality varies by device/browser.
- **Live data**: Firebase has real user data — destructive schema changes risk data loss.

## Review Focus Areas

- **Parser correctness**: When parser logic changes, verify all 9 intent types still work. Watch for ordering regressions (e.g., free-point commands being swallowed by generic status checks).
- **Firebase write paths**: Ensure log entries, payments, and balance updates are atomic where needed. Check that undo properly reverses all side effects.
- **Mobile UX**: 48px minimum tap targets, single-handed use. Test on both Android Chrome and iOS Safari.
- **Scope creep in index.html**: Flag opportunities to extract logic when the file grows, but don't force modularization unless asked.
