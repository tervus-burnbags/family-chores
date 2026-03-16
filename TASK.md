# Task: Fix Remaining Broken Tabs (Bank, Fun Trackers, Lists)

## Summary

Three broken/incomplete tabs need fixing. All are independent and can be done in any order.

1. **Phase 7a: Bank — restore kid credit cards** (renderCardView lost in restructure)
2. **Phase 7b: Fun — add trackers** (no progress tracking for jokes/mad libs)
3. **Phase 7c: Lists — fix broken tab** (renderListsHome never defined)

## Model Mode

default

---

## Phase 7a: Restore Bank Kid Cards

**Problem:** The `renderCardView()` function was defined in the pre-restructure code (commit d207430) but was deleted during the Phase 1-4 restructure (commit 67c5ea8). The router calls `window.renderCardView(kidId)` on Bank tab switch (line ~1788) but the function doesn't exist, so the Bank tab shows an empty `<div id="cardContent"></div>`.

**Fix:** Restore `renderCardView` from the pre-restructure code, adapted to the current codebase. The function should be defined and assigned to `window.renderCardView`.

**Key pieces that must be restored:**
1. The `renderCardView(kidId)` function — renders the kid credit card UI with:
   - Kid card visual (balance, name, points this week)
   - This Week progress (points, pay earned, tier progress, bonus track)
   - Balance section with Pay and Spent buttons
   - Debts section with Settle buttons
   - Recent Activity statement (chore logs + payment transactions)
2. The `handleCardAction(button)` function — handles pay-balance, kid-spent, settle-debt button clicks
3. Event delegation on `#cardContent` for `[data-card-action]` buttons

**Important:** Phase 4 added a `patchBankRender()` (line ~4887) that wraps `renderCardView` to call `stripWeeklyCard()` — this strips the "This Week" card from Bank (since weekly progress was moved to Chores). That patch must still work after restoration. Define `renderCardView` *before* `patchBankRender()` runs.

**Reference:** The original function is in git history at commit `d207430`, line 2335. Retrieve it with:
```bash
git show d207430:index.html | sed -n '2335,2520p'
```

Adapt to current scope. It uses: `runtime()`, `waitForRuntimeReady()`, `paymentBalanceDelta()`, `thresholdInfo()`, `getDebts()`, `formatWeekRange()`, `ensurePhase4Styles()`, `maybeRunWeeklyPay()`, `phase.writePayment()`, `phase.adjustBalance()`, `phase.getBalances()`, `phase.getAllLogEntries()` — verify all exist before using.

**Helper functions to also restore** (from same commit):
- `handleCardAction(button)` — pay, spend, settle-debt actions
- `openCardForKid(kidId)` — convenience to re-render after an action
- Event delegation: `cardContent.addEventListener('click', ...)` for `[data-card-action]`

### Test
- Switch to Bank tab, select Alex → kid card renders with balance, points, activity
- Switch to Louisa → card updates
- Click Pay → prompt for amount → balance updates
- Click Spent → prompt for amount + note → balance decreases
- Verify "This Week" card is still stripped (patchBankRender still works)

---

## Phase 7b: Fun Tab Trackers

**Problem:** The Fun tab shows jokes and mad libs but has no progress tracking. Kids can't see how many jokes they've heard or mad libs they've completed.

**Add the following trackers to the Fun tab:**

1. **Jokes tracker** — track unique jokes seen in localStorage (store array of seen indices via `readFunState`/`writeFunState`). Display: "42 of 250 jokes discovered"

2. **Mad Libs tracker** — increment a counter in localStorage each time a mad lib is fully completed (all blanks filled and story shown). Display: "12 stories created"

3. **Fun stats summary** — at the top of the Fun view, render a small stats bar with both counters.

**Implementation:**
- Store `jokesSeen` as a JSON array of seen indices in localStorage
- Store `madLibsCompleted` as a number counter in localStorage
- Add the current joke index to `jokesSeen` when the punchline is revealed (in the reveal button handler)
- Increment `madLibsCompleted` when a mad lib story is fully displayed (when all blanks are filled)
- Render the stats in `renderFun()` above the joke/madlib cards

### Test
- Open Fun tab → see stats bar (0/250 jokes, 0 stories initially on fresh install)
- Reveal a joke → jokes discovered increments
- Complete a mad lib → stories counter increments
- Reload → counters persist
- Clear localStorage → counters reset to 0

---

## Phase 7c: Fix Lists Tab

**Problem:** The Lists tab shows only "Lists coming soon" placeholder (line 1303). The router calls `window.renderListsHome()` on tab switch (line 1795) but this function is never defined. Commit `52e88a5` added a "shared lists module" but it was lost in the restructure.

**Fix:** Check git history at commit `52e88a5` for the lists implementation:
```bash
git show 52e88a5:index.html | grep -n "renderListsHome\|sharedLists\|listsModule" | head -20
```

Restore or rebuild a working shared lists feature.

**Minimum viable Lists tab:**
1. **Shared checklists** synced via Firebase at `families/{familyId}/lists/{listId}`
2. Each list has: name, items array, creation timestamp
3. **Default lists**: Grocery, To-Do
4. **Create custom list** — name input + create button

**Each list should support:**
- Add item (text input at top)
- Check/uncheck items (tap to toggle)
- Delete item (X button)
- Real-time sync via Firebase (both parents see changes instantly)
- Items stored as: `{ text: string, done: boolean, timestamp: number }`

**Templates** (pre-built lists users can one-click create):
- Weekly groceries
- School supplies
- Chore supplies

**Define `window.renderListsHome`** and render into `#listsContent`.

### Test
- Switch to Lists tab → see available lists + create button
- Create a grocery list → add items → check them off
- Open on second device → items sync in real-time
- Delete items → confirm removal
- Create list from template → pre-populated items appear

---

## Phase Order

```
Phase 7a: Bank cards   → unblocks Bank tab (independent)
Phase 7b: Fun trackers → small addition (independent)
Phase 7c: Lists fix    → unblocks Lists tab (independent)
```

All three are independent — can be done in any order or in parallel.

## Files Changed

- `index.html` — all phases
- `sw.js` — bump cache version after final phase

## Risks

1. **renderCardView restoration** — complex function (~150 lines) with many dependencies. Must verify all helper functions still exist. Key: `thresholdInfo()`, `getDebts()`, `formatWeekRange()`, `ensurePhase4Styles()`, `maybeRunWeeklyPay()`.
2. **Lists Firebase schema** — new data at `families/{familyId}/lists/`. No conflict with existing data.
3. **Single-file size** — index.html is already large. These additions will grow it further.
