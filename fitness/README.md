# Steady — your fitness corner

A separate mobile PWA at `/fitness/`, using the Family Hub's existing Firebase
project, family code and anonymous session. Static HTML/JavaScript, no new build
step, no paid AI integration. The user explicitly selected this approach instead
of Next.js/Supabase.

**Access model (user decision, 2026-10-26):** no personal email login. Steady
asks "Who's using Steady?" (currently only **Travis**) and stores that person's
records at `families/{familyId}/fitness/{person}`. Protection is the same as the
rest of the Hub: anyone holding the family code can read it. The user accepted
that; it is family-private, not private from family members.

## Everyday use

- **Today → Log calories:** a name and a calorie number are enough. Enter a total
  you calculated yourself or asked GPT to calculate. Protein/macros are optional.
- **Your regulars:** one tap for one or two servings. Coffee starts with the exact
  description `280 ml coffee + 120 g of 2% milk`; the banana needs a size/weight.
  Both start with **unknown** nutrition. Review once and reuse the values later.
  The app never schedules or automatically adds food.
- **Describe a meal:** write what you ate and leave the calculation for later.
  Ask Codex **“Process my pending fitness meal notes.”** The review queue and
  exported notes preserve your words. The app does not send them to an AI API.
- **Move:** log movement, customize workouts, use a plank timer, and set a nudge.
  Download the recurring calendar event and open it in your phone's calendar for
  closed-app reminders. Calendar app import/notification settings govern alerts.
- **Food:** save per-100-g foods; search USDA; look up or scan packaged barcodes;
  favorite foods; repeat diary entries; create meals and cooked batch recipes.
- **Progress:** weight/waist, metric or imperial input, graphs, and a seven-calendar-
  day average using actual readings. Starting baselines are labeled separately,
  never fabricated as dated measurements.
- **More:** goals, CSV exports, full JSON backup/merge restore, install and switch user.

Defaults are 1,600 kcal / 120 g protein, 171 lb / 37 in baselines, and 160 lb /
35 in goals. These are editable tracking settings. Exercise never adds calories
back. Unknown nutrients stay blank in exports and null/missing in stored data;
one unknown calorie entry makes the remaining budget unknown, while displaying
the known subtotal. Optional unknown macros do not block calorie tracking.

## Run locally

From the repository root, with Node 20+:

```powershell
node scripts/fitness/serve.cjs
```

Open <http://127.0.0.1:4174/fitness/> and choose **Try a session-only demo**.
The same server also serves the Family Hub at <http://127.0.0.1:4174/>. Open
Steady from the activity icon in the Hub header or Home settings → Open Steady;
More → Back to Family Hub returns to that same origin.
Demo records are only in memory and disappear on reload. Online food search
requires a synced person and the server environment below; all manual flows,
review, calculations, reminders, exports and backup work in the demo.

The local preview only serves an explicit public-file allowlist, not arbitrary
repository files. It also hosts the same food endpoint used by Vercel. Set the
environment variables in that shell before starting to test the real endpoint.

## Setup

None beyond the Hub. The existing rules (`families/$familyId`: `auth != null`)
already cover `families/{familyId}/fitness/*`; no rules change is needed.

1. On each phone, open Family Hub and join the family as usual. That saves the
   code in `localStorage['familyChores.familyId']` on this origin.
2. Open `/fitness/` and tap **Travis**. Steady reuses the Hub's persisted
   anonymous session on the default Firebase app (or signs in anonymously),
   confirms `families/{familyId}/config` exists, and subscribes to
   `families/{familyId}/fitness/travis`. The first subscription initializes
   targets, two unreviewed regulars and a simple example workout.
3. The choice is remembered per device (`localStorage['steady.person']`).
   More → **Switch user** forgets it, detaches listeners and returns to the
   picker. It does not sign the Hub out.

To add a person later, extend `PEOPLE` in `fitness/index.html` and add a picker
button; the key becomes their path segment.

## Deploy on the existing Vercel project

