# Family Hub - Implementation Plans

---

# CURRENT TASK: Family Hub Redesign (March 2026)

## Context

The Family Hub PWA started as a chore tracker and has evolved into a multi-tool home management app (Chores, Lists, Bank). The current UI has two problems: (1) a monolithic Settings tab that mixes concerns from every tool, and (2) the voice/text input is trapped inside the Chores tab even though commands like "add milk to costco list" should work from anywhere. This redesign fixes both, adds a Bulletin board as the new home screen, and integrates Google Calendar events for the kids.

All changes happen in `index.html` (single-file PWA). No build tools. Firebase backend. Hosted on GitHub Pages. Primary devices: Android phone + iPhone.

---

## New Tab Bar (4 tabs, always visible)

```text
+--------------------------------------+
|  Family Hub                   [link] |
+--------------------------------------+
|                                      |
|   (active view content)              |
|                                      |
+--------------------------------------+
| [Type or speak...]      [Send] [Mic] |
+--------------------------------------+
| Home   Chores   Fun   Lists   Bank   |
+--------------------------------------+
```

- Bulletin (home) is the new default landing tab — family notes + calendar.
- Chores keeps chore logging, quick points, and weekly progress.
- Fun is the kids' space — jokes and mad libs.
- Lists keeps the shared lists module.
- Bank keeps kid cards, pay, balances, and debt flows.
- Settings is removed only after its replacements are live.

---

## Phase 1: Fix Tab Bar + Add Bulletin Shell

Goal: fixed bottom nav, Bulletin placeholder, and no loss of access to existing settings.

Important rollout rule: do not strand chore/pay/history management during the phased rollout. Until Phases 4-6 land, keep the existing settings surface reachable via either the current Settings tab or a temporary non-tab entry point such as a header button or `#settings` route. The final 4-tab UI is the end state, not the requirement for the first isolated deploy.

### Changes

CSS (~lines 162-172): change `.tab-bar` from `position: sticky` to `position: fixed; bottom: 0; left: 0; right: 0; max-width: 720px; margin: 0 auto; z-index: 100;`. Remove bottom corner radius. Add `padding-bottom: 72px` to `.app` to account for fixed bar height.

HTML (~lines 840-857): add Bulletin as the first primary tab with a house icon. Add Bulletin view div (`id="viewBulletin"`) before `viewChores`. Keep Settings reachable during this phase, even if it is no longer part of the final tab bar design.

JS (~lines 1149-1213): update `views` to add `bulletin`. Change the default view from `chores` to `bulletin` in `switchView()` fallback, hashchange handling, and initial load. Add a Bulletin render trigger in `switchView()`. Do not remove the `settings` route or render trigger until the replacement settings UIs are live.

### Test

- Tab bar stays fixed while scrolling long content.
- Bulletin, Chores, Lists, and Bank navigate correctly, and Settings remains reachable during the transition.
- App opens to Bulletin (empty placeholder).
- Hash routing works for `#bulletin`, `#chores`, `#lists`, `#bank`, and transitional `#settings`.
- No JS errors.

---

## Phase 2: Universal Input Bar

Goal: move the composer from Chores-only to a persistent bar above the tab bar that works on every view. Redesign the intent parser as an extensible router without dropping any live commands.

### HTML Changes

Move the composer form (`#composer`, around line 807) out of `viewChores` and place it between the views and the tab bar as a sibling of the view divs, just above `<nav class="tab-bar">`. This makes it visible on all tabs.

Remove the composer from inside `viewChores`. Keep the quick-points panel in Chores.

### CSS Changes

Make the composer fixed above the tab bar:

```css
.composer {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  max-width: 720px;
  margin: 0 auto;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--line);
}
```

Increase `.app` bottom padding to about 128px (composer + tab bar).

### JS Changes - Intent Router Architecture

Replace the monolithic `parseIntent()` with an extensible intent router:

```js
var intentRegistry = [];

function registerIntent(config) {
  intentRegistry.push(config);
  intentRegistry.sort(function (a, b) {
    return (b.priority || 0) - (a.priority || 0);
  });
}

function routeIntent(text) {
  var normalized = normalize(text);
  var kids = extractKids(normalized);

  for (var i = 0; i < intentRegistry.length; i++) {
    var intent = intentRegistry[i];
    var match = intent.patterns(normalized, kids);
    if (match && match.confidence > 0.5) {
      return { intent: intent, match: match, kids: kids };
    }
  }

  return null;
}
```

Each tool registers its intents at startup.

Chore/runtime intents migrated from the live parser:
- `log-chore`
- `free-points`
- `adhoc-chore`
- `change-points`
- `check-status`
- `undo`
- `confirm-yes`
- `confirm-no`
- `confirm-chore`
- `missing-kid`

Bank intents migrated from the live parser:
- `record-payment`
- `kid-spent`
- `parent-owes-kid`
- `kid-owes-parent`
- `record-debt`
- `settle-debt`

List intents:
- `add-to-list`
- `check-off-list`
- `create-list`

Bulletin intents:
- `add-note`
- `remove-note`

Parser design principles:
- Higher priority intents are checked first, including undo and confirmation responses.
- Kid name extraction is shared across all intents.
- Each intent's `patterns()` returns `{ confidence, ...extractedData }` or `null`.
- Each intent's `execute()` performs the Firebase writes and returns a user-facing result.
- Shared normalization should map to the current `normalizeText()` and `extractKidIds()` behavior unless intentionally changed.
- `pendingAction`, duplicate detection, and yes/no follow-up behavior remain first-class after the router migration.

### Gemini Fallback Decision

The live app currently has an optional Gemini parser fallback behind feature flags. Phase 2 must make this explicit:
- Either remove `askGemini()` and its config flags as part of the router migration.
- Or keep Gemini as an optional low-confidence fallback behind `routeIntent()`.

Do not describe the parser as rule-based only unless the Gemini path is actually removed from `index.html`.

### Composer Behavior

The composer submit handler calls `routeIntent(text)`:
- If a match is found, execute it and show a toast/snackbar at the top of the current view.
- If no match or low confidence, show a toast with "I didn't catch that. Try again?"
- If medium confidence, preserve the current confirmation flow with toast actions or equivalent yes/no affordances.
- Speech input works the same way: final transcript goes to `routeIntent()`.

### Toast/Feedback System

Replace chat-style message bubbles with a toast notification system since the input is now global.

```text
+------------------------------+
| OK Alex - Feed dog (AM) +1pt |
|                       [Undo] |
+------------------------------+
```

Toasts should use kid accent colors, include an Undo affordance, and stack if multiple commands are given quickly.

### Test

- Input bar visible on all 4 tabs.
- "Alex fed the dog" works from Bulletin tab and logs to Firebase.
- "add milk to costco list" works from Chores tab and adds to the list.
- Speech input works from any tab.
- Quick points still works on Chores.
- No regressions in chore, confirmation, payment, spend, debt, and parent-owes flows.

---

## Phase 3: Bulletin View + Notes

Goal: build the Bulletin as the home dashboard with pinnable family notes.

### Firebase Data Model

New path: `families/{familyId}/bulletin/notes/{noteId}`

```json
{
  "text": "Picture day Tuesday!",
  "timestamp": 1710500000000,
  "color": "neutral"
}
```

