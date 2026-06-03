# Recipe Schema

This is the canonical contract for recipes stored in Family Hub. Any LLM-authored recipe (ChatGPT, Claude, etc.) must conform to this shape before being imported via `scripts/recipes/import-recipe.js`.

## The Workflow

1. User asks an LLM to design a recipe (any format: chat, markdown, PDF).
2. User saves the recipe to `recipes-inbox/` (PDFs, text, whatever).
3. User asks Claude (in this repo) to "import the X recipe."
4. Claude reads the file, **normalizes it to the JSON shape below**, and runs `node scripts/recipes/import-recipe.js <path-to-json>`.
5. The recipe appears in the Recipes tab of Family Hub, synced to every device.
6. Family members add free-form notes inside the app over time.
7. User asks Claude to "revise the X recipe based on the notes."
8. Claude calls `fetch-recipe.js`, generates a new version that incorporates the notes, and calls `update-recipe.js`. **The recipe is overwritten, the notes field is cleared, and `updatedAt` is bumped.** No version history is kept.

## JSON Shape

```jsonc
{
  "title": "Sourdough Boule",                       // required, Title Case
  "description": "Open-crumb country loaf, 24h cold ferment.", // optional, 1–2 sentences
  "tags": ["bread", "sourdough", "weekend"],        // optional, lowercase, kebab-style for multi-word
  "servings": "1 loaf",                             // optional, freeform string
  "prepTime": "30 min active",                      // optional, freeform string
  "cookTime": "45 min",                             // optional, freeform string
  "totalTime": "26 hr",                             // optional — include only when it differs meaningfully from prep+cook (long ferments etc.)
  "ingredients": [                                  // required, non-empty
    { "qty": 500, "unit": "g",   "item": "bread flour" },
    { "qty": 375, "unit": "g",   "item": "water", "note": "90°F" },
    { "qty": 10,  "unit": "g",   "item": "fine sea salt" },
    { "qty": 100, "unit": "g",   "item": "active sourdough starter" }
  ],
  "steps": [                                        // required, non-empty
    "Mix flour and water in a large bowl until no dry spots remain. Rest 1 hour (autolyse).",
    "Add starter and salt. Pinch through the dough to combine.",
    "Perform 4 sets of stretch-and-folds, 30 min apart.",
    "Bulk ferment until the dough is jiggly and 50% larger, ~4 hours at 75°F.",
    "Shape into a tight boule. Cold-retard in a floured banneton, 12–24 hours.",
    "Bake covered at 500°F for 20 min, then uncovered at 450°F for 25 min."
  ],
  "source": "ChatGPT 2026-06-03"                    // optional but recommended — who/what authored this version
}
```

The import script generates `id`, `createdAt`, `updatedAt`, and initializes `notes` to `""`. Don't include them in the input JSON.

### Field-by-Field

| Field         | Type                      | Required | Notes |
| ------------- | ------------------------- | -------- | ----- |
| `title`       | string                    | yes      | **Plain and descriptive — what the dish is.** Title Case, ≤ 70 chars. **No cute names, marketing copy, or possessives.** "Banana Bread" not "One-Bowl Banana Bread"; "Mini Banana Muffins" not "Oh-Shit Mini Banana Muffins"; "Butter Chicken with Naan" not "Mom's Famous Butter Chicken". Strip cuteness from source filenames. |
| `description` | string                    | no       | Factual one-liner — what the dish actually is. **No marketing copy or evocative adjectives** ("loud-banana", "pillowy", "crowd-pleasing"). "Soft skillet flatbread, ~6 inches." is good; "Pillowy, brown-butter-kissed tortillas." is not. |
| `category`    | string                    | no       | Lowercase kebab-style. Drives the list-view grouping. Preferred values (rendered in this order): `mains`, `sides`, `breads`, `soups`, `baked-goods`, `snacks`, `sweets`, `desserts`, `drinks`, `sauces`. Anything else is allowed and falls under an alphabetically-appended bucket; missing/empty lands under "Other". |
| `tags`        | string[]                  | no       | Lowercase, kebab-style. Descriptive categories ("bread", "weeknight", "mexican"), not vibes ("comfort-food", "crowd-pleaser"). 1–5 tags. |
| `servings`    | string                    | no       | E.g. `"4 servings"`, `"1 loaf"`, `"makes 12 cookies"`. |
| `prepTime`    | string                    | no       | Human-readable. `"30 min"`, `"30 min active"`. |
| `cookTime`    | string                    | no       | Human-readable. |
| `totalTime`   | string                    | no       | Only include if it differs meaningfully from prep+cook. |
| `ingredients` | `Ingredient[]`            | **yes**  | Non-empty. See below. |
| `steps`       | string[]                  | **yes**  | Non-empty. Imperative sentences. ≤ 2 sentences each ideally. |
| `source`      | string                    | no       | Provenance. E.g. `"ChatGPT 2026-06-03"`, `"Claude revision 2026-06-15"`. |

### `Ingredient` shape

