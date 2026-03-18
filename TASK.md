# Task: Phase 37 — Bug Fixes, Game Polish, UX Hardening

**Task Type:** bugfix + feature
**Model Mode:** default

## Summary

Phase 36 follow-up: two parser/wiring bugs (bank "owe" hijacked, list settings buttons dead), game UX improvements (player names, win celebration, Battleship overhaul, kid-friendly trivia), and UX hardening (swipe safety, Enter key, header padding, favorites consolidation). Ten parts (A-J).

---

## Part A: Bank Parser — "owe" Hijacked by `check_status`

**Problem:** Typing "i owe louisa 10" on the Bank tab shows a status query instead of recording a debt. The `routeIntent()` function (line ~4711) runs BEFORE `parseIntent()`. The `check_status` intent is registered at priority 50 with `routeView: 'global'`, and `isQuestion()` returns true because `"owe"` is in `QUESTION_WORDS` (line ~4417). So `routeIntent` returns `check_status` and `parseBankIntent` (which correctly handles `parent_owes_kid`) never runs.

**Root cause:** `"owe"` is both a question word ("how much do I owe") and an action verb ("I owe louisa 10"). The `check_status` intent in `routeIntent` doesn't distinguish between the two.

**Fix — two changes:**

### 1. Remove "owe" from QUESTION_WORDS (line ~4417)

```javascript
// BEFORE:
const QUESTION_WORDS = ['how', 'what', 'whats', "what's", 'status', 'score', 'balance', 'owe', 'doing', 'points'];

// AFTER:
const QUESTION_WORDS = ['how', 'what', 'whats', "what's", 'status', 'score', 'balance', 'doing', 'points'];
```

This is safe because:
- "how much do I owe" still matches via "how"
- "what do I owe" still matches via "what"
- Bare "owe" with an amount and a kid name should be a bank action, not a status query

### 2. Guard `check_status` in `routeIntent` against bank-actionable inputs

In the `check_status` registered intent (line ~4763-4767), add a guard so it doesn't fire when the input looks like a bank action (has a kid name + amount):

```javascript
registerIntent({
  id: 'check_status',
  priority: 50,
  patterns: (text, kids) => {
    // Don't hijack bank-actionable inputs that have a kid + amount
    if (kids.length && /\$?\s*\d+/.test(text) && /\b(owe|paid|spent|gave|earned)\b/.test(text)) {
      return null;
    }
    return isQuestion(text) ? { confidence: 0.8 } : null;
  }
});
```

**Why both changes:** Removing "owe" from QUESTION_WORDS fixes the immediate bug. The guard on `check_status` prevents similar future collisions where action verbs in a status-like sentence hijack bank parsing.

### 3. Also fix verb-less input without `$`

The Phase 36 spec required `$` for `bank_ambiguous`, but "i owe louisa 10" has no `$`. The `parent_owes_kid` pattern at line ~4994 already handles this correctly (no `$` required) — so once the `check_status` hijack is fixed, "i owe louisa 10" will correctly route to `parent_owes_kid`. No additional parser changes needed for this input.

**Test cases:**
- "i owe louisa 10" on Bank tab → `parent_owes_kid` (records $10 owed to Louisa)
- "i owe louisa $10" on Bank tab → `parent_owes_kid` (same)
- "how much do I owe" on Bank tab → `check_status` (still works via "how")
- "what's the score" on any tab → `check_status` (still works via "what's")
- "alex $2" on Bank tab → `bank_ambiguous` (Phase 36 feature still works)
- "alex spent $5" on Bank tab → `kid_spent` (existing pattern still works)

---

## Part B: List Settings Buttons — Event Delegation Fix

**Problem:** The "Delete list", "Save as template", and "Reset template" buttons render into `headerSettingsPanel` (line ~9068-9070), but the click handler for `[data-list-action]` is attached to `listsContent` (line ~8967). Since `headerSettingsPanel` is NOT a descendant of `listsContent`, clicks on these buttons have no event listener. The buttons appear but do nothing.

**Fix — add a click listener on `headerSettingsPanel` for list actions:**

In `window.renderListSettingsInHeader` (line ~9053), after rendering the HTML, attach a click handler to the panel:

