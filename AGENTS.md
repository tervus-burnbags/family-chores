# Codex Instructions — Family Chores (chores)

## Role Assignment

Check `PROJECT_CONFIG.md` → `## Role Assignments` for your assigned role. Default: **Builder / Implementer**. Read the matching role template in `../AI_COMMAND/templates/`.

## Shared Instructions

Before starting any work, read and follow:
- `../AI_COMMAND/BOOT.md` — entry point, precedence, modes, file map
- `../AI_COMMAND/core/roles.md` — role definitions, artifact ownership, governance
- `../AI_COMMAND/core/workflow.md` — pipeline, modes, phase loop
- `../AI_COMMAND/core/coding_standards.md` — standards

**User overrides always apply.** If told to perform a different role, do so.

## Handoff Artifacts

- Read task definitions from `TASK.md`
- Read detailed plans from `PLAN.md` (if present)
- Track status in `TASK_STATE.md`
- If blocked, update `TASK_STATE.md` and halt

## Project Overview

Voice-first family chore tracking PWA. Parents log chores for two kids via speech or text. Points → weekly pay → monthly bonuses. Firebase syncs across devices. See `PLAN.md` for the full spec.

## Tech Stack

- Vanilla JavaScript — no framework, no build step
- Single-file app: `index.html` (HTML + CSS + JS)
- Firebase Realtime Database + Anonymous Auth (SDK via CDN)
- Web Speech API for voice input
- Rule-based intent parser (no LLM)
- Hosted on GitHub Pages

## Project Structure

```
index.html          # Entire app runtime
firebase-config.js  # Firebase config (separate file)
manifest.json       # PWA manifest
sw.js               # Service worker
icons/              # PWA icons
test-parser.html    # Parser test harness
```

## Build & Run

No build step. Open `index.html` in a browser, or push to GitHub Pages. Firebase config must be present in `firebase-config.js`.

## Testing

- Manual browser testing — no automated test suite
- `test-parser.html` provides a parser test harness
- See PLAN.md "Verification / Testing Plan" for the full manual test checklist

## Project-Specific Rules

- **Do not split `index.html` into modules** unless explicitly asked. Single-file is intentional.
- **No npm/build tools.** Firebase SDK loaded via CDN `<script>` tags.
- **Parser changes are high-risk.** The intent parser handles 9 intent types — test all of them when modifying parser logic. See PLAN.md for the full parser spec.
- **Preserve existing Firebase data.** The app has live data — schema changes must be backward-compatible or include migration logic.
- **Tab-based navigation**: The app uses a Family Hub layout with a tab bar and view router. New features should integrate as views within this structure.

## Personal fitness corner

- The user approved a separate static PWA at `fitness/`, reusing the existing
  Firebase project. Its plan is `FITNESS_PLAN.md`; setup and review workflows are
  in `fitness/README.md`. This is an explicit exception to integrating new
  features into the shared tab bar.
- Prioritize simple calorie entry (including user/GPT-calculated totals), repeat
  regulars, exercise reminders and free-text meal notes for later review.
- No personal login (user decision, 2026-10-26). Steady reuses the Hub's family
  code and anonymous session, asks who is using it (only Travis today), and stores
  records at `families/{familyId}/fitness/{person}`. Anyone with the family code
  can read it; the user accepted family-level privacy.
- Do not guess nutrition, quantities or liquid density. Coffee's description is
  280 ml coffee + 120 g 2% milk, commonly twice daily. Unknown calories must remain
  visible as unknown. Optional missing macros do not block calorie tracking.
- When explicitly asked to process pending fitness notes, read the README and
  use `scripts/fitness/review-meals.cjs`. Reuse the existing recipe admin setup and
  family-ID resolution; the person defaults to `travis` (`FITNESS_PERSON` overrides).
  Review sources/assumptions and the dry run before
  applying a batch. No background AI integration or automatic food logging.
