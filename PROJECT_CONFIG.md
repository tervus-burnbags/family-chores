# Project Configuration — Family Chores (chores)

This file is shared context for all three AIs. Each AI's instruction file should reference this for project details.

## Project Name

Family Chores (`chores`)

## Description

A voice-first Progressive Web App for tracking family chores, points, and allowance payments. Two parents (Android + iPhone) use natural language (speech or text) to log chores for two kids. Points accumulate toward tiered weekly pay and monthly bonuses. No LLM — the domain is narrow enough for a rule-based intent parser.

## Tech Stack

- Language: Vanilla JavaScript (ES6+)
- Framework: None (no React/Vue, no build step)
- Database: Firebase Realtime Database (free Spark plan)
- Auth: Firebase Anonymous Auth + shared family code
- Voice: Web Speech API (browser-native)
- NLP: Rule-based intent parser (9 intent types)
- Hosting: GitHub Pages (HTTPS for PWA + Speech API)
- Firebase SDK: CDN (firebase-app-compat, firebase-auth-compat, firebase-database-compat v10.12.0)

## Project Structure

```
chores/
├── index.html          # Entire app (HTML + CSS + JS)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline caching
├── firebase-config.js  # Firebase project config
├── icons/              # PWA icons (192px, 512px)
├── test-parser.html    # Parser test harness
├── PLAN.md             # Full specification
├── CLAUDE_HANDOFF.md   # Handoff notes from last session
├── PROJECT_CONFIG.md   # This file
├── CLAUDE.md           # Architect instructions
├── AGENTS.md           # Builder instructions
└── GEMINI.md           # Reviewer instructions
```

## Build & Run

```bash
# No install or build step required
# Option 1: Open index.html directly in a browser
# Option 2: Push to GitHub Pages (live at repo's Pages URL)
# Firebase config must exist in firebase-config.js
```

## Conventions

- Single-file architecture: all runtime code in `index.html`. Do not split unless explicitly asked.
- Firebase SDK via CDN — no npm, no bundler.
- Family Hub layout with tab-based navigation and view router.
- Kid-specific accent colors (blue for Alex, purple for Louisa).
- 48px minimum tap targets throughout — mobile-first, single-handed use.
- See PLAN.md for the canonical Firebase data model and intent parser spec.

## Current Status

- All 5 original phases implemented (app shell, parser, voice, scoreboard, settings)
- Restructured as Family Hub with tab bar and view router
- Shared lists module added (templates, checklist UI, archive)
- Live on GitHub Pages, actively used
- Branch: `master`
- Repo: https://github.com/tervus-burnbags/family-chores

## Constraints

- No build tools or npm — must stay deployable as static files on GitHub Pages
- Firebase free tier (Spark plan) — stay within limits
- Cross-platform: must work on Android Chrome and iOS Safari (14.5+)
- Live user data in Firebase — schema changes must be backward-compatible
- Parser changes are high-risk — 9 intent types with ordering dependencies
