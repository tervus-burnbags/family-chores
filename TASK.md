# Task: Phase 6 Completion — Offline Persistence & Cleanup

## Summary

Complete the remaining Phase 6 scope: Firebase offline persistence (`keepSynced`) and `safeName()` helper investigation. The original review-fix items (joke counter, random seed, stale settings refs) are done.

## Model Mode

default

## Fixes Required

### Fix 1: Implement `keepPathsSynced()` — Firebase offline persistence

**Goal:** Keep key Firebase paths synced locally so the app works offline and syncs when reconnected.

**Implementation:**

Add a `keepPathsSynced()` function that calls `.keepSynced(true)` on critical database refs. Call it once after the family is joined and `familyId` is set.

Paths to keep synced:
- `families/{familyId}/config`
- `families/{familyId}/balances`
- `families/{familyId}/bulletin/notes`

**Where to add it:** Near the other Firebase initialization logic. Define the function at module scope and call it from wherever `familyId` is first established (look for where Firebase listeners are set up after joining a family).

**Example:**
```js
function keepPathsSynced(familyId) {
  var paths = ['config', 'balances', 'bulletin/notes'];
  paths.forEach(function(p) {
    database.ref('families/' + familyId + '/' + p).keepSynced(true);
  });
}
```

Call `keepPathsSynced(familyId)` right after the family join succeeds and Firebase listeners are established.

### Fix 2: Investigate `safeName()` helper

**Context:** The PLAN.md says to "promote `safeName()` from the Phase 5 IIFE before deleting it." However, `safeName` does not exist anywhere in the current `index.html`. Other helpers from the same list (`paymentBalanceDelta()` at line ~2408, `waitForRuntimeReady()` at line ~2874) *were* promoted and exist.

**Action:** Search for any usage of `safeName` in the codebase. If it's not referenced anywhere, it was likely inlined or never needed — skip it and leave a note. If something looks like it needs a name-sanitizing helper (e.g., Firebase key sanitization), flag it.

### Fix 3: Bump service worker cache version

**File:** `sw.js`

Bump the `CACHE_NAME` version string so users pick up the new code.

## Testing Strategy

1. Join a family, then go offline (airplane mode or disable network)
2. Verify the app still shows cached data (chores config, balances, notes)
3. Log a chore while offline, re-enable network, verify it syncs
4. Check no console errors on any tab
5. Hard-refresh to verify the new service worker cache version activates

## Files Changed

- `index.html` — add `keepPathsSynced()`, call it on family join
- `sw.js` — bump cache version

## Risks

- `keepSynced(true)` increases bandwidth slightly (Firebase keeps those paths' data locally). On the free Spark plan this is fine for a family-sized dataset.
- If `safeName()` turns out to be needed somewhere, Codex should flag it rather than guessing at the implementation.
