# Optional photo estimation contract (disabled)

No image upload or estimation endpoint is called by this MVP.

A future server adapter may accept an image only after a visible, specific
"Send this photo for a nutrition estimate" confirmation. Keep provider keys in
server environment variables and apply the same owner token verification as
`api/fitness-foods.js`. Strip metadata and set an image size limit.

Return an editable draft, never a logged record:

```json
{
  "name": "Proposed meal name",
  "description": "Visible ingredients and explicit uncertainties",
  "nutrition": { "calories": null, "protein": null, "carbs": null, "fat": null },
  "basis": "whole photographed portion",
  "source": "provider and model identifier",
  "confidence": "low",
  "assumptions": [],
  "requiresConfirmation": true
}
```

Unknown values remain null. Ask about ambiguous quantities. Present the image,
basis, assumptions, and all proposed numbers in a form; require a separate
explicit Save action. No background uploads, automatic persistence or silent
changes to saved regulars. Existing logs remain snapshots.
