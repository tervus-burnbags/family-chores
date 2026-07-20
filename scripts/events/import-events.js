#!/usr/bin/env node
// Import a batch of curated events into families/{id}/events.
//
//   node import-events.js path\to\batch.json
//   node import-events.js path\to\batch.json --family ABCD1234
//   node import-events.js path\to\batch.json --dry-run
//
// Input is a JSON ARRAY of event objects (see EVENTS_SCHEMA.md).
//
// Existing events are never overwritten. An incoming event that matches one
// already in the database (same url, or same title + startDate) is skipped, so
// a re-run can't wipe out verdicts the family has already set.

const fs = require('fs');
const path = require('path');
const lib = require('./_lib');

function main() {
  const { positional, flags } = lib.parseCliArgs(process.argv.slice(2));
  const inputPath = positional[0];
  if (!inputPath) {
    lib.die('Usage: node import-events.js <batch.json> [--family <id>] [--dry-run]');
  }

  const resolved = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolved)) {
    lib.die('File not found: ' + resolved);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (e) {
    lib.die('Failed to parse ' + resolved + ': ' + e.message);
  }

  if (!Array.isArray(parsed)) {
    lib.die('Expected a JSON array of events. Got ' + (parsed === null ? 'null' : typeof parsed) + '.');
  }
  if (parsed.length === 0) {
    lib.die('Batch is empty — nothing to import.');
  }

  // Validate everything before touching the database: a bad batch writes nothing.
  const errors = [];
  parsed.forEach((event, i) => {
    errors.push(...lib.validateEvent(event, i));
  });
  if (errors.length) {
    console.error('Schema validation failed (' + errors.length + ' problem' + (errors.length === 1 ? '' : 's') + '). Nothing was written.\n');
    errors.forEach((e) => console.error('  ' + e));
    console.error('\nSee EVENTS_SCHEMA.md for the required shape.');
    process.exit(1);
  }

  const familyId = lib.resolveFamilyId(flags.family);
  const dryRun = Boolean(flags['dry-run']);
  const admin = lib.initAdmin();
  const ref = lib.eventsRef(admin, familyId);

  ref.once('value')
    .then((snapshot) => {
      const existing = snapshot.exists() ? snapshot.val() : {};

      // Index everything already in the DB by its dedupe keys.
      const seen = new Map();
      Object.keys(existing).forEach((id) => {
        const record = existing[id];
        if (!record || typeof record !== 'object') return;
        lib.dedupeKeys(record).forEach((key) => {
          if (!seen.has(key)) seen.set(key, { id, record });
        });
      });

      const updates = {};
      const imported = [];
      const skipped = [];

      parsed.forEach((event) => {
        const keys = lib.dedupeKeys(event);
        const hit = keys.map((k) => seen.get(k)).find(Boolean);
        if (hit) {
          skipped.push({
            title: event.title,
            id: hit.id,
            verdict: hit.record.verdict || 'no verdict yet'
          });
          return;
        }

        const id = lib.generateEventId();
        const record = {
          id,
          title: String(event.title).trim(),
          dateText: String(event.dateText).trim(),
          startDate: String(event.startDate).trim(),
          where: String(event.where).trim(),
          cost: String(event.cost).trim(),
          blurb: String(event.blurb).trim(),
          why: String(event.why).trim(),
          url: String(event.url).trim(),
          tags: event.tags.map((t) => String(t).trim().toLowerCase()),
          addedAt: Date.now(),
          verdict: null,
          verdictAt: null
        };
        if (event.endDate) record.endDate = String(event.endDate).trim();
        if (event.ticketNote) record.ticketNote = String(event.ticketNote).trim();

        updates[id] = record;
        imported.push({ id, title: record.title });

        // Guard against duplicates *within* the incoming batch too.
        keys.forEach((k) => seen.set(k, { id, record }));
      });

      if (dryRun) {
        report(imported, skipped, true);
        return Promise.resolve();
      }

      if (!imported.length) {
        report(imported, skipped, false);
        return Promise.resolve();
      }

      // Child-keyed update: only adds new ids, never replaces the events node.
      return ref.update(updates).then(() => report(imported, skipped, false));
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Import failed:', err.message || err);
      process.exit(1);
    });
}

function report(imported, skipped, dryRun) {
  const prefix = dryRun ? '[dry run] ' : '';
  console.log(prefix + 'Imported: ' + imported.length + ',  skipped (already present): ' + skipped.length);
  if (imported.length) {
    console.log('\n  New:');
    imported.forEach((e) => console.log('    ' + e.id + '  ' + e.title));
  }
  if (skipped.length) {
    console.log('\n  Skipped:');
    skipped.forEach((e) => console.log('    ' + e.id + '  ' + e.title + '  [' + e.verdict + ']'));
  }
  if (dryRun) {
    console.log('\nNothing was written. Re-run without --dry-run to import.');
  }
}

main();
