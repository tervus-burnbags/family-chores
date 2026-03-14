# Family Chore Tracker — PWA Implementation Plan

## Context

Two parents (Android + iPhone) track chores for two kids using paper charts. The goal is a voice-first, chat-style Progressive Web App that minimizes friction — speak naturally to log chores, award points, track balances, and manage what's owed. No LLM APIs; the domain is narrow enough for rule-based NLP. Firebase provides free real-time sync between devices. This plan is designed for Codex to implement.

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
| NLP | Rule-based intent parser | Constrained domain (~2 kids, ~20 chores) — no LLM needed |
| Hosting | GitHub Pages | Free, HTTPS (required for PWA + Speech API) |
| CSS | Embedded in index.html, mobile-first | Single file keeps things simple |

---

## Project Structure

```
chores/
├── index.html          # Entire app (HTML + CSS + JS)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline caching
├── firebase-config.js  # Firebase project config (separate for easy swapping)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── alex_chart_v2.docx  # (existing reference)
└── louisa_2page.odt    # (existing reference)
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
- Chore `points` values are stored in config and editable — when a parent says "change feed dog to 2 points", the config is updated and future logs use the new value
- `date` and `week` strings are pre-computed on write so Firebase queries stay simple

---

## Intent Parser — Full Specification

The parser is the core of the conversational UX. It must handle these intent categories:

### Intent 1: Log a known chore
- "Alex fed the dog this morning" → `{ kids: ["alex"], choreId: "feed_dog_am", points: 1 }`
- "Both kids made their beds" → two entries
- "Louisa wiped surfaces and matched socks" → two entries for Louisa

**Parsing steps:**
1. Normalize: lowercase, strip filler words (um, uh, like, so, well)
2. Extract kid names: "alex", "louisa", "lou", "both", "both kids", "the kids", "everyone" → resolve to kid ID(s). If none found, ask "Which kid?"
3. Match chore: tokenize utterance, score against each chore's keyword list using token-overlap (fraction of keyword phrase tokens found in utterance). Best match > 0.5 threshold = match. If 0.3–0.5, ask to confirm. Below 0.3, try ad-hoc or free-points patterns.
4. Time inference: "this morning" / before noon → AM chores; "tonight" / "this evening" / after noon → PM chores; "yesterday" → adjust date
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
- **High confidence** (all fields resolved): "Got it! Alex fed the dog this morning — 1pt. [Undo]"
- **Medium confidence**: "Did you mean Alex fed the dog? [Yes / No]"
- **Missing info**: "Which kid?" or "How many points?"
- **No match**: "I didn't catch that. Try again or type it out?"
- **Duplicate warning**: "Alex already fed the dog this morning. Log again? [Yes / No]"

---

## UI Specification

### Layout (mobile-first, single screen)

```
┌──────────────────────────────────┐
│  Family Chores    [📊] [⚙️]      │  ← Header: app name, scoreboard toggle, settings
├──────────────────────────────────┤
│                                  │
│  Chat history (scrollable)       │  ← Messages from system + user utterances
│                                  │
│  ┌─ system ─────────────────┐    │
│  │ Good morning! What chores │    │
│  │ have been done today?     │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌─ you ────────────────────┐    │
│  │ Alex fed the dog          │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌─ system ─────────────────┐    │
│  │ ✓ Alex — Feed dog (AM)    │    │
│  │   1pt                [Undo]│   │
│  └──────────────────────────┘    │
│                                  │
├──────────────────────────────────┤
│  [Type or speak...    ]  [🎤]   │  ← Input bar: text field + mic button
└──────────────────────────────────┘
```

### Scoreboard panel (slides down from header when 📊 tapped)

```
┌──────────────────────────────────┐
│  This Week (Mar 9–15)           │
│                                  │
│  Alex     14pts    $3 earned     │
│  ████████░░░░░░    next: 20pts   │
│                                  │
│  Louisa    9pts    $2 earned     │
│  █████████░░░░░    next: 12pts   │
├──────────────────────────────────┤
│  Balances                        │
│  Alex owed: $12.00      [Pay]    │
│  Louisa owed: $8.00     [Pay]    │
│                                  │
│  Louisa owes Alex: $2  [Settle]  │
└──────────────────────────────────┘
```

### Settings panel (⚙️)

- Edit chore list (add/remove/rename chores, change point values)
- Edit pay tiers per kid
- Edit monthly bonus thresholds
- View full log history with filters (by kid, by date range)
- Family code display + share link
- Reset/recalibrate for new age (prompted on birthdays)

### Visual design guidelines
- Clean, light theme with good contrast
- Kid-specific accent colors (e.g., blue for Alex, purple for Louisa)
- Large tap targets (48px minimum) — parents are using this one-handed on phones
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

- Weekly pay calculated when the week rolls over (detected on app open — check if summary exists for prior week, if not, compute and write it)
- Monthly bonus checked every 4 weeks from a configurable start date
- On a kid's birthday, the app shows a chat message: "Louisa turned 5! Want to update her pay tiers?" with a link to settings

---

## Firebase Setup Instructions (for Codex / developer)

1. Go to console.firebase.google.com, create project "family-chores"
2. Enable **Realtime Database** (start in test mode, then apply rules below)
3. Enable **Authentication** → Sign-in method → **Anonymous** (enable it)
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
2. Mobile-first CSS embedded in `<style>` — clean, light theme, kid accent colors (blue for Alex, purple for Louisa), 48px min tap targets
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
3. Implement all 9 intent types from the "Intent Parser — Full Specification" section:
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

**Test it:** Type "Alex fed the dog" → see confirmation with 1pt. Type "both kids made beds" → see two confirmations. Type "Alex gets 3 points" → see freepoints entry. Type "change feed dog to 2 points" → check Firebase config updated. Type "undo" → see entry removed.

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

**Test it:** On Android Chrome, tap mic, say "Alex fed the dog" → see it transcribed and logged. On iPhone Safari, same test (requires iOS 14.5+).

---

### Phase 4: Scoreboard + Pay + Balances
**Files to modify:** `index.html` (add JS + HTML panel)

**What to build:**
1. Scoreboard panel: hidden by default, slides down when 📊 header button is tapped
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
   - Edit pay tiers per kid (table of minPts → $amount)
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

1. **Text input**: Type "Alex fed the dog" → verify log entry appears in Firebase and chat confirms
2. **Voice input**: Tap mic, say "Both kids made their beds" → verify two entries logged
3. **Free points**: Type "Alex gets 3 points" → verify freepoints entry, 3pts added to weekly tally
4. **Ad-hoc chore**: "Louisa swept the porch, 2 points" → verify adhoc entry with label
5. **Change points**: "Change feed dog to 2 points" → verify config updated in Firebase, next log uses 2pts
6. **Scoreboard**: Check weekly tally matches logged entries
7. **Balance**: Log enough points for weekly pay, verify balance increases
8. **Payment**: "I paid Alex $6" → verify balance decreases
9. **Debt**: "Louisa owes Alex $2" → verify debt record; "settle" → verify marked settled
10. **Undo**: Log a chore, say "undo" → verify entry removed
11. **Cross-device sync**: Open on two devices with same family code, log on one, verify appears on other
12. **Offline**: Turn off network, log a chore, turn network back on, verify it syncs
13. **PWA install**: On Android Chrome and iOS Safari, verify "Add to Home Screen" works
14. **Birthday**: Set a kid's birthday to today's date, reload app, verify birthday prompt appears
