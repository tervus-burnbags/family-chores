# Task: Phase 12 — Header Polish, Fullscreen PWA, Data Extraction

## Summary

Four changes that improve UX and reduce file size for AI agent performance:

1. **Settings text fix** — "Switch family" → "Update code"
2. **Customizable family name** — Header says "Browning Family Hub" (stored in Firebase, editable in settings)
3. **Fullscreen PWA** — Remove URL bar when installed as app
4. **Extract fun data** — Move 855 lines of jokes/madlibs from index.html to kid-fun-data.js (loaded as external script)

## Model Mode

default

---

## Phase 12a: Settings Text + Family Name

### "Switch family" → "Update code"

**File:** `index.html` line ~2305

Change:
```javascript
'<button type="button" class="settings-btn" data-family-action="manage">Switch family</button>'
```
To:
```javascript
'<button type="button" class="settings-btn" data-family-action="manage">Update code</button>'
```

### Customizable Family Name in Header

**Goal:** The header currently shows "Family Hub". It should show a customizable name like "Browning Family Hub" stored in Firebase.

**Firebase path:** `families/{familyId}/config/familyName`
- Default: `'Family Hub'` (if not set)

**Header HTML** (line ~1843):
The `brand-text` section currently has:
```html
<h1>Family Hub</h1>
```

Change to render from config:
```html
<h1 id="headerTitle">Family Hub</h1>
```

**On config load**, update the header title:
In the config listener / warmup code where `currentConfig` is populated, add:
```javascript
var headerTitle = document.getElementById('headerTitle');
if (headerTitle) {
  headerTitle.textContent = currentConfig.familyName || 'Family Hub';
}
```

**Settings UI** — Add a "Family name" field to the family settings form (inside `buildFamilySettingsMarkup()`):

Add before the calendar URL field:
```html
<div class="settings-field">
  <label for="familyNameInput">Family name</label>
  <input type="text" id="familyNameInput" placeholder="Family Hub" value="{currentFamilyName}" maxlength="30">
</div>
```

**Save handler** — In the family settings save handler, read the name input and save:
```javascript
var nameInput = document.getElementById('familyNameInput');
var familyName = nameInput ? String(nameInput.value || '').trim() : '';
updates['families/' + familyId + '/config/familyName'] = familyName || null;
// Update header immediately:
var headerTitle = document.getElementById('headerTitle');
if (headerTitle) headerTitle.textContent = familyName || 'Family Hub';
```

### Test
- Settings shows "Update code" (not "Switch family")
- Settings has "Family name" text input
- Type "Browning Family Hub" → save → header updates immediately
- Reload app → header still shows "Browning Family Hub"
- Clear the field → save → header reverts to "Family Hub"
- Other family member sees the same name (Firebase sync)

---

## Phase 12b: Fullscreen PWA

**Problem:** When installed as a PWA on Android/iOS, the URL bar and status bar still show. The manifest already has `"display": "standalone"` which should hide the URL bar, but the status bar area needs proper handling.

**File:** `manifest.json`

The manifest already has `"display": "standalone"` which is correct. The issue might be:

1. **iOS needs `apple-mobile-web-app-capable`** — Check if this meta tag exists in index.html. If not, add:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

2. **`viewport-fit=cover`** is already present in the viewport meta tag. Good.

3. **Safe area padding** — With `black-translucent` status bar on iOS, content can render behind the status bar. Add to the `body` or `.app-shell` CSS:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

4. **Header needs safe area** — The dark header gradient should extend behind the status bar. Update `.header` CSS:
```css
.header {
  padding-top: calc(8px + env(safe-area-inset-top));
}
```

**Important:** Only add the apple meta tags if they don't already exist. Check first.

### Test
- On Android: install PWA → no URL bar visible
- On iOS Safari: Add to Home Screen → opens fullscreen, status bar text is white over the dark header gradient
- Content doesn't get clipped behind status bar or home indicator

---

## Phase 12c: Extract Fun Data to External File

**Problem:** `index.html` is 6773 lines. ~855 of those are static joke/madlib data arrays (`KID_JOKES` lines 3922-4197, `KID_MADLIBS` lines 4199-4779). This bloats the file for AI agents (Codex and Gemini) who need to read/parse the entire file, causing slow reviews and context issues.

**Solution:** The file `kid-fun-data.js` already exists with this data. Flip the architecture: load it as an external script instead of embedding in index.html.

### Steps

1. **Update `kid-fun-data.js`:**
   - Remove the old comment saying "Do NOT load this as a separate script"
   - Make sure `KID_JOKES` and `KID_MADLIBS` are declared with `var` (global scope) so the Fun IIFE can access them
   - Ensure the file contains ALL the jokes and madlibs currently in index.html (250 jokes, ~25 madlibs) — the file may have an older/smaller set

2. **Add script tag in `index.html`** before the Fun IIFE `<script>` block:
```html
<script src="kid-fun-data.js"></script>
```

3. **Remove the inline data from `index.html`:**
   - Delete the `var KID_JOKES = [...]` array (lines ~3922-4197)
   - Delete the `var KID_MADLIBS = [...]` array (lines ~4199-4779)
   - The Fun IIFE code that references `KID_JOKES` and `KID_MADLIBS` stays — it will find them in global scope from the external script

4. **Update `sw.js`:**
   - Add `'./kid-fun-data.js'` to the `ASSETS` array so it's cached for offline
   - Bump cache version to `hub-v14`

### Test
- Fun tab loads jokes and madlibs correctly
- Joke reveal works
- Mad Lib fill-in works
- Next joke / next madlib cycling works
- Works offline (service worker caches the data file)
- index.html is ~855 lines shorter

---

## Files Changed

- `index.html` — All phases
- `manifest.json` — Phase 12b (only if changes needed)
- `kid-fun-data.js` — Phase 12c (update content, remove warning comment)
- `sw.js` — Phase 12c (add to ASSETS, bump cache)

## Phase Order

```
12a → 12b → 12c (can be done in any order, all independent)
```

## Risks

1. **kid-fun-data.js content mismatch** — The existing file may have fewer jokes/madlibs than index.html (which was expanded to 250 jokes). Codex must copy the FULL current arrays from index.html into kid-fun-data.js before deleting them from index.html.
2. **Script load order** — `kid-fun-data.js` must load BEFORE the Fun IIFE that references the arrays. Place the `<script>` tag above the Fun IIFE block.
3. **Gemini conflict** — Gemini is currently reviewing Phase 11. This task should be queued for after that review completes. Do NOT modify index.html until Gemini's review is done and committed.