```jsonc
{
  "qty": 500,          // required, number (not a string). Use 0.25 for fractions, not "1/4".
  "unit": "g",         // required, one of the allowed units below. Use "" for "to taste".
  "item": "bread flour", // required, lowercase. Singular when natural ("egg" not "eggs", unless count > 1).
  "note": "90°F",      // optional, parenthetical (temperature, brand, prep instruction like "finely chopped")
  "component": "batter" // optional, lowercase. Groups multi-component recipes in the detail view.
                       //   Common values: "batter", "dough", "crumble", "topping", "glaze",
                       //   "sauce", "marinade", "filling", "garnish", "spice blend", "berry prep",
                       //   "finishing garlic butter", etc. Free-form; whatever the recipe naturally uses.
                       //   Omit on single-component recipes.
}
```

## Unit Conventions

The contract — keep these consistent so the app's ingredient column reads cleanly and so revisions are predictable.

| Unit          | Use for                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `g`           | **Default for baking.** Flour, sugar, butter, cocoa, salt, yeast, dough hydration water, meats, cheeses, anything where precision matters. |
| `ml`          | Liquids when volume is more natural than weight (stocks, milk in soup, oil in dressing). Prefer `g` for baking water. |
| `tsp`         | Spices, extracts, small amounts of oil/vinegar, baking powder, baking soda. |
| `Tbsp`        | Same as `tsp` but for slightly larger amounts (3 tsp = 1 Tbsp). Capital T. |
| `cup`         | Bulky non-baking items where cup measures are idiomatic ("1 cup chopped onion", "2 cup spinach, packed"). Do not use for baking ingredients. |
| `ea`          | Whole items: `2 ea eggs`, `1 ea lemon`, `3 ea garlic cloves`. |
| `pinch`       | Trace amounts. |
| `""` (empty)  | "To taste" — pair with `"item": "salt and pepper, to taste"` and `"qty": 0`. |

### Style Rules

- **Baking is grams; cooking by feel is volume.** When in doubt for baking, choose grams.
- **One ingredient per line.** No embedded `"or"` lists. If a substitution is meaningful enough to mention, add a `note`.
- **No ranges in `qty`.** Pick a number. If a range matters (e.g., "salt to taste, start with 5g"), put the range in `note`.
- **Steps are imperative.** "Mix the flour and water." Not "You mix" or "Mixing".
- **Steps are short.** ≤ 2 sentences each. If a step has multiple actions, split it.
- **Tags are lowercase, kebab-style.** `"slow-cooker"`, `"weeknight"`, `"vegetarian"`. 1–5 tags max.
- **Source is honest.** If the recipe came from ChatGPT, say so. Helps with future revisions.

## Worked Example: Banana Bread

```json
{
  "title": "Banana Bread",
  "description": "Brown-butter banana loaf with a demerara sugar crust.",
  "tags": ["bread", "quick-bread", "weeknight"],
  "servings": "1 loaf (about 10 slices)",
  "prepTime": "15 min",
  "cookTime": "55 min",
  "ingredients": [
    { "qty": 113, "unit": "g",    "item": "unsalted butter",          "note": "brown until nutty, then cool slightly" },
    { "qty": 200, "unit": "g",    "item": "very ripe bananas",        "note": "about 3 medium, mashed" },
    { "qty": 150, "unit": "g",    "item": "light brown sugar",        "note": "packed" },
    { "qty": 1,   "unit": "ea",   "item": "egg",                      "note": "room temp" },
    { "qty": 1,   "unit": "tsp",  "item": "vanilla extract" },
    { "qty": 180, "unit": "g",    "item": "all-purpose flour" },
    { "qty": 1,   "unit": "tsp",  "item": "baking soda" },
    { "qty": 3,   "unit": "g",    "item": "fine sea salt" },
    { "qty": 15,  "unit": "g",    "item": "demerara sugar",           "note": "for the top" }
  ],
  "steps": [
    "Heat oven to 350°F (175°C). Line a 9x5 loaf pan with parchment.",
    "In a bowl, whisk warm brown butter with brown sugar until glossy.",
    "Whisk in mashed bananas, egg, and vanilla.",
    "Sprinkle flour, baking soda, and salt over the top. Fold gently until just combined.",
    "Scrape into the pan. Smooth the top and sprinkle generously with demerara sugar.",
    "Bake 50–60 min, until a skewer comes out clean and the top is deeply bronzed.",
    "Cool in the pan 15 min, then lift onto a rack."
  ],
  "source": "ChatGPT 2026-06-03"
}
```

## Firebase Path

Recipes live at `families/{familyId}/recipes/{recipeId}`. Family-shared, no per-kid scoping. Everyone in the family sees the same recipes and can add notes.

## The `notes` Field

- Only mutable field once a recipe is in Firebase.
- Free-form string. Whatever the cook wants to capture: changes they made, how it turned out, what to try next time.
- App writes to it on user input with a 500ms debounce.
- `update-recipe.js` **clears** `notes` after Claude integrates them into a new revision. The cook starts each round fresh.

## Validation Rules

`import-recipe.js` and `update-recipe.js` enforce these. A failure prints a clear message and writes nothing.

1. `title` is a non-empty string.
2. `ingredients` is a non-empty array.
3. Every ingredient has a numeric `qty`, a string `unit` (may be empty), and a non-empty `item`.
4. `steps` is a non-empty array of non-empty strings.
5. `tags`, if present, is an array of strings.
6. No unexpected top-level fields. (Claude may add `id`, `createdAt`, `updatedAt`, `notes` — the scripts strip these from input and manage them server-side.)
