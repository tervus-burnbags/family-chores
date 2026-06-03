# Recipes Inbox

Drop recipe sources here (PDFs, markdown, plain text — any format).

Then tell Claude:

> Import the [name] recipe from `recipes-inbox/`.

Claude will read the file, normalize it to the canonical JSON in [`../RECIPE_SCHEMA.md`](../RECIPE_SCHEMA.md), and push it to Firebase via `scripts/recipes/import-recipe.js`. The recipe will appear in the Recipes tab of Family Hub on every family device.

This directory's contents are gitignored (only this README and `.gitkeep` are tracked).
