# Task: Phase 13 — Chores Tab Overhaul

**Task Type:** standard
**Model Mode:** default

## Summary

The Chores tab is broken and needs a full overhaul:

1. **Critical bug** — Block 6 IIFE (line ~5320) calls `toDateString(new Date())` at line ~5324, but `toDateString` is defined inside Block 3's IIFE (line ~2748) and is NOT in scope. This throws a `ReferenceError` on load, which kills the entire Block 6 IIFE — meaning `window.renderChoreProgress`, `window.renderChoreSettings`, `window.renderBankSettings`, and `window.refreshPhase4` are NEVER assigned to `window`. This cascading failure explains every symptom: blank chores tab, settings showing "Lists", no quick-add buttons.

2. **Settings fallthrough** — Line ~2384 in `renderHeaderSettingsPanel` falls through to "No settings for Lists" when `currentView` is `chores` but the functions aren't defined. The fallthrough label logic should handle all 5 tab names explicitly.

3. **Chores UX redesign** — New "quick tasks" feature and modern design matching the rest of the app.

---

## Phase 13a: Fix the Critical Bug

**This is a one-line fix that unblocks everything.**

**File:** `index.html`, line ~5324

```javascript
// BROKEN — toDateString is not in this IIFE's scope:
var historyState = {
  kid: 'all',
  date: toDateString(new Date())
};

// FIX — inline the date formatting:
var historyState = {
  kid: 'all',
  date: (function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()
};
```

Or more readably, define a local helper at the top of the IIFE:
```javascript
(function () {
  function localDateString(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  var historyState = {
    kid: 'all',
    date: localDateString(new Date())
  };
  // ... rest of IIFE
```

**Also fix the settings fallthrough** at line ~2384:
```javascript
// BEFORE:
var label = appShellState.currentView === 'fun' ? 'Fun' : 'Lists';

// AFTER:
var viewLabels = { fun: 'Fun', lists: 'Lists', chores: 'Chores', bank: 'Bank' };
var label = viewLabels[appShellState.currentView] || appShellState.currentView;
```

This way if `renderChoreSettings` isn't available for any reason, the fallback at least says "Chores" not "Lists."

### Test after 13a
- Chores tab renders the full checklist, weekly progress, and quick-add buttons
- Settings gear on Chores tab shows chore settings (add/remove/edit)
- Bank tab still works (renderCardView, renderBankSettings are back)
- No console errors on any tab
- This fix should immediately restore ALL chores + bank functionality

---

## Phase 13b: Quick Tasks Feature

**New feature:** Configurable "quick tasks" — chores pinned to the top of the Chores tab as large tap targets. Tapping a quick task immediately logs it for the currently selected kid(s) without extra steps.

### How it works

1. **Configuration** — Each chore in `config.chores` gets a new boolean field: `quickTask: true/false`
   - Default: `false` for existing chores
   - Set in chore settings (header gear → Chores tab)

2. **Quick Task UI** — At the top of the chores view (below kid picker, above weekly progress):
   - Row of large pill-shaped buttons, one per quick task
   - Each shows: chore label + point value (e.g., "Fed Dog +1")
   - Colored by selected kid (blue for Alex, purple for Louisa, split for Both)
   - 48px+ height, horizontal scroll if many quick tasks

3. **Tap behavior:**
   - Tap a quick task → immediately logs it for selected kid(s) via `saveLogEntries()`
   - Shows toast confirmation: "Logged Fed Dog for Alex"
   - Button briefly animates (pulse/check) to confirm
   - If already done today, shows as muted/completed with a checkmark
   - Tapping a completed quick task prompts: "Already done. Log again?"

4. **Settings UI** — In chore settings, add a toggle per chore:
   - "Quick task" checkbox/toggle next to each chore row
   - Saving updates `config.chores/{choreId}/quickTask` in Firebase

### Quick Task Layout

```
┌─────────────────────────────────────┐
│  [Alex]  [Louisa]  [Both]           │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐ ┌──────────┐ ┌─────┐ │
│  │ Fed Dog  │ │ Made Bed │ │ ... │ │
│  │   +1 ✓   │ │   +1     │ │     │ │
│  └──────────┘ └──────────┘ └─────┘ │
│                                     │
│  ● Weekly Progress                  │
│  ...                                │
```

### CSS for Quick Tasks

```css
.quick-tasks {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.quick-tasks::-webkit-scrollbar { display: none; }

.quick-task-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  min-height: 52px;
  padding: 8px 14px;
  border: 0;
  border-radius: 16px;
  background: var(--panel);
  border: 2px solid var(--line);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.quick-task-btn.alex { border-color: var(--alex); color: var(--alex); }
.quick-task-btn.louisa { border-color: var(--louisa); color: var(--louisa); }

.quick-task-btn.done {
  background: var(--panel-alt);
  opacity: 0.55;
}

.quick-task-btn:active {
  transform: scale(0.95);
}

.quick-task-pts {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted);
}
```

---

## Phase 13c: Visual Polish

Apply the same design language as the Home tab and header to the Chores view.

### Chore checklist items
- Use SVG checkmark icon (not Unicode ✓) inside `.chore-check` for consistency with tab bar icons
- Checked state: green fill (#22c55e) with white SVG check
- Unchecked state: empty circle with `var(--line)` border

### Weekly progress card
- Ensure the progress bar animates smoothly on updates
- Kid-colored fills (blue for Alex, purple for Louisa)
- Bonus teaser uses 🔥 emoji as originally specified

### Section labels
- Uppercase, small, muted — matching existing `.chore-section-label` style
- Sections: "Quick Tasks" (if any configured), "Weekly Progress", "Today's Chores", "Quick Add"

### Quick-add buttons
- Match the existing `qp-pts` button style
- Keep at bottom of the view

### Bump SW cache
- Bump to `hub-v16` after all changes

---

## Files Changed

| File | Phase | Changes |
|------|-------|---------|
| `index.html` | 13a, 13b, 13c | Bug fix, quick tasks feature, visual polish |
| `sw.js` | 13c | Bump cache to hub-v16 |

## What NOT to Change

- Home tab, Fun tab, Lists tab, Bank tab — no changes
- Parser logic — no changes
- Firebase data model — only addition is `quickTask` boolean on chore config
- No new files, no new dependencies

## Phase Order

```
13a first (critical bug fix — unblocks everything)
13b second (quick tasks feature)
13c last (visual polish)
```

## Risks

1. **13a is the key** — if the `toDateString` reference error is the real root cause, fixing it should immediately restore all Chores + Bank functionality. If the tab is still broken after 13a, there's a deeper issue and Codex should halt and report.
2. **Quick task config migration** — existing chores in Firebase won't have `quickTask` field. Code must default to `false` when the field is missing.
3. **Horizontal scroll on quick tasks** — may feel odd on desktop/wide screens. Consider wrapping to grid on wider viewports.

## Validation Checklist

After all phases:
1. No console errors on any tab
2. Chores tab shows: quick tasks (if configured), weekly progress, daily checklist, quick-add buttons
3. Tapping a quick task logs it immediately, toast shows
4. Quick task shows as done after logging
5. Settings gear on Chores tab shows chore settings with quick task toggles
6. Settings gear does NOT show "Lists" on Chores tab
7. Bank tab renders kid cards, balance, transactions
8. Weekly progress card shows correct points and tier
9. Both mode works for quick tasks and checklist
10. Offline works (SW cache updated)
