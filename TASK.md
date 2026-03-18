# Task: Phase 38 — UI Refresh, Trivia Calibration, Battleship Grid, Template Save, Pin Routing

**Task Type:** bugfix
**Model Mode:** default

## Summary

Six user-reported issues from Phase 37 testing: bank view doesn't refresh after transactions, trivia questions swung too easy (need 2nd-grade level), Battleship grid cells overlap and board is too small, "Save template" button fails silently for lakehouse, "pin" command only works on bulletin tab, and chore logging needs better error handling and UI feedback. Six parts (A-F).

---

## Part A: Bank View Auto-Refresh After Transactions

**Problem:** After saying "I owe alex 2" on the Bank tab, the transaction goes through (toast confirms) but the card view doesn't update. User must switch away and back to see the new balance.

**Root cause:** The `parent_owes_kid` / `kid_owes_parent` handler (line ~5601-5623) calls `adjustBalance()` and `dbRef('payments').push().set()` and shows a toast, but never calls `renderCardView()` to refresh the UI. The same issue exists for `kid_spent` (line ~5589-5598), `record_payment`, `bank_ambiguous` disambiguation callbacks (line ~5576-5583), `record_debt`, and `settle_debt`.

**Fix:** After every successful bank write, re-render the active view:

```javascript
// After the toast in each bank handler:
if (appShellState.currentView === 'bank' && typeof window.renderCardView === 'function') {
  window.renderCardView(kidId).catch(function (e) { console.error(e); });
}
```

Apply this pattern to ALL bank intent handlers:
1. `parent_owes_kid` / `kid_owes_parent` (line ~5601-5623)
2. `kid_spent` (line ~5589-5598)
3. `record_payment` (wherever this handler is)
4. `bank_ambiguous` — both the "earned" and "spent" callbacks (line ~5576, ~5581)
5. `record_debt` and `settle_debt` handlers

**Validation:**
- [ ] Say "I owe alex 2" on bank tab → balance updates immediately without switching tabs
- [ ] Say "louisa spent 3 on candy" → balance updates immediately
- [ ] Say "alex 5" (ambiguous) → pick "earned" → balance updates immediately
- [ ] All bank operations refresh the card view after the toast

---

## Part B: Trivia Difficulty — Calibrate for 2nd Graders

**Problem:** Phase 37 rewrote trivia questions but overcorrected. Current questions are pre-K level ("What sound does a cow make?", "What color is a banana?"). These are too easy for the target audience. User wants **2nd-grade level** (ages 7-8).

**Fix:** Replace all 50 questions in `KID_TRIVIA` array in `kid-fun-data.js` (line ~998-1049) with 2nd-grade-appropriate questions. Target difficulty:

**Guidelines for 2nd-grade trivia:**
- Questions should require actual knowledge/recall, not just sensory recognition
- Distractors should be plausible (not absurd)
- Topics: basic science (seasons, weather, plants, animal habitats), geography (continents, oceans), math concepts (addition, shapes, fractions intro), reading/literature (fairy tales, story elements), history (holidays, famous figures), everyday knowledge
- Avoid: periodic table, boiling points, technical vocabulary, anything requiring reading above grade level

**Example calibration (these are the RIGHT difficulty):**
- "How many continents are there?" → [5, 6, **7**, 8]
- "What planet do we live on?" → [Mars, **Earth**, Jupiter, Moon]
- "What do caterpillars turn into?" → [Spiders, Birds, **Butterflies**, Frogs]
- "How many sides does a hexagon have?" → [4, 5, **6**, 8]
- "Which season comes after winter?" → [Summer, Fall, **Spring**, December]
- "What is the largest ocean?" → [Atlantic, Indian, Arctic, **Pacific**]

**Validation:**
- [ ] All 50 questions are appropriate for ages 7-8
- [ ] No questions a 5-year-old could answer instantly (too easy)
- [ ] No questions requiring knowledge beyond 2nd-grade curriculum (too hard)
- [ ] All `answer` indices are valid (0-3) for their options arrays
- [ ] Plausible distractors on every question (no joke answers)