The repository already has an existing Vercel deployment. Static files remain
static; `api/fitness-foods.js` is a dependency-free Node serverless function.

In that Vercel project's Settings → Environment Variables, set:

| Variable | Value |
| --- | --- |
| `FIREBASE_WEB_API_KEY` | The **existing** Firebase web API key from `firebase-config.js`. It identifies the project; it is not an Admin/service-account secret. |
| `FIREBASE_DATABASE_URL` | The existing `databaseURL` from `firebase-config.js`. Used to confirm the caller's family code exists. |
| `USDA_API_KEY` | Your free [FoodData Central API key](https://fdc.nal.usda.gov/api-guide/). Keep it server-only. |

Retain the existing deployment mechanism for the ignored `firebase-config.js`:
it must be served publicly at the repository root as it already is for the Hub.
If deploying from a new Git checkout, restore that config through your existing
deployment process. It contains public Firebase app identifiers, **not** an Admin
key or USDA secret. Never put USDA or service-account keys in that file.

Add the deployed host to Firebase Authentication → Settings → Authorized domains
if needed. Redeploy the existing Vercel project after environment changes using
its normal Git push or Vercel workflow. Visit `<existing-origin>/fitness/`.
No Vercel rewrite, framework preset or new Firebase project is needed.

For a direct CLI deployment, prepare an isolated public-file directory first:

```powershell
node scripts/fitness/package-hub.cjs
```

This copies the public Hub/Steady assets, food endpoint, existing package files,
and existing Vercel project link into a new temporary directory. It prints that
directory and the exact file list. From a shell with working Vercel access, use
`vercel --prod --cwd "THE_PRINTED_DIRECTORY"` to deploy the existing project.
Staging is local only; it does not deploy anything. Avoid deploying the whole
working directory, which also contains private admin tooling and local files.

The endpoint accepts only authenticated POSTs. It validates the Firebase token
through the project's `accounts:lookup`, then reads
`families/{familyId}/config?shallow=true` with that same token and requires it to
exist (the same bar as the Hub), and requests USDA/OFF on the server. It returns normalized nutrients,
never keys or raw upstream errors. Responses are `private, no-store`. Its 30/min
in-memory throttle is per function instance; upstream rate limits remain relevant.
If you restrict the Firebase web key, allow the Identity Toolkit API and ensure
server calls are permitted by those restrictions.

Branded USDA foods and Open Food Facts results require confirmation of the gram
basis before saving. Liquid nutrition can be per 100 ml: weigh that volume and
enter the actual grams, or use a per-serving regular instead. The app does not
assume a liquid density or silently treat millilitres as grams.

GitHub Pages can host the shell and manual Firebase flows, but cannot run this
server endpoint. Use Vercel for the complete app; do not put a USDA key into
client code to make Pages search work. Neither database rules nor real food
search are bypassed in the demo.

## Install, offline behavior and camera

On Android Chrome, open `/fitness/` over HTTPS → menu → Add to Home screen →
Install. The manifest has its own start URL/scope and 192/512px icons. On localhost
the secure-context exceptions allow local PWA testing.

The fitness worker caches **only** public shell assets. The Hub worker now also
uses a public asset allowlist, excludes fitness/API requests, and preserves
sibling caches. Both workers must have updated before testing a deployed upgrade
from an older Hub version: reload the Hub once, then open `/fitness/`.

Health records and API responses are never cached by these workers. The offline
shell opens a fresh session-only demo; real data sync/editing needs network and
the Firebase SDK. Real edits are blocked while disconnected, leaving an open
form intact. Local demo entries are not an offline durable backup.

Camera scanning uses feature-detected `BarcodeDetector`/`getUserMedia` and works
in supporting Android Chrome versions. Frames stay on device. Closing the panel,
changing visibility, navigating away or a 60-second timeout stops the stream.
The printed barcode input is always available, including on unsupported browsers.
Actual camera and Android installation need a physical-device check.

## On-request nutrition processing with Codex

Existing recipe admin setup is reused: `scripts/recipes/node_modules/firebase-admin`
and its ignored `scripts/recipes/service-account.json` plus the root Firebase
config. If those dependencies are missing, follow `scripts/recipes/README.md`;
there is no new service-account key to configure. These tools run locally, never
inside a web deployment. The family ID comes from the same resolution as the
recipe tools (`--family`, `FAMILY_ID`, or `scripts/recipes/family-id.txt`). The
person defaults to `travis`; set `FITNESS_PERSON` for anyone else:

```powershell
node scripts/fitness/review-meals.cjs list
```

The command prints only pending descriptions, associated diary snapshots,
regulars and `expectedLogHash` values for that person. When you ask Codex to process
notes, it should read them, check reliable labels or online sources as needed,
ask about unknown quantities instead of guessing, and prepare a reviewed batch
under `fitness-inbox/`. It should preserve the coffee's 280 ml and 120 g exactly;
volume must not silently become mass. Source-derived estimates must be identified
as estimates, with assumptions exposed for your review.

Review JSON is an array of:

```json
[
  {
    "noteId": "ID_FROM_LIST",
    "expectedLogHash": "HASH_FROM_LIST",
    "nutrition": { "calories": null, "protein": null, "carbs": null, "fat": null },
    "source": "Specific label/USDA food ID or URL, calculation and any assumptions",
    "updateRoutine": false
  }
]
```

Replace only confirmed numbers. Values are totals for the **entire logged entry**.
If two coffees were logged, enter the two-coffee total; `updateRoutine: true`
divides by the logged serving count for the future per-coffee regular. The script
rejects all-empty nutrition. Leave fully unresolved notes out of the batch.

```powershell
node scripts/fitness/review-meals.cjs apply fitness-inbox/review.json
node scripts/fitness/review-meals.cjs apply fitness-inbox/review.json --confirm
```

The first command is a dry run. The second commits using a transaction under
`families/{familyId}/fitness/{person}`, rechecking the pending status and snapshot hashes to
avoid overwriting an intervening edit. It changes only reviewed diary fields,
review metadata and explicitly selected regulars. It never rewrites other
historical logs or family records. Complete calories clear the pending status;
optional unknown macros stay unknown. No background processing runs.

Without admin access, More → Export pending meal notes gives descriptions to
process offline. Enter the reviewed values through Food → Needs review → Review,
or directly use **Log calories** for a GPT-calculated total. Updating the regular
is an explicit checkbox. Exporting a full JSON backup preserves all collections;
restore validates and merges matching records/settings, rather than deleting
unrelated entries. All exported health data is personal; keep it privately.

## Tests and live checks

Use the installed repository Playwright tooling; runtime needs no install/build:

```powershell
node --test fitness/tests/nutrition.test.cjs fitness/tests/api.test.cjs
node node_modules/@playwright/test/cli.js test --config fitness/playwright.config.cjs
```

Tests use session-only fixtures and mock external services, never production
family data. Covered: mass/measurement units, missing vs zero, recipe density,
calendar-day averages, CSV injection, backup validation, review transactions,
family-code API authorization, person picker/family path scoping, upstream
failures, cache allowlists, and browser
food/meal-note/regular/workout/measurement/reminder/export flows.
Offline service-worker reload runs in Chromium/Android. The Windows Playwright
WebKit engine reports an internal error for that emulated offline navigation,
so that one iOS case is explicitly skipped; its other flows still run.

After live setup, manually verify two-device sync, that the Hub still works after
Switch user, USDA results/units against the source, a known
packaged barcode, camera permission denial and cleanup, install, airplane mode,
and the imported phone calendar notification. Mock tests do not establish that
live rules, device permissions, credentials or calendar notifications work.

Food sources: [USDA API guide](https://fdc.nal.usda.gov/api-guide/),
[Open Food Facts product API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/v2/products/get-product-by-code/)
and [database license](https://world.openfoodfacts.org/terms-of-use).
Future image estimates: [`photo-adapter.md`](photo-adapter.md).
