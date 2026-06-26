# Task State - Family Hub

**Task:** Phase 42 — Add Recipe Ingredient to Grocery List
**Current Phase:** built
**Status:** Built by Claude (user override of feedback_workflow — explicitly asked Claude to program it directly)
**Next Agent:** human (smoke test) → Gemini (review)
**Next Action:** Smoke test in browser: open a recipe, tap the "+" on an ingredient, confirm it lands on the Grocery list in the right aisle, dedup + Undo work, and "added ✓" persists on reopen. Then hand to Gemini per Test Focus.
**Last Updated:** 2026-06-26

## Phase 42 build notes

Implemented entirely in `index.html` + `sw.js` cache bump (`hub-v55` → `hub-v56`):
- `GROCERY_STAPLES` keyword list + `isStapleItem`, `groceryTextForIngredient` (staple → item-only; else amount), `isOnGroceryList`, `addIngredientToGrocery` (find-or-create grocery list, dedupe, autoCategory, returns pushed item id for Undo).
- `renderIngredient` now emits a third grid child: `.recipe-ing-add` button (`data-ing-add`). Grid went 2-col → 3-col.
- Click delegation handles `[data-ing-add]` before the cooking check-off branch (`stopPropagation`), with Undo toast via `runtime().showToast`.
- "added ✓" state derived per-render from the live grocery list (recomputed, not stored).
- Print CSS hides `.recipe-ing-add`.
- Known minor edge: if lists haven't loaded yet when adding, a second grocery list could be created (same theoretical window as existing `openOrCreateTypedList`). Low risk in practice.

## Completed

- [x] Phases 8-41

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
