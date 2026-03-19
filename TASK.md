# Task: Phase 40 — Minor Cleanup

**Task Type:** bugfix
**Model Mode:** default

## Summary

Small consistency fixes flagged in Phase 38 and 39 reviews. Two parts.

---

## Part A: Add "pin" to routeIntent log_note Registry

**Problem:** The `log_note` intent registered in `routeIntent` (line ~4941-4952) has a pattern regex that doesn't include "pin":

```javascript
patterns: (text) => {
  const match = text.match(/^(?:note|add note|post note|bulletin note|remember)\s+(.+)$/i);
```

While `parseNoteIntent` (line ~5110) was updated in Phase 39 to include "pin", the `routeIntent` registry was not. This means `routeIntent` won't match "pin pick up milk" — it falls through to `parseIntent` which handles it, but the two code paths are inconsistent.

**Fix:** Add `pin` to the alternation in the routeIntent patterns function (line ~4945):

```javascript
const match = text.match(/^(?:pin|note|add note|post note|bulletin note|remember)\s+(.+)$/i);
```

**Validation:**
- [ ] "pin pick up milk" matches via routeIntent (not just parseIntent fallback)
- [ ] "note remember dentist" still works
- [ ] "pin" with no text returns null (no empty note)

---

## Part B: Sync routeIntent remove_note with Current Patterns

**Problem:** While reviewing Part A, check if the `remove_note` intent in routeIntent (line ~4954) has the same pattern set as the `parseNoteIntent` removal regex. Ensure both are consistent.

**Fix:** Verify and sync if needed. If already consistent, no change required.

**Validation:**
- [ ] "delete note" works via routeIntent
- [ ] "remove note" works via routeIntent
- [ ] "clear note" works via routeIntent

---

## Test Focus

Both parts are low-risk regex-only changes. Verify no regressions in note creation or deletion from any tab.

**Service worker:** Bump `sw.js` cache version.
