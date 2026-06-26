# Task: Phase 42 — Add Recipe Ingredient to Grocery List

**Task Type:** feature
**Model Mode:** default
**Implementer:** Codex (architect = Claude; do not have Claude implement)

## Summary

In the recipe **detail view**, let the user add a single ingredient to the family grocery list with one tap — selectively, one item at a time (not "add all ingredients"). Each ingredient row gets a small "add to grocery" button. Tapping it pushes that ingredient onto the existing `'grocery'`-type list (auto-created if none exists), auto-categorized into the right aisle, deduped, with an Undo toast. Ingredients already on the grocery list render in an "added ✓" state.

This is additive and small — it reuses the existing lists plumbing and the existing ingredient-row rendering. **No schema change, no new Firebase paths.**

---

## Context: what already exists (reuse these — do not reinvent)

**Lists module (all in `index.html`):**
- `findExistingListByType('grocery')` (~line 9713) — returns the existing grocery list object (`{id, name, type, items}`) or null.
- `openOrCreateTypedList('grocery')` (~line 9721) — opens or creates a typed list. Use a non-navigating create path if needed (see A3) — we must NOT switch the user away from the Recipes view.
- `addListItems(listId, value, explicitCategory)` (~line 9685) — pushes item(s) to a list. Splits on commas/"and", so pass a **single clean item string** (no commas). With `explicitCategory` omitted/`'auto'` and a grocery list, it calls `autoCategory()` automatically.
- `autoCategory(text)` — maps "flour" → baking aisle, "banana" → produce, etc. Already wired for grocery/costco.
- `buildItemPayload`, `nextItemOrder` — item construction + ordering, already correct.
- `normalizeListName(text)` — normalized comparison key (used for dedupe).
- `listState.listsById` — live map of loaded lists (read current grocery items from here for dedupe + "added" state).
- `showToast(text, { onUndo: fn })` (~line 5619) — toast with an Undo button. Use this.

**Recipe detail rendering (all in `index.html`):**
- `renderIngredient(ing, idx)` (~line 10816) — emits two spans: `.recipe-ingredient-qty[data-ing-row]` and `.recipe-ingredient-item[data-ing-row]`. Container `.recipe-ingredients` is a 2-column grid.
- Ingredient rows ALREADY have a tap interaction: tapping a row toggles a `.checked` strikethrough (cooking mode), with a `#recipeResetBtn` "Reset checks" button. The detail click handler is around **lines 10953–11010** (`data-ing-row` closest-match logic).
- **CONSTRAINT:** plain row tap is taken by cooking check-off. The new "add to grocery" affordance must be a **distinct, separate tap target** (its own button), and clicking it must `stopPropagation()` so it does not also toggle the cooking check.

---

## Requirements

### 1. Per-ingredient "add to grocery" button

- In `renderIngredient`, append a third element per row: a small button, e.g.
  `<button type="button" class="recipe-ing-add" data-ing-add="IDX" aria-label="Add to grocery list">＋</button>`
  Use a cart or plus SVG (~16–18px) matching the app's stroke style — not a literal "＋" character.
- Update the `.recipe-ingredients` grid to **3 columns** (qty | item | button), button column `max-content`, button right-aligned. Keep qty right-aligned/tabular-nums as today. Verify the existing `.checked` styling on qty/item still reads correctly.
- The button must work in BOTH layouts in `renderDetailImpl` — the no-components branch (~10835) and the components branch (~10841).
- **Print stylesheet:** hide `.recipe-ing-add` in the print/cookbook CSS (search the print `@media` block near lines 4061–4150). It must not appear on the printed sheet.

### 2. What text gets added (the staple rule)

