# Task: Phase 10 — Chores Tab Redesign + Bonus Bug Fix

## Summary

Two connected changes:

1. **Bug fix** — Weekly bonus pay is never credited to kid balances. `maybeRunWeeklyPay()` only credits tier pay, ignoring bonus earnings. Alex earned enough points for a bonus but got $0 bonus in her balance.
2. **Chores redesign** — The chore tracking UI currently lives split between Chores (checklist) and Bank (points/earnings display). Consolidate all chore tracking into the Chores tab with a modern, cohesive design matching the recent header/tab bar redesign.

## Model Mode

default

---

## Phase 10a: Fix Weekly Bonus Payment Bug

**Problem:** `maybeRunWeeklyPay()` (line ~5537) calculates weekly pay via `calculateWeeklyPay()` which returns only the tier-based amount. The bonus calculation (`Math.floor(extraPoints / extraPts) * bonusAmount`) exists only in `renderCardView()` for display — it's never included in the actual payment credited to the balance.

**Root cause (line ~5556):**
```javascript
var amount = phase.calculateWeeklyPay((phase.currentConfig.kids[kidId] || {}).payTiers || [], weeklyPoints);
```
This returns tier pay only. Bonus is never added.

**Fix in `maybeRunWeeklyPay()`:**

After line 5556, add bonus calculation:
```javascript
var amount = phase.calculateWeeklyPay((phase.currentConfig.kids[kidId] || {}).payTiers || [], weeklyPoints);

// Add bonus pay for points above top tier
var kid = phase.currentConfig.kids[kidId] || {};
var tiers = (kid.payTiers || []).slice().sort(function(a, b) { return a.minPts - b.minPts; });
var topMinPts = tiers.length ? tiers[tiers.length - 1].minPts : 0;
var extraPoints = Math.max(0, weeklyPoints - topMinPts);
var wb = kid.weeklyBonus || { extraPts: 10, bonus: 2 };
var bonus = Math.floor(extraPoints / (wb.extraPts || 10)) * (wb.bonus || 2);
amount += bonus;
```

**Also update the payment note** to include bonus info when applicable:
```javascript
var note = 'Auto weekly pay for ' + previousWeek + (bonus > 0 ? ' (includes $' + bonus.toFixed(2) + ' bonus)' : '');
```

### Test
- Set Alex to have 35 points in a week (top tier is 22pts)
- Verify `maybeRunWeeklyPay` credits tier pay ($7) + bonus ($2 for 10+ extra pts) = $9 total
- Check payment note shows bonus info
- Verify balance updates correctly

---

## Phase 10b: Chores Tab Redesign

**Problem:** The Chores tab has a basic checklist and quick-add buttons, but no weekly progress visualization. Parents have to go to the Bank tab to see how many points each kid has earned and what they've earned in dollars. The chore tracking experience should be self-contained in the Chores tab.

### Design Spec

The design follows the existing app aesthetic: clean white cards with subtle shadows, `--alex` blue and `--louisa` purple color accents, SVG icons, and the same font/spacing system used in the header and Home tab redesigns.

#### Layout (top to bottom):

```
┌─────────────────────────────────────┐
│  [Alex]  [Louisa]  [Both]           │  ← kid picker (keep existing)
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ● Weekly Progress           │    │
│  │                             │    │
│  │  18 / 22 pts     $3 → $7   │    │ ← points toward next tier
│  │  ████████████░░░░  82%      │    │ ← progress bar (kid-colored)
│  │                             │    │
│  │  🔥 +$2 bonus at 32pts     │    │ ← bonus track teaser
│  └─────────────────────────────┘    │
│                                     │
│  Today's Chores                     │
│  ┌─────────────────────────────┐    │
│  │ ✓  Fed the dog (AM)    +1  │    │ ← done (muted, checkmark)
│  │ ✓  Made bed             +1  │    │
│  │ ○  Brush teeth PM       +1  │    │ ← not done (tap to log)
│  │ ○  Clean room           +2  │    │
│  │ ○  Read 15 min          +2  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Quick Add                          │
│  [+1]  [+2]  [+3]  [+4]            │ ← keep existing buttons
│                                     │
└─────────────────────────────────────┘
```

#### Weekly Progress Card

New component — a compact card showing this week's trajectory:

- **Points counter**: `{current} / {nextTierMin} pts` — shows progress toward the next pay tier
  - If already at top tier, show `{current} pts · Top tier reached!`
- **Dollar display**: `${currentTierPay} → ${nextTierPay}` — what they're earning now vs what's next
  - At top tier: `${tierPay} earned`
