# Task: Chores Redesign + Unified Settings

## Summary

Two connected changes:

1. **Chores tab redesign** — add a visual chore tracker showing today's chores as a tappable checklist, replacing the generic progress bars with something parents actually use
2. **Unified settings** — move all gear icons out of individual tabs into the header, where one gear button opens context-aware settings based on the active tab

## Model Mode

default

---

## Phase 8a: Unified Header Settings

**Problem:** Each tab has its own gear icon + inline settings panel (Chores toolbar line ~1579, Bank toolbar line ~1617). This is inconsistent — Home and Fun and Lists have no gear. The gear buttons feel random and take up space in the tab content area.

**Fix:** One gear icon in the header (next to the existing link icon). When tapped, it opens settings relevant to the currently active tab.

### Header Changes

**File:** `index.html`

**Current header-actions (line ~1564):**
```html
<div class="header-actions">
  <button type="button" class="icon-btn" id="headerFamilyButton">&#128279;</button>
</div>
```

**New header-actions:**
```html
<div class="header-actions">
  <button type="button" class="icon-btn" id="headerSettingsButton" aria-label="Settings">&#9881;</button>
  <button type="button" class="icon-btn" id="headerFamilyButton" aria-label="Family info">&#128279;</button>
</div>
```

### Settings Panel Behavior

Add a `headerSettingsPanel` section (similar to `headerFamilyPanel`) that renders different content based on the current view:

| Active Tab | Settings Content |
|-----------|-----------------|
| **Home** | Family code, calendar URL (current family panel content) |
| **Chores** | Chore list editor (add/remove/edit points) — current `renderChoreSettings()` content |
| **Fun** | Nothing (or "No settings for Fun") |
| **Lists** | Nothing (or "No settings for Lists") |
| **Bank** | Pay tiers, bonus settings, history, transactions — current `renderBankSettings()` content |

### What to Remove

- Remove `choresSettingsToggle` button from Chores toolbar (line ~1581)
- Remove `bankSettingsToggle` button from Bank toolbar (line ~1619)
- Remove the `choresSettings` hidden panel from Chores view (line ~1598)
- Remove the `bankSettings` hidden panel from Bank view (line ~1622)
- Remove the per-tab toolbar `.chores-toolbar` panels entirely — the tab title is redundant since the tab bar already shows which tab you're on
- Keep the `renderChoreSettings()` and `renderBankSettings()` functions but rewire them to render into the new header settings panel

### Implementation

1. Add `headerSettingsPanel` div in the header section (after `headerFamilyPanel`)
2. Add `headerSettingsButton` click handler that toggles `appShellState.settingsPanelOpen`
3. Add `renderHeaderSettings()` function that checks `currentView` and calls the appropriate renderer
4. When switching tabs, if settings panel is open, re-render it for the new tab's context
5. Merge the family panel (link icon) into settings when on Home tab — or keep them separate if simpler

### Test
- Tap gear on Home → see family code + calendar URL settings
- Tap gear on Chores → see chore list editor
- Tap gear on Bank → see pay tiers, history, transactions
- Tap gear on Fun/Lists → see "no settings" or panel stays closed
- Switch tabs while settings open → content updates to match new tab

---

## Phase 8b: Chores Tab Redesign — Daily Tracker

**Problem:** The Chores tab has quick-point buttons and progress bars but no visual sense of "what chores need doing today" or "what's been done." Parents want to see today's chores as a checklist they can tap through.

**New Chores tab layout:**

```
┌──────────────────────────────┐
│  [Alex] [Louisa] [Both]     │  ← kid picker (keep)
├──────────────────────────────┤
│  Today's Chores              │
│  ☑ Fed the dog        +1    │  ← done (tappable to undo)
│  ☑ Made bed           +1    │
│  ☐ Brush teeth AM     +1    │  ← not done (tap to log)
│  ☐ Clean room         +2    │
│  ☐ Read 15 min        +2    │
├──────────────────────────────┤
│  Quick Add            [+1] [+2] [+3]  │  ← for ad-hoc points
├──────────────────────────────┤
│  This Week: 14pts · $3.50   │  ← compact summary line
└──────────────────────────────┘
```

