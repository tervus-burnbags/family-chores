// Shared library for the recipe admin scripts.
//
// Loads firebase-admin with the service-account key, resolves the family ID,
// validates recipe JSON against the schema in RECIPE_SCHEMA.md, and exposes
// helpers used by import / update / fetch / list.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SERVICE_ACCOUNT_PATH = path.join(ROOT, 'service-account.json');
const FAMILY_ID_PATH = path.join(ROOT, 'family-id.txt');
const FIREBASE_CONFIG_PATH = path.join(REPO_ROOT, 'firebase-config.js');

const ALLOWED_UNITS = ['g', 'ml', 'tsp', 'Tbsp', 'cup', 'ea', 'pinch', ''];

function die(msg) {
  console.error('Error: ' + msg);
  process.exit(1);
}

function readServiceAccount() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    die(
      'Missing service-account.json.\n' +
      '  Download a service account key from the Firebase Console:\n' +
      '    Project Settings → Service Accounts → Generate New Private Key\n' +
      '  Save it to:\n    ' + SERVICE_ACCOUNT_PATH + '\n' +
      '  (This file is gitignored.)'
    );
  }
  try {
    return JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  } catch (e) {
    die('Failed to parse service-account.json: ' + e.message);
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
  if (argFamily) return String(argFamily).trim();
  if (process.env.FAMILY_ID) return String(process.env.FAMILY_ID).trim();
  if (fs.existsSync(FAMILY_ID_PATH)) {
    const v = fs.readFileSync(FAMILY_ID_PATH, 'utf8').trim();
    if (v) return v;
  }
  die(
    'Family ID not set.\n' +
    '  Use one of:\n' +
    '    --family <id> on the command line\n' +
    '    FAMILY_ID=<id> env var\n' +
    '    write the family code into ' + FAMILY_ID_PATH + ' (gitignored)'
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

function familyRef(admin, familyId) {
  return admin.database().ref('families/' + familyId);
}

function recipesRef(admin, familyId) {
  return familyRef(admin, familyId).child('recipes');
}

function recipeRef(admin, familyId, recipeId) {
  return recipesRef(admin, familyId).child(recipeId);
}

// --- Validation ---

function isNumberLike(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateRecipe(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    errors.push('Input must be a JSON object.');
    return errors;
  }
  if (typeof input.title !== 'string' || !input.title.trim()) {
    errors.push('`title` is required and must be a non-empty string.');
  }
  if (input.description != null && typeof input.description !== 'string') {
    errors.push('`description` must be a string if present.');
  }
  if (input.tags != null) {
    if (!Array.isArray(input.tags)) {
      errors.push('`tags` must be an array.');
    } else {
      input.tags.forEach(function (t, i) {
        if (typeof t !== 'string') errors.push('tags[' + i + '] must be a string.');
      });
    }
  }
  ['servings', 'prepTime', 'cookTime', 'totalTime', 'source', 'category'].forEach(function (f) {
    if (input[f] != null && typeof input[f] !== 'string') {
      errors.push('`' + f + '` must be a string if present.');
    }
  });
  if (!Array.isArray(input.ingredients) || input.ingredients.length === 0) {
    errors.push('`ingredients` is required and must be a non-empty array.');
  } else {
    input.ingredients.forEach(function (ing, i) {
      if (!ing || typeof ing !== 'object' || Array.isArray(ing)) {
        errors.push('ingredients[' + i + '] must be an object.');
        return;
      }
      if (!isNumberLike(ing.qty)) {
        errors.push('ingredients[' + i + '].qty must be a number (got ' + JSON.stringify(ing.qty) + ').');
      }
      if (typeof ing.unit !== 'string') {
        errors.push('ingredients[' + i + '].unit must be a string (use "" for "to taste").');
      } else if (ALLOWED_UNITS.indexOf(ing.unit) < 0) {
        errors.push('ingredients[' + i + '].unit is "' + ing.unit + '". Allowed: ' + ALLOWED_UNITS.filter(Boolean).join(', ') + ', "".');
      }
      if (typeof ing.item !== 'string' || !ing.item.trim()) {
        errors.push('ingredients[' + i + '].item must be a non-empty string.');
      }
      if (ing.note != null && typeof ing.note !== 'string') {
        errors.push('ingredients[' + i + '].note must be a string if present.');
      }
      if (ing.component != null && typeof ing.component !== 'string') {
        errors.push('ingredients[' + i + '].component must be a string if present.');
      }
    });
  }
  if (!Array.isArray(input.steps) || input.steps.length === 0) {
    errors.push('`steps` is required and must be a non-empty array.');
  } else {
    input.steps.forEach(function (s, i) {
      if (typeof s !== 'string' || !s.trim()) {
        errors.push('steps[' + i + '] must be a non-empty string.');
      }
    });
  }
  return errors;
}

// Strip server-managed fields from input.
function sanitizeInput(input) {
  const clean = {};
  ['title', 'description', 'servings', 'prepTime', 'cookTime', 'totalTime', 'source'].forEach(function (f) {
    if (input[f] != null) clean[f] = String(input[f]);
  });
  if (input.category != null && String(input.category).trim()) {
    clean.category = String(input.category).trim().toLowerCase();
  }
  clean.tags = Array.isArray(input.tags) ? input.tags.map(String) : [];
  clean.ingredients = input.ingredients.map(function (ing) {
    const out = {
      qty: Number(ing.qty),
      unit: String(ing.unit),
      item: String(ing.item).trim()
    };
    if (ing.note != null && String(ing.note).trim()) out.note = String(ing.note);
    if (ing.component != null && String(ing.component).trim()) {
      out.component = String(ing.component).trim().toLowerCase();
    }
    return out;
  });
  clean.steps = input.steps.map(function (s) { return String(s).trim(); });
  return clean;
}

function readJsonFile(p) {
  if (!fs.existsSync(p)) die('File not found: ' + p);
  let raw;
  try {
    raw = fs.readFileSync(p, 'utf8');
  } catch (e) {
    die('Cannot read ' + p + ': ' + e.message);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    die('Invalid JSON in ' + p + ': ' + e.message);
  }
}

function makeRecipeId() {
  return 'rcp_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

module.exports = {
  parseCliArgs,
  resolveFamilyId,
  initAdmin,
  familyRef,
  recipesRef,
  recipeRef,
  validateRecipe,
  sanitizeInput,
  readJsonFile,
  makeRecipeId,
  die,
  ROOT,
  REPO_ROOT
};