---

## Part C: Battleship Grid Layout — Fix Overlap and Increase Size

**Problem:** The Battleship grid cells are all overlapping/on top of each other. The grid is also too small for comfortable play on mobile.

**Root cause:** The HTML structure nests a `.bs-grid` (8-column grid) inside a `.bs-grid-row` (9-column grid: label + 8 cells), but `.bs-grid` only has 8 columns and takes up a single column of its parent, causing all cells to collapse into one column.

**Fix — two changes:**

### 1. Fix grid structure — flatten the cell layout

Remove the nested `.bs-grid` wrapper. Instead, place cells directly inside `.bs-grid-row` so each cell occupies one of the 9 columns (label + 8 cells):

In `renderBattleshipGrid()` (line ~7394) and `renderBattleshipSetupGrid()` (line ~7416):
- Remove the `<div class="bs-grid">` wrapper
- Place cell buttons/divs directly inside `<div class="bs-grid-row">`
- Each row should have: `<span class="bs-row-label">A</span>` + 8 cell elements

### 2. Increase grid to 10x10

Change the grid from 8x8 to 10x10:
- Update all `Array(8)` references in Battleship rendering to `Array(10)`
- Column labels: 1-10
- Row labels: A-J
- Update `grid-template-columns` from `22px repeat(8, ...)` to `22px repeat(10, ...)`
- Update ship placement validation bounds
- Update `BATTLESHIP_SHIPS` — add back a 5th ship now that there's room:
  ```javascript
  var BATTLESHIP_SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Destroyer', size: 3 },
    { name: 'Sub', size: 2 }
  ];
  ```
- Update the randomize/shuffle placement logic to use the 10x10 bounds
- Update hit detection and win condition to account for new grid size and ship count

### 3. CSS sizing

Update `.bs-cell` (line ~3285):
- Remove fixed `min-height: 34px`
- Let cells size naturally via `aspect-ratio: 1/1` and the grid's `1fr` columns
- The 10x10 grid should fill the available card width

**Validation:**
- [ ] Grid renders as a clean 10x10 matrix with no overlapping cells
- [ ] Row labels A-J on left, column labels 1-10 on top
- [ ] 5 ships to place (Carrier 5, Battleship 4, Cruiser 3, Destroyer 3, Sub 2)
- [ ] Randomize places all ships without overlap or out-of-bounds
- [ ] Manual placement works within 10x10 bounds
- [ ] Grid cells are tappable on mobile (fill available width)
- [ ] Ship preview highlights correct cells during placement
- [ ] Game plays to completion — all ships must be sunk to win

---

## Part D: Save Template Button — Fix Silent Failure

**Problem:** "Save as template" button doesn't work for lakehouse list. Reset and delete DO work from the same header settings panel.

**Root cause:** The `saveTemplateForList()` function (line ~9198-9207) at line 9201 has an early return: `if (!ref || !list || !LIST_TEMPLATES[list.type]) return;`. The function returns `undefined` (not a rejected promise), so the `.then()` in the click handler (line ~9379) still fires and shows the toast — but the actual Firebase write at line 9205 never runs.

Likely issue: the `list` object passed from `listState.listsById[listState.currentListId]` may not have its `type` property set correctly, OR the `items` property may not be populated in the state object (items might be stored separately or as a Firebase object rather than an array).

**Fix:**
1. Add logging to `saveTemplateForList` to identify exactly which guard condition is failing
2. Ensure the `list` object passed includes both `type` and `items`
3. If `list.items` is a Firebase object (keys are push IDs), convert to array before `.filter()`
4. The `.then()` handler should only show the success toast if `saveTemplateForList` returns a truthy value (the item count):
   ```javascript
   saveTemplateForList(currentListForSave).then(function (count) {
     if (count != null) {
       var activePhase = runtime();
       if (activePhase && currentListForSave) {
         activePhase.showToast('Saved ' + count + ' items as template for ' + listTypeMeta(currentListForSave.type).label + '.');
       }
     } else {
       runtime().showToast('Could not save template.', { type: 'error' });
     }
   }).catch(function (error) { console.error(error); });
   ```

