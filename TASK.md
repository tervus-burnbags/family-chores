# Task: Phase 41 — Recipes

**Task Type:** feature
**Model Mode:** default

## Summary

Add a Recipes capability to Family Hub. Recipes are authored externally (ChatGPT/Claude → PDF dropped into a local inbox folder) and pushed into Firebase by Claude using a small admin script. The app renders recipes in a canonical layout and lets any family member add free-form notes. Notes are the user-facing input channel; Claude later reads recipe + notes and pushes a revised recipe back.

Two parts:

- **Part A** — In-app Recipes tab (the UI + Firebase read/write for notes).
- **Part B** — Admin tooling (canonical JSON schema + Node scripts that use `firebase-admin` to import/update/fetch recipes from a service-account key).

---

## Part A: In-App Recipes Tab

### A1. Add "Recipes" as the 6th tab

Edit the tab bar in `index.html` around **line 3697 (`<nav class="tab-bar" id="tabBar">`)**. Add a Recipes tab between Lists and Bank (or after Fun — pick whichever balances visual weight best). Use a chef-hat / bowl-and-spoon SVG (~20×20, same stroke style as siblings).

```html
<a class="tab" href="#recipes" data-tab="recipes">
  <span class="tab-icon"><!-- chef-hat or pot SVG --></span>
  <span class="tab-label">Recipes</span>
</a>
```

**Six tabs is tight on narrow screens.** Verify on a 360px-wide viewport (Android small) that labels don't truncate awkwardly. If they do, drop label font-size by ~1px or use icon-only at ≤360px via a media query — but keep all 6 visible (do not hide a tab behind a menu).

### A2. Add the Recipes view shell

Add `<div class="view" id="viewRecipes">…</div>` as a sibling of `viewBank` near **line 3677**. Two sub-sections inside:

- **List pane** (`#recipesListPane`) — search box at top, then list items.
- **Detail pane** (`#recipesDetailPane`) — hidden when nothing selected; back button when a recipe is open. On wider viewports this can be side-by-side; on phones it's list → detail navigation (hide list when detail open, like the existing Bank kid-card flow).

Register the view in `setupRouter()` at **line 4205**:

```js
recipes: document.getElementById('viewRecipes')
```

Add a render trigger inside `switchView()` near **line 4244–4259**:

```js
if (name === 'recipes' && typeof window.renderRecipes === 'function') {
  window.renderRecipes().catch(function (e) { console.error(e); });
}
```

Add a composer placeholder for the recipes view at **line 4220** (the placeholders object):

```js
recipes: 'Search recipes…'
```

Note: the universal composer is wired to the intent parser. For Phase 41, **do not add a recipes intent** — the search box inside the Recipes view handles search. The universal composer should remain functional on the Recipes tab for other intents (chores, lists, etc.) but not interpret anything as a recipe command. Out of scope.

### A3. Firebase schema

Path: `/recipes/{recipeId}` — **family-shared at the family root**, same level as `/chores`, `/lists`, etc. Use the existing `familyRef` pattern (see how Lists writes — search for `familyRef.child('lists')`).

Recipe document shape (canonical — also documented in `RECIPE_SCHEMA.md`, Part B):

```json
{
  "id": "rcp_abc123",
  "title": "Sourdough Boule",
  "description": "Open-crumb country loaf, 24h cold ferment.",
  "tags": ["bread", "sourdough"],
  "servings": "1 loaf",
  "prepTime": "30 min active",
  "cookTime": "45 min",
  "totalTime": "26 hr",
  "ingredients": [
    { "qty": 500, "unit": "g", "item": "bread flour" },
    { "qty": 375, "unit": "g", "item": "water", "note": "90°F" },
    { "qty": 10,  "unit": "g", "item": "salt" },
    { "qty": 100, "unit": "g", "item": "active sourdough starter" }
  ],
  "steps": [
    "Mix flour and water; rest 1 hour (autolyse).",
    "Add starter and salt; pinch to combine.",
    "…"
  ],
  "source": "ChatGPT 2026-06-03",
  "createdAt": 1717372800000,
  "updatedAt": 1717372800000,
  "notes": ""
}
```

- `notes` is the only field the app mutates after creation. Single free-form string.
- `ingredients[].qty` is always a number; `unit` is a short string ("g", "ml", "tsp", "Tbsp", "cup", "ea", "pinch"). `note` is optional per-ingredient parenthetical.
- All other fields are write-once from the admin script. App must not edit them.

### A4. List view

`window.renderRecipes()` should:

- Read `/recipes/{id}` from Firebase under the family root, sort by `updatedAt` desc.
- Render each as a row: title (large), description (muted, truncated to 1 line), tags as small chips.
- Search box filters by title + tags + ingredient items (substring, case-insensitive).
- Empty state: "No recipes yet. Drop a PDF into `recipes-inbox/` and ask Claude to import it."
- Tap a row → open detail.

### A5. Detail view

When a recipe is selected:

- Header: title, tags as chips, source line (small, muted).
- Meta row: servings · prep · cook · total (only show fields that are present).
- **Ingredients** section: rendered as a 2-column list — `qty unit` left, `item` right, with optional `note` in parens.
- **Steps** section: numbered list, generous line-height.
- **Notes** section (the only editable area):
  - `<textarea>` bound to `/recipes/{id}/notes`.
  - Debounced write (500ms) on input — same pattern as how Bulletin notes / list items currently sync.
  - Subtle "Saving…" → "Saved" indicator.
  - Placeholder: "What did you change? How did it turn out? Claude will use this to revise the recipe."

