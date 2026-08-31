# Events Admin Scripts

Node scripts that read and write the curated local events shown in the **Around Charlotte** section on the Home tab. These are the tools an AI assistant (Claude, Codex, or any other) uses to push a researched batch of events into Firebase and to read the family's reactions back.

Nothing here is assistant-specific: the scripts are plain Node CLIs, and the workflow below is the whole contract. Any assistant that can run a shell command and do web research can drive it.

The in-app side is read-only for the event body — the app only ever writes the two reaction fields, `interest` and `plan`. All event authoring happens here.

Canonical data shape: [`../../EVENTS_SCHEMA.md`](../../EVENTS_SCHEMA.md).

## One-Time Setup

### 1. Install dependencies

```powershell
cd scripts\events
npm install
```

(`firebase-admin` is the only dependency.)

### 2. Service-account key

These scripts look for `service-account.json` in **this** directory first, then fall back to `scripts/recipes/service-account.json`. If you already set up the recipes scripts, **there is nothing to do here** — the existing key is reused.

Otherwise: Firebase Console → `family-chores-2e3f4` → Project Settings → **Service Accounts** → **Generate New Private Key**, and save it to `scripts/events/service-account.json`.

Both paths are gitignored. **Do not commit the key** — anyone holding it has admin access to the database.

### 3. Family ID

Same fallback chain: `scripts/events/family-id.txt`, then `scripts/recipes/family-id.txt`, or use `--family ABCD1234` / the `FAMILY_ID` env var. Again, already covered if the recipes scripts are set up.

## Scripts

### `list-events.js`

Read current events **and the family's reactions**. This is the feedback-loop reader — run it before researching anything new.

```powershell
node list-events.js
node list-events.js --json
node list-events.js --json --active-only
```

Expired events are included by default; the reaction history is exactly what makes the next batch better. `--json` adds a `tagSummary` block with per-tag counts — the fastest read on what this family actually says yes to.

The summary reports `interested` / `notForUs` / `undecided` from **interest**, plus `going` / `notThisTime` from **plan**. Only the interest counts are a signal about the category: see "Two axes, not one" in `EVENTS_SCHEMA.md`. A tag with a pile of `notThisTime` and no `notForUs` is one they like and keep missing — keep pitching it.

### `import-events.js`

Push a batch of new events.

```powershell
node import-events.js ..\..\events-inbox\_tmp-batch.json
node import-events.js batch.json --dry-run
node import-events.js batch.json --family ABCD1234
```

Input is a **JSON array** of event objects. Every record is validated against `EVENTS_SCHEMA.md` before anything is written — one bad record aborts the whole batch.

Generates `id` (`evt_…`) and `addedAt`, and initializes `interest`/`interestAt`/`plan`/`planAt` to `null`.

**Reactions are never clobbered.** An incoming event matching one already in the database (same `url`, or same normalized `title` + `startDate`) is skipped and reported, so a re-run is safe. Duplicates *within* the incoming batch are caught too. Writes are child-keyed, so the `events` node is never wholesale replaced.

### `migrate-verdicts.js`

One-shot backfill from the pre-split single `verdict` field to `interest` + `plan`. Already run against the live family; kept for reference and for any other family created before the split.

```powershell
node migrate-verdicts.js
node migrate-verdicts.js --confirm
```

Dry run by default. Safe to re-run — records that already carry an `interest` are skipped.

### `prune-events.js`

Delete past events.

```powershell
node prune-events.js --before 2026-06-01
node prune-events.js --before 2026-06-01 --confirm
node prune-events.js --before 2026-06-01 --confirm --include-dismissed
```

Dry run by default — requires `--confirm` to actually delete. Events with `interest: "no"` are **kept regardless of age** unless `--include-dismissed` is passed; that dismissal history is what stops a future research pass from re-suggesting things already turned down. Undated events are never auto-pruned.

## The Research Workflow

Run by whichever assistant the family asks ("go find some Charlotte events"). This is a **review-then-add** loop, not an append-only one — always read the existing state before writing. Follow these steps in order.

**1. Review what's already there.**

```powershell
node list-events.js --json
```

Read all of it before researching. Specifically note:
- **`interest: "no"` events** — never re-suggest these, or close variants of them.
- **`interest: "yes"` events** — the family liked these; find more in the same vein, whether or not they ended up going.
- **`plan: "not-going"` events** — declined for that date only. Says nothing about the category; do not treat it as a negative.
- **The `tagSummary`** — a tag with several `notForUs` and no `interested` is a category to stop pitching. A tag with `interested` or `going` is one to lean into.
- **What's still live and undecided** — don't re-add it.
- **Anything expired** that's worth clearing out (see prune below).

**2. Research.** First check the priority artist/team watches in `EVENTS_SCHEMA.md`, then web-search Charlotte-area events per the remaining curation rules — note both the SouthPark and Camp Lake James home-base rules, the family music signal, the "don't over-filter" rule, and the requirement to verify every date and price against an official source.

**3. Write the batch.** A JSON array to `events-inbox/_tmp-batch.json`.

**4. Dry run.**

```powershell
node import-events.js ..\..\events-inbox\_tmp-batch.json --dry-run
```

Confirms what's genuinely new vs. already present. If something you expected to be new comes back "skipped," it's already in the database — that's the dedupe working, not an error.

**5. Import.** Same command without `--dry-run`.

**6. Report back to the family** — list what was added and what was skipped and why. Mention anything you deliberately left out (unconfirmed date, already dismissed) so they can overrule you.

New cards appear on Home within seconds via the live listener. The family reacts; those verdicts feed step 1 next time.

**Housekeeping:** every few passes, clear out old events with `prune-events.js --before <a few months ago> --confirm`. Dismissed events survive this by design — that history is what prevents re-suggesting things already turned down.

Occasionally: `node prune-events.js --before <a few months ago> --confirm` to clear out stale past events.

## Troubleshooting

- **`Missing service-account.json`** — see setup step 2.
- **`PERMISSION_DENIED`** — the service account lacks access, or the database rules block `families/{id}/events`. Note the app also needs *client* write access to `verdict`/`verdictAt` for reactions to save.
- **Events don't appear in the app** — confirm the family ID matches the one you're signed into, and force-refresh (the service worker caches `index.html`).
- **Everything reported "skipped"** — the batch is already in the database. Check with `list-events.js`.