**Validation:**
- [ ] Open lakehouse list → gear icon → "Save as template" → toast confirms with item count
- [ ] Open grocery list → gear icon → "Save as template" → toast confirms with item count
- [ ] If save fails, error toast shown instead of false success
- [ ] After saving, "Reset template" restores the saved version (not the built-in default)

---

## Part E: Pin Command — Route from Any Tab

**Problem:** Saying "pin [text]" only works when already on the bulletin tab. From other tabs, the `parseNoteIntent` function is never called (it's guarded by `if (activeTab === 'bulletin')`), so the input falls through to `missing_kid` or other handlers, resulting in "which kid?" prompts.

**Fix:** Register `pin` as a cross-tab routed intent, similar to how other global intents work:

Option 1 — Add `pin` to `routeIntent` registered intents:
- Register a `log_note` intent in `routeIntent` that matches `^pin\b` patterns
- Set `routeView: 'bulletin'` so it routes to the bulletin tab and executes there
- Priority should be high enough to catch it before other parsers

Option 2 — Move `parseNoteIntent` call before the tab guard:
- In `parseIntent()`, call `parseNoteIntent` early (before the tab-specific blocks) when the text starts with "pin"
- This is simpler but only handles the "pin" keyword

Either way, saying "pin pick up dry cleaning" from any tab should create a bulletin note.

**Validation:**
- [ ] On chores tab: "pin pick up milk" → creates bulletin note, toast confirms
- [ ] On bank tab: "pin remember picture day" → creates bulletin note
- [ ] On lists tab: "pin call dentist" → creates bulletin note
- [ ] On bulletin tab: "pin something" → still works as before
- [ ] "pin" with no text → does NOT create an empty note (graceful handling)

---

## Part F: Chore Logging — Error Handling and Refresh Verification

**Problem:** User reported "louisa made bed" showed "got it" but didn't appear to add the chore. The code path shows the toast only appears after a successful `saveLogEntries()` call, so the write likely succeeded. But there may be a UI refresh gap or a silent error swallowed by the async chain.

**Fix — defensive improvements:**
1. Wrap `executeLogAction` in try-catch so Firebase write failures show an error toast instead of silently failing:
   ```javascript
   try {
     const saved = await saveLogEntries(entries);
     // ... show success toast ...
   } catch (error) {
     console.error('Failed to save chore:', error);
     showToast('Failed to save — try again.', { type: 'error' });
   }
   ```

2. After successful chore logging, explicitly refresh the chore view if active:
   ```javascript
   if (appShellState.currentView === 'chores' && typeof window.renderChoreProgress === 'function') {
     window.renderChoreProgress().catch(function (e) { console.error(e); });
   }
   ```
   Note: `hub:log-changed` already triggers `renderChoreProgress` via the event listener at line ~10041, but an explicit call ensures the refresh happens synchronously after the save rather than relying on the event dispatch timing.

3. Similarly, wrap the bank handlers from Part A in try-catch for consistency.

**Validation:**
- [ ] "louisa made bed" → "Got it!" toast AND chore appears in the chore progress view immediately
- [ ] If Firebase is unreachable, error toast shown instead of false "Got it!"
- [ ] "alex brush teeth" → chore progress updates without needing to switch tabs
- [ ] Bank transactions also show error toast on Firebase failure

---

## Test Focus

Parts A and C are highest risk — A touches all bank handlers, C is a structural grid rewrite. Part B is content-only (data file). Part D is a targeted fix. Part E requires parser routing changes. Part F is defensive hardening.

**Service worker:** Bump `sw.js` cache version after all changes.
