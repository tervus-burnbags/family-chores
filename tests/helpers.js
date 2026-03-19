// tests/helpers.js — shared test utilities
//
// SETUP: Set your family code in .env.test (never commit this file):
//   FAMILY_CODE=YOURCODE
//
// Or pass inline: FAMILY_CODE=YOURCODE npx playwright test

const FAMILY_CODE = process.env.FAMILY_CODE || '';

if (!FAMILY_CODE) {
  console.warn('\n⚠️  FAMILY_CODE env var not set. Auth-dependent tests will fail.\n   Run: FAMILY_CODE=YOURCODE npx playwright test\n');
}

/**
 * Navigate to the app and inject the family code via localStorage
 * BEFORE the app initialises, bypassing the setup modal.
 * Waits for the tab bar to confirm the app is ready.
 */
async function loginAs(page, familyCode = FAMILY_CODE) {
  // addInitScript runs before any page JS — this is the correct injection point
  await page.addInitScript((code) => {
    localStorage.setItem('familyChores.familyId', code);
  }, familyCode);
  await page.goto('/');
  // Wait for tab bar — confirms app loaded and auth succeeded
  await page.waitForSelector('[data-tab]', { timeout: 15000 });
  // Wait for modal to close (if any)
  await page.waitForFunction(() => {
    const modal = document.getElementById('familyModal');
    return !modal || !modal.classList.contains('open');
  }, { timeout: 10000 });
}

/**
 * Switch to a named tab (bulletin, chores, bank, lists, fun).
 */
async function switchTab(page, tabName) {
  await page.click(`[data-tab="${tabName}"]`);
  // Wait for the corresponding view to become active
  await page.waitForSelector(`#view${capitalize(tabName)}.active, [id="view${capitalize(tabName)}"].active`, {
    timeout: 5000
  }).catch(() => {
    // Fallback: just wait a moment for the transition
    return page.waitForTimeout(500);
  });
}

/**
 * Submit text via the main chat input.
 */
async function sendInput(page, text) {
  await page.fill('#messageInput', text);
  await page.keyboard.press('Enter');
  // Wait for a toast or system message response
  await page.waitForSelector('.toast', { timeout: 8000 });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { loginAs, switchTab, sendInput, FAMILY_CODE };
