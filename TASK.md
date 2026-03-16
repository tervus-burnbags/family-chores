# Task: Consolidation — index.html Cleanup

**Task Type:** consolidation
**Model Mode:** default

## Goal

Reduce patch layering, remove monkey-patching, replace ES6+ incompatibilities, extract static data, and simplify the script block architecture — **without changing any user-visible behavior**.

## Context

`index.html` is 6773 lines across 6 inline script blocks. Over phases 1–11, code was added as new IIFEs that communicate through `window.phaseRuntime` and monkey-patching (`patchRuntimeHooks`, `patchBankRender`, `stripWeeklyCard`). This has made the file hard for both humans and AI agents to reason about.

Gemini flagged critical regressions in Phase 11 — while investigation shows the architecture is more stable than reported (no true duplicate state variables, no stale DOM refs), the monkey-patching pattern, spread operators, and embedded static data are real problems that need fixing.

## Current Script Block Structure

| Block | Lines | Size | Purpose |
|-------|-------|------|---------|
| 1 | 1952-1962 | 10 | Firebase config |
| 2 | 1963-2634 | 671 | App shell (auth, routing, voice, message handling) |
| 3 | 2636-3919 | 1283 | Parser IIFE (intents, config, `phaseRuntime` setup) |
| 4 | 3920-5577 | 1657 | Fun/Bulletin/Calendar IIFE (jokes, madlibs, rendering) |
| 5 | 5578-6146 | 568 | Lists IIFE |
| 6 | 6147-6765 | 618 | Chores/Bank IIFE |

---

## Phase C1: Replace Spread Operators

**Priority: High — these can break parsing in older browsers and kill entire script blocks.**

Replace all 7 `...` spread operators with `Object.assign()` or manual property copying. The app has no build step, so only ES5/ES2015 syntax is safe.

### Locations and fixes:

**Line ~2812** (parser intent match):
```javascript
// BEFORE:
{ intent: intentConfig.id, ...match, kids }
// AFTER:
Object.assign({}, match, { intent: intentConfig.id, kids: kids })
```

**Lines ~3096, ~3101, ~3106** (Firebase snapshot unflattening — same pattern in `getLogEntriesByDate`, `getAllLogEntries`, `getAllPayments`):
```javascript
// BEFORE:
Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }))
// AFTER:
Object.entries(snapshot.val()).map(function(pair) { return Object.assign({ id: pair[0] }, pair[1]); })
```
Note: `Object.entries` is ES2017 — also replace with:
```javascript
var data = snapshot.val();
Object.keys(data).map(function(id) { return Object.assign({ id: id }, data[id]); })
```

**Line ~3146** (saveLogEntries):
```javascript
// BEFORE:
saved.push({ id: ref.key, ...entry })
// AFTER:
saved.push(Object.assign({ id: ref.key }, entry))
```

**Lines ~6666, ~6676** (bank settings tier update):
```javascript
// BEFORE:
{ ...tiers[idx], minPts: val }
// AFTER:
Object.assign({}, tiers[idx], { minPts: val })
```

### Guardrail
- Run a search for `...` in all script blocks after changes — zero spread operators should remain.
- `Object.entries` should also be replaced with `Object.keys` + manual access.

---

## Phase C2: Eliminate Monkey-Patching

**Priority: High — this is the main source of fragility.**

Three functions in the Chores/Bank IIFE (Block 6) monkey-patch `window.phaseRuntime` and `window.renderCardView` at runtime:

1. **`patchRuntimeHooks()`** (line ~6557) — wraps `phaseRuntime.saveLogEntries` and `phaseRuntime.updateChorePoints` to add `renderChoreProgress()` calls after each operation.
2. **`patchBankRender()`** (line ~6545) — wraps `window.renderCardView` to call `stripWeeklyCard()` after render.
3. **`stripWeeklyCard()`** (line ~6534) — DOM-scrapes "This Week" cards from Bank view after render.

### Fix: Move side effects into the source functions

**For `saveLogEntries` and `updateChorePoints`** (defined in Block 3, the parser IIFE):

Add a simple event dispatch pattern. After `saveLogEntries` completes, dispatch a custom event:
```javascript
document.dispatchEvent(new CustomEvent('hub:log-changed'));
```

After `updateChorePoints` completes, dispatch:
```javascript
document.dispatchEvent(new CustomEvent('hub:config-changed'));
```

Then in Block 6, replace the monkey-patching with event listeners:
```javascript
document.addEventListener('hub:log-changed', function() {
  renderChoreProgress().catch(function(e) { console.error(e); });
  if (appShellState.settingsPanelOpen) renderHeaderSettingsPanel();
});

document.addEventListener('hub:config-changed', function() {
  renderChoreProgress().catch(function(e) { console.error(e); });
  if (appShellState.settingsPanelOpen) renderHeaderSettingsPanel();
});
```

