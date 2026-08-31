#!/usr/bin/env node
// List events in families/{id}/events, with the family's reactions.
//
//   node list-events.js
//   node list-events.js --json
//   node list-events.js --json --active-only
//
// This is the feedback-loop reader: run it BEFORE researching a new batch so
// past reactions steer what gets suggested next. Expired events are included by
// default — the reaction history is the whole point.
//
// --json also prints a tagSummary: per-tag INTEREST counts, which is the quickest
// read on "what does this family actually say yes to". Interest is the only
// tailoring signal — `plan` records one occasion and is reported separately so it
// can't be mistaken for a judgement on the category.

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

// Reads a record written either side of the interest/plan split.
function readInterest(e) {
  if (e.interest === 'yes' || e.interest === 'no') return e.interest;
  if (e.verdict === 'interested' || e.verdict === 'going') return 'yes';
  if (e.verdict === 'no') return 'no';
  return null;
}

function readPlan(e) {
  if (e.plan === 'going' || e.plan === 'not-going') return e.plan;
  return e.verdict === 'going' ? 'going' : null;
}

// Interest counts per tag — the ONLY signal for tailoring the next batch.
// `notThisTime` is carried alongside purely so it is visible; it says nothing
// about the category and must not be read as a negative on the tag.
function buildTagSummary(events) {
  const summary = {};
  events.forEach((e) => {
    const tags = Array.isArray(e.tags) ? e.tags : [];
    const interest = readInterest(e);
    const plan = readPlan(e);
    tags.forEach((tag) => {
      if (!summary[tag]) {
        summary[tag] = { interested: 0, notForUs: 0, undecided: 0, going: 0, notThisTime: 0 };
      }
      if (interest === 'yes') summary[tag].interested++;
      else if (interest === 'no') summary[tag].notForUs++;
      else summary[tag].undecided++;
      if (plan === 'going') summary[tag].going++;
      else if (plan === 'not-going') summary[tag].notThisTime++;
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
    pad('INTEREST', 10) + pad('PLAN', 14) + pad('TITLE', 36) + pad('WHEN', 26) + 'TAGS'
  );
  console.log('-'.repeat(100));

  events.forEach((e) => {
    const interest = readInterest(e);
    const plan = readPlan(e);
    const interestCell = (interest === 'yes' ? 'yes' : interest === 'no' ? 'not for us' : '—') +
      (e.expired ? '*' : '');
    const planCell = plan === 'going' ? 'going' : plan === 'not-going' ? 'not this time' : '—';
    const tags = Array.isArray(e.tags) ? e.tags.join(', ') : '';
    console.log(
      pad(interestCell, 10) + pad(planCell, 14) + pad(e.title, 36) +
      pad(e.dateText || e.startDate || '', 26) + tags
    );
  });

  const expiredCount = events.filter((e) => e.expired).length;
  console.log('\n' + events.length + ' event(s)' + (expiredCount ? ',  * = ' + expiredCount + ' past' : ''));
}

main();
