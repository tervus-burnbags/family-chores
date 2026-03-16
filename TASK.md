# Task: Phase 12 — Header Polish + Fullscreen PWA

**Task Type:** standard
**Model Mode:** default

## Summary

Two changes to improve the app feel:

1. **Settings text + customizable family name** — "Switch family" → "Update code", header displays a configurable name like "Browning Family Hub"
2. **Fullscreen PWA** — Remove URL bar/status bar chrome when installed as an app

Phase 12c (extract fun data) was completed during the consolidation phase (C4).

---

## Phase 12a: Settings Text + Family Name

### "Switch family" → "Update code"

Find the button text `Switch family` in `buildFamilySettingsMarkup()` and change to `Update code`.

### Customizable Family Name in Header

**Firebase path:** `families/{familyId}/config/familyName`
Default: `'Family Hub'` (if not set)

**Header change:**
The `<h1>` in the header brand-text section currently says "Family Hub". Give it an ID:
```html
<h1 id="headerTitle">Family Hub</h1>
```

**On config load**, update the title. In the config listener / warmup where `currentConfig` is populated, add:
```javascript
var headerTitle = document.getElementById('headerTitle');
if (headerTitle) headerTitle.textContent = currentConfig.familyName || 'Family Hub';
```

**Settings UI** — Add a "Family name" text input to `buildFamilySettingsMarkup()`, before the calendar URL field:
```html
<div class="settings-field">
  <label for="familyNameInput">Family name</label>
  <input type="text" id="familyNameInput" placeholder="Family Hub" value="{currentFamilyName}" maxlength="30">
</div>
```

**Save handler** — In the family settings save logic, read and save the name:
```javascript
var nameInput = document.getElementById('familyNameInput');
var familyName = nameInput ? String(nameInput.value || '').trim() : '';
updates['families/' + familyId + '/config/familyName'] = familyName || null;
// Update header immediately:
var headerTitle = document.getElementById('headerTitle');
if (headerTitle) headerTitle.textContent = familyName || 'Family Hub';
```

### Test
- Settings button says "Update code" not "Switch family"
- Settings has "Family name" text input
- Type "Browning Family Hub" → save → header updates immediately
- Reload → header still shows saved name
- Clear field → save → reverts to "Family Hub"

---

## Phase 12b: Fullscreen PWA

**Problem:** URL bar and status bar chrome visible when installed as PWA.

### Meta tags

Check if these exist in `<head>`. Add any that are missing:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### Safe area CSS

The header gradient should extend behind the iOS status bar. Update `.header` CSS:
```css
padding-top: calc(8px + env(safe-area-inset-top));
```

Add safe area bottom padding for the tab bar (home indicator area):
```css
.tab-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Bump SW cache

Bump `sw.js` cache to `hub-v15` after both phases.

### Test
- Android: install PWA → no URL bar
- iOS: Add to Home Screen → fullscreen, white status bar text over dark header
- Content not clipped behind status bar or home indicator
- Tab bar not obscured by home indicator

---

## Files Changed

| File | Phase | Changes |
|------|-------|---------|
| `index.html` | 12a, 12b | Settings text, family name field, Apple meta tags, safe area CSS |
| `sw.js` | 12b | Bump cache to hub-v15 |

## What NOT to Change

- No changes to Firebase data model beyond adding `familyName` to config
- No changes to parser, chores, bank, lists, or fun modules
- No CSS changes beyond safe area padding
- `manifest.json` already has `"display": "standalone"` — leave it as-is
