# Task: Phase 14 — Chores Visual Overhaul

**Task Type:** standard
**Model Mode:** default

## Summary

The Chores tab works but needs major visual and UX improvements. This is a design-driven overhaul with specific layout changes requested by the user, plus a frontend polish pass.

## User Feedback

1. "Too many quick buttons" — reduce clutter, make quick tasks more selective
2. "Quick points should be at the top" — move +1/+2/+3/+4 above the checklist
3. "Both kids' goals should be shown until one is selected" — default to Both, show dual progress

---

## Phase 14a: Layout Restructure

### New Chores Tab Layout (top to bottom)

```
┌─────────────────────────────────────┐
│                                     │
│  ┌──── Alex ────┐ ┌── Louisa ──┐   │  ← Kid cards (BOTH shown by default)
│  │  14 / 22 pts │ │  8 / 12 pts│   │     Tapping one filters to that kid
│  │  ████████░░  │ │  ██████░░  │   │     Tapping again goes back to Both
│  │  $3 → $7     │ │  $2 → $4   │   │
│  └──────────────┘ └────────────┘   │
│                                     │
│  ┌─ Quick Points ─────────────────┐ │  ← +1/+2/+3/+4 (moved to top area)
│  │  [+1]  [+2]  [+3]  [+4]       │ │
│  └────────────────────────────────┘ │
│                                     │
│  Today's Chores                     │
│  ┌────────────────────────────────┐ │
│  │ ✓  Fed the dog (AM)      +1   │ │  ← Checklist (existing, polished)
│  │ ✓  Made bed               +1   │ │
│  │ ○  Brush teeth PM         +1   │ │
│  │ ○  Clean room             +2   │ │
│  └────────────────────────────────┘ │
│                                     │
│  8pts this week · $3.00 earned      │  ← Summary line
│                                     │
└─────────────────────────────────────┘
```

### Key Changes

**1. Replace kid picker buttons + weekly progress card with "Kid Progress Cards"**

Remove the current kid picker (`#quickPoints` with Alex/Louisa/Both buttons) and the separate weekly progress card. Replace with two tappable kid cards that serve BOTH purposes — showing progress AND selecting the active kid.

**Default state: Both selected.** Both cards are shown side by side, both visually "active." The checklist shows chores for both kids.

**When a kid card is tapped:** That kid is selected (card is highlighted, other card is dimmed). Checklist filters to that kid only. Tapping the active card again deselects it and returns to Both mode.

**Kid card content:**
- Kid name (Alex / Louisa)
- Points this week: `14 / 22 pts` (current / next tier min)
- Progress bar (colored: `--alex` blue, `--louisa` purple)
- Pay info: `$3 → $7` (current tier → next tier)
- At top tier: `$7 earned` + bonus teaser
- Card border/shadow uses the kid's color

**2. Move quick-add points to just below the kid cards**

The `+1/+2/+3/+4` buttons move from the bottom of the view to right below the kid cards. These are the primary action buttons parents use for ad-hoc points.

**3. Remove the "Quick Tasks" section entirely**

The separate quick tasks row added in Phase 13b is removed. The daily checklist already serves this purpose — tapping a chore logs it. The quick tasks row was redundant and cluttered.

**4. Keep the daily checklist and summary line at the bottom**

### HTML Structure Change

Replace the static `#quickPoints` div in the HTML:

**BEFORE** (line ~1972):
```html
<div class="view" id="viewChores">
  <div class="panel quick-points" id="quickPoints">
    <div class="qp-row">
      <button type="button" class="qp-kid alex active" data-qp-kid="alex">Alex</button>
      <button type="button" class="qp-kid louisa" data-qp-kid="louisa">Louisa</button>
      <button type="button" class="qp-kid both" data-qp-kid="both">Both</button>
    </div>
  </div>
  <section class="panel" id="choreProgress" aria-live="polite"></section>
  <section class="panel messages" id="messages" aria-live="polite" aria-label="Chat history"></section>
</div>
```

**AFTER:**
```html
<div class="view" id="viewChores">
  <div id="choreKidCards"></div>
  <div class="chore-quick-add" id="choreQuickAdd">
    <button type="button" class="qp-pts" data-qp-pts="1">+1</button>
    <button type="button" class="qp-pts" data-qp-pts="2">+2</button>
    <button type="button" class="qp-pts" data-qp-pts="3">+3</button>
    <button type="button" class="qp-pts" data-qp-pts="4">+4</button>
  </div>
  <section id="choreProgress" aria-live="polite"></section>
  <section class="panel messages" id="messages" aria-live="polite" aria-label="Chat history"></section>
</div>
```