```javascript
window.renderListSettingsInHeader = function renderListSettingsInHeader() {
  var panel = document.getElementById('headerSettingsPanel');
  if (!panel) return;
  var phase = runtime();
  if (!listState.currentListId || !phase) {
    panel.innerHTML = '<div class="settings-empty"><strong>Select a list</strong><p class="family-panel-note">Tap a list to see its settings here.</p></div>';
    return;
  }
  var list = listState.listsById[listState.currentListId];
  if (!list) {
    panel.innerHTML = '<div class="settings-empty"><strong>List not found.</strong></div>';
    return;
  }
  var listType = list.type || 'custom';
  var isTemplateType = ['grocery', 'costco', 'lakehouse', 'packing'].indexOf(listType) !== -1;
  panel.innerHTML = '<div class="settings-grid"><article class="stat-card"><h3 class="hub-section-head">' + escapeHtml(list.name) + ' Settings</h3>' +
    (isTemplateType ? '<div class="settings-list"><button type="button" class="btn btn-secondary" data-list-action="save-template" style="width:100%;margin-bottom:8px;">Save as template</button><button type="button" class="btn btn-secondary" data-list-action="reset-template" style="width:100%;margin-bottom:8px;">Reset template</button></div>' : '') +
    '<button type="button" class="btn btn-danger" data-list-action="delete-list" style="width:100%;">Delete list</button></article></div>';

  // Wire up button clicks — these buttons are in headerSettingsPanel, NOT listsContent
  panel.onclick = async function(event) {
    var target = event.target.closest('[data-list-action]');
    if (!target) return;
    var action = target.dataset.listAction;

    if (action === 'delete-list' && listState.currentListId) {
      var currentListForDelete = listState.listsById[listState.currentListId];
      if (!currentListForDelete) return;
      if (!await window.appConfirm('Delete list?', 'Delete ' + currentListForDelete.name + '? This can\'t be undone.', true)) return;
      deleteEntireList(listState.currentListId).catch(function(e) { console.error(e); });
      return;
    }
    if (action === 'save-template' && listState.currentListId) {
      var currentListForSave = listState.listsById[listState.currentListId];
      saveTemplateForList(currentListForSave).then(function() {
        if (phase && currentListForSave) {
          phase.showToast('Saved as template for ' + listTypeMeta(currentListForSave.type).label + '.');
        }
      }).catch(function(e) { console.error(e); });
      return;
    }
    if (action === 'reset-template' && listState.currentListId) {
      var currentList = listState.listsById[listState.currentListId];
      if (!currentList) return;
      if (!await window.appConfirm('Reset to default template?', 'This will replace all items in this list with the default template. Any custom items will be lost.', true)) return;
      resetTemplateForType(currentList.type).then(function(count) {
        if (phase) phase.showToast('Template reset - ' + count + ' items loaded.');
      }).catch(function(e) { console.error(e); });
      return;
    }
  };
};
```

**Key point:** The handler mirrors the existing logic from `listsContent`'s click handler (lines ~8982-9007) but is attached directly to the panel. Using `panel.onclick =` ensures it gets replaced each time the panel re-renders (no listener accumulation).

**After delete:** When a list is deleted, the header settings panel should close or update. `deleteEntireList` already clears `listState.currentListId` and re-renders — verify this also closes or updates the header panel.

---

## Part C: Customizable Game Player Names

**Problem:** Tic Tac Toe, Connect Four, and Battleship hardcode "Alex" and "Louisa" as player names via `kidLabelForMarker()` (line ~6545) and direct string references in render functions. Parents, friends, or guests can't play as themselves.

**Fix — add editable player names:**

### 1. Add state fields (line ~6119, in the `state` object)

```javascript
gamePlayers: { p1: 'Alex', p2: 'Louisa' },
```

Initialize from `currentConfig.kids` if available (in the init section, line ~6280):

```javascript
var kidIds = Object.keys((phase.currentConfig && phase.currentConfig.kids) || {});
if (kidIds.length >= 2) {
  state.gamePlayers = {
    p1: (phase.currentConfig.kids[kidIds[0]] || {}).name || 'Player 1',
    p2: (phase.currentConfig.kids[kidIds[1]] || {}).name || 'Player 2'
  };
} else {
  state.gamePlayers = { p1: 'Player 1', p2: 'Player 2' };
}
// Restore from localStorage if saved
var savedPlayers = localStorage.getItem('familyChores.gamePlayers');
if (savedPlayers) {
  try { state.gamePlayers = JSON.parse(savedPlayers); } catch(e) {}
}
```

