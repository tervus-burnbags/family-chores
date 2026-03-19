// tests/helpers.js — shared test utilities
//
// Tests run against Vercel but intercept firebase-config.js to point
// at the isolated test Firebase project (family-hub-test-8f868).
// No real family data is touched.
//
// Required: set FAMILY_CODE to an 8-char code for the TEST database.
// Create one by opening the app pointed at the test Firebase and
// clicking "Create New Family", or just pick any 8-char string —
// the test DB is empty so it'll auto-create the family.
//
// Run: FAMILY_CODE=TESTFAM1 npx playwright test

const fs = require('fs');
const path = require('path');

const FAMILY_CODE = process.env.FAMILY_CODE || 'TESTFAM1';

// Read the test firebase config to inject as a route intercept
const TEST_CONFIG_PATH = path.join(__dirname, '..', 'firebase-config.test.js');
const TEST_CONFIG_JS = fs.readFileSync(TEST_CONFIG_PATH, 'utf8');

/**
 * Navigate to the app with:
 * - firebase-config.js intercepted → points at test Firebase project
 * - family code injected into localStorage → skips setup modal
 */
async function loginAs(page, familyCode = FAMILY_CODE) {
  // Capture browser console messages so we can see Firebase errors in test output
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('firebase') || msg.text().includes('family')) {
      console.log(`[browser ${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => console.log(`[page error] ${err.message}`));

  // Intercept the firebase config request and serve test credentials
  await page.route('**/firebase-config.js', (route) => {
    console.log('[intercept] firebase-config.js intercepted — serving test config');
    route.fulfill({
      contentType: 'application/javascript',
      body: TEST_CONFIG_JS,
    });
  });

  // Set localStorage AND install a flag that gets set when config loads
  await page.addInitScript((code) => {
    localStorage.setItem('familyChores.familyId', code);
    // Listen for the config-loaded event dispatched by the app
    window.__hubConfigLoaded = false;
    document.addEventListener('hub:config-changed', function () {
      window.__hubConfigLoaded = true;
    });
  }, familyCode);

  await page.goto('/');

  // Wait for tab bar — confirms HTML rendered
  await page.waitForSelector('[data-tab]', { timeout: 15000 });

  // Wait for hub:config-changed, modal closed, AND chore config loaded.
  // hub:config-changed fires when configLoaded=true, but Firebase onValue
  // listeners may not have delivered currentConfig.chores yet. We wait
  // for that too so intent parsing works immediately after loginAs returns.
  await page.waitForFunction(() => {
    const modal = document.getElementById('familyModal');
    const modalClosed = modal && !modal.classList.contains('open');
    const runtime = window.phaseRuntime;
    // configLoaded=true means Firebase config loaded. currentConfig.chores
    // is populated from Firebase (seeded with keywords), so intent parsing works.
    const choresReady = runtime && runtime.configLoaded === true &&
      runtime.currentConfig && runtime.currentConfig.chores &&
      Object.keys(runtime.currentConfig.chores).length > 0;
    return window.__hubConfigLoaded === true && modalClosed && choresReady;
  }, { timeout: 20000 });
}

/**
 * Switch to a named tab (bulletin, chores, bank, lists, fun).
 */
async function switchTab(page, tabName) {
  await page.click(`[data-tab="${tabName}"]`);
  await page.waitForSelector(`#view${capitalize(tabName)}.active`, {
    timeout: 5000,
  }).catch(() => page.waitForTimeout(500));
}

/**
 * Submit text via the main chat input and wait for a toast response.
 */
async function sendInput(page, text) {
  await page.fill('#messageInput', text);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.toast', { timeout: 8000 });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { loginAs, switchTab, sendInput, FAMILY_CODE };