The `#choreKidCards` div is populated dynamically by `renderChoreProgress()` with the kid progress cards. The quick-add buttons are static HTML (always visible).

### Kid Selection State

Replace the current `selectedChoreKids()` function which reads from the old `#quickPoints` buttons. Instead, maintain a module-level variable:

```javascript
var choreSelectedKid = 'both'; // 'alex', 'louisa', or 'both'
```

Tapping a kid card sets `choreSelectedKid` to that kid's ID. Tapping the same card again resets to `'both'`.

Update `selectedChoreKids()` to read from this variable:
```javascript
function selectedChoreKids() {
  if (choreSelectedKid === 'both') return ['alex', 'louisa'];
  return [choreSelectedKid];
}
```

**Important:** The quick-add `+1/+2/+3/+4` buttons must still work with the selected kid(s). The existing click handler reads `selectedChoreKids()` so it will automatically use the new selection state.

### Quick-Add Button Event Handling

The existing quick-add point click handlers are in the main app shell (Block 2) and look for `[data-qp-pts]` inside `#quickPoints`. Since we're moving the buttons outside `#quickPoints`, the handler needs updating.

Check the existing handler and update it to find buttons in `#choreQuickAdd` instead of (or in addition to) `#quickPoints`. The handler should still call `selectedChoreKids()` to determine which kid(s) to log for.

---

## Phase 14b: Kid Progress Card CSS

### New CSS

```css
.chore-kid-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 4px 0 8px;
}

.chore-kid-card {
  background: var(--panel);
  border-radius: 16px;
  padding: 14px;
  border: 2px solid var(--line);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.chore-kid-card:active {
  transform: scale(0.97);
}

.chore-kid-card.alex { border-color: rgba(74, 144, 217, 0.3); }
.chore-kid-card.louisa { border-color: rgba(138, 91, 209, 0.3); }

/* Selected state — bolder border + subtle background tint */
.chore-kid-card.selected.alex {
  border-color: var(--alex);
  background: rgba(74, 144, 217, 0.06);
  box-shadow: 0 4px 16px rgba(74, 144, 217, 0.15);
}

.chore-kid-card.selected.louisa {
  border-color: var(--louisa);
  background: rgba(138, 91, 209, 0.06);
  box-shadow: 0 4px 16px rgba(138, 91, 209, 0.15);
}

/* Dimmed state — when OTHER kid is selected */
.chore-kid-card.dimmed {
  opacity: 0.45;
  border-color: var(--line);
}

.chore-kid-card-name {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.chore-kid-card-pts {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.chore-kid-card-pay {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 600;
  margin-top: 2px;
}

.chore-kid-card .weekly-progress-bar-track {
  margin-top: 8px;
  height: 6px;
}

.chore-kid-card-bonus {
  font-size: 0.72rem;
  color: var(--muted);
  margin-top: 4px;
}
```

### Quick-Add Buttons Styling

```css
.chore-quick-add {
  display: flex;
  gap: 8px;
  padding: 4px 0 12px;
}

.chore-quick-add .qp-pts {
  flex: 1;
}
```

The `qp-pts` base styles already exist — this just makes them fill the row evenly.

---

## Phase 14c: Render Function Update

Update `renderChoreProgress()` to output the new layout:

```javascript
// 1. Build kid cards (always show both)
var kidCardMarkup = renderKidCards(phase, entries, week);

// 2. Build checklist (filtered by selected kid)
// ... existing checklist logic ...

// 3. Assemble
container.innerHTML = '<div class="chore-board">' +
  kidCardMarkup +
  '<div class="chore-section-label">Today\'s Chores</div>' +
  (checklistMarkup || emptyMessage) +
  '<div class="chore-summary">' + summary + '</div>' +
'</div>';
```

### `renderKidCards(phase, entries, week)` function

New function that builds two kid progress cards:

```javascript
function renderKidCards(phase, entries, week) {
  var kidIds = Object.keys(phase.currentConfig.kids || {});
  return '<div class="chore-kid-cards">' +
    kidIds.map(function (kidId) {
      var info = getWeeklyProgressInfo(phase, kidId, entries, week);
      var isSelected = choreSelectedKid === kidId;
      var isDimmed = choreSelectedKid !== 'both' && choreSelectedKid !== kidId;
      var cardClass = 'chore-kid-card ' + kidId +
        (isSelected ? ' selected' : '') +
        (isDimmed ? ' dimmed' : '');
      return '<button type="button" class="' + cardClass + '" data-chore-kid="' + kidId + '">' +
        '<div class="chore-kid-card-name">' + escapeHtml(info.kid.name || kidId) + '</div>' +
        '<div class="chore-kid-card-pts">' + escapeHtml(info.pointsLabel) + '</div>' +
        '<div class="chore-kid-card-pay">' + escapeHtml(info.payLabel) + '</div>' +
        '<div class="weekly-progress-bar-track"><div class="weekly-progress-bar-fill ' + kidId + '" style="width:' + info.progressPct + '%;"></div></div>' +
        (info.bonusLabel ? '<div class="chore-kid-card-bonus">' + escapeHtml(info.bonusLabel) + '</div>' : '') +
      '</button>';
    }).join('') +
  '</div>';
}
```

### Kid card click handler

Add a click handler for `[data-chore-kid]` buttons:

```javascript
document.addEventListener('click', function (event) {
  var kidCard = event.target.closest('[data-chore-kid]');
  if (kidCard) {
    var kidId = kidCard.dataset.choreKid;
    if (choreSelectedKid === kidId) {
      choreSelectedKid = 'both';  // Deselect → back to Both
    } else {
      choreSelectedKid = kidId;   // Select this kid
    }
    renderChoreProgress().catch(function (e) { console.error(e); });
    return;
  }
  // ... existing click handlers ...
});
```

---

## Phase 14d: Cleanup

1. **Remove the Quick Tasks section** — delete `renderQuickTasks()` function, the `quickTaskFlashId` variable, and the Quick Tasks CSS (`.quick-tasks`, `.quick-task-btn`, etc.)
2. **Remove `quickTask` field handling** from chore settings (the toggle added in Phase 13b)
3. **Remove the old `#quickPoints` kid picker** from the static HTML
4. **Remove the old `weekly-progress-card` wrapper** — progress is now inside the kid cards
5. **Remove the "Chores" header** (`chore-board-header`) — the tab bar already says "Chores"
6. **Bump `sw.js`** cache to `hub-v16`

### CSS to Remove

- `.quick-tasks`, `.quick-task-btn`, `.quick-task-label`, `.quick-task-pts`, `.quick-task-check`, `.quick-task-btn.flash`
- `.chore-board-header` (the "Chores" title + subtitle)
- `.weekly-progress-card` wrapper (progress bars move into kid cards)

### CSS to Keep

- `.chore-board`, `.chore-section-label`, `.chore-list`, `.chore-item`, `.chore-check`, `.chore-label`, `.chore-pts`, `.chore-note`, `.chore-summary`
- `.weekly-progress-bar-track`, `.weekly-progress-bar-fill` (reused inside kid cards)
- `.qp-pts` button styles
- `.weekly-bonus-teaser` renamed to `.chore-kid-card-bonus`

---

## Files Changed

| File | Phase | Changes |
|------|-------|---------|
| `index.html` | 14a-d | Layout restructure, kid cards, CSS, cleanup |
| `sw.js` | 14d | Bump cache to hub-v16 |

## What NOT to Change

- Bank tab — leave untouched
- Home tab — leave untouched
- Parser, voice, Firebase data model — untouched
- `chore.quickTask` field can stay in Firebase (harmless) — just remove the UI for setting it

## Validation Checklist

1. On load, Chores tab shows BOTH kid progress cards side by side
2. Both cards show current points, tier progress, pay info
3. Tapping Alex card → filters checklist to Alex only, Alex card highlighted, Louisa dimmed
4. Tapping Alex card again → back to Both mode, both cards active
5. Quick-add buttons (+1/+2/+3/+4) visible below kid cards
6. Quick-add logs for currently selected kid(s)
7. Daily checklist shows chores with SVG checkmarks
8. Tapping a chore logs it, toast confirms
9. Undo works on checked chores
10. Summary line shows correct weekly points and pay
11. No Quick Tasks section visible
12. No "Chores" header (tab bar handles this)
13. Settings gear on Chores tab still works
14. Bank tab still works
15. No console errors
