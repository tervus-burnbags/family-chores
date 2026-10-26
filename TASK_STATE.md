# Task State - Family Hub

## Claude rollout progress (2026-10-26)

- **User changed the access model:** no email login. Steady reuses the Hub family
  code + anonymous session, shows a "Who's using Steady?" picker (Travis only),
  and stores at `families/{familyId}/fitness/travis`. Family-level privacy was
  explicitly accepted. No Firebase rules change and no Email/Password provider.
  `prepare-rules.cjs` removed; API now checks token + family config exists.
- **Live:** `https://family-chores-psi.vercel.app` (`/` and `/fitness/`), latest
  deployment `family-chores-gya5tr0hg-…`. First Claude deploy was
  `family-chores-6khffxr3j-…`; pre-Claude rollback target
  `family-chores-51uv2pq6c-tervus-burnbags-projects.vercel.app`.
- Vercel env (production, non-sensitive public values): `FIREBASE_WEB_API_KEY`,
  `FIREBASE_DATABASE_URL`. **`USDA_API_KEY` not set** → USDA name search 503s.
- Live checks with a fresh anonymous token: barcode lookup 200 (real family),
  403 (fake family), 401 (bad token); anonymous read of the Steady path 200.
  Picker present, email form gone. Tests: 25/25 Node, 80 Playwright passed,
  1 iOS offline skipped. Not yet tried on a physical phone.
- Event refresh not imported; dry run shows 8 new / 4 already live;
  before-snapshot at `events-inbox/_tmp-before-2026-10-26.json` (ignored).

## Handoff to Claude (2026-10-26)

- User explicitly asked Claude to take over the live rollout and requested a
  handoff file. Start at `CLAUDE_HANDOFF.md`.
- Resume in this working tree; new app files are uncommitted/untracked and the
  researched event batch is ignored. Do not rebuild or assume a fresh clone has
  them. No production deployment, event import, or private rules change succeeded.
- Claude is authorized by the latest user request to finish deployment, private
  activation and the event refresh. Older role restrictions in archived task
  details do not supersede that request.
- Codex is stopping implementation/deployment work here as requested.

## Active request — Hub fitness integration and Charlotte refresh (2026-10-26)

- User authorized adding Steady to the Hub and refreshing upcoming local events.
- 2026-10-26 access diagnosis: explicitly confirmed
  `CODEX_SANDBOX_NETWORK_DISABLED=1` in this Codex session. Bounded connection
  checks to `oauth2.googleapis.com` and `api.vercel.com` both return `EACCES`.
  This is evidence of a local command-network restriction, not a demonstrated
  Firebase outage, revoked service-account key, or Vercel project failure.
  The existing Firebase service-account file and staged deployment are present.
  User-level Codex config is readable; no network-enabling entry was found.
  Do not rotate credentials or require new plugins solely because of this error.
  User must enable command network access through the host's permissions/config
  and refresh/reopen the session before deployment/import can resume.
