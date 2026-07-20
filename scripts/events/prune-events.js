#!/usr/bin/env node
// Delete past events from families/{id}/events.
//
//   node prune-events.js --before 2026-06-01              (dry run — lists only)
//   node prune-events.js --before 2026-06-01 --confirm    (actually deletes)
//   node prune-events.js --before 2026-06-01 --confirm --include-dismissed
//
// Dry run by default. Events with verdict "no" are KEPT regardless of age unless
// --include-dismissed is passed: that dismissal history is what stops the next
// research pass from re-suggesting things the family already turned down.

const lib = require('./_lib');

function main() {
  const { flags } = lib.parseCliArgs(process.argv.slice(2));

  if (!flags.before || flags.before === true) {
    lib.die('Missing --before <YYYY-MM-DD>.\n  Usage: node prune-events.js --before 2026-06-01 [--confirm] [--include-dismissed]');
  }

  const cutoff = lib.parseISODate(flags.before);
  if (!cutoff) {
    lib.die('--before must be a valid YYYY-MM-DD date. Got "' + flags.before + '".');
  }

  const familyId = lib.resolveFamilyId(flags.family);
  const confirm = Boolean(flags.confirm);
  const includeDismissed = Boolean(flags['include-dismissed']);

  const admin = lib.initAdmin();
  const ref = lib.eventsRef(admin, familyId);

  ref.once('value')
    .then((snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};

      const doomed = [];
      const keptDismissed = [];

      Object.keys(data).forEach((id) => {
        const event = data[id];
        if (!event || typeof event !== 'object') return;

        const end = lib.effectiveEndDate(event);
        if (!end) return;                              // undated: never auto-prune
        if (end.getTime() >= cutoff.getTime()) return; // still current

        if (event.verdict === 'no' && !includeDismissed) {
          keptDismissed.push({ id, title: event.title });
          return;
        }
        doomed.push({ id, title: event.title, when: event.dateText || event.startDate, verdict: event.verdict || '—' });
      });

      if (!doomed.length) {
        console.log('Nothing to prune before ' + flags.before + '.');
        if (keptDismissed.length) {
          console.log('(' + keptDismissed.length + ' dismissed event(s) preserved — pass --include-dismissed to remove them too.)');
        }
        return Promise.resolve();
      }

      console.log((confirm ? 'Deleting ' : '[dry run] Would delete ') + doomed.length + ' event(s) ending before ' + flags.before + ':\n');
      doomed.forEach((e) => console.log('  ' + e.id + '  ' + e.title + '  (' + e.when + ')  [' + e.verdict + ']'));

      if (keptDismissed.length) {
        console.log('\nPreserved ' + keptDismissed.length + ' dismissed event(s) (verdict "no"):');
        keptDismissed.forEach((e) => console.log('  ' + e.id + '  ' + e.title));
        console.log('Pass --include-dismissed to remove these as well.');
      }

      if (!confirm) {
        console.log('\nNothing was deleted. Re-run with --confirm to apply.');
        return Promise.resolve();
      }

      const updates = {};
      doomed.forEach((e) => { updates[e.id] = null; });
      return ref.update(updates).then(() => {
        console.log('\nDeleted ' + doomed.length + ' event(s).');
      });
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Prune failed:', err.message || err);
      process.exit(1);
    });
}

main();
