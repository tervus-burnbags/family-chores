# Claude Instructions — Family Chores (chores)

## Shared Instructions

Before starting any work, read and follow:
- `../AI_COMMAND/core/roles.md` — roles and override rules
- `../AI_COMMAND/core/workflow.md` — collaboration pipeline
- `../AI_COMMAND/core/coding_standards.md` — standards
- `../AI_COMMAND/core/claude_usage.md` — token efficiency
- `../AI_COMMAND/core/task_system.md` — TASK.md system

Your default role is **Architect / Planner**. See `../AI_COMMAND/templates/CLAUDE.md` for full instructions.

**User overrides always apply.** If told to implement directly, do so.

## Handoff Artifacts

- Write task definitions to `TASK.md`
- Write detailed plans to `PLAN.md` (complex tasks only)
- Track status in `TASK_STATE.md`
- Read reviewer feedback from `REVIEW.md`

## Project Overview

Voice-first family chore tracking PWA. Two parents (Android + iPhone) log chores for two kids via natural language (speech or text). Points accumulate toward weekly pay tiers and monthly bonuses. Firebase provides real-time cross-device sync. Hosted on GitHub Pages.

See `PLAN.md` for the full specification including intent parser, data model, and UI spec.

## Tech Stack

- Language: Vanilla JavaScript (no framework, no build step)
- UI: Single-file HTML/CSS/JS (`index.html`)
- Database: Firebase Realtime Database (Spark/free plan)
- Auth: Firebase Anonymous Auth + shared family code
- Voice: Web Speech API (browser-native)
- NLP: Rule-based intent parser (no LLM)
- Hosting: GitHub Pages (HTTPS required for PWA + Speech API)
- Firebase SDK loaded via CDN (firebase-app-compat, firebase-auth-compat, firebase-database-compat)

## Project Structure

```
chores/
├── index.html          # Entire app (HTML + CSS + JS) — single-file architecture
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline caching
├── firebase-config.js  # Firebase project config (separate for easy swapping)
├── icons/              # PWA icons (192px, 512px)
├── test-parser.html    # Parser test harness
├── alex_chart_v2.docx  # Reference: original paper chore chart
├── louisa_2page.odt    # Reference: original paper chore chart
├── PLAN.md             # Full specification (data model, parser spec, UI spec, phases)
└── CLAUDE_HANDOFF.md   # Handoff notes from last major session
```

## Project-Specific Rules

- **Single-file app**: All runtime code lives in `index.html`. Do not split into modules unless explicitly asked — this is intentional for simplicity and GitHub Pages hosting.
- **No build tools**: No npm, no bundler, no transpiler. Firebase SDK via CDN only.
- **Parser-first**: The intent parser is the core UX. Changes to parsing logic need careful testing against all 9 intent types (see PLAN.md "Intent Parser — Full Specification").
- **Firebase data model**: The canonical data model is in PLAN.md. Schema changes need to account for existing live data.
- **Recently restructured**: The app was restructured as "Family Hub" with a tab bar and view router (see recent commits). The kid-card dashboard is now the primary view.

## Current Status

- **All 5 implementation phases complete** (app shell, parser, voice, scoreboard, settings)
- Recently restructured from chat-only to Family Hub with tab-based navigation
- Shared lists module added (templates, checklist UI, archive)
- Repo: `master` branch, pushed to `origin/master`
- GitHub Pages is live
- Known debt: large single-file app, should eventually be modularized
- See `CLAUDE_HANDOFF.md` for detailed current state and remaining risks