### 2. Update `kidLabelForMarker()` (line ~6545)

```javascript
function kidLabelForMarker(marker) {
  return marker === 'X' || marker === 'red' || marker === 'alex'
    ? state.gamePlayers.p1 : state.gamePlayers.p2;
}
```

### 3. Add a name-entry row at the top of each game

Instead of a separate setup screen (too much friction), add an inline editable row at the top of each game's render output, above the status line:

```javascript
function renderPlayerNameBar() {
  return '<div class="game-player-names">' +
    '<label><input type="text" class="game-player-input p1" value="' + escapeBulletinHtml(state.gamePlayers.p1) + '" maxlength="12" data-player="p1"></label>' +
    '<span class="game-vs">vs</span>' +
    '<label><input type="text" class="game-player-input p2" value="' + escapeBulletinHtml(state.gamePlayers.p2) + '" maxlength="12" data-player="p2"></label>' +
  '</div>';
}
```

Insert `renderPlayerNameBar()` into `renderTTTActivity`, `renderConnectFourActivity`, and `renderBattleshipActivity` (idle/gameover screens), just inside the `fun-card` article, before the status div.

### 4. Handle name input changes

In the Fun tab's click/input handler, listen for changes on `.game-player-input`:

```javascript
container.addEventListener('input', function(event) {
  if (event.target.classList.contains('game-player-input')) {
    var player = event.target.dataset.player;
    var name = String(event.target.value || '').trim() || (player === 'p1' ? 'Player 1' : 'Player 2');
    state.gamePlayers[player] = name;
    localStorage.setItem('familyChores.gamePlayers', JSON.stringify(state.gamePlayers));
    // Update status text without full re-render
    var statusEl = container.querySelector('.ttt-status strong, .c4-status strong, .bs-status strong');
    if (statusEl) {
      // Let the next render pick it up — don't need instant update for status
    }
  }
});
```

Names update on the fly as users type. The scoreboard and status text update on the next render cycle (next move or new game).

### 5. Update all hardcoded name references

Replace direct "Alex"/"Louisa" strings in these render functions:
- **`renderTTTActivity`** (line ~7125): scoreboard `'Alex'` / `'Louisa'` → `state.gamePlayers.p1` / `state.gamePlayers.p2`
- **`renderConnectFourActivity`** (line ~7150): same scoreboard replacement
- **`renderBattleshipActivity`** (line ~7189, 7193-7195, 7199, 7204, 7207): all "Alex"/"Louisa" strings → use `kidLabelForMarker` or `state.gamePlayers`
- **CSS class usage** (`.alex` / `.louisa` on status text): change to `.p1` / `.p2` and add matching CSS, OR keep using the alex/louisa classes for color (since they map to --alex/--louisa vars)

**For CSS colors:** Keep using `.alex` and `.louisa` CSS classes for the color theming (blue for p1, purple for p2). Just change the text content, not the class names. This avoids needing new CSS.

### 6. Add minimal CSS

```css
.game-player-names {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}
.game-player-input {
  width: 80px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel-alt);
}
.game-player-input.p1 { color: var(--alex); }
.game-player-input.p2 { color: var(--louisa); }
.game-vs { color: var(--muted); font-size: 0.85rem; }
```

---

## Part D: Enter Key on Text Inputs

**Problem:** In Mad Libs, pressing Enter on the answer input (`#funMadLibAnswer`) does nothing useful — it doesn't submit the current blank and move to the next one. The user expects Enter to work like tapping the "Next" button, and for focus to stay on the input for the next blank.

**Root cause:** The `funMadLibAnswer` input has no `keydown` listener. It's not inside a `<form>`, so Enter doesn't trigger any submit behavior.

**Fix — add keydown Enter handler for Mad Libs:**

In the Fun tab's event delegation (near the existing `input` event listener, line ~7737), add a `keydown` listener:

```javascript
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && event.target.id === 'funMadLibAnswer') {
    event.preventDefault();
    var nextBtn = document.getElementById('funMadLibNextBtn');
    if (nextBtn) nextBtn.click();
    // After re-render, refocus the new input
    setTimeout(function() {
      var newInput = document.getElementById('funMadLibAnswer');
      if (newInput) newInput.focus();
    }, 50);
  }
});
```

