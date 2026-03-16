# Codex Instructions — Family Chores (chores)

## Shared Instructions

Before starting any work, read and follow:
- `../AI_COMMAND/BOOT.md` — quick-start context (roles, workflow, file map)
- `../AI_COMMAND/core/roles.md` — roles and override rules
- `../AI_COMMAND/core/workflow.md` — collaboration pipeline
- `../AI_COMMAND/core/coding_standards.md` — standards

Your default role is **Builder / Implementer**. See `../AI_COMMAND/templates/AGENTS.md` for full instructions.

**User overrides always apply.** If told to handle a task directly, do so.

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