**For `stripWeeklyCard`** — this removes the "This Week" stat card from Bank view because it's now shown in the Chores tab. Instead of monkey-patching `renderCardView`, have `renderCardView` itself skip rendering that card. Add a guard at the point where the "This Week" card is built in `renderCardView`:

Find the section in `renderCardView` (Block 4, ~line 5573+) that builds the "This Week" heading and wrap it with:
```javascript
// Skip "This Week" card — weekly progress is now shown in Chores tab
```
Then remove `stripWeeklyCard()`, `patchBankRender()`, and `patchRuntimeHooks()` entirely.

### Remove warmup monkey-patching

The `phase4Warmup` interval (line ~6750) currently calls `patchRuntimeHooks()` and `patchBankRender()`. After this change, it should just call `renderChoreProgress()` and `maybeRunWeeklyPay()`.

Updated warmup:
```javascript
var phase4Warmup = setInterval(function () {
  var phase = runtime();
  if (!phase || !phase.database || !phase.familyId || !phase.configLoaded) return;
  clearInterval(phase4Warmup);
  renderChoreProgress().catch(function (error) { console.error(error); });
  maybeRunWeeklyPay().catch(function (error) { console.error(error); });
}, 400);
```

Note: This also addresses Gemini's finding that `maybeRunWeeklyPay()` only runs when opening the Bank tab. Moving it to warmup ensures weekly pay is credited on app launch.