**Also check:** The game player name inputs (Part C) should NOT submit on Enter — they should just blur or do nothing, since they update on input.

**Also check:** The list item input already handles Enter (line ~9021-9026) — verify it keeps focus after adding an item. If it doesn't refocus, add a similar `setTimeout` focus pattern.

---

## Part F: Game Win Celebration

**Problem:** When someone wins in Tic Tac Toe or Connect Four, it's not obvious. The winning cells get a faint green box-shadow (`.ttt-cell.win` / `.c4-cell.win`) that's barely visible. The status text says "Alex wins!" but uses the same small styling as the turn indicator. There's no visual fanfare — kids can't tell they won.

**Fix — make wins unmistakable:**

### 1. Bigger, bolder win status text

When there's a winner, the status div should be larger, use the winner's color prominently, and feel celebratory:

```css
.ttt-status.game-won,
.c4-status.game-won {
  font-size: 1.4rem;
  text-align: center;
  padding: 12px;
  border-radius: var(--radius-md);
  animation: win-pulse 0.6s ease-out;
}

@keyframes win-pulse {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

Add the `game-won` class conditionally in `renderTTTActivity` and `renderConnectFourActivity` when `state.tttWinner` / `state.c4Winner` is set (and not 'draw').

### 2. More visible winning cells

Replace the subtle box-shadow with something kids can see:

```css
.ttt-cell.win {
  background: rgba(34, 197, 94, 0.25);
  box-shadow: inset 0 0 0 3px #22c55e;
  animation: win-cell-pop 0.3s ease-out;
}

.c4-cell.win {
  box-shadow: 0 0 0 3px #22c55e;
  animation: win-cell-pop 0.3s ease-out;
}

@keyframes win-cell-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
```

### 3. Win text should include the player marker

For TTT, the status should say something like "X wins! 🎉" with the player name, not just "Alex wins!". This makes it clear WHICH marker won, since players may forget which letter they are:

```javascript
// In renderTTTActivity:
var status = state.tttWinner === 'draw'
  ? "It's a tie!"
  : state.tttWinner
    ? kidLabelForMarker(state.tttWinner) + ' (' + state.tttWinner + ') wins! 🎉'
    : kidLabelForMarker(state.tttTurn) + "'s turn (" + state.tttTurn + ")";
```

For Connect Four, use the color:
```javascript
var colorLabel = state.c4Winner === 'red' ? '🔴' : '🟡';
var winnerText = state.c4Winner === 'draw'
  ? 'Board full — draw!'
  : state.c4Winner
    ? kidLabelForMarker(state.c4Winner) + ' ' + colorLabel + ' wins! 🎉'
    : kidLabelForMarker(state.c4Turn) + "'s turn";