- Local implementation complete: header fitness icon plus Home settings → Open
  Steady, with a same-origin return link. Unified preview serves both `/` and
  `/fitness/` at `http://127.0.0.1:4174/` (left running for the user's preview).
- Production access check: Firebase OAuth and Vercel CLI requests fail with
  network `EACCES`; GitHub CLI also reports an invalid stored token. Firebase and
  Vercel integrations were offered; neither connection is confirmed yet.
- Event draft complete: `events-inbox/_tmp-refresh-2026-10-26.json` contains 11
  local candidates and one Robbie Williams priority watch. All 12 pass schema
  validation with no intra-batch duplicate keys. See `EVENTS_REFRESH_2026-10-26.md`
  for official sources, unresolved prices, exclusions, and the exact next steps.
- Status: live deployment/import BLOCKED on external access. Current reactions
  could not be read, so live history review and duplicate checking remain
  required before any import. No events or reactions were written/deleted.
- An actual production deployment attempt using an isolated 20-file public-only
  staging directory failed while retrieving the Vercel project (`EACCES`), before
  any successful upload/deployment. No live deployment was verified.
- Regenerate the deployment directory with `node scripts/fitness/package-hub.cjs`.
  The prepared copy at `C:\Users\tlb32\AppData\Local\Temp\family-hub-deploy-AK6Lyj`
  contains exactly the declared 20 public files, with no unexpected files.
- Checks: 9/9 new Hub-navigation/public-file browser cases across desktop,
  Android and iPhone; 25/25 calculation/API/security checks; inline JS parses;
  manifest parses; scoped whitespace checks pass. Both preview routes return 200.
- Next: once Firebase/Vercel connections are confirmed, inspect their capabilities,
  resume the existing-project deployment and live event-history review/import.
  Private fitness account/rules/API environment setup remains as documented.
- Prior task history and unrelated changes remain below.

## Active work — Private fitness MVP (2026-10-26)

- Status: MVP built and verified locally; live activation awaits the documented
  existing-project account/rules/environment setup. No production data/rules were
  changed and nothing was deployed.
- Plan: `FITNESS_PLAN.md` (incremental implementation and verification).
- Scope: separate `fitness/` PWA, owner-only data namespace, secret-protecting
  food lookup endpoint, calculation/browser tests, setup/export documentation.
- Existing Phase 43 state and unrelated work are preserved below.
- Instruction gap: referenced `../AI_COMMAND/` files are absent.
- User refinements implemented: simple manual calorie totals (protein optional),
  one/two-serving coffee and banana regulars, plain-language meal descriptions
  queued for on-request review, and exercise/calendar reminders.
- Complete app: own auth session/PWA scope; saved food library/favorites; USDA and
  barcode proxy plus camera feature detection; meals and batch recipes; editable
  workouts/set history/plank timer; measurements, averages/charts/goals; CSV and
  JSON backup/merge restore. Unknown nutrition is never converted to zero.
- Verification: 25/25 dependency-free Node calculation/API/security/workflow
  checks; 62 browser checks passed across desktop Chromium, Android and iPhone
  WebKit. One iOS offline reload case is explicitly skipped because the Windows
  WebKit runner reports an internal engine error. Android/Chromium offline shell
  tests pass. Source data/auth are mocked; no live family records are tested.
- Camera mocks also verify stream cleanup after a late permission response and
  playback failure, while preserving the printed-barcode fallback.
- Physical-device camera/install/calendar alerts, live Firebase rules/two-device
  sync and real upstream credentials remain unverified until setup.
- Read `fitness/README.md` for local preview, safe additive rules preparation,
  Vercel variables, and future “process my pending fitness meal notes” requests.
- Existing dirty `REVIEW.md` and unrelated untracked files were left untouched.

**Task:** Phase 43 — Around Charlotte (curated local events)
**Current Phase:** built + tested; preference/event refresh staged
**Status:** Blocked only on this Codex sandbox's read-only `.git` access and blocked outbound Google OAuth; local changes and event data are validated
**Next Agent:** human (commit + Firebase import + smoke test) → Gemini (review)
**Next Action:** Commit the scoped preference/highlight changes, dry-run and import `events-inbox/pending-2026-07-20-codex.json` from a normal networked shell, then confirm the cards and verdict flow on both phones.
**Last Updated:** 2026-07-20

## Phase 43 build notes

Home tab gains a third section below "Coming Up". Events are LLM-researched and pushed via `scripts/events/`; the app only ever writes `verdict`/`verdictAt`.

- `index.html`: `eventsState` + `subscribeEvents` (live listener, mirrors `subscribeRecipes`), `normalizeEvents`, `parseEventDate`/`isEventExpired` (local-time date-only), `sortEvents` (going-first, then startDate), `renderEventsSection`/`renderEventCard`, `setEventVerdict`. Delegated click branches ordered innermost-first (link → verdict → restore → dismissed-toggle → card). `'events'` added to `keepPathsSynced`. `sw.js` → `hub-v62`.
- Accordion expand is local view state (`state.expandedEventId`), never persisted.
- `safeEventUrl` allows only http(s) — data comes from an external script, so `javascript:` URLs are dropped before reaching an href.
- Admin tooling: `EVENTS_SCHEMA.md`, `scripts/events/{_lib,import-events,list-events,prune-events}.js`, `events-inbox/`. Service-account key and family-id fall back to `scripts/recipes/` so there's one setup, not two.
- `import-events.js` skips any event matching an existing one (url, or title+startDate) — verdicts can never be clobbered by a re-run. Child-keyed writes, never a wholesale node replace.
- `prune-events.js` is dry-run by default and preserves `"no"` verdicts unless `--include-dismissed`.
- Tests: `tests/events.spec.js` (12 tests) + `tests/seed-test-events.js`, run against the isolated test Firebase project. 12/12 chromium, 24/24 across both mobile viewports.
- First real batch imported: 6 Charlotte events (Sept–Nov 2026), verified against official sources.
- 2026-07-20 preference refresh: music history is now durable curation input; Robbie Williams and Taylor Swift are worldwide priority watches; Florida Gators and Cincinnati Bearcats are Charlotte-area priority watches. `priority-watch` cards receive a visible Priority flag (`sw.js` → `hub-v63`).
- A validated 13-card follow-up batch is staged in `events-inbox/pending-2026-07-20-codex.json`: 12 regional events plus the worldwide Robbie Williams priority watch. It includes the Aug 10 Muse show and Aug 29 WNC Bigfoot Festival near Camp Lake James. The schema validator reports 13 valid records and zero duplicate keys. Live duplicate checking/import could not run because the sandbox cannot fetch a Google OAuth token (`EACCES`).
- Camp Lake James is now a secondary base: substantial events in Morganton, Nebo, Old Fort, Black Mountain, and Marion qualify, while farmers markets and other routine recurring listings do not.
- Added one priority-watch UI test (13 event tests total). Static JavaScript parsing passed; the new Firebase-backed browser test was not run in this network-restricted sandbox.
- **DB rules checked:** `families/$familyId` is `.read`/`.write` on `auth != null`, so the app's anonymous auth can write verdicts. No rules change needed.
- **Pre-existing, unrelated:** `app.spec.js` "logging a chore shows Got it toast" is not idempotent — it fails on any second run the same day because the app correctly says "Alex already logged Make bed today." Left alone deliberately; loosening the assertion would mask real regressions.

## Phase 42 build notes

Implemented entirely in `index.html` + `sw.js` cache bump (`hub-v55` → `hub-v56`):
- `GROCERY_STAPLES` keyword list + `isStapleItem`, `groceryTextForIngredient` (staple → item-only; else amount), `isOnGroceryList`, `addIngredientToGrocery` (find-or-create grocery list, dedupe, autoCategory, returns pushed item id for Undo).
- `renderIngredient` now emits a third grid child: `.recipe-ing-add` button (`data-ing-add`). Grid went 2-col → 3-col.
- Click delegation handles `[data-ing-add]` before the cooking check-off branch (`stopPropagation`), with Undo toast via `runtime().showToast`.
- "added ✓" state derived per-render from the live grocery list (recomputed, not stored).
- Print CSS hides `.recipe-ing-add`.
- Known minor edge: if lists haven't loaded yet when adding, a second grocery list could be created (same theoretical window as existing `openOrCreateTypedList`). Low risk in practice.

## Completed

- [x] Phases 8-41

## Current

- [x] **Phase 41 — Recipes** (built by Claude)
  - [x] Part A: 6th "Recipes" tab between Lists and Bank
    - View shell, router registration, composer placeholder, render trigger
    - List view with search across title/tags/ingredients
    - Detail view: title, source, tags, meta (servings/prep/cook/total), ingredients (right-aligned tabular-nums qty), numbered steps
    - Notes textarea with 500ms debounced Firebase sync + "Saving/Saved" indicator
    - Recipe body read-only (only notes mutable)
    - Back button + hardware-back support via `returnToRecipesHome`
    - Concurrency guard: skip auto-refresh if user is actively typing in notes
    - Narrow-viewport CSS for 6-tab fit (≤380px)
    - `sw.js` cache bumped to `hub-v45`
  - [x] Part B: Admin tooling
    - `RECIPE_SCHEMA.md` — canonical JSON shape + unit conventions + worked example
    - `scripts/recipes/{package.json, README.md, _lib.js, import-recipe.js, update-recipe.js, fetch-recipe.js, list-recipes.js}`
    - `recipes-inbox/` with README + .gitkeep
    - `.gitignore` updated

## Notes

- Design decisions locked with user (2026-06-03):
  - Recipe ingestion: external (ChatGPT/Claude → PDF in `recipes-inbox/` → Claude reads, converts to canonical JSON, pushes via admin script).
  - Notes: single free-form field per recipe, family-shared.
  - Updates: overwrite, no version history. Notes clear on update.
  - Visibility: everyone in family (not parent-gated).
  - Editing: LLM-only round-trip; app is read-only for recipe body.
- Six-tab nav will be tight on small screens — flagged for Gemini.
