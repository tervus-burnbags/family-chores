#!/usr/bin/env node
// Overwrite an existing recipe with a revised body. Preserves id and createdAt.
// Clears the notes field (per decision: overwrite, no history).
//
// Usage:
//   node update-recipe.js <recipeId> <path-to-revised.json> [--family <id>]

const lib = require('./_lib');

const { positional, flags } = lib.parseCliArgs(process.argv.slice(2));
if (!positional[0] || !positional[1]) {
  console.error('Usage: node update-recipe.js <recipeId> <path-to-revised.json> [--family <id>]');
  process.exit(1);
}

const recipeId = positional[0];
const input = lib.readJsonFile(positional[1]);
const errors = lib.validateRecipe(input);
if (errors.length) {
  console.error('Recipe validation failed:');
  errors.forEach(function (e) { console.error('  - ' + e); });
  process.exit(1);
}

const familyId = lib.resolveFamilyId(flags.family);
const admin = lib.initAdmin();

const ref = lib.recipeRef(admin, familyId, recipeId);

ref.once('value').then(function (snap) {
  if (!snap.exists()) {
    lib.die('Recipe not found: ' + recipeId + ' under family ' + familyId);
  }
  const existing = snap.val() || {};
  const clean = lib.sanitizeInput(input);
  const now = Date.now();
  const doc = Object.assign({}, clean, {
    id: recipeId,
    createdAt: Number(existing.createdAt || now),
    updatedAt: now,
    notes: ''
  });
  return ref.set(doc).then(function () {
    console.log('Updated: ' + clean.title);
    console.log('  id:        ' + recipeId);
    console.log('  family:    ' + familyId);
    console.log('  previous title: ' + (existing.title || '(unknown)'));
    console.log('  notes cleared: ' + (existing.notes ? 'yes (had ' + String(existing.notes).length + ' chars)' : 'no notes existed'));
    process.exit(0);
  });
}).catch(function (err) {
  console.error('Update failed: ' + err.message);
  process.exit(1);
});