Read-only enforcement: no edit button for title/ingredients/steps. The recipe body is immutable from the app. Notes are the only writable field.

### A6. Styling

Match existing Family Hub design language — neutral background, kid-color accents not applicable here (recipes are family-shared, not per-kid). Use the same card / chip / section-header treatments as Lists and Bulletin so it feels native.

Ingredient quantities should be **right-aligned in the qty column** so the eye can scan amounts. Use a tabular-nums font feature on the qty column.

### A7. Service worker

Bump `sw.js` cache version. Add the new view's nothing-extra (it all lives in `index.html`).

---

## Part B: Admin Tooling

Codex builds the schema doc + script skeletons. Claude (the architect) is the day-to-day user of these scripts.

### B1. `RECIPE_SCHEMA.md` at repo root

Document:

- The full JSON shape from A3 above, with each field's purpose and whether it's required.
- **Unit conventions** (this is the contract for any LLM producing recipes):
  - **Grams (`g`)** for: flour, sugar, butter, cocoa, salt, yeast, any baking ingredient measured by weight, meats, cheeses, vegetables when precision matters.
  - **Milliliters (`ml`)** for: liquids only when a precise volume is more natural than weight (e.g., "200 ml stock"). For water in baking, prefer grams.
  - **Teaspoons (`tsp`) / tablespoons (`Tbsp`)** for: spices, extracts, small amounts of oil/vinegar, leaveners when traditional (baking powder, baking soda).
  - **Cups (`cup`)** for: bulky non-baking items where US cooks expect cup measures (e.g., "1 cup chopped onion"). Prefer weight for baking.
  - **`ea`** (each) for whole items: "2 ea eggs", "1 ea lemon".
  - **`pinch`** for trace amounts.
- Style notes: title in Title Case; tags lowercase, kebab-style for multi-word ("slow-cooker"); steps as imperative sentences, ≤ 2 sentences each where possible; one ingredient per line, no embedded "or" lists (split into two recipes if substitution is significant).
- A worked example (sourdough or similar) showing a complete, valid JSON.

### B2. `scripts/recipes/` directory

Create:

```
scripts/recipes/
  package.json          # firebase-admin only
  README.md             # setup: how to download a service-account key, where to put it, how to run scripts
  import-recipe.js      # node import-recipe.js <path-to-recipe.json>  → pushes to /recipes/{generatedId}
  update-recipe.js      # node update-recipe.js <recipeId> <path-to-recipe.json>  → overwrites body, clears notes, bumps updatedAt
  fetch-recipe.js       # node fetch-recipe.js <recipeId>  → prints current JSON (recipe + notes) to stdout
  list-recipes.js       # node list-recipes.js  → prints {id, title, updatedAt} list
```

Each script:

- Loads service-account key from `./scripts/recipes/service-account.json` (path documented in README).
- Loads Firebase database URL from existing `firebase-config.js` (parse it, or have user paste it into a sibling `.env`-style file — pick whichever is cleaner).
- Resolves the family node: read `family-id.txt` (a single-line file the user creates once) or accept `--family <id>` as a CLI flag. Document in README.
- Validates the JSON against the schema in `RECIPE_SCHEMA.md` (minimum: required fields present, ingredients array non-empty, qty numeric). Reject with a clear error before writing.

`update-recipe.js` behavior (per user decision: **overwrite, no history**):

- Fetch existing recipe to confirm it exists.
- Overwrite the body fields. Set `notes = ""`. Bump `updatedAt`. Preserve `id` and `createdAt`.
- Print before/after summary.

### B3. `.gitignore` additions

Add to repo `.gitignore`:

```
# Recipes admin tooling
recipes-inbox/
scripts/recipes/service-account.json
scripts/recipes/node_modules/
scripts/recipes/family-id.txt
```

### B4. `recipes-inbox/` folder

Create the empty folder with a `.gitkeep` (or just leave it; the gitignore covers contents). Document its purpose in `RECIPE_SCHEMA.md`: this is where the user drops PDFs (or any source format) for Claude to read and convert.

---

## Test Focus

Direct Gemini's review at these areas:

1. **Six-tab fit on narrow viewports** — does the tab bar look reasonable at 360px? Are labels readable, or do they wrap/truncate ugly?
2. **Notes write-debouncing** — type continuously in the Notes textarea, confirm no Firebase write storm and no lost characters. Verify the "Saving / Saved" indicator behaves.
3. **Recipe body is genuinely read-only from the UI** — no hidden edit affordance for title/ingredients/steps. Selectable text is fine; mutable inputs are not.
4. **Schema validation** in admin scripts — try importing a JSON missing `ingredients`, a JSON with `qty: "500"` (string instead of number), and an empty `steps`. Each should fail with a clear message rather than silently writing bad data.
5. **`update-recipe.js` clears notes** — import, write a note in the app, run update, confirm note is cleared and `updatedAt` advanced.
6. **No regressions** in existing tabs. Confirm composer placeholder swaps include the new `recipes` key. Confirm hash routing for `#recipes` works.

## Out of Scope

- Recipe creation/editing UI in the app (decided: LLM round-trip only).
- Recipe categories / collections / favoriting.
- Image attachments.
- Universal composer intent for recipes (e.g., "add 200g butter to sourdough notes"). Future phase.
- Version history (decided: overwrite, no history).
- Direct LLM API integration (decided: manual Claude-mediated round-trip).
- Print / export views.

**Service worker:** Bump `sw.js` cache version.
