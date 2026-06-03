# Recipes Admin Scripts

Node scripts that read and write recipes in the Family Hub Firebase Realtime Database. These are the tools Claude uses to import recipes from `recipes-inbox/` and to push LLM-generated revisions back.

The in-app side is read-only for the recipe body (only `notes` is mutable). All recipe authoring happens here.

## One-Time Setup

### 1. Install dependencies

```powershell
cd scripts\recipes
npm install
```

(`firebase-admin` is the only dependency.)

### 2. Download a Firebase service-account key

In the [Firebase Console](https://console.firebase.google.com/):

1. Pick the `family-chores-2e3f4` project.
2. Project Settings (gear icon) → **Service Accounts** tab.
3. Click **Generate New Private Key** → confirm. A JSON file downloads.
4. Save it to **`scripts/recipes/service-account.json`** (exact name, exact path).

The file is gitignored. **Do not commit it.** Anyone with this key has admin access to the database.

### 3. Set the family ID

The scripts need to know which family's `/families/{id}/recipes` node to write to. Pick one of:

- **Write a file:** create `scripts/recipes/family-id.txt` containing only the 8-char family code on a single line. (Gitignored.) ← easiest
- **Env var:** `FAMILY_ID=ABCD1234 node import-recipe.js …`
- **CLI flag:** `node import-recipe.js recipe.json --family ABCD1234`

You can find the family code in-app under Settings → Family.

## Scripts

All scripts validate input against the schema in [`../../RECIPE_SCHEMA.md`](../../RECIPE_SCHEMA.md) before writing. A schema failure prints clear errors and writes nothing.

### `import-recipe.js`

Push a new recipe.

```powershell
node import-recipe.js path\to\recipe.json
node import-recipe.js path\to\recipe.json --family ABCD1234
```

Generates a fresh `id` (`rcp_…`), sets `createdAt` / `updatedAt` to now, and initializes `notes` to `""`.

### `update-recipe.js`

Overwrite an existing recipe with a revised body. **The notes field is cleared.** Preserves `id` and `createdAt`.

```powershell
node update-recipe.js rcp_abc123 path\to\revised.json
```

Used after Claude reads a recipe + its notes and produces a new version.

### `fetch-recipe.js`

Print the current recipe (body + notes) as JSON to stdout.

```powershell
node fetch-recipe.js rcp_abc123 > current.json
```

Used as the first step of a Claude-mediated revision.

### `list-recipes.js`

```powershell
node list-recipes.js
node list-recipes.js --json
```

Shows id, title, last-updated date, and whether the recipe has unread notes.

## The Claude Workflow

### Importing a new recipe

1. User saves a recipe (PDF, markdown, anything) into `recipes-inbox/` and says "import this".
2. Claude reads the file, normalizes to canonical JSON per `RECIPE_SCHEMA.md`, writes it to a temp file (e.g. `recipes-inbox/_tmp-banana.json`).
3. Claude runs `node scripts/recipes/import-recipe.js recipes-inbox/_tmp-banana.json`.
4. On success Claude reports the assigned id back to the user.

### Revising a recipe from notes

1. User says "revise the banana bread recipe based on my notes."
2. Claude runs `node scripts/recipes/list-recipes.js` to find the id, or already knows it.
3. Claude runs `node scripts/recipes/fetch-recipe.js rcp_… > /tmp/current.json` and reads it.
4. Claude generates a revised JSON that integrates the notes. Save to a temp file.
5. Claude runs `node scripts/recipes/update-recipe.js rcp_… /tmp/revised.json`.
6. The app immediately shows the new version, with notes cleared.

## Troubleshooting

- **`Error: Missing service-account.json`** — step 2 above.
- **`PERMISSION_DENIED`** — service account doesn't have access. Re-generate the key from the right project, or check Firebase rules.
- **`Recipe not found`** — verify the id with `list-recipes.js`. Family-id mismatch is the most common cause.
- **Recipe doesn't appear in the app** — confirm the family ID matches the one you're logged into in the app, and force-refresh (PWA service worker caches index.html).