`color` is optional: `alex`, `louisa`, or `neutral`.

### HTML

```html
<div class="view active" id="viewBulletin">
  <div id="bulletinContent" class="view-content"></div>
</div>
```

### Rendering

`renderBulletin()` fetches notes from Firebase and renders:

1. Notes section as colored post-it cards in a grid.
   - Each note has text, timestamp, and delete button.
   - Add note button opens a simple inline form, or use the universal input.
   - Notes sort newest first.
   - Limit display to about 10 notes, with a Show older link.

2. Calendar section placeholder for Phase 7.

### Test

- Bulletin renders on app open.
- Can add notes via universal input.
- Can add notes via a button in Bulletin view.
- Notes persist across reloads.
- Can delete notes.
- Notes display in a responsive grid.

---

## Phase 3b: Kid Fun — Own Tab

Goal: Kid Fun gets its own tab in the bottom nav bar (5 tabs total). This gives the kids a dedicated space and keeps the Bulletin focused on family notes and calendar.

**IMPORTANT — Codex migration note:** Kid Fun was initially built as a section inside the Bulletin view. It needs to be extracted into its own view (`viewFun`) with its own tab. The joke/mad lib data arrays and rendering logic stay the same — just move the container and rendering from the Bulletin IIFE into a new Fun view and IIFE.

### Tab Bar Update (5 tabs)

```text
+--------------------------------------+
| Home   Chores   Fun   Lists   Bank   |
+--------------------------------------+
```

