#!/usr/bin/env node
// List recipes in the family: id, title, has-notes, updatedAt.
//
// Usage:
//   node list-recipes.js [--family <id>] [--json]

const lib = require('./_lib');

const { flags } = lib.parseCliArgs(process.argv.slice(2));
const familyId = lib.resolveFamilyId(flags.family);
const admin = lib.initAdmin();

lib.recipesRef(admin, familyId).once('value').then(function (snap) {
  const val = snap.val() || {};
  const rows = Object.keys(val).map(function (id) {
    const r = val[id] || {};
    return {
      id: id,
      title: String(r.title || '(untitled)'),
      hasNotes: !!(r.notes && String(r.notes).trim()),
      updatedAt: Number(r.updatedAt || r.createdAt || 0)
    };
  }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });

  if (flags.json) {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
  } else if (rows.length === 0) {
    console.log('No recipes in family ' + familyId + '.');
  } else {
    console.log(rows.length + ' recipe' + (rows.length === 1 ? '' : 's') + ' in family ' + familyId + ':');
    rows.forEach(function (r) {
      const ts = r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '----------';
      const notesFlag = r.hasNotes ? ' [notes]' : '';
      console.log('  ' + ts + '  ' + r.id + '  ' + r.title + notesFlag);
    });
  }
  process.exit(0);
}).catch(function (err) {
  console.error('List failed: ' + err.message);
  process.exit(1);
});
