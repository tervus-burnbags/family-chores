'use strict';
// An explicit, on-request assistant workflow; this script never estimates food.
const fs = require('node:fs');
const crypto = require('node:crypto');
const F = require('../../fitness/nutrition.js');
const { initAdmin, resolveFamilyId } = require('../recipes/_lib.js');
function fingerprint(log) { return crypto.createHash('sha256').update(JSON.stringify(log)).digest('hex'); }
function planReview(current, entries) {
  if (!Array.isArray(entries) || !entries.length) throw new Error('Review file must be a nonempty array.');
  const changes = {}, seen = new Set(), routineUpdates = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry.noteId !== 'string' || seen.has(entry.noteId)) throw new Error('Each review needs a unique noteId.');
    seen.add(entry.noteId);
    const note = current.mealNotes?.[entry.noteId], log = current.foodLogs?.[note?.logId];
    if (!note || note.status !== 'pending' || !log) throw new Error('Pending note/log no longer exists: ' + entry.noteId);
    if (entry.expectedLogHash !== fingerprint(log)) throw new Error('Diary entry changed since export. Fetch the queue again: ' + entry.noteId);
    if (typeof entry.source !== 'string' || !entry.source.trim() || entry.source.length > 2000) throw new Error('Include a specific nutrition source and any quantity assumptions.');
    const nutrition = F.nutrition(entry.nutrition);
    if (F.nutrients.every(n => nutrition[n] == null)) throw new Error('No reviewed nutrition provided. Leave unresolved notes pending.');
    changes['foodLogs/' + note.logId + '/nutrition'] = nutrition;
    changes['foodLogs/' + note.logId + '/source'] = entry.source.trim();
    changes['mealNotes/' + entry.noteId + '/status'] = nutrition.calories == null ? 'pending' : 'reviewed';
    changes['mealNotes/' + entry.noteId + '/source'] = entry.source.trim();
    changes['mealNotes/' + entry.noteId + '/reviewedAt'] = Date.now();
    if (entry.updateRoutine === true) {
      const routine = current.routines?.[note.routineId];
      if (!routine) throw new Error('The reusable regular no longer exists.');
      if (routineUpdates.has(note.routineId)) throw new Error('Update each regular only once in a batch.');
      routineUpdates.add(note.routineId);
      const perServing = F.servings(nutrition, 1 / F.positive(log.quantity || 1));
      for (const [key,value] of Object.entries(perServing)) changes['routines/' + note.routineId + '/' + key] = value;
      changes['routines/' + note.routineId + '/source'] = entry.source.trim();
    }
  }
  return changes;
}
function applyChanges(current, changes) {
  const next = structuredClone(current);
  for (const [path,value] of Object.entries(changes)) {
    const segments = path.split('/'); let cursor = next;
    for (const segment of segments.slice(0,-1)) cursor = cursor[segment] ||= {};
    if (value == null) delete cursor[segments.at(-1)]; else cursor[segments.at(-1)] = value;
  }
  return next;
}
async function main() {
  const [command,file] = process.argv.slice(2);
  // Steady's person keys match its PEOPLE map; only Travis exists today.
  const person = (process.env.FITNESS_PERSON || 'travis').trim();
  if (!/^[a-z0-9_-]{1,40}$/.test(person)) throw new Error('FITNESS_PERSON must be a Steady person key such as travis.');
  if (!['list','apply'].includes(command)) throw new Error('Usage: node scripts/fitness/review-meals.cjs list | apply fitness-inbox/review.json [--confirm]');
  const admin = initAdmin();
  try {
    const ref = admin.database().ref('families/' + resolveFamilyId() + '/fitness/' + person), current = (await ref.get()).val();
    if (!current) throw new Error('No Steady records for ' + person + ' yet.');
    if (command === 'list') {
      const pending = Object.entries(current.mealNotes || {}).filter(([,note]) => note?.status === 'pending').map(([noteId,note]) => {
        const log = current.foodLogs?.[note.logId];
        return {noteId,...note,log,expectedLogHash: log ? fingerprint(log) : null,routine:current.routines?.[note.routineId] || null};
      });
      console.log(JSON.stringify(pending,null,2)); return;
    }
    if (!file || file === '--confirm') throw new Error('Provide a reviewed JSON batch file.');
    const entries = JSON.parse(fs.readFileSync(file,'utf8'));
    const changes = planReview(current,entries);
    if (!process.argv.includes('--confirm')) { console.log(JSON.stringify({dryRun:true,changes},null,2)); return; }
    let reason = '';
    const result = await ref.transaction(latest => {
      if (!latest) return;
      try { return applyChanges(latest,planReview(latest,entries)); }
      catch (error) { reason = error.message; return; }
    },undefined,false);
    if (!result.committed) throw new Error(reason || 'Data changed during review; nothing was written. Fetch the queue again.');
    console.log('Applied ' + entries.length + ' reviewed entries. Only ' + person + '\'s Steady records changed.');
  } finally { await admin.app().delete(); }
}
if (require.main === module) main().catch(error => {console.error(error.message);process.exitCode=1;});
module.exports = { fingerprint, planReview, applyChanges };
