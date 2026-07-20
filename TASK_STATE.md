# Task State - Family Hub

**Task:** Phase 43 — Around Charlotte (curated local events)
**Current Phase:** built + tested
**Status:** Built by Claude (user override of feedback_workflow — explicitly asked Claude to program it directly)
**Next Agent:** human (smoke test on phones) → Gemini (review)
**Next Action:** Open Home on both phones and confirm the six real events render, a verdict set on one phone appears on the other, and dismiss/undo works. Then hand to Gemini per Test Focus.
**Last Updated:** 2026-07-20

## Phase 43 build notes

Home tab gains a third section below "Coming Up". Events are LLM-researched and pushed via `scripts/events/`; the app only ever writes `verdict`/`verdictAt`.

- `index.html`: `eventsState` + `subscribeEvents` (live listener, mirrors `subscribeRecipes`), `normalizeEvents`, `parseEventDate`/`isEventExpired` (local-time date-only), `sortEvents` (going-first, then startDate), `renderEventsSection`/`renderEventCard`, `setEventVerdict`. Delegated click branches ordered innermost-first (link → verdict → restore → dismissed-toggle → card). `'events'` added to `keepPathsSynced`. `sw.js` → `hub-v62`.
- Accordion expand is local view state (`state.expandedEventId`), never persisted.
- `safeEventUrl` allows only http(s) — data comes from an external script, so `javascript:` URLs are dropped before reaching an href.
- Admin tooling: `EVENTS_SCHEMA.md`, `scripts/events/{_lib,import-events,list-events,prune-events}.js`, `events-inbox/`. Service-account key and family-id fall back to `scripts/recipes/` so there's one setup, not two.
- `import-events.js` skips any event matching an existing one (url, or title+startDate) — verdicts can never be clobbered by a re-run. Child-keyed writes, never a wholesale node replace.
- `prune-events.js` is dry-run by default and preserves `"no"` verdicts unless `--include-dismissed`.
- Tests: `tests/events.spec.js` (12 tests) + `tests/seed-test-events.js`, run against the isolated test Firebase project. 12/12 chromium, 24/24 across both mobile viewports.
- First real batch imported: 6 Charlotte events (Sept–Nov 2026), verified against official sources.
- **DB rules checked:** `families/$familyId` is `.read`/`.write` on `auth != null`, so the app's anonymous auth can write verdicts. No rules change needed.
- **Pre-existing, unrelated:** `app.spec.js` "logging a chore shows Got it toast" is not idempotent — it fails on any second run the same day because the app correctly says "Alex already logged Make bed today." Left alone deliberately; loosening the assertion would mask real regressions.

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
