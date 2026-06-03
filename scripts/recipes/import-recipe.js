#!/usr/bin/env node
// Import a new recipe into Firebase.
//
// Usage:
//   node import-recipe.js <path-to-recipe.json> [--family <id>]
//
// On success, prints the assigned recipe ID.

const lib = require('./_lib');

const { positional, flags } = lib.parseCliArgs(process.argv.slice(2));
if (!positional[0]) {
  console.error('Usage: node import-recipe.js <path-to-recipe.json> [--family <id>]');
  process.exit(1);
}

const input = lib.readJsonFile(positional[0]);
const errors = lib.validateRecipe(input);
if (errors.length) {
  console.error('Recipe validation failed:');
  errors.forEach(function (e) { console.error('  - ' + e); });
  process.exit(1);
}

const familyId = lib.resolveFamilyId(flags.family);
const admin = lib.initAdmin();

const clean = lib.sanitizeInput(input);
const id = lib.makeRecipeId();
const now = Date.now();
const doc = Object.assign({}, clean, {
  id: id,
  createdAt: now,
  updatedAt: now,
  notes: ''
});

lib.recipeRef(admin, familyId, id).set(doc)
  .then(function () {
    console.log('Imported: ' + clean.title);
    console.log('  id:        ' + id);
    console.log('  family:    ' + familyId);
    console.log('  ingredients: ' + clean.ingredients.length);
    console.log('  steps:       ' + clean.steps.length);
    process.exit(0);
  })
  .catch(function (err) {
    console.error('Firebase write failed: ' + err.message);
    process.exit(1);
  });