```

---

## Part E: Age-Appropriate Trivia Questions

**Problem:** The current `KID_TRIVIA` questions in `kid-fun-data.js` are too hard for a 4-7 year old. Examples: "What is the boiling point of water in Fahrenheit?", "What element does 'O' stand for on the periodic table?", "What is the largest desert on Earth?" (trick answer: Antarctica), "How many stomachs does a cow have?", "What is the smallest bone in the human body?". These are 3rd-5th grade difficulty — the target users are preschool through 1st grade.

**Fix — replace the entire `KID_TRIVIA` array in `kid-fun-data.js`:**

Write 50 new questions appropriate for ages 4-7. Guidelines:

- **Topics they know:** colors, shapes, counting to 20, animals they see (dogs, cats, farm animals, zoo favorites), food they eat, body parts, seasons, weather, family, their daily life
- **Phrasing:** Simple, short sentences. No jargon. Use "What color is..." not "Which chromatic classification..."
- **Choices:** 3-4 options, all plausible to a kid, no trick answers. Wrong answers should be silly/fun, not confusing
- **Difficulty curve:** Mix easy (age 4: "What sound does a cow make?") with slightly harder (age 7: "How many days in a week?")
- **No:** periodic table, geography trivia, boiling points, technical vocabulary, anything requiring reading above 1st grade level

**Example good questions:**
```javascript
{ question: "What sound does a cow make?", choices: ["Woof", "Moo", "Meow", "Baa"], answer: 1 },
{ question: "What color is a banana?", choices: ["Red", "Blue", "Yellow", "Green"], answer: 2 },
{ question: "How many fingers do you have?", choices: ["5", "8", "10", "12"], answer: 2 },
{ question: "Which animal says 'woof'?", choices: ["Cat", "Bird", "Dog", "Fish"], answer: 2 },
{ question: "What shape is a ball?", choices: ["Square", "Triangle", "Circle", "Star"], answer: 2 },
{ question: "What do you use to smell?", choices: ["Ears", "Eyes", "Nose", "Mouth"], answer: 2 },
{ question: "How many legs does a dog have?", choices: ["2", "4", "6", "8"], answer: 1 },
{ question: "What season do leaves fall?", choices: ["Spring", "Summer", "Fall", "Winter"], answer: 2 },
```

**Keep the same array structure** (`question`, `choices`, `answer` index). Just replace all 50 entries.

---

## Part I: Swipe-to-Delete — Raise Threshold & Add Friction

**Problem:** Swipe-to-delete triggers too easily. The threshold is 80px (line ~8872), which is about 22% of a phone screen. Combined with instant deletion (no confirmation), it's scary on long lists like groceries. Users can accidentally delete items with a casual sideways scroll.

**Fix — three changes to make swipes more deliberate:**

### 1. Raise the swipe-delete threshold from 80px to 130px

```javascript
// Line ~8872: change -80 to -130
} else if (diffX <= -130) {
// Line ~8878: change 80 to 130
} else if (diffX >= 130) {
```

130px is about 36% of a 360px phone screen — enough to be clearly intentional.

### 2. Two-stage swipe: reveal, then commit

Instead of the item flying off when it crosses the threshold, switch to a **reveal pattern** like iOS Mail:

- **Stage 1 (0-80px):** Item follows finger, background reveals action label ("Delete" on left, "Done ✓" on right). Item stops tracking at 130px.
- **Stage 2 (release past 130px):** Action fires. Release between 0-130px snaps back.

The background action labels are already partially there via `.swiping-left` / `.swiping-right` classes. Make sure the delete/check labels are visible and large enough to read during the swipe.

### 3. Haptic-style visual snap at threshold

When the swipe crosses the commit threshold, add a visual "click" — a brief scale bump or color change on the action label — so the user knows they've crossed the point of no return:

```css
.swipe-wrapper.swipe-committed .swipe-action-left {
  background: #dc2626;  /* brighter red */
  font-weight: 700;
}
```

Add the `swipe-committed` class in the touchmove handler when `|diff| > 130`.

### 4. Keep the undo toast

The existing undo toast on delete is good — keep it. But make sure it's prominent enough (not a tiny fading toast). The toast should persist for at least 4 seconds with a clear "Undo" button.

**Also:** The max translateX clamp (currently `Math.max(-120, Math.min(120, diff))` at line 8836) should increase to match the new threshold — change to `Math.max(-160, Math.min(160, diff))` so the item can visually reach the commit point.

---

## Part G: Remove Favorites Tile from Fun Home

**Problem:** Starred jokes have their own tile on the Fun home grid ("Favorites ⭐"), but there's already a toggle inside the Jokes activity (`funStarToggle` button, line ~7250) that filters to starred only. The separate tile wastes grid space and fragments the experience — users should just use the filter inside Jokes.

**Fix:**

Remove the conditional Favorites tile from `renderFunHome()` (lines ~7224-7231):

```javascript
// DELETE this block:
if (state.starredJokes.length) {
  tiles.push({
    id: 'favorites',
    icon: '⭐',
    label: 'Favorites',
    ...
  });
}
```

Also remove the `favorites` case in `openFunActivity()` (line ~6431-6433) that sets `jokeShowStarred = true`. The Jokes activity's internal toggle handles this.

**Keep:** The star count subtitle on the Jokes tile (`'★ ' + state.starredJokes.length + ' saved'`) — that's a nice indicator. Keep the `funStarToggle` button inside the Jokes view. Keep all starring/unstarring logic.

---

## Part H: Battleship UX Overhaul

**Problem:** Battleship is nearly unusable on mobile. The setup is tedious (5 ships × 2 players = 10 placement rounds), there's no preview of where ships will land, placed ships can't be moved, the 8x8 grid cells are tiny, and "Orientation: horizontal" is jargon for kids. The user would rather scrap it than keep it broken.

**Fix — make setup fast and gameplay clearer:**

### 1. Add "Randomize" button for auto-placement

Add a one-tap "Randomize" button that places all remaining ships randomly. This is the primary setup method — manual placement becomes optional for people who want control.

```javascript
function randomizeBSShips(player) {
  // Clear any already-placed ships
  state.bsBoards[player].ships = [];
  state.bsShipIndex = 0;

  for (var i = 0; i < BATTLESHIP_SHIPS.length; i++) {
    var ship = BATTLESHIP_SHIPS[i];
    var placed = false;
    var attempts = 0;
    while (!placed && attempts < 200) {
      state.bsShipIndex = i;
      state.bsOrientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      var row = Math.floor(Math.random() * 8);
      var col = Math.floor(Math.random() * 8);
      if (canPlaceBSShip(player, row, col)) {
        state.bsBoards[player].ships.push({
          name: ship.name,
          size: ship.size,
          cells: shipCells(row, col, ship.size, state.bsOrientation),
          sunk: false
        });
        placed = true;
      }
      attempts++;
    }
  }
  state.bsShipIndex = BATTLESHIP_SHIPS.length;
}
```

Show the randomized board and let the player "Shuffle" or "Accept":

```javascript
// In setup render, when all ships placed (or after randomize):
'<div class="fun-actions">' +
  '<button type="button" class="fun-btn" id="funBSAcceptBtn">Accept</button>' +
  '<button type="button" class="fun-btn secondary" id="funBSShuffleBtn">Shuffle</button>' +
'</div>'
```

### 2. Reduce to 4 ships

Remove the "Boat" (size 1) — it's a random needle in a haystack and extends the game unnecessarily:

```javascript
var BATTLESHIP_SHIPS = [
  { name: 'Carrier', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Destroyer', size: 2 },
  { name: 'Sub', size: 2 }
];
```

### 3. Undo last ship during manual placement

Add an "Undo" button visible during setup that removes the last placed ship:

```javascript
function undoLastBSShip() {
  var player = currentBSPlayer();
  if (state.bsBoards[player].ships.length > 0) {
    state.bsBoards[player].ships.pop();
    state.bsShipIndex = Math.max(0, state.bsShipIndex - 1);
  }
}
```

### 4. Replace "Orientation: horizontal" with icons

Instead of text, show a visual toggle:
```javascript
'<button type="button" class="fun-btn secondary" id="funBSRotateBtn">' +
  (state.bsOrientation === 'horizontal' ? '⟷ Across' : '⟵⟶ Down') +
'</button>'
```

Or just use "↔ Across" / "↕ Down".

### 5. Add row/column labels

Add "A-H" on rows and "1-8" on columns to the grid so players can communicate ("Try B4"):

```javascript
// Add a header row with column numbers
'<div class="bs-grid-wrapper">' +
  '<div class="bs-col-labels"><span></span>' +
  Array(8).fill(0).map(function(_, i) { return '<span>' + (i + 1) + '</span>'; }).join('') +
  '</div>' +
  // Each row gets a label
  rows.map(function(row, i) {
    return '<span class="bs-row-label">' + String.fromCharCode(65 + i) + '</span>' + row;
  }) +
'</div>'
```

### 6. Ship preview on touch

During setup, highlight the cells where the current ship WOULD be placed when the user touches/hovers a cell. Use a CSS class like `.bs-cell.preview`:

```css
.bs-cell.preview {
  background: rgba(74, 144, 217, 0.3);
  border-color: var(--alex);
}
.bs-cell.preview-invalid {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}
```

This requires a `touchstart`/`mouseover` handler during setup that calculates `shipCells()` for the hovered position and adds preview classes, then places on `click`/`touchend`.

---

## Part J: Header Top Padding

**Problem:** The header has visible dead space above the banner. `.header` has `padding-top: calc(8px + env(safe-area-inset-top))` (line ~146) and `.header-main` adds another `padding: 16px 20px 14px` (line ~159). On devices without a notch, that's 24px of empty space above "Family Hub".

**Fix:** Reduce the base padding. The `env(safe-area-inset-top)` is necessary for iPhone notch/dynamic island, but the extra 8px base is unnecessary. And `.header-main`'s 16px top padding can be reduced:

```css
.header {
  padding-top: env(safe-area-inset-top);  /* was calc(8px + env(...)) */
}

.header-main {
  padding: 10px 20px 10px;  /* was 16px 20px 14px */
}
```

This keeps notch safety on iPhones while removing the dead space on Android. The header will feel tighter and more connected to the content.

---

## Files Changed

| File | Changes |
|------|---------|
| `index.html` | Part A: Remove "owe" from QUESTION_WORDS, guard check_status against bank inputs |
| `index.html` | Part B: Wire click handlers on headerSettingsPanel for list action buttons |
| `index.html` | Part C: Add gamePlayers state, renderPlayerNameBar(), update game renders |
| `index.html` | Part D: Enter key handler for Mad Libs input, refocus after submit |
| `index.html` | Part F: Win celebration CSS, status text with marker/color, game-won class |
| `index.html` | Part I: Raise swipe threshold to 130px, add committed visual state |
| `index.html` | Part G: Remove Favorites tile from Fun home grid |
| `index.html` | Part H: Battleship UX — randomize, undo, reduce ships, labels, preview |
| `index.html` | Part J: Reduce header top padding |
| `kid-fun-data.js` | Part E: Replace KID_TRIVIA with age-appropriate questions (ages 4-7) |
| `sw.js` | Bump cache version |

## What NOT to Change

- `parseBankIntent` patterns — the owe/debt patterns already work correctly; the fix is in `routeIntent`
- Game logic (win detection, board state) — leave untouched
- List rendering or list data model — only the settings button wiring
- Tab routing — leave untouched

## Validation Checklist

### Bank Parser (Part A)
1. "i owe louisa 10" on Bank tab → records $10 owed to Louisa (not a status query)
2. "i owe louisa $10" on Bank tab → same result
3. "how much do I owe" on any tab → shows status (still works)
4. "what's louisa's balance" on any tab → shows status (still works)
5. "alex $2" on Bank tab → bank_ambiguous prompt (Phase 36 still works)
6. "alex spent $5" on Bank tab → kid_spent (existing pattern intact)
7. "louisa earned $3" on Bank tab → record_payment (existing pattern intact)

### List Settings (Part B)
8. Header gear on Lists tab → "Delete list" button works (shows confirmation, deletes list)
9. Header gear on Lists tab → "Save as template" button works (for template-type lists)
10. Header gear on Lists tab → "Reset template" button works (shows confirmation, resets items)
11. After deleting a list, header panel updates appropriately

### Game Names (Part C)
12. Opening TTT/C4/Battleship shows name inputs pre-filled with kid names
13. Editing a name updates the scoreboard on next move/new game
14. Names persist after navigating away and back (localStorage)
15. Battleship handoff screens use the edited names
16. Empty name input falls back to "Player 1"/"Player 2"

### Enter Key (Part D)
17. Pressing Enter on Mad Libs answer input submits the current blank and advances to next
18. Focus stays on (or returns to) the input after advancing
19. Pressing Enter on the last blank finishes the story
20. List item input keeps focus after Enter-to-add (verify existing behavior)

### Win Celebration (Part F)
21. TTT win → status text is large, animated, includes marker letter (e.g., "Alex (X) wins! 🎉")
22. C4 win → status text includes color emoji (e.g., "Alex 🔴 wins! 🎉")
23. Winning cells in TTT have a visible green border and pop animation
24. Winning cells in C4 have a visible green border and pop animation
25. Draw state doesn't show celebration styling

### Favorites Tile (Part G)
26. Fun home grid does NOT have a "Favorites" tile
27. Jokes tile still shows "★ N saved" subtitle when starred jokes exist
28. Star toggle inside Jokes activity still works

### Battleship UX (Part H)
29. "Randomize" button places all ships in valid positions with one tap
30. "Shuffle" re-randomizes the board
31. "Undo" during manual placement removes the last placed ship
32. Ship count reduced to 4 (no size-1 Boat)
33. Row labels (A-H) and column labels (1-8) visible on grid
34. Rotate button says "↔ Across" / "↕ Down" instead of "Orientation: horizontal"
35. Ship preview highlights cells before committing placement

### Swipe Safety (Part I)
36. Swiping 80px on a list item does NOT delete — snaps back
37. Swiping 130px+ on a list item triggers the delete
38. Visual "committed" feedback visible when crossing threshold
39. Undo toast shows for at least 4 seconds with clear Undo button
40. Swipe-right to check off also uses the higher threshold

### Header Padding (Part J)
41. No visible dead space above the header banner on Android
42. iPhone notch/dynamic island still has safe area padding
43. Header feels tight — brand text close to the top edge

### Trivia (Part E)
44. All 50 trivia questions are understandable by a 4-7 year old
45. No questions require knowledge of: periodic table, boiling points, geography tricks, technical vocabulary
46. Questions cover familiar topics: colors, shapes, animals, food, body parts, counting, seasons
47. Choices are plausible and not tricky — wrong answers are clearly wrong to the target age

---

## Test Focus (for Gemini)

### Bank parser
- Trace `routeIntent("i owe louisa 10", "bank")` — must NOT return `check_status`
- Verify "owe" is NOT in `QUESTION_WORDS`
- Verify `check_status` pattern function returns null when input has kid + amount + action verb
- `parseBankIntent("i owe louisa 10", "i owe louisa 10", ["louisa"])` → returns `parent_owes_kid` with amount 10
- `isQuestion("how much do i owe")` → still true (via "how")

### List settings wiring
- Verify `renderListSettingsInHeader` attaches a click handler to `headerSettingsPanel`
- Verify the handler calls `deleteEntireList` / `saveTemplateForList` / `resetTemplateForType`
- Verify handler uses `appConfirm` for destructive actions

### Game player names
- Verify `state.gamePlayers` exists with p1/p2 fields
- Verify `kidLabelForMarker` reads from `state.gamePlayers`
- Verify `renderPlayerNameBar()` is called in TTT, C4, and Battleship render functions
- Verify no hardcoded "Alex"/"Louisa" strings remain in game render output (except CSS class names)
- Verify localStorage read/write for `familyChores.gamePlayers`

### Enter key
- Verify `keydown` listener exists for `funMadLibAnswer` that triggers `funMadLibNextBtn.click()`
- Verify `preventDefault()` is called (so Enter doesn't cause page behavior)
- Verify the input is refocused after the re-render (setTimeout pattern)
- Verify list item input retains focus after Enter-to-add

### Win celebration
- Verify `.ttt-status.game-won` and `.c4-status.game-won` CSS rules exist with animation
- Verify `win-pulse` keyframe animation is defined
- Verify `win-cell-pop` keyframe animation is defined
- Verify `.ttt-cell.win` has a visible border (not just faint box-shadow)
- Verify TTT win status includes the marker letter (X or O)
- Verify C4 win status includes color emoji (🔴 or 🟡)
- Verify `game-won` class is conditionally added only when there's a winner (not draw)

### Header padding
- Verify `.header` padding-top uses `env(safe-area-inset-top)` without extra base padding
- Verify `.header-main` top padding is reduced (≤12px)

### Swipe safety
- Verify swipe delete threshold is 130px (not 80px) in touchend handler
- Verify swipe check-off threshold is also 130px
- Verify translateX clamp is at least 160px (not 120px)
- Verify `swipe-committed` class (or equivalent) is added at threshold crossing
- Verify undo toast duration is >= 4 seconds

### Favorites tile
- Verify `renderFunHome` does NOT push a tile with `id: 'favorites'`
- Verify `funStarToggle` button still exists inside Jokes render

### Battleship UX
- Verify `BATTLESHIP_SHIPS` has 4 entries (no size-1 Boat)
- Verify `randomizeBSShips` (or equivalent) function exists and places all ships
- Verify setup UI has "Randomize"/"Shuffle" and "Accept" buttons
- Verify "Undo" button exists during manual setup and calls a function that pops the last ship
- Verify grid has row (A-H) and column (1-8) labels
- Verify rotate button text is user-friendly (not "horizontal"/"vertical")
- Verify `.bs-cell.preview` CSS class exists for ship preview

### Trivia
- Verify `KID_TRIVIA` has ~50 entries in `kid-fun-data.js`
- Spot-check 10 random questions — would a 5 year old understand the question and recognize the correct answer?
- Verify no questions reference: periodic table, boiling points, deserts-as-trick-answers, bone names, technical terms
- Verify array structure unchanged (`question`, `choices`, `answer` index)
