# Task: Phase 11 — Chores Tab Rendering Bugs

## Summary

The Chores tab is broken — users see the kid picker (Alex/Louisa/Both) and a blank area below, sometimes with a stale settings panel referencing "Lists." Two root causes:

1. **`switchView` never calls `renderChoreProgress()`** — When navigating to the Chores tab, no render is triggered. The function only runs during warmup (line ~6734) and after chore interactions. If the user navigates away and back, the content area is empty.
2. **Settings panel renders for wrong view** — If the settings panel is open when switching tabs, it re-renders at line ~2417, but `appShellState.currentView` may already be updated to the new tab. The fallthrough at line ~2358 shows "No settings for Lists" when the view doesn't match any known settings handler.

## Model Mode

default

---

## Phase 11a: Fix Chores Tab Not Rendering on Navigation

**File:** `index.html`

**Problem:** In `switchView()` (~line 2389), there are render calls for bulletin, fun, bank, and lists — but NOT for chores.

**Fix:** Add a chores render call in `switchView()`, after the existing `if (name === 'bank')` block (~line 2413):

```javascript
if (name === 'chores' && typeof renderChoreProgress === 'function') {
  renderChoreProgress().catch(function (e) { console.error(e); });
}
```

Note: `renderChoreProgress` is defined inside the chores IIFE and is NOT on `window`. You'll need to either:
- **Option A (preferred):** Expose it as `window.renderChoreProgress = renderChoreProgress;` in the chores IIFE (near line ~6722 where `window.renderChoreSettings` is already exposed), then call it from `switchView`.
- **Option B:** Move the `switchView` chores call inside the chores IIFE where it has access to the function scope — but this is messier since `switchView` is defined elsewhere.

### Test
- Load app on Home tab
- Tap Chores tab → should show weekly progress card + today's chores checklist
- Tap Bank, then tap Chores again → chores still render
- Tap Lists, then Chores → chores render
- Refresh page with #chores in URL → chores render on load

---

## Phase 11b: Fix Settings Panel Showing Wrong Content

**File:** `index.html`

**Problem:** When the settings panel is open and user switches tabs, `renderHeaderSettingsPanel()` is called at line ~2417 after `currentView` is updated. If the new view is `chores` but `window.renderChoreSettings` isn't defined yet (timing), or if there's a mismatch, the fallthrough at line ~2358 shows "No settings for Lists/Fun."

**Fix:** Close the settings panel when switching tabs. In `switchView()`, before the view-specific render calls:

```javascript
appShellState.settingsPanelOpen = false;
renderHeaderSettingsPanel();
```

This is cleaner UX anyway — switching tabs should dismiss the settings panel rather than trying to re-render it for the new context.

**Remove** the existing settings re-render at line ~2417:
```javascript
// DELETE THIS:
if (appShellState.settingsPanelOpen) {
  renderHeaderSettingsPanel();
}
```

### Test
- Open settings on Home tab (gear icon)
- Tap Chores tab → settings panel closes
- Tap Bank, open settings, tap Fun → settings panel closes
- Settings gear still works independently on each tab

---

## Phase 11c: Bump SW Cache

**File:** `sw.js`

Bump cache version from `hub-v12` to `hub-v13`.

---

## Files Changed

- `index.html` — Phase 11a and 11b
- `sw.js` — Phase 11c

## Phase Order

All three are small, independent fixes. Can be done in one pass.

## Risks

1. **`renderChoreProgress` scope** — It's defined inside an IIFE. Must be exposed on `window` for `switchView` to call it. Check that no naming collision exists.
2. **Settings close behavior** — Closing settings on tab switch is a UX choice. If the user explicitly wants settings to persist across tabs, this would be wrong. But given the bug it causes, closing is the right call.
