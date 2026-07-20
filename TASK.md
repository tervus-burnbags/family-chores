# Task: Phase 43 — Around Charlotte (curated local events)

**Task Type:** feature
**Model Mode:** default
**Implementer:** Codex (architect = Claude; do not have Claude implement)

## Summary

Add a third section to the **Home (bulletin) tab**, below the existing "Coming Up" calendar block: **Around Charlotte** — a short, curated list of local events (things needing tickets or that are one-off/unique) that the family might want to do.

Events are **not** user-authored in the app. Claude researches them on request and bulk-pushes them to Firebase via a new admin script. The app's only job is to **display them and capture one family verdict per event**: Interested / Going / Not for us. Those verdicts are read back by Claude on the next research pass to tailor future suggestions — so the verdict data is the whole point, not a nicety.

Two deliverables:
- **Part A** — the Home-tab UI + Firebase read/verdict-write (`index.html`)
- **Part B** — admin scripts under `scripts/events/` (mirrors `scripts/recipes/`)

The canonical data shape is already written: **`EVENTS_SCHEMA.md`** at repo root. Read it first; do not redesign the schema.

---

## Context: what already exists (reuse — do not reinvent)

**Home tab rendering, all in `index.html`:**
- `renderBulletin()` (~line 8600-8695) builds `container.innerHTML` as: toolbar + compose + notes grid + `.bulletin-divider` + `Coming Up` head + `renderCalendarSection(calendarState)`. **Append the new section after that**, separated by another `.bulletin-divider`.
- `renderCalendarSection(calendarState)` (~8194) — the pattern to copy for status/empty/error states.
- `escapeBulletinHtml(...)` — use for **every** interpolated value, including `url`.
- `.hub-section-head`, `.bulletin-divider`, `.bulletin-btn` / `.bulletin-btn.secondary`, `.calendar-empty`, `.hub-empty` — existing classes, reuse them.
- Click handling is **delegated** on `document` (~8697+) with `event.target.closest(...)` and a `data-*` attribute per action. Follow that exact pattern; do not attach per-card listeners.
- `runtime()` → phase runtime; `phase.familyId`; `dbPath('...')` for family-scoped paths.
- `showToast(text, { onUndo: fn })` (~5619) — toast with Undo.
- The Firebase subscription list is at ~line 4819: `['config', 'balances', 'bulletin/notes'].forEach(...)`. **Add `'events'` there** so the section live-syncs across devices like everything else.

**Admin script pattern:** `scripts/recipes/{_lib.js, import-recipe.js, list-recipes.js, fetch-recipe.js, README.md}`. `_lib.js` resolves the service-account key, the database URL (parsed out of `firebase-config.js`), and the family ID (arg → env → `family-id.txt`). Mirror this structure and its error messages closely.

---

## Part A — Home tab UI

### A1. Data load

- Subscribe to `families/{id}/events` alongside the existing bulletin subscriptions (~4819). Live updates, same as notes.
- Normalize into an array (Firebase gives an object map). Guard against every field being missing — this data is written by an external script and a malformed record must not blank the Home tab.
- **Filter out expired:** drop events where `endDate` (or `startDate` if no `endDate`) is before today, comparing date-only, local time. Expired events stay in the DB — the app just hides them; pruning is the script's job.
- **Filter out dismissed:** events with `verdict === "no"` do not render in the main list (see A4).
- **Sort:** `going` first, then everything else by `startDate` ascending. Within a group, ties break on `startDate` then `title`.

### A2. Section shell

```
──────────── (divider)
Around Charlotte                    [n dismissed]
  <cards>
```

- Heading `Around Charlotte` using `.hub-section-head`, matching the "Coming Up" head markup.
- **Empty state** (no events at all): reuse the `.calendar-empty` shape — `<strong>No events right now.</strong><p>Ask Claude to look for things happening around Charlotte.</p>`. No button; there's no in-app way to trigger research.
- If every event is dismissed or expired, show the same empty state plus the dismissed toggle.

### A3. Event card

Collapsed (default) — the scan state:

```
┌────────────────────────────────────────┐
│ Carolina Renaissance Festival          │
│ Oct 4 – Nov 23, weekends only          │
│ Huntersville, ~25 min  ·  $28 / $14    │
│ Outdoor festival with jousting,        │
│ artisan booths, and food stalls.       │
└────────────────────────────────────────┘
```

- Title, then `dateText` verbatim (**never** reformat it — it's authored to carry fuzzy ranges like "weekends only"), then `where · cost` on one line, then `blurb`.
- Whole card is the expand/collapse tap target. Expanded state is **local view state only** — do not persist it to Firebase.
- Only one card expanded at a time (accordion). Expanding one collapses the others.

Expanded adds:
- `why` paragraph.
- `ticketNote`, if present, visually distinguished as the time-sensitive line (warning-ish treatment — there's an existing `--warning` token).
- **"More info"** link button → `url`, `target="_blank" rel="noopener noreferrer"`.
- The three verdict buttons (A4).
- Omit any optional field that's missing — never render an empty row or a stray `·` separator.

**Typography:** use the existing type-scale tokens (`--font-sm`, `--font-xl`, etc.). No hardcoded `px` font sizes and nothing below `--font-sm` — small text has been a repeated problem in this app.

### A4. Verdict buttons

Three mutually exclusive buttons, visible when a card is expanded:

```
  [ Interested ]  [ Going ]  [ Not for us ]
```

- **One shared family verdict per event** — not per person. Last tap wins; whoever taps sets it for everyone. This is deliberate.
- Writes `verdict` + `verdictAt` (epoch ms) to `families/{id}/events/{eventId}`. Update only those two fields — never overwrite the event body.
- Tapping the already-active verdict **clears it** back to `null` (toggle off).
- The active verdict renders in a selected state. Since verdict is shared, it must reflect the live Firebase value, not local optimistic state alone — a change made on the other parent's phone has to show up here.

**Per-verdict behavior:**
- `interested` — card stays in place, marked. That's all.
- `going` — card sorts to the top with a clear "Going" marker. **Nothing else happens** — no auto-pinned note, no calendar write. Adding the real date to Google Calendar stays manual.
- `no` — card leaves the main list immediately, with a `showToast('Dismissed <title>', { onUndo: ... })` where Undo restores `verdict` to its prior value.

**Dismissed events** are reachable via a small toggle in the section header (`3 dismissed`) that expands a collapsed list of dismissed cards, each with a way to un-dismiss. They're kept, not deleted — the `"no"` history is exactly what Claude reads to avoid re-suggesting that kind of thing.

### A5. Service worker

Bump `sw.js` cache version: `hub-v61` → `hub-v62`.

---

## Part B — `scripts/events/`

Mirror `scripts/recipes/` structure, conventions, and error-message style. Own `package.json` (`firebase-admin` only) and own `npm install`. Reuse `scripts/recipes/_lib.js` **as a reference to copy from**, not by importing across directories.

Validate every record against `EVENTS_SCHEMA.md` before writing; on a schema failure print clear per-record errors and **write nothing**.

### `import-events.js`

```powershell
node import-events.js path\to\batch.json
node import-events.js path\to\batch.json --family ABCD1234
```

- Input is a **JSON array** of event objects (a batch, not one file per event — this is the main difference from `import-recipe.js`).
- Generates `id` (`evt_` + 8 chars) and sets `addedAt` for each.
- Initializes `verdict` and `verdictAt` to `null`.
- **Must not clobber verdicts.** If an incoming event matches an existing one (same `url`, or same normalized `title` + `startDate`), skip it and report `skipped (already present)`. Never blind-overwrite the `events` node.
- Prints a summary: imported / skipped, with ids.

### `list-events.js`

**This is the feedback-loop reader — the most important script here.** Claude runs it before every research pass.

```powershell
node list-events.js
node list-events.js --json
node list-events.js --json --active-only
```

- Human mode: table of title, `dateText`, verdict, tags.
- `--json`: full records including `verdict`, `verdictAt`, and `tags`, so reaction patterns are analyzable by tag.
- By default includes expired events (the history is the signal); `--active-only` to exclude them.

### `prune-events.js`

```powershell
node prune-events.js --before 2026-06-01
node prune-events.js --before 2026-06-01 --confirm
```

- Deletes events whose end date precedes the cutoff. Defaults to a dry run listing what *would* go; requires `--confirm` to actually delete.
- **Keeps `"no"`-verdict events regardless of age** unless `--include-dismissed` is passed — that history is the tailoring signal and shouldn't be silently discarded.

### `events-inbox/`

Create with a `README.md` (batch JSON drop point + the Claude workflow) and a `.gitkeep`. Add `events-inbox/_tmp-*.json` to `.gitignore`.

### `scripts/events/README.md`

Same shape as the recipes README: setup, service-account instructions, family-id resolution, per-script docs, and a **"The Claude Workflow"** section documenting the actual loop:

1. Claude runs `list-events.js --json` and reads current events + verdict history.
2. Claude web-searches Charlotte-area events, honoring the curation rules in `EVENTS_SCHEMA.md` and steering by past verdicts (avoid tags repeatedly marked `no`, favor tags marked `going`).
3. Claude writes a batch array to `events-inbox/_tmp-batch.json`.
4. Claude runs `import-events.js events-inbox/_tmp-batch.json`.
5. New cards appear on Home; family reacts; verdicts feed step 1 next time.

---

## Explicitly OUT of scope

- Any in-app way to create or edit an event body. The app writes `verdict`/`verdictAt` and nothing else.
- Per-person reactions. One family verdict — decided.
- Writing to Google Calendar, or auto-creating notes/list items from an event.
- Scheduled/automatic research runs. Triggered ad hoc by the user asking Claude.
- Push notifications or "new events" badging.
- Filtering, search, or a dedicated events tab. It's one section on Home.
- Images or thumbnails on cards. Text only.

---

## Test Focus

Direct Gemini's review at these areas:

1. **Malformed data resilience** — an event record missing `why`, `url`, `tags`, or with a garbage `startDate` must render gracefully (or be skipped) and **must not blank or break the Home tab**, since notes and calendar share that view. Try an empty `events` node, a `null` child, and a non-object child.
2. **Verdict sync across devices** — set a verdict on device A; device B's card reflects it without a manual refresh. Then set a *different* verdict on B and confirm A follows. This is the single-shared-verdict model working as intended, including the last-tap-wins overwrite.
3. **Verdict writes are surgical** — after setting a verdict, dump the event node and confirm `title`/`blurb`/`why`/`tags`/`url` are untouched and only `verdict` + `verdictAt` changed.
4. **Import never clobbers verdicts** — set verdicts on several events, re-run `import-events.js` with a batch containing those same events plus new ones. Existing events keep their verdicts and are reported skipped; only genuinely new ones import.
5. **Dismiss + undo** — "Not for us" removes the card immediately, toast Undo restores it to its *previous* verdict (including back to `null`, not to `interested`). Dismissed events appear under the dismissed toggle and can be un-dismissed.
6. **Expiry boundary** — an event whose `endDate` is *today* still shows; one that ended *yesterday* does not. Check a single-day event with no `endDate` on its own date. Verify against local time, not UTC — a late-evening test shouldn't hide today's event.
7. **`dateText` renders verbatim** — `"Oct 4 – Nov 23, weekends only"` and `"Every 3rd Friday"` display exactly as authored, never reformatted or replaced by the ISO dates.
8. **Sort + accordion** — `going` events pin to the top; the rest are date-ascending. Expanding a card collapses any other open one.
9. **Escaping** — an event with `<script>` or quotes in `title`/`blurb`/`url` is escaped, and the "More info" link carries `rel="noopener noreferrer"`.
10. **Typography** — no hardcoded font sizes, nothing smaller than `--font-sm`, consistent with the Coming Up section directly above it.
11. **`prune-events.js` safety** — dry run by default; `"no"`-verdict events survive a prune unless `--include-dismissed`.
12. **No regressions** — pinned notes (add/delete/rotation), the Coming Up calendar block, its retry/open-settings buttons, and the other tabs all still work. Confirm the `sw.js` bump to `hub-v62` actually serves fresh HTML.
