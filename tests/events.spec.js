// tests/events.spec.js — Around Charlotte section on the Home tab.
//
// Requires the test events to be seeded first:
//   node tests/seed-test-events.js
//
// Run against a local build:
//   TEST_URL=http://localhost:8080 npx playwright test events.spec.js --project=chromium

const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.beforeEach(async ({ page }) => {
  await loginAs(page);
  await page.waitForSelector('.events-head', { timeout: 15000 });
});

test('renders the Around Charlotte section', async ({ page }) => {
  await expect(page.locator('.events-head .hub-section-head')).toHaveText('Around Charlotte');
});

test('hides expired events but keeps one ending today', async ({ page }) => {
  await expect(page.locator('.event-card', { hasText: 'Test Expired Event' })).toHaveCount(0);
  await expect(page.locator('.event-card', { hasText: 'Test Ends Today Event' })).toHaveCount(1);
});

test('hides dismissed events behind the toggle', async ({ page }) => {
  await expect(page.locator('.events-list .event-card', { hasText: 'Test Dismissed Event' })).toHaveCount(0);

  const toggle = page.locator('[data-events-toggle-dismissed]');
  await expect(toggle).toContainText('1 dismissed');
  await toggle.click();

  await expect(page.locator('.event-dismissed-row', { hasText: 'Test Dismissed Event' })).toHaveCount(1);
});

test('pins going events to the top despite a later date', async ({ page }) => {
  const first = page.locator('.events-list .event-card').first();
  await expect(first).toContainText('Test Going Event');
  await expect(first.locator('.event-flag')).toHaveText('Going');
});

test('renders dateText verbatim rather than reformatting', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'Test Renaissance Festival' });
  await expect(card.locator('.event-date')).toHaveText('Weekends only, rain or shine');
});

test('highlights a priority artist or team watch', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'Test Priority Watch Event' });
  await expect(card).toHaveClass(/priority-watch/);
  await expect(card.locator('.event-flag')).toHaveText('Priority');
});

test('expands one card at a time and shows detail', async ({ page }) => {
  const renfest = page.locator('.event-card', { hasText: 'Test Renaissance Festival' });
  await renfest.click();

  await expect(renfest).toHaveClass(/expanded/);
  await expect(renfest.locator('.event-why')).toContainText('Full day outdoors');
  await expect(renfest.locator('.event-ticket')).toContainText('buy in advance');
  await expect(renfest.locator('.event-verdicts .event-verdict-btn')).toHaveCount(3);

  // Opening another collapses the first (accordion).
  const going = page.locator('.event-card', { hasText: 'Test Going Event' });
  await going.click();
  await expect(going).toHaveClass(/expanded/);
  await expect(renfest).not.toHaveClass(/expanded/);
});

test('external link opens in a new tab with rel protection', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'Test Renaissance Festival' });
  await card.click();
  const link = card.locator('.event-link');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('escapes HTML in event fields', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'alert("xss")' });
  await expect(card.locator('.event-title')).toHaveText('<script>alert("xss")</script> & "quoted"');
  // If escaping failed the tag would have become a real element.
  await expect(card.locator('.event-date b')).toHaveCount(0);
});

test('renders a record missing every optional field', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'Test Minimal Event' });
  await expect(card).toHaveCount(1);
  await expect(card.locator('.event-meta')).toHaveCount(0);
  await expect(card.locator('.event-blurb')).toHaveCount(0);

  // Still expandable, and the verdict buttons still work.
  await card.click();
  await expect(card.locator('.event-verdict-btn')).toHaveCount(3);
  await expect(card.locator('.event-link')).toHaveCount(0);
});

test('setting and clearing a verdict round-trips through Firebase', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'Test Renaissance Festival' });
  await card.click();

  const interested = card.locator('[data-event-verdict="interested"]');
  await interested.click();
  await expect(card.locator('.event-flag')).toHaveText('Interested');
  await expect(card).toHaveClass(/verdict-interested/);

  // The card stays expanded across the verdict re-render, so the buttons are
  // still on screen. Tapping the active verdict again clears it.
  await expect(card).toHaveClass(/expanded/);
  await expect(interested).toHaveClass(/active/);
  await interested.click();
  await expect(card.locator('.event-flag')).toHaveCount(0);
  await expect(interested).not.toHaveClass(/active/);
});

test('dismissing removes the card and Undo restores it', async ({ page }) => {
  const card = page.locator('.event-card', { hasText: 'Test Ends Today Event' });
  await card.click();
  await card.locator('[data-event-verdict="no"]').click();

  await expect(page.locator('.events-list .event-card', { hasText: 'Test Ends Today Event' })).toHaveCount(0);

  await page.locator('.toast-undo').click();
  await expect(page.locator('.events-list .event-card', { hasText: 'Test Ends Today Event' })).toHaveCount(1);
});

test('does not break the rest of the Home tab', async ({ page }) => {
  await expect(page.locator('#bulletinNewNoteBtn')).toBeVisible();
  await expect(page.locator('.bulletin-calendar-head')).toContainText('Coming Up');
});
