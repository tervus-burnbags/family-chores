# Task State - Family Hub

**Task:** Phase 41 — Recipes
**Current Phase:** built
**Status:** Built by Claude (one-off override of feedback_workflow for this phase)
**Next Agent:** human / Gemini
**Next Action:** (1) one-time setup: download Firebase service-account key into `scripts/recipes/service-account.json`, write family code into `scripts/recipes/family-id.txt`, `npm install` inside `scripts/recipes/`. (2) Smoke test in browser: switch to Recipes tab, verify empty state. (3) Try importing a recipe from `recipes-inbox/`. (4) Hand to Gemini for review.
**Last Updated:** 2026-06-03

## Completed

- [x] Phases 8-40

## Current

- [x] **Phase 41 — Recipes** (built by Claude)
  - [x] Part A: 6th "Recipes" tab between Lists and Bank
    - View shell, router registration, composer placeholder, render trigger
    - List view with search across title/tags/ingredients
    - Detail view: title, source, tags, meta (servings/prep/cook/total), ingredients (right-aligned tabular-nums qty), numbered steps
    - Notes textarea with 500ms debounced Firebase sync + "Saving/Saved" indicator
    - Recipe body read-only (only notes mutable)
    - Back button + hardware-back support via `returnToRecipesHome`
    - Concurrency guard: skip auto-refresh if user is actively typing in notes
    - Narrow-viewport CSS for 6-tab fit (≤380px)
    - `sw.js` cache bumped to `hub-v45`
  - [x] Part B: Admin tooling
    - `RECIPE_SCHEMA.md` — canonical JSON shape + unit conventions + worked example
    - `scripts/recipes/{package.json, README.md, _lib.js, import-recipe.js, update-recipe.js, fetch-recipe.js, list-recipes.js}`
    - `recipes-inbox/` with README + .gitkeep
    - `.gitignore` updated

## Notes

- Design decisions locked with user (2026-06-03):
  - Recipe ingestion: external (ChatGPT/Claude → PDF in `recipes-inbox/` → Claude reads, converts to canonical JSON, pushes via admin script).
  - Notes: single free-form field per recipe, family-shared.
  - Updates: overwrite, no version history. Notes clear on update.
  - Visibility: everyone in family (not parent-gated).
  - Editing: LLM-only round-trip; app is read-only for recipe body.
- Six-tab nav will be tight on small screens — flagged for Gemini.
