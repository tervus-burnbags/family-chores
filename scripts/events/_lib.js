// Shared library for the events admin scripts.
//
// Loads firebase-admin with the service-account key, resolves the family ID,
// validates event JSON against the schema in EVENTS_SCHEMA.md, and exposes
// helpers used by import / list / prune.
//
// Mirrors scripts/recipes/_lib.js. The service-account key and family-id file
// are shared with the recipes scripts — this reads from either location so you
// don't have to set them up twice.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const RECIPES_DIR = path.join(REPO_ROOT, 'scripts', 'recipes');
const FIREBASE_CONFIG_PATH = path.join(REPO_ROOT, 'firebase-config.js');

// Prefer a key in this directory; fall back to the recipes one so a single
// downloaded key serves both toolchains.
const SERVICE_ACCOUNT_CANDIDATES = [
  path.join(ROOT, 'service-account.json'),
  path.join(RECIPES_DIR, 'service-account.json')
];
const FAMILY_ID_CANDIDATES = [
  path.join(ROOT, 'family-id.txt'),
  path.join(RECIPES_DIR, 'family-id.txt')
];

const VALID_VERDICTS = ['interested', 'going', 'no'];

function die(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function readServiceAccount() {
  const found = firstExisting(SERVICE_ACCOUNT_CANDIDATES);
  if (!found) {
    die(
      'Missing service-account.json.\n' +
      '  Download a service account key from the Firebase Console:\n' +
      '    Project Settings → Service Accounts → Generate New Private Key\n' +
      '  Save it to either:\n' +
      '    ' + SERVICE_ACCOUNT_CANDIDATES[0] + '\n' +
      '    ' + SERVICE_ACCOUNT_CANDIDATES[1] + '  (shared with the recipes scripts)\n' +
      '  (Both paths are gitignored.)'
    );
  }
  try {
    return JSON.parse(fs.readFileSync(found, 'utf8'));
  } catch (e) {
    die('Failed to parse ' + found + ': ' + e.message);
  }
}

function readDatabaseUrl() {
  if (process.env.FIREBASE_DATABASE_URL) return process.env.FIREBASE_DATABASE_URL;
  if (!fs.existsSync(FIREBASE_CONFIG_PATH)) {
    die('Cannot locate firebase-config.js at repo root.');
  }
  const content = fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf8');
  const match = content.match(/databaseURL\s*:\s*["']([^"']+)["']/);
  if (!match) {
    die('Could not parse databaseURL from firebase-config.js. Set FIREBASE_DATABASE_URL env var as a fallback.');
  }
  return match[1];
}

function resolveFamilyId(argFamily) {
  if (argFamily && argFamily !== true) return String(argFamily).trim();
  if (process.env.FAMILY_ID) return String(process.env.FAMILY_ID).trim();
  const found = firstExisting(FAMILY_ID_CANDIDATES);
  if (found) {
    const v = fs.readFileSync(found, 'utf8').trim();
    if (v) return v;
  }
  die(
    'Family ID not set.\n' +
    '  Use one of:\n' +
    '    --family <id> on the command line\n' +
    '    FAMILY_ID=<id> env var\n' +
    '    write the family code into ' + FAMILY_ID_CANDIDATES[0] + ' (gitignored)'
  );
}

function parseCliArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq >= 0) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        flags[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function initAdmin() {
  const admin = require('firebase-admin');
  if (admin.apps && admin.apps.length) return admin;
  const cred = readServiceAccount();
  const databaseURL = readDatabaseUrl();
  admin.initializeApp({
    credential: admin.credential.cert(cred),
    databaseURL: databaseURL
  });
  return admin;
}

function eventsRef(admin, familyId) {
  return admin.database().ref('families/' + familyId + '/events');
}

// --- Validation ---

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Parsed as local Y/M/D so date-only comparisons don't shift a day across the
// UTC boundary. Returns null for anything that isn't a real calendar date.
function parseISODate(value) {
  const m = ISO_DATE.exec(String(value || '').trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null; // e.g. 2026-02-30
  }
  return date;
}

const REQUIRED_STRINGS = ['title', 'dateText', 'where', 'cost', 'blurb', 'why', 'url'];

function validateEvent(event, index) {
  const errors = [];
  const label = '[' + index + ']';

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    return [label + ' is not an object.'];
  }

  REQUIRED_STRINGS.forEach((field) => {
    if (!isNonEmptyString(event[field])) {
      errors.push(label + ' missing required string field "' + field + '".');
    }
  });

  if (isNonEmptyString(event.url) && !/^https?:\/\//i.test(event.url.trim())) {
    errors.push(label + ' url must start with http:// or https://.');
  }

  if (!isNonEmptyString(event.startDate)) {
    errors.push(label + ' missing required "startDate" (YYYY-MM-DD).');
  } else if (!parseISODate(event.startDate)) {
    errors.push(label + ' startDate "' + event.startDate + '" is not a valid YYYY-MM-DD date.');
  }

  if (event.endDate !== undefined && event.endDate !== null && event.endDate !== '') {
    const end = parseISODate(event.endDate);
    if (!end) {
      errors.push(label + ' endDate "' + event.endDate + '" is not a valid YYYY-MM-DD date.');
    } else {
      const start = parseISODate(event.startDate);
      if (start && end.getTime() < start.getTime()) {
        errors.push(label + ' endDate is before startDate.');
      }
    }
  }

  if (!Array.isArray(event.tags) || event.tags.length === 0) {
    errors.push(label + ' tags must be a non-empty array.');
  } else if (!event.tags.every(isNonEmptyString)) {
    errors.push(label + ' tags must all be non-empty strings.');
  }

  if (event.ticketNote !== undefined && event.ticketNote !== null && typeof event.ticketNote !== 'string') {
    errors.push(label + ' ticketNote must be a string when present.');
  }

  if (errors.length) {
    return errors.map((e) => e + (isNonEmptyString(event.title) ? '  (' + event.title.trim() + ')' : ''));
  }
  return [];
}

function generateEventId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return 'evt_' + out;
}

function normalizeTitleKey(title) {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Two events are "the same" if they share a URL, or share a normalized title on
// the same start date. Used to avoid re-importing something that already has a
// verdict attached to it.
function dedupeKeys(event) {
  const keys = [];
  const url = String(event.url || '').trim().toLowerCase().replace(/\/+$/, '');
  if (url) keys.push('url:' + url);
  const titleKey = normalizeTitleKey(event.title);
  if (titleKey) keys.push('title:' + titleKey + '|' + String(event.startDate || '').trim());
  return keys;
}

function effectiveEndDate(event) {
  return parseISODate(event && event.endDate) || parseISODate(event && event.startDate);
}

module.exports = {
  die,
  parseCliArgs,
  initAdmin,
  resolveFamilyId,
  eventsRef,
  validateEvent,
  generateEventId,
  dedupeKeys,
  parseISODate,
  effectiveEndDate,
  VALID_VERDICTS
};