The driving question is **"will I use the whole purchase in this recipe?"** Pantry **staples** (you keep them on hand, buy in bulk, won't use the whole package) go in as **item-only**. Everything else (you buy it for this recipe and use it up — meats, fresh produce, canned goods, etc.) goes in **with its amount**.

Classification is by a **curated staple keyword list** (NOT by unit). Implement a pure helper `groceryTextForIngredient(ing)`:

1. **Strip note** — never include `ing.note` (cooking prep like "packed"/"melted"/"90°F" — irrelevant to shopping).
2. **Is it a staple?** Normalize `ing.item` (lowercase, trim) and test against `GROCERY_STAPLES` (substring match — `"all-purpose flour"` contains `"flour"`, `"unsalted butter"` contains `"butter"`, `"light brown sugar"` contains `"sugar"`).
   - **Staple** → return **item only** (e.g. `all-purpose flour`, `eggs`, `butter`, `olive oil`).
   - **Non-staple** → include amount:
     - `ing.unit === 'ea'` → `"<qty> <item>"` (e.g. `3 lemon`, `1 can crushed tomatoes`).
     - any other unit → `"<qty> <unit> <item>"` (e.g. `500 g ground beef`, `200 g mushrooms`).
     - If `qty` is empty/0 → item only regardless.
3. **Strip commas** from the final string (commas split into multiple items in `addListItems`). If `item` contains a comma, replace with a space or drop the trailing clause.

**`GROCERY_STAPLES`** — define as an editable array near the recipe code. Starter set (lowercase keywords; match as substring of the normalized item):

```
flour, sugar, salt, pepper, baking soda, baking powder, yeast, butter, oil,
egg, milk, honey, maple syrup, vanilla, water, starter, discard, vinegar,
soy sauce, cornstarch, cocoa, cinnamon, nutmeg, ginger, cumin, paprika,
cardamom, clove, oregano, basil, thyme, chili powder, garlic powder, onion powder
```

Deliberately **NOT** staples (they get amounts): meats, fresh produce/vegetables, canned/jarred goods, cheeses (incl. cream cheese, sour cream), heavy cream, fresh herbs, nuts, chocolate/chips, fresh garlic and onion. Keep `cream` OUT of the staple list so it doesn't grab "cream cheese"/"sour cream". Add a one-line comment that the list is meant to be tuned over time.

### 3. Add behavior

On button tap:
1. `stopPropagation()` (do not toggle cooking check).
2. Resolve the grocery list: `findExistingListByType('grocery')`; if none, create one **without navigating away** from the Recipes view (reuse the create-record path that `openOrCreateTypedList` uses internally, or call `createListRecord(<name>, 'grocery', [])`). The list name should match whatever the app's default grocery list name is (check `LIST_TEMPLATES`/`listTypeMeta('grocery')` for the label).
3. **Dedupe:** if an un-done item on that grocery list already matches (`normalizeListName(existing.text) === normalizeListName(groceryText)`), do NOT add a duplicate — just flip the button to the "added ✓" state and show a toast like `"Already on Grocery"`.
4. Otherwise `await addListItems(groceryListId, groceryText)` (let it auto-categorize).
5. Flip the button to an "added" state (✓ icon, `aria-label="Added to grocery — tap to undo"` optional).
6. `showToast('Added ' + groceryText + ' to Grocery', { onUndo: removeThatItem })` — Undo removes the just-added item (capture its pushed item id; reuse `deleteListItem` or a direct `ref.child(...).remove()`).

### 4. "Already added" state on (re)render

- When `renderDetailImpl` builds the ingredient rows, look up the current grocery list from `listState.listsById` (via `findExistingListByType('grocery')`). For each ingredient, if its `groceryTextForIngredient(...)` normalized-matches an un-done item already on the list, render the button in the "added ✓" state instead of the "＋" state.
- This must survive a re-render (e.g., the detail view refreshing on a Firebase update). It's derived state, not stored on the recipe — recompute each render. (Recipes remain read-only; we never write to the recipe doc.)

### 5. Service worker

Bump `sw.js` cache version (it was `hub-v45`; use the next integer above the current value in the file).

---

## Explicitly OUT of scope

- "Add ALL ingredients" / bulk multi-select (possible future Phase 43).
- Any change to the recipe schema, the admin scripts, or `RECIPE_SCHEMA.md` data shape. (One small doc note may be added — see below.)
- Editing the recipe body. Recipes stay read-only; this feature only writes to `/lists`.
- Scaling quantities, unit conversion, or "smart" merging of like items beyond exact normalized dedupe.
- A grocery-list picker UI. There is one grocery list; auto-create if absent.

## Doc note (optional, low priority)

In `RECIPE_SCHEMA.md`, add one line under the `ea` unit guidance: **canned/packaged goods should be authored as `ea` with the package word in the item** (e.g. `{qty:1, unit:"ea", item:"can crushed tomatoes"}`), so the count carries to the grocery list. This is guidance for future recipe authoring, not a code change.

---

## Test Focus

Direct Gemini's review at these areas:

1. **Tap-target separation** — tapping the "＋" adds to grocery and does NOT toggle the ingredient's cooking-check strikethrough, and vice-versa. Test on touch (the row tap and the button are close together).
2. **The staple rule** — staples come over item-only regardless of unit; non-staples carry their amount. Notes never appear. Verify against the Sourdough recipes: Banana Bread "egg" → `eggs` (staple, no count), "all-purpose flour" → `all-purpose flour`, "honey" → `honey`, "chopped nuts" → `85 g chopped nuts` (non-staple, gets amount). Brownies "semisweet chocolate chips" → `340 g semisweet chocolate chips` (non-staple). Confirm a non-staple `ea` item (author a quick test ingredient like `{qty:1, unit:"ea", item:"can crushed tomatoes"}`) → `1 can crushed tomatoes`. Confirm "cream cheese"-style items are NOT treated as staples.
3. **No grocery list exists** — first add auto-creates the grocery list (correct type, correct default name) WITHOUT navigating away from the Recipes detail view. Subsequent adds reuse it.
4. **Dedupe** — adding the same ingredient twice does not create two list rows; button shows "added ✓"; a sensible toast appears.
5. **Auto-categorization** — added items land in the correct grocery aisle via `autoCategory` (e.g. flour → baking, banana → produce).
6. **Undo** — the toast Undo removes exactly the item just added (not a same-named pre-existing one), and the button reverts to "＋".
7. **"Added ✓" persistence** — open a recipe, add 2 ingredients, navigate away and back (or trigger a Firebase refresh): those 2 still show "added ✓"; the rest show "＋".
8. **Print** — the "＋"/✓ buttons do NOT appear on the printed/cookbook view.
9. **Components layout** — the button renders correctly in both single-list and multi-component (e.g. Brownies "chocolate mixture"/"batter") recipes, with the 3-column grid intact.
10. **No regressions** — cooking check-off + "Reset checks", notes textarea sync, search, and other tabs all still work.

**Service worker:** Bump `sw.js` cache version.