- **Progress bar**: Horizontal bar filled to `current / nextTierMin` percentage
  - Color: `var(--alex)` or `var(--louisa)` based on selected kid
  - Background: `var(--line)` or similar light neutral
  - Rounded ends (`border-radius: 999px`)
  - Height: ~8px
- **Bonus teaser** (only shows when at or above top tier):
  - "🔥 +$2 bonus at {topMinPts + extraPts}pts" — shows what they'll earn next
  - "🔥 $4 bonus earned!" if they've already passed a bonus threshold
- **When "Both" selected**: Show two mini progress rows, one per kid, stacked

**Data source**: Same as existing — `getAllLogEntries()` filtered by current ISO week + selected kid, summed for points. `calculateWeeklyPay()` for tier mapping. Kid config for tier thresholds and bonus settings.

#### Today's Chores Checklist

Keep existing `renderChoreProgress` logic but update the visual design:

**CSS classes:**

```css
.chore-progress-card {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.chore-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  min-height: 52px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}

.chore-item:last-child {
  border-bottom: 0;
}

.chore-item:active {
  background: var(--panel-alt);
}

.chore-item.done {
  opacity: 0.55;
}

.chore-item.done .chore-label {
  text-decoration: line-through;
}

.chore-check {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.chore-item.done .chore-check {
  background: #22c55e;
  border-color: #22c55e;
  color: #fff;
}

/* SVG checkmark icon inside .chore-check when done */

.chore-label {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
}

.chore-pts {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted);
  background: var(--panel-alt);
  padding: 2px 8px;
  border-radius: 999px;
}

.chore-item.done .chore-pts {
  color: #22c55e;
}
```

**Partial completion note**: When "Both" is selected and a chore is done by one kid but not the other, show "Done for Alex" in small muted text below the label (this logic already exists in `choreNote`).

#### Weekly Progress Card CSS

```css
.weekly-progress-card {
  background: var(--panel);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}

.weekly-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.weekly-progress-pts {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.weekly-progress-pay {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--muted);
}

.weekly-progress-bar-track {
  height: 8px;
  background: var(--line);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.weekly-progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.weekly-progress-bar-fill.alex { background: var(--alex); }
.weekly-progress-bar-fill.louisa { background: var(--louisa); }

.weekly-bonus-teaser {
  font-size: 0.82rem;
  color: var(--muted);
  font-weight: 500;
}
```

#### Section Headers

Use lightweight text labels (not card headers):

```css
.chore-section-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  padding: 16px 4px 6px;
}
```

### Rendering

Update `renderChoreProgress()` to output:

1. **Weekly Progress Card** — new, placed between kid picker and checklist
2. **"Today's Chores" label** — section header
3. **Chore checklist** — existing logic, new CSS
4. **"Quick Add" label** — section header
5. **Quick-add buttons** — keep existing `qp-pts` buttons

The weekly progress card needs to:
- Get current week's log entries for selected kid(s)
- Sum points
- Look up pay tiers to find current tier and next tier
- Calculate progress percentage toward next tier
- Calculate bonus if at/above top tier

### What to Keep
- Kid picker buttons (Alex / Louisa / Both) — `#quickPoints`
- Quick point buttons (+1/+2/+3/+4) — existing `qp-pts`
- `toggleChoreItem()` logic
- `saveLogEntries()` infrastructure
- `renderChoreSettings()` for the header settings panel
- Chat composer / voice input at bottom

### What NOT to Change
- Bank tab — leave `renderCardView` as-is (it still shows balance, payments, debts)
- Home tab — no changes
- Header — no changes

### Test
- Select Alex → weekly progress shows her points, current/next tier, progress bar in blue
- Select Louisa → same in purple
- Select Both → two stacked mini progress rows
- Tap unchecked chore → logs it, progress bar updates, points tick up
- Tap checked chore → undo prompt, progress bar adjusts down
- At top tier → bonus teaser shows next bonus threshold
- Past bonus threshold → shows bonus earned amount
- Quick add +2 → points update, progress bar moves

---

## Files Changed

- `index.html` — both phases (bug fix + UI)
- `sw.js` — bump cache version after Phase 10b

## Phase Order

```
Phase 10a: Bonus bug fix → small, standalone fix
Phase 10b: Chores redesign → depends on 10a being correct (progress card shows bonus info)
```

## Risks

1. **Weekly pay retroactivity** — The bonus fix only applies going forward. If Alex was already shorted a bonus for a past week, her balance won't auto-correct. Consider: should we add a one-time correction? (Ask user if needed.)
2. **Progress bar edge cases** — When a kid has 0 points, bar should show empty, not NaN%. When they exceed top tier, bar should show 100% + bonus teaser.
3. **"Both" mode layout** — Two progress rows need to stack cleanly without feeling cramped. Use compact variant with smaller text/bar when showing both.
