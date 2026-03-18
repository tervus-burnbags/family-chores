# Task: Phase 39 — Battleship Polish, Template Save Fix, Bulletin Parsing, Pin Regex

**Task Type:** bugfix
**Model Mode:** default

## Summary

Four issues from Phase 38 testing: Battleship miss dots too faint, save template still broken (writes succeed but reset ignores saved data), bulletin tab text input treated as chore points instead of notes, and pin keyword missing from `log_note` regex. Four parts (A-D).

---

## Part A: Battleship Miss Dots — Increase Visibility

**Problem:** The miss markers (white dots on the water cells) are too light/faint to see clearly on mobile.

**Current CSS** (line ~3318-3322):
```css
.bs-cell.miss::after {
  inset: 32%;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(100, 140, 180, 0.4);
}
```

**Fix:** Make miss dots more prominent:
```css
.bs-cell.miss::after {
  inset: 30%;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(60, 90, 130, 0.6);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}
```

Key changes: higher opacity background, thicker/darker border, subtle shadow, slightly larger (`inset: 30%` instead of `32%`).

**Validation:**
- [ ] Miss dots are clearly visible against the water cell background
- [ ] Miss dots are visually distinct from hit markers (red)
- [ ] Dots are visible on both light and dark water cell gradients

---

## Part B: Save Template — Fix Reset to Use Saved Templates

**Problem:** "Save as template" writes to Firebase successfully, but "Reset template" always loads the hardcoded `LIST_TEMPLATES` defaults and **deletes** the saved template from Firebase. So saved templates are immediately destroyed on reset.

**Root cause:** `resetTemplateForType()` (line ~9274-9297):
1. Line ~9279: `await ref.child(type).remove()` — **deletes** the saved custom template from Firebase
2. Line ~9282: `var templateItems = (LIST_TEMPLATES[type].items || []).slice()` — **always** uses hardcoded defaults, never checks for saved templates

The function `templateForType()` (line ~8657) correctly prefers saved templates: `return listState.templatesByType[type] || LIST_TEMPLATES[type] || null;` — but `resetTemplateForType` doesn't use it.

**Fix — redesign the save/reset flow:**

The intent of the two buttons should be:
- **"Save as template"** — saves current list items as a custom template in Firebase at `listTemplates/{type}`
- **"Reset template"** — reloads the list from the template (custom if saved, built-in if not). Does NOT delete the saved template.

Changes to `resetTemplateForType()`:
1. **Remove** the `await ref.child(type).remove()` line — don't delete saved templates on reset
2. **Use `templateForType(type)`** instead of `LIST_TEMPLATES[type]` to prefer saved templates:
   ```javascript
   var template = templateForType(type);
   if (!template) return 0;
   var templateItems = (template.items || []).slice();
   ```
3. If the user wants to truly reset to built-in defaults (discarding their custom template), that's a separate action — but for now, "Reset" means "reload from template" (custom or built-in).

**Optional — add a "Reset to default" option:**
If you want to give users a way to discard their custom template and revert to built-in:
- Add a third button "Reset to default" that does `ref.child(type).remove()` + loads from `LIST_TEMPLATES[type]`
- Or add a confirmation: "Reset to your saved template, or reset to factory defaults?"
- This is optional — the minimum fix is making "Reset template" use saved templates.

**Validation:**
- [ ] Save template for lakehouse → toast shows item count
- [ ] Add a new item to the list, then "Reset template" → list reloads from saved template (includes the items that were there when you saved, NOT the built-in defaults)
- [ ] On a list type with NO saved template, "Reset template" → loads built-in defaults (fallback works)
- [ ] Saved templates persist across app reloads
- [ ] Save template for grocery → works the same way

---

## Part C: Bulletin Tab — Fix Text Input Defaulting to Chore Logging

**Problem:** Typing plain text on the Home/Bulletin tab (e.g., "pick up milk", "remember dentist") tries to log it as a chore instead of creating a pinned note. It asks "which kid?" because the chore parser runs and finds no kid name.

**Root cause:** In `parseIntent()`, the block at line ~5152 runs for both `activeTab === 'chores'` AND `activeTab === 'bulletin'`:
```javascript
if (activeTab === 'chores' || activeTab === 'bulletin') {
  // ... clause processing, chore inference ...
  if (!clauseKids.length) return { intent: 'missing_kid' };  // ← returns early!
}
```

This `missing_kid` return at line ~5187 prevents execution from reaching the contextual default at line ~5201:
```javascript
if (activeTab === 'bulletin' && normalized.length > 0 && normalized.length < 250) {
  return { intent: 'log_note', noteText: text.trim(), color: 'neutral' };
}
```

**Fix:** The clause-processing/chore-inference block should NOT run on the bulletin tab. Change the guard:

```javascript
if (activeTab === 'chores') {
  // ... clause processing, chore inference, missing_kid ...
}
```

Remove `|| activeTab === 'bulletin'` from that condition. The bulletin tab's contextual default at line ~5201 will then correctly catch all unmatched text and create a note.

**Important:** Chore logging from the bulletin tab should still work if the user explicitly says a chore phrase with a kid name (e.g., "alex made bed"). This is handled by `routeIntent` which has chore intents registered globally. The fix only removes the **fallback chore inference** from the bulletin tab — explicit chore commands still route correctly.

**Validation:**
- [ ] On Home/Bulletin tab: type "pick up milk" → creates a pinned note (not "which kid?")
- [ ] On Home/Bulletin tab: type "remember dentist appointment" → creates a note
- [ ] On Home/Bulletin tab: type "alex made bed" → still logs the chore correctly (via routeIntent)
- [ ] On Chores tab: type "louisa brush teeth" → still logs chore as before
- [ ] On Chores tab: type "made bed" (no kid name) → still asks "which kid?" as expected

---

## Part D: Pin Keyword in log_note Regex

**Problem:** Flagged in Phase 38 review — the `log_note` intent regex (line ~4944) doesn't include "pin" as a keyword, even though pin routing was added to the dispatcher. The regex and dispatcher are inconsistent.

**Current regex** (approximate):
```javascript
/^(?:note|add note|post note|bulletin note|remember)\s*:?\s+(.+)$/i
```

**Fix:** Add `pin` to the alternation:
```javascript
/^(?:pin|note|add note|post note|bulletin note|remember)\s*:?\s+(.+)$/i
```

This ensures `parseNoteIntent()` directly matches "pin pick up milk" without relying on the dispatcher workaround.

**Validation:**
- [ ] "pin pick up dry cleaning" → creates note (via parseNoteIntent, not dispatcher fallback)
- [ ] "note remember picture day" → still works
- [ ] "pin" with no text → does not create empty note

---

## Test Focus

Part B is highest risk — it changes the template save/reset contract. Part C is a parser guard change that could affect chore logging if done incorrectly. Part A is CSS-only. Part D is a one-line regex fix.

**Service worker:** Bump `sw.js` cache version after all changes.
