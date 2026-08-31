#!/usr/bin/env node
// One-shot backfill: the single `verdict` field became two independent axes,
// `interest` (standing taste, steers research) and `plan` (this occasion only).
//
//   node migrate-verdicts.js
//   node migrate-verdicts.js --confirm
//
// Dry run by default. Safe to re-run: records that already carry an `interest`
// are left alone, so a partial run can simply be repeated.
//
// Mapping:
//   "interested" -> interest yes,  plan (none)
//   "going"      -> interest yes,  plan going
//   "no"         -> interest no,   plan (none)
//
// "going" implies the family liked it, so it sets interest as well — otherwise
// every event they actually attended would count as untasted in the tag summary.
// "no" sets no plan: it is a standing judgement, not a decision about one date.
//
// The old `verdict` / `verdictAt` keys are left in place rather than deleted.
// They cost nothing, and keeping them means a stale cached copy of the app that
// still reads `verdict` keeps working until the service worker updates.

const lib = require('./_lib');

const MAP = {
  interested: { interest: 'yes', plan: null },
  going: { interest: 'yes', plan: 'going' },
  no: { interest: 'no', plan: null }
};

function main() {
  const { flags } = lib.parseCliArgs(process.argv.slice(2));
  const familyId = lib.resolveFamilyId(flags.family);
  const confirm = Boolean(flags.confirm);

  const admin = lib.initAdmin();
  const ref = lib.eventsRef(admin, familyId);

  ref.once('value')
    .then((snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      const updates = {};
      const planned = [];
      const alreadyDone = [];
      const noReaction = [];

      Object.keys(data).forEach((id) => {
        const event = data[id];
        if (!event || typeof event !== 'object') return;

        if (event.interest === 'yes' || event.interest === 'no') {
          alreadyDone.push(event.title || id);
          return;
        }

        const mapped = MAP[event.verdict];
        if (!mapped) {
          noReaction.push(event.title || id);
          return;
        }

        // Reuse the original timestamp so the migration doesn't look like the
        // family re-reacted to everything today.
        const when = event.verdictAt || Date.now();
        updates[id + '/interest'] = mapped.interest;
        updates[id + '/interestAt'] = when;
        if (mapped.plan) {
          updates[id + '/plan'] = mapped.plan;
          updates[id + '/planAt'] = when;
        }

        planned.push({
          title: event.title || id,
          from: event.verdict,
          to: 'interest: ' + mapped.interest + (mapped.plan ? ', plan: ' + mapped.plan : '')
        });
      });

      const prefix = confirm ? '' : '[dry run] ';
      if (!planned.length) {
        console.log(prefix + 'Nothing to migrate.');
      } else {
        console.log(prefix + 'Migrating ' + planned.length + ' event(s):\n');
        planned.forEach((p) => {
          console.log('  ' + p.from.padEnd(12) + '->  ' + p.to.padEnd(34) + p.title);
        });
      }

      if (alreadyDone.length) {
        console.log('\nAlready migrated: ' + alreadyDone.length);
      }
      if (noReaction.length) {
        console.log('No reaction to carry over: ' + noReaction.length);
      }

      if (!confirm) {
        console.log('\nNothing was written. Re-run with --confirm to apply.');
        return null;
      }
      if (!planned.length) return null;

      return ref.update(updates).then(() => {
        console.log('\nDone.');
      });
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err.message || err);
      process.exit(1);
    });
}

main();
