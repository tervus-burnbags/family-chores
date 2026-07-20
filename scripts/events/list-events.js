#!/usr/bin/env node
// List events in families/{id}/events, with the family's verdicts.
//
//   node list-events.js
//   node list-events.js --json
//   node list-events.js --json --active-only
//
// This is the feedback-loop reader: run it BEFORE researching a new batch so
// past verdicts steer what gets suggested next. Expired events are included by
// default — the reaction history is the whole point.
//
// --json also prints a tagSummary: per-tag verdict counts, which is the quickest
// read on "what does this family actually say yes to".

const lib = require('./_lib');

function main() {
  const { flags } = lib.parseCliArgs(process.argv.slice(2));
  const familyId = lib.resolveFamilyId(flags.family);
  const asJson = Boolean(flags.json);
  const activeOnly = Boolean(flags['active-only']);

  const admin = lib.initAdmin();

  lib.eventsRef(admin, familyId).once('value')
    .then((snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let events = Object.keys(data)
        .map((id) => Object.assign({}, data[id], { id }))
        .filter((e) => e && typeof e === 'object' && e.title);

      events = events.map((e) => {
        const end = lib.effectiveEndDate(e);
        return Object.assign({}, e, {
          expired: end ? end.getTime() < today.getTime() : false
        });
      });

      if (activeOnly) {
        events = events.filter((e) => !e.expired);
      }

      events.sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || '')));

      if (asJson) {
        console.log(JSON.stringify({
          familyId,
          count: events.length,
          tagSummary: buildTagSummary(events),
          events
        }, null, 2));
        return;
      }

      printTable(events);
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('List failed:', err.message || err);
      process.exit(1);
    });
}

// Verdict counts per tag — the signal for tailoring the next batch.
function buildTagSummary(events) {
  const summary = {};
  events.forEach((e) => {
    const tags = Array.isArray(e.tags) ? e.tags : [];
    const verdict = e.verdict || 'undecided';
    tags.forEach((tag) => {
      if (!summary[tag]) summary[tag] = { interested: 0, going: 0, no: 0, undecided: 0 };
      if (summary[tag][verdict] === undefined) summary[tag][verdict] = 0;
      summary[tag][verdict]++;
    });
  });
  return summary;
}

function pad(value, width) {
  const s = String(value == null ? '' : value);
  return s.length >= width ? s.slice(0, width - 1) + '…' : s + ' '.repeat(width - s.length);
}

function printTable(events) {
  if (!events.length) {
    console.log('No events found.');
    return;
  }

  console.log(
    pad('VERDICT', 12) + pad('TITLE', 38) + pad('WHEN', 30) + 'TAGS'
  );
  console.log('-'.repeat(100));

  events.forEach((e) => {
    const verdict = (e.verdict || '—') + (e.expired ? '*' : '');
    const tags = Array.isArray(e.tags) ? e.tags.join(', ') : '';
    console.log(
      pad(verdict, 12) + pad(e.title, 38) + pad(e.dateText || e.startDate || '', 30) + tags
    );
  });

  const expiredCount = events.filter((e) => e.expired).length;
  console.log('\n' + events.length + ' event(s)' + (expiredCount ? ',  * = ' + expiredCount + ' past' : ''));
}

main();
