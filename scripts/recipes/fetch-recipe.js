#!/usr/bin/env node
// Print a recipe (body + notes) as JSON to stdout. Used before a Claude-mediated revision.
//
// Usage:
//   node fetch-recipe.js <recipeId> [--family <id>]

const lib = require('./_lib');

const { positional, flags } = lib.parseCliArgs(process.argv.slice(2));
if (!positional[0]) {
  console.error('Usage: node fetch-recipe.js <recipeId> [--family <id>]');
  process.exit(1);
}

const recipeId = positional[0];
const familyId = lib.resolveFamilyId(flags.family);
const admin = lib.initAdmin();

lib.recipeRef(admin, familyId, recipeId).once('value').then(function (snap) {
  if (!snap.exists()) {
    lib.die('Recipe not found: ' + recipeId + ' under family ' + familyId);
  }
  process.stdout.write(JSON.stringify(snap.val(), null, 2) + '\n');
  process.exit(0);
}).catch(function (err) {
  console.error('Fetch failed: ' + err.message);
  process.exit(1);
});