### Guardrail
- Search for `__phase4Patched` — should return zero results after cleanup.
- Search for `patchRuntimeHooks`, `patchBankRender`, `stripWeeklyCard` — should return zero results.
- Search for `originalSaveLogEntries`, `originalUpdateChorePoints` — should return zero results.
- Bank view should NOT show a "This Week" card (it's in Chores now).
- Chores checklist should still update after logging a chore.
- Bank settings should still update after changing chore points.

---

## Phase C3: Deduplicate `runtime()` Accessors

**Priority: Low — not a bug, just noise.**

Three IIFEs (Blocks 4, 5, 6) each define their own identical `runtime()` function:
```javascript
function runtime() { return window.phaseRuntime; }
```

This is harmless (IIFE scope), but it's 3x the same code. Define it once as a global before the IIFEs:

In Block 2 (app shell, after the `elements` object), add:
```javascript
function runtime() { return window.phaseRuntime; }
```

Then remove the local `runtime()` definitions from Blocks 4 (~line 4781), 5 (~line 5599), and 6 (~line 6154).

### Guardrail
- `runtime()` should appear exactly once as a function declaration.
- All calls to `runtime()` throughout all blocks should still work (they'll find the global).

---

## Phase C4: Extract Fun Data to External File

**Priority: Medium — biggest line-count reduction (~855 lines).**

`KID_JOKES` (lines ~3922-4197, ~275 lines) and `KID_MADLIBS` (lines ~4199-4779, ~580 lines) are static data arrays embedded in Block 4.

### Steps

1. **Update `kid-fun-data.js`** (already exists):
   - Remove the old comment "Do NOT load this as a separate script"
   - Replace its content with the FULL current `KID_JOKES` and `KID_MADLIBS` arrays from `index.html`. The existing file may have fewer items — the canonical data is in `index.html`.
   - Declare with `var` (not `const`) for widest compatibility:
     ```javascript
     var KID_JOKES = [ /* ... */ ];
     var KID_MADLIBS = [ /* ... */ ];
     ```

2. **Add `<script>` tag in `index.html`** — place it BEFORE Block 4 (before line ~3920):
   ```html
   <script src="kid-fun-data.js"></script>
   ```

3. **Delete the inline arrays** from Block 4:
   - Remove `var KID_JOKES = [...]` (lines ~3922-4197)
   - Remove `var KID_MADLIBS = [...]` (lines ~4199-4779)
   - The Fun IIFE references `KID_JOKES` and `KID_MADLIBS` by name — they'll resolve from the global `<script>` tag.

4. **Update `sw.js`**:
   - Add `'./kid-fun-data.js'` to the `ASSETS` array
   - Bump cache version to `hub-v14`

### Guardrail
- Fun tab jokes load and reveal correctly
- Mad Libs fill-in and story generation work
- `kid-fun-data.js` is in the service worker ASSETS list
- Offline mode still works (data file cached)
- `index.html` is ~855 lines shorter

---

## Phase C5: Minor Cleanups

**Priority: Low — quality-of-life items.**

### 5a: Remove `renderHeaderFamilyPanel` dead code

The family button and panel were removed in Phase 9, but `renderHeaderFamilyPanel()` still exists (line ~2219) and is called from several places. The function no-ops because the panel element is gone, but the calls are noise.

- Remove the `renderHeaderFamilyPanel` function definition (lines ~2219-2228)
- Remove `appShellState.familyPanelOpen` from the state object (line ~2108)
- Remove all calls to `renderHeaderFamilyPanel()` throughout the file
- Remove all references to `appShellState.familyPanelOpen`

Search for both `renderHeaderFamilyPanel` and `familyPanelOpen` to find all instances.

### 5b: Remove function-wrapping pattern in Block 3

Lines ~2681-2712 wrap `createFamily`, `joinFamily`, and `initFirebase` with `originalXxx` pattern. This was needed when Block 3 was added as a layer on top of Block 2. Instead, inline the extra logic directly into the original functions in Block 2.

**For `createFamily`** (defined in Block 2): Add `seedFamilyV2()` and `loadFamilyConfigV2()` calls directly into the Block 2 version, then remove the wrapper from Block 3.

**For `joinFamily`** (defined in Block 2): Add `loadFamilyConfigV2()` call directly, remove wrapper.

**For `initFirebase`** (defined in Block 2): Add `loadFamilyConfigV2()` call directly, remove wrapper.

Move `seedFamilyV2` and `loadFamilyConfigV2` definitions to a location accessible by Block 2 (either above Block 2 or expose them differently). Since Block 3's IIFE owns `currentConfig`, the cleanest approach is:
- Keep `loadFamilyConfigV2` in Block 3 but export it on `window` (already done at line 2665)
- In Block 2's functions, call `window.loadFamilyConfigV2()` directly instead of wrapping

Then remove lines ~2681-2712 (the `originalXxx` wrappers).

### Guardrail
- Creating a family still works (seeds config + loads it)
- Joining a family still works (loads config after join)
- App init still loads config on startup
- No references to `originalCreateFamily`, `originalJoinFamily`, `originalInitFirebase` remain

---

## Files Changed

| File | Phases | Changes |
|------|--------|---------|
| `index.html` | C1-C5 | Spread operators, monkey-patching, runtime(), data extraction, dead code |
| `kid-fun-data.js` | C4 | Full jokes + madlibs arrays |
| `sw.js` | C4 | Add kid-fun-data.js to ASSETS, bump to hub-v14 |

## What NOT to Change

- **No UI changes.** Every view should render identically before and after.
- **No feature additions.** Phase 12 (family name, fullscreen PWA) is queued separately.
- **No data model changes.** Firebase paths, config structure, log entries — all unchanged.
- **No new dependencies.** No build tools, no libraries.
- **Parser logic (Block 3 lines ~2714-3855).** Don't touch the intent parser unless a spread operator fix requires it.
- **CSS.** No style changes.
- **HTML structure.** No DOM changes.

## Validation Checklist

After all phases, verify:

1. App loads and shows Home tab with notes + calendar
2. Chores tab renders checklist on navigation (not blank)
3. Tapping a chore logs it, checklist updates, toast shows
4. Undo prompt works on checked chore
5. Weekly progress card shows correct points and tier
6. Quick-add points work
7. Bank tab shows kid card with balance
8. Bank settings (pay tiers) open from header gear
9. Chore settings open from header gear on Chores tab
10. Fun tab shows joke + madlib (data from external file)
11. Lists tab loads
12. Settings panel closes when switching tabs
13. Voice input still works
14. Offline mode works (service worker caches kid-fun-data.js)
15. No console errors on any tab
16. No `...` spread operators in any script block
17. No `__phase4Patched` references
18. No `patchRuntimeHooks` / `patchBankRender` / `stripWeeklyCard` references

## Risks

1. **Event dispatch timing** — Custom events (`hub:log-changed`) fire synchronously. If `renderChoreProgress` needs async data, it may need to be wrapped. Test that the checklist updates correctly after logging.
2. **`runtime()` global scope** — Moving `runtime()` to global means it's defined before `window.phaseRuntime` is set (Block 3 sets it). This is fine — `runtime()` returns `window.phaseRuntime` which is `undefined` until Block 3 runs. All callers already guard against this (`if (!phase) return`).
3. **kid-fun-data.js content sync** — The file may have fewer jokes/madlibs than index.html. Codex MUST copy the full arrays from index.html into kid-fun-data.js before deleting them from index.html. Count: 250 jokes, ~25 madlibs.
4. **Function wrapper removal (C5b)** — The `originalXxx` pattern exists because Block 3's IIFE needs to intercept Block 2's functions. Inlining requires Block 2 to call `window.loadFamilyConfigV2()`. Since this is set at Block 3 parse time (line 2665), it's available by the time Block 2's async functions execute. But verify the timing.