### How It Works

1. **Chore checklist** — render all configured chores from `config.chores` as a tappable list
2. **Done state** — cross-reference today's log entries (from `getAllLogEntries()` filtered by today's date and selected kid) against the chore list. If a chore was logged today for this kid, show it checked
3. **Tap to log** — tapping an unchecked chore calls the existing `saveLogEntries()` to log it for the selected kid. Shows a toast confirmation
4. **Tap to undo** — tapping a checked chore prompts "Remove this entry?" and deletes the log entry
5. **Quick Add** stays — the `+1/+2/+3/+4` buttons remain for ad-hoc/free points (renamed "Quick Add")
6. **Weekly summary** — single compact line replacing the full progress cards: "14pts this week · $3.50 earned"
7. **Remove** the old `choreProgress` progress bar cards — the checklist IS the tracker now

### Chore Checklist Data Flow

```
Config chores (Firebase):     config/chores/{choreId} → { label, points, kids, keywords }
Today's log entries:          getAllLogEntries() → filter by date === today && kid === selectedKid
Match:                        for each chore, check if any log entry has matching choreId
Render:                       checked if matched, unchecked if not
```

### Visual Design

Follow the Home tab's clean aesthetic:
- No `.panel` wrapping around each section
- Checklist items: full-width rows with comfortable tap targets (48px+ height)
- Checked items: muted text, line-through, green checkmark
- Unchecked items: bold text, empty circle, point value on right
- Kid picker stays at top (existing `quickPoints` kid row)
- Quick add points row below the checklist (existing `+1/+2/+3/+4` buttons)
- Weekly summary: small muted text at bottom

### CSS Classes Needed

- `.chore-list` — container for the checklist
- `.chore-item` — individual row (48px min-height, flex, gap)
- `.chore-item.done` — checked state (muted, line-through)
- `.chore-check` — checkbox indicator (circle/checkmark)
- `.chore-label` — chore name
- `.chore-pts` — point value badge
- `.chore-summary` — weekly summary line

### What to Keep
- Kid picker buttons (Alex / Louisa / Both) — existing `#quickPoints` kid row
- Quick point buttons (+1/+2/+3/+4) — existing `qp-pts` buttons
- `renderChoreProgress()` logic for calculating weekly points/pay — reuse for the summary line
- All existing log entry and chore config infrastructure

### What to Remove from Chores View
- The `chores-toolbar` panel (title + gear icon) — title redundant, gear moved to header
- The `choreProgress` progress bar cards — replaced by checklist + summary line
- The `choresSettings` inline panel — moved to header settings
- The `messages` panel (chat history) — if still present and not used elsewhere

### Test
- Select Alex → see her configured chores as unchecked list
- Tap "Fed the dog" → logs entry, shows checked with green mark, toast confirms
- Tap checked item → prompts undo, removes log entry
- Tap +2 quick add → logs ad-hoc points, weekly summary updates
- Switch to Louisa → her chores shown, different check states
- Select Both → both kids' states shown (or logs for both)
- Weekly summary shows correct points and dollar amount
- Gear icon in header → chore settings (add/remove/edit chores)

---

## Phase Order

```
Phase 8a: Unified settings → must come first (removes per-tab toolbars)
Phase 8b: Chores redesign  → depends on 8a (no toolbar, settings in header)
```

## Files Changed

- `index.html` — both phases
- `sw.js` — bump cache version after Phase 8b

## Risks

1. **Settings rewiring** — the chore and bank settings render functions reference DOM elements by ID. Rewiring them to render into the header panel requires updating those references.
2. **Chore checklist matching** — matching log entries to configured chores requires robust ID matching. The existing `choreId` field in log entries should match `config.chores` keys.
3. **"Both" mode** — when "Both" is selected, the checklist needs to show combined state or log for both kids simultaneously. Follow existing `selectedChoreKids()` pattern.
4. **Chat messages removal** — verify `#messages` panel isn't used by other features before removing.
