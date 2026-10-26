# Private fitness MVP

> **Superseded access model (2026-10-26, later the same day):** the user rejected
> the personal email login. Steady now reuses the Hub family code and anonymous
> session, offers a "Who's using Steady?" picker (Travis only), and stores data at
> `families/{familyId}/fitness/{person}`. References below to `privateFitness/{uid}`,
> verified email, owner UID and the rules merge are historical. Current details:
> `fitness/README.md`.

## Decision and scope (2026-10-26)

The user chose the existing static HTML/JavaScript approach and Firebase instead
of the pasted Next.js/Supabase stack. Build a sibling PWA at `fitness/`, using the
same Firebase project. Keep the Family Hub runtime and parser intact. Add a link
in Hub settings, rather than another crowded primary tab.

The referenced `../AI_COMMAND/` directory and role templates are absent in this
checkout. The available AGENTS.md and PROJECT_CONFIG.md apply. Earlier task
artifacts describe Phase 43; preserve their history.

## Incremental implementation

**User refinement:** prioritize a simple exercise reminder and calorie tracker.
Save repeatable foods as per-serving routines (including the user's coffee:
280 ml coffee + 120 g 2% milk, commonly two per day). A tap logs one or two;
never log automatically. Free-text meal descriptions enter a pending review
queue, for the user to ask Codex to process later. Pending calories remain
unknown and visible in totals. Provide an explicit admin review/resolve workflow
with source attribution and optional updates to the reusable routine. No live
AI service or guessed serving conversions. The advanced food/workout features
remain available behind the simple primary flows. Daily reminders include a
calendar-file option; do not promise background web notifications.

1. **Calculation and data foundation.** Tested pure nutrition/unit functions,
   unknown-value propagation, cooked-batch density, calendar-day weight averages,
   CSV escaping, source adapters, and a versioned, additive data model.
2. **Mobile app.** Separate named Firebase app/auth session; verified email sign-in;
   session-only demo without live writes; dashboard, searchable food library,
   editable/manual nutrition, barcode lookup/camera, favorites, repeat logging,
   reusable meals and ingredient-based recipes, editable workout templates,
   set/repetition/weight/seconds history and a plank timer, measurements/charts,
   editable targets, CSV and complete JSON backup/restore.
3. **Private backend integration.** Store only at `privateFitness/{uid}`. Supply an
   owner-only rules fragment and a safe offline merge helper which preserves all
   existing rules and rejects permissive root grants. No anonymous fitness access.
   A same-origin Vercel Node function verifies Firebase ID tokens against the
   existing project and owner UID before USDA/Open Food Facts requests. USDA key
   exists only in server environment. No paid AI dependency.
4. **PWA and deployment.** Separate scope/manifest/icons/cache. Limit both service
   workers to public shell assets; exclude fitness/API from the Hub worker and
   avoid deleting sibling caches. Document Firebase Auth/rules setup and Vercel
   environment variables. GitHub Pages supports manual logging but cannot host
   the private USDA proxy; Vercel is the complete deployment target.
5. **Verification.** Node tests for calculations, missing values, units, adapters,
   auth/proxy failures, CSV, and rule merging. Browser tests at phone/desktop sizes
   for full session-only flows, recipe arithmetic, meal repeats, workouts, charts,
   exports, injection resistance and PWA cache boundaries. Mock upstream services;
   never use family production records in tests. Report unverified live setup.

## Data contract

`privateFitness/{uid}` has `schemaVersion: 1`, `settings`, `foods`, `meals`,
`recipes`, `foodLogs`, `workouts`, `exerciseLogs`, and `measurements` maps.
Also `routines` (per-serving nutrition plus exact plain-language descriptions),
`mealNotes` (pending/reviewed descriptions linked to food-log snapshots), and
`reminders` (user-chosen time and weekdays).
Records have random IDs; updates are child-scoped, never replace the shared
family root. Food/ingredient nutrition is per 100 g, nullable per nutrient.
Logs snapshot food name, grams, nutrition and source so later library edits do
not rewrite history. Recipes snapshot ingredient portions, cooked batch grams,
and calculated nutrition density. Meals snapshot food portions. Repeats create
new records for the selected local calendar date.

Default settings: 1,600 kcal, 120 g protein, 171 lb/37 in starting baseline,
160 lb/35 in goals. Baselines are labeled settings, not fabricated dated
measurements. Exercise never adjusts the food budget. An unknown calorie value
makes remaining calories unknown; partial known totals are explicitly labeled.
Units convert by exact mass/length factors. Volume is never assumed to equal
mass. Moving averages use actual readings in the preceding seven calendar days.

## Privacy and future photo estimation

Privacy relies on deployed Firebase rules, not route visibility. Auth is isolated
from the Hub through a named app. The shell can be cached, but fitness records,
tokens, camera frames and API responses are not service-worker cached. Camera
frames are processed on device and streams stop when scanning closes. Local
demo records live in memory until reload. Explicitly document that exported
files contain personal data.

Photo estimation is disabled. Provide an adapter contract for a future server
API: require explicit image-upload consent, return nullable nutrients plus
confidence/source, and populate an editable draft. Only an explicit save/log
action can persist a confirmed estimate. No image is uploaded in this MVP.

## Completion criteria

All requested MVP flows operate locally, meaningful tests pass, and deployment
steps identify the exact remaining account/rules/secret setup. Do not deploy new
database rules or modify production records during development. Live sync,
actual USDA/OFF responses and physical Android camera/install checks require the
documented environment/account setup and must not be reported as verified when
only mocked checks have run.