- Add a **Fun** tab (star icon &#9733; or game controller &#127918;) as the middle tab
- Add `<div class="view" id="viewFun"><div id="funContent" class="view-content"></div></div>` to HTML
- Add `fun: document.getElementById('viewFun')` to the `views` object
- Add `renderFun()` trigger in `switchView()` when `name === 'fun'`
- Remove the Kid Fun section from `renderBulletin()` output
- Tab label font may need to shrink slightly for 5 tabs on narrow phones (test at 320px width)

### Architecture

Kid Fun lives in its own view, rendered when the Fun tab is selected. No Firebase needed — jokes and mad lib templates are embedded as JS arrays in the code. State (current joke index, in-progress mad lib) uses `localStorage` only.

### Jokes Module

A large array of 250 kid-appropriate jokes (ages 4-7) in `kid-fun-data.js`. Each joke is a `{ setup, punchline }` object.

**IMPORTANT design changes from the current implementation:**
- **Random, not sequential.** "Next Joke" picks a random joke from the array. Do NOT cycle sequentially. Use `Math.floor(Math.random() * KID_JOKES.length)` to pick the next index.
- **Designed for verbal delivery.** These jokes are meant to be **read aloud by a parent or older sibling** to a 4-year-old who can't read yet. The setup/punchline format works perfectly for this — parent reads the setup, kid says "what?", parent delivers the punchline. The UI should NOT require reading comprehension to enjoy.
- **250 jokes.** Replace the current 100-joke array with the 250-joke array from `kid-fun-data.js`.
- **No "X of Y" counter.** Remove the "Joke 5 of 100" label — it's meaningless with random order and makes kids feel like they're running out.

```text
+-------------------------------+
|  Kid Fun                      |
+-------------------------------+
|  Why did the teddy bear say   |
|  no to dessert?               |
|                               |
|  [Tap to reveal!]             |
|                               |
|  [Next Joke]                  |
+-------------------------------+
```

When "Tap to reveal" is pressed, show punchline with a fun animation (scale bounce). "Next Joke" advances the index and hides the punchline again.

### Mad Libs Module

An array of ~50 kid-friendly Mad Libs templates. Each template has:
- `title` — name of the story (e.g., "The Silly Zoo Trip")
- `blanks` — ordered array of `{ label, hint }` where `label` is the part of speech ("noun", "adjective", "animal", "color", "name", "number", "verb", "food", "place") and `hint` is a kid-friendly example
- `story` — the template string with `{0}`, `{1}`, etc. placeholders

**Age-appropriate design:**
- For Louisa (age 4): the labels show simple words and pictures. "A color" with a hint like "red, blue, green". She can dictate answers or a parent types.
- For Alex (age 7): the labels teach parts of speech. "An adjective (a describing word)" with a hint like "silly, tall, sparkly". This is educational — he learns what nouns, adjectives, and verbs are through play.

**UI flow:**
1. Show current Mad Lib title and a "Start" button
2. Step through each blank one at a time: show the label + hint, input field, "Next" button
3. After all blanks filled, show the completed story with the kid's words highlighted in their accent color
4. "New Mad Lib" button picks a **random** template (not sequential). Use `Math.floor(Math.random() * KID_MADLIBS.length)` — avoid repeating the same one just played

```text
+-------------------------------+
|  Mad Libs: The Silly Zoo Trip |
+-------------------------------+
|  Fill in blank 3 of 8:       |
|                               |
|  An adjective                 |
|  (a describing word, like     |
|   "silly" or "sparkly")       |
|                               |
|  [________________]  [Next >] |
+-------------------------------+
```

State stored in `localStorage`:
- `funMadLibIndex` — current template index
- `funMadLibProgress` — `{ templateIndex, currentBlank, answers[] }` for resuming

### Bulletin Layout After This Phase

```text
+-------------------------------+
|  Sticky Notes (grid)          |
+-------------------------------+
|  Kid Fun                      |
|  +--joke--+  +--mad libs----+ |
|  | setup  |  | The Silly    | |
|  | [tap]  |  | Zoo Trip     | |
|  | [next] |  | [Start]      | |
|  +--------+  +--------------+ |
+-------------------------------+
|  Coming Up (calendar - Ph 7)  |
+-------------------------------+
```

Kid Fun renders as two side-by-side cards on wider screens, stacked on narrow phones.

### CSS

```css
.fun-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 480px) {
  .fun-section { grid-template-columns: 1fr; }
}
.fun-card {
  padding: 16px;
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: var(--shadow);
}
.fun-card h3 { margin: 0 0 8px; font-size: 1rem; }
.joke-punchline {
  font-weight: 700;
  animation: jokeBounce 0.3s ease-out;
}
@keyframes jokeBounce {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.madlib-highlight {
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
}
.madlib-highlight.alex { background: rgba(74, 144, 217, 0.15); color: var(--alex); }
.madlib-highlight.louisa { background: rgba(138, 91, 209, 0.15); color: var(--louisa); }
```

### Test

- Fun tab appears in the bottom nav bar between Chores and Lists.
- Tapping Fun tab shows the Kid Fun view with jokes and mad libs.
- Bulletin no longer contains the Kid Fun section.
- 5 tabs fit cleanly on phone screens (test at 320px and 375px width).
- Joke shows setup, tap reveals punchline with animation.
- Next Joke advances and wraps around after seeing all jokes.
- Current joke index persists across page reloads.
- Mad Libs: can step through blanks, see completed story with highlighted words.
- Mad Lib progress persists if page is reloaded mid-game.
- Both modules work on phone screens (stacked layout on narrow).
- Joke and Mad Lib content is age-appropriate for ages 4-7.

---

## Phase 4: Chores Gear Icon + Move Weekly Progress to Chores

Goal: move chore management into the Chores tab AND move the weekly progress dashboard out of Bank and into Chores. Chores and Bank are separate tools — Chores tracks effort (points, progress toward tiers, bonus track), Bank tracks money (balances, payments, debts, transactions).

### Weekly Progress Move

Currently `renderCardView()` in Bank renders a "This Week" stat card with weekly points, progress bar, tier progress label, and bonus track info (lines ~2801-2809). This belongs in Chores because it's about chore effort, not money.

**Add to Chores view** (below quick-points, above messages):
- A `#choreProgress` container that renders a compact weekly progress card per kid
- Kid picker in Chores already exists (Alex / Louisa / Both) — reuse it or show both kids' progress side by side
- Show: weekly points, progress bar toward next tier, bonus track progress
- Extract the progress rendering logic from `renderCardView()` into a shared `renderWeeklyProgress(kidId)` function that both views can call if needed

**Remove from Bank view**:
- Delete the "This Week" stat card from `renderCardView()` output (lines ~2801-2809)
- Bank's kid card (`.kid-card`) can still show `weeklyPoints` as a small label for context, but the full progress dashboard moves to Chores

**After this change:**

| Chores View | Bank View |
|---|---|
| Kid picker (Alex / Louisa / Both) | Kid picker (Alex / Louisa) |
| Quick points buttons | Kid card (balance + kid name) |
| **Weekly progress** (points, bar, tier, bonus) | Balance card (Pay / Spent) |
| Chat/message history | Debts card (Settle) |
| Gear icon → chore settings | Recent Activity (financial ledger) |

### Chores Gear Icon

- Add a Chores toolbar with a gear button.
- Toggle an inline `#choresSettings` panel.
- Move chore point editing, add chore, and remove chore flows out of `settingsContent` delegation into `choresSettings` delegation.
- Move shared settings CSS out of runtime injection and into the main style block.

### Test

- Chores tab shows weekly progress for selected kid(s) with progress bar and bonus info.
- Bank tab no longer shows the "This Week" progress card — only balance, debts, activity.
- Gear icon visible in Chores.
- Clicking toggles the chore editor.
- Add/remove/edit chore points work and persist.
- Clicking gear again collapses the panel.
- Logging a chore from any tab updates the Chores progress when you navigate there.

---

## Phase 5: Redistribute Settings - Bank Gear Icon

Goal: move pay tiers, bonus settings, history log, and transactions into Bank. Bank focuses purely on money: what's owed, what's been paid, and the financial rules (pay tiers, bonuses).

- Add a Bank toolbar with a gear button.
- Toggle an inline `#bankSettings` panel.
- Move pay tiers, bonus settings, history filters, and transaction deletion out of `settingsContent` delegation into `bankSettings` delegation.

### Test

- Gear icon visible in Bank.
- Pay tiers editable per kid and persist.
- Bonus settings editable.
- History filters work.
- Transaction delete works.
- Kid card renders with balance focus (no weekly progress bar — that's in Chores now).

---

## Phase 6: Family Code to Header + Cleanup

Goal: move family code/share to the header and remove all Settings remnants.

- Add a header share/info button that shows family code, copy link, and online/offline status.
- Delete `viewSettings` from HTML.
- Delete `settings` from `views` only after the replacement settings surfaces are live.
- Promote shared helpers such as `safeName()`, `paymentBalanceDelta()`, `waitForRuntimeReady()`, `keepPathsSynced()`, and online indicator helpers before deleting the Phase 5 IIFE.
- Move shared settings CSS classes into the main style block.
- Bump the service worker cache version in `sw.js`.

### Test

- Family code accessible from header on any tab.
- Copy link works.
- Online indicator works.
- No Settings tab or orphaned Settings route remains after cleanup.
- No JS errors from missing references.
- Full regression: log chore, add to list, make payment, add bulletin note.

---

## Phase 7: Google Calendar Integration

Goal: show upcoming kid-related Google Calendar events on the Bulletin.

Part A: create a Google Apps Script web app that reads the family calendar, filters events for Alex and Louisa, and returns JSON.

Part B: in the PWA, fetch that JSON, cache it for 15 minutes, and render events grouped by day with kid color badges.

### Test

- Deploy Apps Script and set the URL in Firebase.
- Bulletin shows upcoming events for Alex and Louisa.
- Events group by day and are kid color coded.
- Graceful fallback if fetch fails.
- Cache prevents excessive API calls.
- Works on Android Chrome and iOS Safari.

---

## Phase Dependency Order

```text
Phase 1  -> Fix tab bar + bulletin shell, keep settings reachable          [DONE]
Phase 2  -> Universal input + intent router                                [DONE]
Phase 3  -> Bulletin view + notes                                          [DONE]
Phase 3b -> Kid Fun as its own tab (extract from Bulletin, add 5th tab)    [NEXT]
Phase 4  -> Chores gear icon + move weekly progress from Bank to Chores    [DONE]
Phase 5  -> Bank gear icon
Phase 6  -> Header family code + cleanup, remove settings only after replacements are live
Phase 7  -> Google Calendar
```

---

## Risk Mitigation

1. Shared utilities: before deleting the Phase 5 IIFE in Phase 6, promote `safeName()`, `paymentBalanceDelta()`, `waitForRuntimeReady()`, `keepPathsSynced()`, and online indicator functions to global/core scope.
2. Intent router migration: migrate every live intent and follow-up state, including yes/no confirmations, duplicate prompts, spend flows, and parent/child debt variants. Run the full test matrix from the original plan after Phase 2.
3. Service worker: bump `CACHE_NAME` in `sw.js` after each phase to ensure users get fresh code.
4. Event delegation: do not remove `settingsContent` delegation until `#choresSettings` and `#bankSettings` replacements exist.
5. Mobile keyboard: test the fixed composer + fixed tab bar interaction on Android Chrome and iOS Safari. Use `visualViewport` adjustments if needed.

---

## Critical Files

- `index.html` - all HTML/CSS/JS changes.
- `sw.js` - bump cache version after changes.
- `manifest.json` - verify `start_url` works with the new default hash.
- Google Apps Script - new file, deployed separately for Phase 7.

---
---
# ORIGINAL SPEC: Family Chore Tracker (Phases 1-5, completed)

The sections below are the original implementation plan. All 5 phases are complete. Preserved for reference â€” the data model, parser spec, and UI spec are still the canonical source of truth for existing functionality.

---

## Context

Two parents (Android + iPhone) track chores for two kids using paper charts. The goal is a voice-first, chat-style Progressive Web App that minimizes friction â€” speak naturally to log chores, award points, track balances, and manage what's owed. No LLM APIs; the domain is narrow enough for rule-based NLP. Firebase provides free real-time sync between devices. This plan is designed for Codex to implement.

### Kids
- **Alex**: born Feb 15, 2019 (age 7). Pay: 12pts=$3/wk, 20pts=$6/wk. Monthly bonus: 100pts=+$6
- **Louisa**: born July 2, 2021 (age 4). Pay: 8pts=$2/wk, 12pts=$4/wk. Monthly bonus: 60pts=+$4

Pay is age-based and recalibrates as they age. Point values per chore are adjustable by the parent at any time.

---

## Architecture

| Concern | Choice | Why |
|---|---|---|
| App type | Single-page PWA | Cross-platform via browser, installable on home screen |
| Framework | Vanilla JS (no React/Vue) | Zero dependencies, simple for Codex to generate, easy to debug |
| Data sync | Firebase Realtime Database (free Spark plan) | Real-time sync between 2 devices, built-in offline persistence |
| Auth | Firebase Anonymous Auth + shared family code | No login forms. One parent creates, shares code with the other |
| Voice | Web Speech API | Free, built into Chrome (Android) and Safari (iOS 14.5+) |
| NLP | Rule-based intent parser | Constrained domain (~2 kids, ~20 chores) â€” no LLM needed |
| Hosting | GitHub Pages | Free, HTTPS (required for PWA + Speech API) |
| CSS | Embedded in index.html, mobile-first | Single file keeps things simple |

---

## Project Structure

```
chores/
â”œâ”€â”€ index.html          # Entire app (HTML + CSS + JS)
â”œâ”€â”€ manifest.json       # PWA manifest
â”œâ”€â”€ sw.js               # Service worker for offline caching
â”œâ”€â”€ firebase-config.js  # Firebase project config (separate for easy swapping)
â”œâ”€â”€ icons/
â”‚   â”œâ”€â”€ icon-192.png
â”‚   â””â”€â”€ icon-512.png
â”œâ”€â”€ alex_chart_v2.docx  # (existing reference)
â””â”€â”€ louisa_2page.odt    # (existing reference)
```

---

## Data Model (Firebase Realtime Database)

```
/families/{familyId}/
  config/
    createdAt: <timestamp>
    kids/
      alex/
        name: "Alex"
        born: "2019-02-15"
        payTiers: [
          { minPts: 12, pay: 3 },
          { minPts: 20, pay: 6 }
        ]
        monthlyBonus: { threshold: 100, bonus: 6 }
      louisa/
        name: "Louisa"
        born: "2021-07-02"
        payTiers: [
          { minPts: 8, pay: 2 },
          { minPts: 12, pay: 4 }
        ]
        monthlyBonus: { threshold: 60, bonus: 4 }
    chores/
      feed_dog_am:
        label: "Feed dog (AM)"
        points: 1
        kids: ["alex", "louisa"]    # which kids can do this
        keywords: ["fed the dog this morning", "fed dog", "dog food morning"]
      feed_dog_pm:
        label: "Feed dog (PM)"
        points: 1
        kids: ["alex", "louisa"]
        keywords: ["fed the dog tonight", "fed dog pm", "dog food evening"]
      refill_dog_water:
        label: "Refill dog water"
        points: 1
        kids: ["alex", "louisa"]
        keywords: ["refill water", "dog water", "filled water bowl"]
      make_bed:
        label: "Make bed"
        points: 1
        kids: ["alex", "louisa"]
        keywords: ["made bed", "make bed", "made their bed", "beds"]
      put_away_laundry:
        label: "Put away clean laundry"
        points: 1
        kids: ["alex"]
        keywords: ["put away laundry", "put away clothes", "laundry away"]
      put_away_clothes:
        label: "Put away clothes"
        points: 1
        kids: ["louisa"]
        keywords: ["put away clothes", "clothes away"]
      wipe_bathroom:
        label: "Wipe bathroom counter"
        points: 1
        kids: ["alex"]
        keywords: ["wipe bathroom", "bathroom counter", "cleaned bathroom"]
      wipe_surfaces:
        label: "Wipe surfaces"
        points: 2
        kids: ["alex", "louisa"]
        keywords: ["wiped surfaces", "wipe surfaces", "wiped table", "wiped counter", "cleaned surfaces", "wiped tower"]
      help_pack_lunch:
        label: "Help pack lunch"
        points: 2
        kids: ["alex"]
        keywords: ["pack lunch", "packed lunch", "lunch for tomorrow"]
      fold_laundry:
        label: "Fold laundry"
        points: 2
        kids: ["alex"]
        keywords: ["fold laundry", "folded laundry", "folded towels", "folded clothes"]
      match_socks:
        label: "Match socks"
        points: 2
        kids: ["louisa"]
        keywords: ["match socks", "matched socks", "sock matching"]
      fold_washcloths:
        label: "Fold washcloths"
        points: 2
        kids: ["louisa"]
        keywords: ["fold washcloths", "folded washcloths"]
      bins_in:
        label: "Bring bins back in"
        points: 2
        kids: ["alex", "louisa"]
        keywords: ["bins in", "bring bins", "bins back", "brought bins in", "garbage in", "recycling in"]
      bins_curb:
        label: "Bins to curb"
        points: 3
        kids: ["alex", "louisa"]
        keywords: ["bins to curb", "bins out", "took bins out", "trash out", "garbage out", "recycling out", "took out trash"]
      water_plants:
        label: "Water plants"
        points: 3
        kids: ["alex", "louisa"]
        keywords: ["water plants", "watered plants", "watered the plants"]

  log/
    {pushId}:
      kid: "alex"
      choreId: "feed_dog_am" | "adhoc" | "freepoints"
      choreLabel: "Feed dog (AM)"
      points: 1
      timestamp: <ms>
      date: "2026-03-13"        # for easy querying
      week: "2026-W11"          # ISO week for weekly tallies
      note: ""                  # optional, used for ad-hoc description

  payments/
    {pushId}:
      kid: "alex"
      amount: 6.00
      type: "weekly" | "monthly_bonus" | "manual"
      timestamp: <ms>
      date: "2026-03-13"
      note: ""

  balances/
    alex:
      owed: 12.00              # running total of unpaid earnings
    louisa:
      owed: 8.00

  debts/
    {pushId}:
      from: "louisa"
      to: "alex"
      amount: 2.00
      reason: "Borrowed for ice cream"
      timestamp: <ms>
      settled: false
```

### Key decisions:
- `choreId: "freepoints"` is used when a parent says "Alex gets 3 points" without tying to a specific chore
- `choreId: "adhoc"` is used for one-off chores not in the menu, with `choreLabel` and `note` describing what it was
- Chore `points` values are stored in config and editable â€” when a parent says "change feed dog to 2 points", the config is updated and future logs use the new value
- `date` and `week` strings are pre-computed on write so Firebase queries stay simple

---

## Intent Parser â€” Full Specification

The parser is the core of the conversational UX. It must handle these intent categories:

### Intent 1: Log a known chore
- "Alex fed the dog this morning" â†’ `{ kids: ["alex"], choreId: "feed_dog_am", points: 1 }`
- "Both kids made their beds" â†’ two entries
- "Louisa wiped surfaces and matched socks" â†’ two entries for Louisa

**Parsing steps:**
1. Normalize: lowercase, strip filler words (um, uh, like, so, well)
2. Extract kid names: "alex", "louisa", "lou", "both", "both kids", "the kids", "everyone" â†’ resolve to kid ID(s). If none found, ask "Which kid?"
3. Match chore: tokenize utterance, score against each chore's keyword list using token-overlap (fraction of keyword phrase tokens found in utterance). Best match > 0.5 threshold = match. If 0.3â€“0.5, ask to confirm. Below 0.3, try ad-hoc or free-points patterns.
4. Time inference: "this morning" / before noon â†’ AM chores; "tonight" / "this evening" / after noon â†’ PM chores; "yesterday" â†’ adjust date
5. Multi-chore: split on "and", "also", "plus" when connecting independent actions

### Intent 2: Free points (no specific chore)
- "Alex gets 3 points"
- "Give Louisa 2 points"
- "3 points for Alex"
- Pattern: look for `<number> points` + kid name, with no chore match
- Log as `choreId: "freepoints"`, `choreLabel: "Free points"`, points from utterance

### Intent 3: Ad-hoc chore
- "Alex did a new chore, he organized his bookshelf, give him 2 points"
- "Louisa helped sweep the porch, 2 points"
- Pattern: presence of "new chore", "something new", "something extra", or a chore description that doesn't match known chores + explicit point value
- Log as `choreId: "adhoc"`, extract description for `choreLabel`, points from utterance
- If no points specified, ask: "How many points for that?"

### Intent 4: Change chore point value
- "Change feed dog to 2 points"
- "Make wiping surfaces 3 points"
- "Dog feeding should be 2 points now"
- Pattern: presence of "change", "make", "should be", "update" + chore match + number
- Updates `config/chores/{choreId}/points` in Firebase

### Intent 5: Check status
- "How's Alex doing this week?"
- "What are the points?"
- "How much do I owe?"
- "What's the balance?"
- Pattern: question words + "points", "balance", "owe", "doing", "score", "status"
- Response: show current week points, pay earned, balance owed

### Intent 6: Record payment
- "I paid Alex $6"
- "Gave Louisa $4"
- Pattern: "paid", "gave", "pay" + kid + dollar amount
- Reduces balance owed

### Intent 7: Record debt between kids
- "Louisa owes Alex $2"
- "Louisa borrowed $2 from Alex"
- Pattern: "owes", "borrowed", "lent" + two kid names + amount
- Creates debt record

### Intent 8: Settle debt
- "Louisa paid Alex back"
- "Settle Louisa's debt to Alex"
- Pattern: "paid back", "settle", "settled" + kid names
- Marks debt as settled

### Intent 9: Undo
- "Undo"
- "Undo that"
- "Take that back"
- Removes the most recent log entry and adjusts points

### Parser response behavior:
- **High confidence** (all fields resolved): "Got it! Alex fed the dog this morning â€” 1pt. [Undo]"
- **Medium confidence**: "Did you mean Alex fed the dog? [Yes / No]"
- **Missing info**: "Which kid?" or "How many points?"
- **No match**: "I didn't catch that. Try again or type it out?"
- **Duplicate warning**: "Alex already fed the dog this morning. Log again? [Yes / No]"

---

## UI Specification

### Layout (mobile-first, single screen)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Family Chores    [ðŸ“Š] [âš™ï¸]      â”‚  â† Header: app name, scoreboard toggle, settings
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                  â”‚
â”‚  Chat history (scrollable)       â”‚  â† Messages from system + user utterances
â”‚                                  â”‚
â”‚  â”Œâ”€ system â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Good morning! What chores â”‚    â”‚
â”‚  â”‚ have been done today?     â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                  â”‚
â”‚  â”Œâ”€ you â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Alex fed the dog          â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                  â”‚
â”‚  â”Œâ”€ system â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ âœ“ Alex â€” Feed dog (AM)    â”‚    â”‚
â”‚  â”‚   1pt                [Undo]â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Type or speak...    ]  [ðŸŽ¤]   â”‚  â† Input bar: text field + mic button
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Scoreboard panel (slides down from header when ðŸ“Š tapped)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  This Week (Mar 9â€“15)           â”‚
â”‚                                  â”‚
â”‚  Alex     14pts    $3 earned     â”‚
â”‚  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘    next: 20pts   â”‚
â”‚                                  â”‚
â”‚  Louisa    9pts    $2 earned     â”‚
â”‚  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘    next: 12pts   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Balances                        â”‚
â”‚  Alex owed: $12.00      [Pay]    â”‚
â”‚  Louisa owed: $8.00     [Pay]    â”‚
â”‚                                  â”‚
â”‚  Louisa owes Alex: $2  [Settle]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Settings panel (âš™ï¸)

- Edit chore list (add/remove/rename chores, change point values)
- Edit pay tiers per kid
- Edit monthly bonus thresholds
- View full log history with filters (by kid, by date range)
- Family code display + share link
- Reset/recalibrate for new age (prompted on birthdays)

### Visual design guidelines
- Clean, light theme with good contrast
- Kid-specific accent colors (e.g., blue for Alex, purple for Louisa)
- Large tap targets (48px minimum) â€” parents are using this one-handed on phones
- System messages use a subtle background; user messages align right
- [Undo] buttons are inline, visible for 60 seconds then fade (but available in history)
- Progress bars for weekly point thresholds use kid accent colors

---

## Speech Recognition Implementation

```javascript
function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    // Hide mic button, text-only mode
    return null;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;  // one utterance at a time (safer on iOS)
  return recognition;
}
```

- Mic button: tap to start, tap again to stop (or auto-stops after silence)
- While listening: mic button pulses/glows, interim text shows in input field
- On final result: feed transcript to intent parser
- Fallback: text input always available, same parser pipeline

---

## Pay Calculation Logic

```javascript
function getAge(bornDateStr) {
  const born = new Date(bornDateStr);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) age--;
  return age;
}

function calculateWeeklyPay(payTiers, weeklyPoints) {
  // payTiers sorted ascending by minPts
  // Highest qualifying tier wins (not cumulative)
  let earned = 0;
  for (const tier of payTiers) {
    if (weeklyPoints >= tier.minPts) earned = tier.pay;
  }
  return earned;
}

function calculateMonthlyBonus(bonusConfig, fourWeekPoints) {
  return fourWeekPoints >= bonusConfig.threshold ? bonusConfig.bonus : 0;
}
```

- Weekly pay calculated when the week rolls over (detected on app open â€” check if summary exists for prior week, if not, compute and write it)
- Monthly bonus checked every 4 weeks from a configurable start date
- On a kid's birthday, the app shows a chat message: "Louisa turned 5! Want to update her pay tiers?" with a link to settings

---

## Firebase Setup Instructions (for Codex / developer)

1. Go to console.firebase.google.com, create project "family-chores"
2. Enable **Realtime Database** (start in test mode, then apply rules below)
3. Enable **Authentication** â†’ Sign-in method â†’ **Anonymous** (enable it)
4. Copy the Firebase config object into `firebase-config.js`
5. Database security rules:
```json
{
  "rules": {
    "families": {
      "$familyId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

Use Firebase SDK via CDN (no npm/build step):
```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
```

---

## PWA Files

### manifest.json
```json
{
  "name": "Family Chores",
  "short_name": "Chores",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4a90d9",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### sw.js
```javascript
const CACHE_NAME = 'chores-v1';
const ASSETS = ['./', './index.html', './manifest.json', './firebase-config.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

---

## Codex Workflow

**Strategy:** Feed Codex one phase at a time. After each phase, test the output manually (open index.html in your browser), then come back to Claude if something is off. Each phase below is written as a self-contained prompt you can paste into Codex.

**Before Phase 1:** You must create a Firebase project manually (Codex can't do this). Follow the Firebase Setup Instructions section above. Once you have your Firebase config object, create `firebase-config.js` with it before starting Phase 1.

**Tip:** When giving Codex a phase, also paste the relevant data model and spec sections from this plan so it has full context.

---

## Implementation Phases

### Phase 1: App Shell + Firebase
**Files to create:** `index.html`, `manifest.json`, `sw.js`
**Prereq:** `firebase-config.js` already exists with your Firebase config

**What to build:**
1. Create `index.html` with the full chat UI layout (header with app name + scoreboard toggle + settings gear, scrollable message area, input bar with text field + mic button)
2. Mobile-first CSS embedded in `<style>` â€” clean, light theme, kid accent colors (blue for Alex, purple for Louisa), 48px min tap targets
3. Load Firebase SDK via CDN `<script>` tags (firebase-app-compat, firebase-auth-compat, firebase-database-compat v10.12.0)
4. Import config from `firebase-config.js`, initialize Firebase app, auth, and database
5. Anonymous auth sign-in on app load
6. Family code flow: check localStorage for `familyId`. If none, show a modal: "Create new family" (generates 8-char alphanumeric code) or "Join family" (enter code). Save to localStorage.
7. On family creation, seed the default chore config into Firebase at `/families/{familyId}/config/` using the exact data model from this plan (all chores with labels, points, kids arrays, and keywords)
8. Display a welcome system message in the chat area: "Welcome! Type or tap the mic to log chores."
9. Create `manifest.json` and `sw.js` per the specs in this plan
10. Register service worker from `index.html`

**Test it:** Open index.html in Chrome. You should see the chat UI, be able to create/join a family, and see the config seeded in your Firebase console.

---

### Phase 2: Intent Parser + Logging
**Files to modify:** `index.html` (add JS)

**What to build:**
1. Text input: when user submits text (Enter key or send button), pass it to `parseIntent(text)`
2. `parseIntent(text)` returns a structured result: `{ intent, kids[], choreId, choreLabel, points, amount, note, confidence }`
3. Implement all 9 intent types from the "Intent Parser â€” Full Specification" section:
   - **Log chore**: token-overlap match against chore keywords from Firebase config. Score = fraction of keyword phrase tokens found in utterance. >0.5 = match, 0.3-0.5 = ask confirmation, <0.3 = no match.
   - **Free points**: pattern `/<number>\s*points?\s*(for\s+)?<kid>/i` or `/<kid>\s*(gets?|earns?|earned)\s*<number>\s*points?/i`. Log as `choreId: "freepoints"`.
   - **Ad-hoc chore**: no chore match + explicit points mentioned. Extract description. Log as `choreId: "adhoc"`.
   - **Change points**: "change/make/update <chore> to <number> points". Update Firebase config.
   - **Check status**: question words + "points/balance/owe/score". Show scoreboard info in chat.
   - **Record payment**: "paid/gave <kid> $<amount>". Create payment record, reduce balance.
   - **Record debt**: "<kid> owes/borrowed <amount> from <kid>". Create debt record.
   - **Settle debt**: "paid back/settle". Mark debt as settled.
   - **Undo**: "undo/take that back". Remove most recent log entry.
4. Kid name extraction: match "alex", "louisa", "lou", "both", "both kids", "the kids", "everyone". "both"/"everyone" expands to both kids.
5. Multi-chore splitting: split on "and", "also", "plus" between independent clauses
6. Chat responses: system messages confirming what was logged (with points), asking for clarification, or showing errors. Include [Undo] button on confirmations.
7. Each log entry writes to Firebase at `/families/{familyId}/log/{pushId}` with: kid, choreId, choreLabel, points, timestamp, date (YYYY-MM-DD), week (YYYY-Wnn), note
8. Duplicate detection: before logging, check if same kid+choreId was already logged today. If so, ask "Already logged today. Log again?"

**Test it:** Type "Alex fed the dog" â†’ see confirmation with 1pt. Type "both kids made beds" â†’ see two confirmations. Type "Alex gets 3 points" â†’ see freepoints entry. Type "change feed dog to 2 points" â†’ check Firebase config updated. Type "undo" â†’ see entry removed.

---

### Phase 3: Voice Input
**Files to modify:** `index.html` (add JS)

**What to build:**
1. Feature-detect `window.SpeechRecognition || window.webkitSpeechRecognition`. If unavailable, hide mic button.
2. Mic button: on tap, call `recognition.start()`. Set `lang='en-US'`, `interimResults=true`, `continuous=false`.
3. Visual feedback: while listening, mic button gets a CSS pulse animation (red glow). Show "Listening..." text.
4. `onresult`: show interim transcript in the text input field as the user speaks. On `isFinal`, pass to `parseIntent()` (same pipeline as text).
5. `onerror` / `onend`: stop pulse animation, clear "Listening..." state.
6. Second tap while listening stops recognition.

**Test it:** On Android Chrome, tap mic, say "Alex fed the dog" â†’ see it transcribed and logged. On iPhone Safari, same test (requires iOS 14.5+).

---

### Phase 4: Scoreboard + Pay + Balances
**Files to modify:** `index.html` (add JS + HTML panel)

**What to build:**
1. Scoreboard panel: hidden by default, slides down when ðŸ“Š header button is tapped
2. Query Firebase `/families/{familyId}/log` entries where `week` equals current ISO week, group by kid, sum points
3. For each kid: show points, a progress bar toward their pay tier thresholds, and current earned pay (using `calculateWeeklyPay`)
4. Monthly section: sum points for current 4-week period, show progress toward bonus threshold
5. Weekly pay auto-calculation: on app open, check if it's a new week (compare current ISO week to last calculated week stored in Firebase). If new week, calculate prior week's pay for each kid, write a payment record, update balance.
6. Balance display: show `owed` amount per kid with a [Pay] button. Tapping [Pay] opens a prompt for amount, records payment, reduces balance.
7. Debt display: show active (unsettled) debts with a [Settle] button.
8. Birthday check: on app open, compare today's date to each kid's `born` month+day. If birthday, show chat message prompting to update pay tiers.

**Test it:** Log some chores, open scoreboard, verify points match. Manually set a past week in Firebase, reload, verify pay auto-calculates.

---

### Phase 5: Settings + Polish
**Files to modify:** `index.html` (add JS + HTML panel)

**What to build:**
1. Settings panel (gear icon):
   - List all chores with editable point values (inline number input)
   - Add new chore button (name, points, which kids)
   - Remove chore button (with confirmation)
   - Edit pay tiers per kid (table of minPts â†’ $amount)
   - Edit monthly bonus threshold and amount per kid
   - Display family code with a "Copy link" button
2. Log history view: scrollable list of recent entries with filter chips (Alex / Louisa / All) and date picker
3. Smart time-of-day defaults: if before noon, AM chores are assumed; after noon, PM chores
4. Time-based greeting: "Good morning!" / "Good afternoon!" / "Good evening!" as first system message
5. Quick-reply buttons: when the system asks "Which kid?", show tappable [Alex] [Louisa] [Both] buttons instead of requiring typed response
6. Online/offline indicator: small dot in header (green=online, gray=offline)
7. Enable Firebase offline persistence (`firebase.database().ref().keepSynced(true)` on key paths)

**Test it:** Change a chore's point value in settings, log that chore, verify new points used. Add a custom chore, log it by voice. Test offline: turn off wifi, log a chore, turn wifi on, verify sync.

---

## Verification / Testing Plan

1. **Text input**: Type "Alex fed the dog" â†’ verify log entry appears in Firebase and chat confirms
2. **Voice input**: Tap mic, say "Both kids made their beds" â†’ verify two entries logged
3. **Free points**: Type "Alex gets 3 points" â†’ verify freepoints entry, 3pts added to weekly tally
4. **Ad-hoc chore**: "Louisa swept the porch, 2 points" â†’ verify adhoc entry with label
5. **Change points**: "Change feed dog to 2 points" â†’ verify config updated in Firebase, next log uses 2pts
6. **Scoreboard**: Check weekly tally matches logged entries
7. **Balance**: Log enough points for weekly pay, verify balance increases
8. **Payment**: "I paid Alex $6" â†’ verify balance decreases
9. **Debt**: "Louisa owes Alex $2" â†’ verify debt record; "settle" â†’ verify marked settled
10. **Undo**: Log a chore, say "undo" â†’ verify entry removed
11. **Cross-device sync**: Open on two devices with same family code, log on one, verify appears on other
12. **Offline**: Turn off network, log a chore, turn network back on, verify it syncs
13. **PWA install**: On Android Chrome and iOS Safari, verify "Add to Home Screen" works
14. **Birthday**: Set a kid's birthday to today's date, reload app, verify birthday prompt appears

---

# Phase 30 — Bank Tab Revamp: Invest Tracking & YTD Summary

## Goal

Transform the Bank tab from a chore payroll ledger into a kid money dashboard. Add an "invest" transaction type so kids can see earned vs spent vs invested YTD. Align visual style with the rest of the app. Keep the credit card visual — it's the anchor of the tab.

## Current State (what exists)

- **Credit card visual** per kid (line ~6078) — gradient backgrounds, chip, balance, kid name, weekly points
- **Transaction types**: `weekly`, `manual`, `spend`, `credit` (line ~4150)
- **Action buttons**: "Pay" and "Spent" (line ~6078, inside `drawer-grid`)
- **Recent Activity**: flat list of last 20 transactions mixing chores and payments (lines ~6069-6076)
- **Balance system**: `writePayment()` (line ~4149) writes to Firebase, `adjustBalance()` (line ~4114) updates `families/{familyId}/balances/{kidId}/owed`
- **balanceDelta**: always negative in `writePayment()` — spend/manual/invest all reduce balance
- **`paymentBalanceDelta()`** (line ~4122): returns positive for `credit`/`weekly`, negative for others
- **Kid picker**: buttons at top to switch between Alex and Louisa (line ~2731)
- **Weekly pay auto-calc**: `maybeRunWeeklyPay()` (line ~5966) runs on card render

## Changes

### 1. Add "invest" transaction type

In `handleCardAction()` (line ~6081), add an `invest` handler parallel to `kid-spent`:

```javascript
if (action === 'kid-invest') {
  var investKidId = button.dataset.kid;
  var investText = await window.appPrompt(
    'How much is ' + (kidName) + ' investing?', 'Amount', '5',
    { inputType: 'number' }
  );
  var investAmount = investText === null ? null : Number(investText);
  if (!investAmount || Number.isNaN(investAmount) || investAmount <= 0) return;
  phase.writePayment(investKidId, investAmount, 'invest', 'Investment').then(function () {
    phase.showToast('Investment recorded.', { kid: investKidId });
    return window.openCardForKid(investKidId);
  }).catch(function (error) {
    console.error(error);
    phase.showToast('Failed to record investment.', { type: 'error' });
  });
  return;
}
```

Add the "Invest" button to the card actions in `renderCardView()` (line ~6078), alongside Pay and Spent:

```html
<button type="button" data-card-action="kid-invest" data-kid="{kidId}">Invest</button>
```

### 2. Update transaction labeling

In the statement row builder (line ~6073), add invest label:

```javascript
var label = item.type === 'spend' ? 'Purchase'
  : item.type === 'weekly' ? 'Weekly pay'
  : item.type === 'credit' ? 'Credit'
  : item.type === 'invest' ? 'Investment'
  : 'Payment';
```

### 3. YTD Summary section

Add a summary section between the credit card and the action buttons. Shows three numbers for the current year:

```
┌─────────────────────────────────┐
│   Earned     Spent    Invested  │
│   $142.00    $87.50    $30.00   │
│   ████████   █████     ███      │
└─────────────────────────────────┘
```

**Calculation** — filter all payments for the current kid where `date` starts with current year:

```javascript
var currentYear = String(new Date().getFullYear());
var yearPayments = payments.filter(function (p) {
  return p.kid === kidId && (p.date || '').indexOf(currentYear) === 0;
});

var ytdEarned = 0, ytdSpent = 0, ytdInvested = 0;
yearPayments.forEach(function (p) {
  var delta = paymentBalanceDelta(p);
  if (p.type === 'invest') {
    ytdInvested += Math.abs(delta);
  } else if (delta > 0) {
    ytdEarned += delta;
  } else if (delta < 0) {
    ytdInvested += 0; // already handled
    ytdSpent += Math.abs(delta);
  }
});
```

**HTML structure:**

```html
<div class="ytd-summary">
  <div class="ytd-item earned">
    <div class="ytd-label">Earned</div>
    <div class="ytd-value">${earned}</div>
    <div class="ytd-bar" style="width:{earnedPct}%"></div>
  </div>
  <div class="ytd-item spent">
    <div class="ytd-label">Spent</div>
    <div class="ytd-value">${spent}</div>
    <div class="ytd-bar" style="width:{spentPct}%"></div>
  </div>
  <div class="ytd-item invested">
    <div class="ytd-label">Invested</div>
    <div class="ytd-value">${invested}</div>
    <div class="ytd-bar" style="width:{investedPct}%"></div>
  </div>
</div>
```

Percentages are relative to the largest value (so the biggest bar is 100% width).

### 4. Remove points from credit card

The card currently shows `{weeklyPoints} pts this week` in `.card-pts`. Remove this — the Bank tab is about money, not points. Points belong on the Chores tab.

Replace `.card-pts` content with the YTD net position or simply remove the element:

```javascript
// REMOVE from card-bottom:
// '<div class="card-pts">' + weeklyPoints + ' pts<br>this week</div>'
```

Keep the card-bottom with just the kid name. The weekly points info stays on the Chores tab where it belongs.

### 5. Remove chore entries from Recent Activity

Currently `renderCardView()` mixes chore log entries into `allTxns` (line ~6054). Remove the chore entries — Recent Activity should only show money movements:

```javascript
// REMOVE these lines (~6054-6056):
// entries.filter(function (entry) { return entry.kid === kidId; }).forEach(function (entry) {
//   allTxns.push({ type: 'chore', ... });
// });
```

Also remove the chore row rendering in `stmtRows` (line ~6070-6071) — only payment rows remain.

### 6. Visual style alignment

The Bank tab should feel cohesive with the rest of the app:

- **Credit card**: Keep as-is — it's already good
- **Section headers**: Use `font-size: var(--font-base); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted)` (matches existing `.card-statement h3`)
- **Action buttons**: Use kid-colored backgrounds (already done via `.score-action button`)
- **YTD summary bars**: Use kid colors — `var(--alex)` / `var(--louisa)` for earned, `var(--danger)` for spent, `#22c55e` (green) for invested

### 7. CSS for YTD summary

```css
.ytd-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  padding: 16px;
  background: var(--panel-alt);
  border-radius: var(--radius);
  margin-top: 12px;
}

.ytd-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ytd-label {
  font-size: var(--font-xs);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ytd-value {
  font-size: var(--font-lg);
  font-weight: 800;
}

.ytd-item.earned .ytd-value { color: #16a34a; }
.ytd-item.spent .ytd-value { color: var(--danger); }
.ytd-item.invested .ytd-value { color: var(--alex); }

.ytd-bar {
  height: 6px;
  border-radius: 3px;
  min-width: 4px;
  transition: width 0.3s ease;
}

.ytd-item.earned .ytd-bar { background: #16a34a; }
.ytd-item.spent .ytd-bar { background: var(--danger); }
.ytd-item.invested .ytd-bar { background: var(--alex); }
```

### 8. Update undo for invest type

In `writePayment()` (line ~4149), undo already works for all payment types — it reverses the `balanceDelta` and removes the payment record. No special handling needed for `invest` since it uses the same `writePayment` → `adjustBalance` flow.

## Layout (top to bottom)

```
┌─ Kid Picker ──────────────────────┐
│  [Alex]  [Louisa]                 │
├─ Credit Card ─────────────────────┤
│  Family Chores Card          [chip]│
│  $24.50                           │
│  Available Balance                │
│  ALEX                             │
├─ YTD Summary ─────────────────────┤
│  Earned    Spent     Invested     │
│  $142.00   $87.50    $30.00       │
│  ████████  █████     ███          │
├─ Actions ─────────────────────────┤
│  You owe Alex $24.50              │
│  [Pay]  [Spent]  [Invest]         │
├─ Debts ───────────────────────────┤
│  (if any active debts)            │
├─ Recent Activity ─────────────────┤
│  Weekly pay         +$5.00        │
│  Purchase: toy      -$3.50        │
│  Investment          -$5.00       │
│  Credit              +$2.00       │
└───────────────────────────────────┘
```

## Files Changed

| File | Changes |
|------|---------|
| `index.html` | Add `invest` handler to `handleCardAction()`, add Invest button to card actions, add YTD summary section to `renderCardView()`, remove points from card, remove chore entries from activity, add invest label to statement rows, add `.ytd-*` CSS |
| `sw.js` | Bump cache version |

## What NOT to Change

- `writePayment()` internals — invest uses the same flow as spend (negative balanceDelta)
- `paymentBalanceDelta()` — invest returns negative like spend/manual, which is correct
- Weekly pay auto-calculation — leave untouched
- Debt system — leave untouched
- Pay tier settings — leave untouched
- Kid picker — leave untouched

## Validation Checklist

1. Tap "Invest" → prompt for amount → investment recorded, balance decreases
2. YTD summary shows correct earned/spent/invested totals for current year
3. YTD bars scale relative to largest value
4. Recent Activity shows only money movements (no chore log entries)
5. Investment transactions show as "Investment" with debit styling in activity list
6. Credit card no longer shows weekly points
7. Undo after invest → investment removed, balance restored
8. Switching between Alex and Louisa updates YTD summary correctly
9. No console errors

---

# Phase 31 — New App Icon

## Goal

Replace the generic PWA icon with a distinctive, recognizable icon for the Family Hub app. Should look great on both Android and iOS home screens.

## Design Concept

A rounded-square icon with a warm gradient background. Center element: a simple house silhouette (pentagon/chevron roof shape) with three colored dots beneath the roof line representing the family members — blue (Alex), purple (Louisa), green (Jamie the dog). Clean, flat, geometric. Recognizable at 32px.

**Color palette:**
- Background gradient: warm amber/gold (#f59e0b → #d97706) — warm, inviting, distinct from both kid colors
- House silhouette: white, slightly translucent (rgba 255,255,255,0.95)
- Dots: var(--alex) blue (#4a90d9), var(--louisa) purple (#8a5bd1), green (#22c55e)
- Subtle shadow on the house shape for depth

**Shape:** Rounded square (Android adaptive icon safe zone compliant — content within center 66% circle)

## Implementation

### 1. Create SVG source icon

Create `icons/icon-source.svg` — the master icon as an SVG. This is the source of truth for all rasterized sizes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <!-- House shape (centered, within maskable safe zone) -->
  <!-- Roof: chevron/triangle -->
  <path d="M256 120 L370 230 L142 230 Z" fill="rgba(255,255,255,0.95)"/>
  <!-- Body: rectangle below roof -->
  <rect x="172" y="230" width="168" height="130" rx="4" fill="rgba(255,255,255,0.95)"/>
  <!-- Door -->
  <rect x="232" y="290" width="48" height="70" rx="4" fill="url(#bg)" opacity="0.7"/>
  <!-- Three dots (family members) below house -->
  <circle cx="206" cy="400" r="18" fill="#4a90d9"/>  <!-- Alex blue -->
  <circle cx="256" cy="400" r="18" fill="#8a5bd1"/>  <!-- Louisa purple -->
  <circle cx="306" cy="400" r="18" fill="#22c55e"/>  <!-- Jamie green -->
</svg>
```

Codex has creative latitude on the exact proportions, shapes, and visual details — this is a conceptual guide, not a pixel-perfect spec. The key requirements are:
- House shape as the central element
- Three colored dots for family members
- Warm amber/gold background
- Clean and recognizable at small sizes
- Content within the maskable safe zone (center 80% area)

### 2. Generate PNG icons

From the SVG, generate the required PNG sizes. Use an inline `<canvas>` approach in a temporary HTML file, or if Codex has access to a rasterization method:

Required files:
- `icons/icon-192.png` — 192×192 (Android home screen)
- `icons/icon-512.png` — 512×512 (Android splash, PWA install)
- `icons/apple-touch-icon.png` — 180×180 (iOS home screen)
- `favicon-32.png` — 32×32 (browser tab) — currently referenced in index.html but missing

**Alternative approach:** If rasterizing SVG to PNG is impractical in the single-file context, Codex can:
1. Create the SVG file
2. Update manifest.json to reference an SVG icon (modern browsers support this)
3. Keep the existing PNGs as fallback until the user manually converts the SVG

### 3. Update manifest.json

```json
{
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-source.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

### 4. Update index.html meta tags

Ensure these are correct (line ~11-13):
```html
<link rel="icon" type="image/svg+xml" href="icons/icon-source.svg">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
```

## Files Changed

| File | Changes |
|------|---------|
| `icons/icon-source.svg` | New — master SVG icon |
| `icons/icon-192.png` | Replaced — new design |
| `icons/icon-512.png` | Replaced — new design |
| `icons/apple-touch-icon.png` | Replaced — new design |
| `favicon-32.png` | New — browser tab icon |
| `manifest.json` | Updated icon entries |
| `index.html` | Updated favicon meta tags |
| `sw.js` | Bump cache version |

## Validation Checklist

1. SVG icon renders correctly in browser
2. Icon is recognizable at 32px (browser tab)
3. Icon looks good on Android home screen (192px)
4. Icon looks good on iOS home screen (apple-touch-icon)
5. Maskable safe zone: core content visible when Android crops to circle
6. manifest.json references all icon sizes
7. No 404s for icon files

