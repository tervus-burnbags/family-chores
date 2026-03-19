// tests/app.spec.js — Family Hub smoke tests
// Run all:        FAMILY_CODE=XXXX npx playwright test
// Run one:        FAMILY_CODE=XXXX npx playwright test --grep "tab navigation"
// Interactive UI: FAMILY_CODE=XXXX npx playwright test --ui

const { test, expect } = require('@playwright/test');
const { loginAs, switchTab, sendInput } = require('./helpers');

// ─── Auth & Load ─────────────────────────────────────────────────────────────

test('app loads and shows tab bar', async ({ page }) => {
  await loginAs(page);
  await expect(page.locator('[data-tab="bulletin"]')).toBeVisible();
  await expect(page.locator('[data-tab="chores"]')).toBeVisible();
  await expect(page.locator('[data-tab="bank"]')).toBeVisible();
  await expect(page.locator('[data-tab="lists"]')).toBeVisible();
  await expect(page.locator('[data-tab="fun"]')).toBeVisible();
});

test('family setup modal is not shown when code is pre-loaded', async ({ page }) => {
  await loginAs(page);
  const modal = page.locator('#familyModal');
  await expect(modal).not.toHaveClass(/open/);
});

// ─── Tab Navigation ───────────────────────────────────────────────────────────

test('tab navigation switches views', async ({ page }) => {
  await loginAs(page);

  await switchTab(page, 'chores');
  await expect(page.locator('#viewChores')).toHaveClass(/active/);

  await switchTab(page, 'bank');
  await expect(page.locator('#viewBank')).toHaveClass(/active/);

  await switchTab(page, 'lists');
  await expect(page.locator('#viewLists')).toHaveClass(/active/);

  await switchTab(page, 'fun');
  await expect(page.locator('#viewFun')).toHaveClass(/active/);

  await switchTab(page, 'bulletin');
  await expect(page.locator('#viewBulletin')).toHaveClass(/active/);
});

// ─── Bulletin / Home ──────────────────────────────────────────────────────────

test('bulletin tab is the default active view', async ({ page }) => {
  await loginAs(page);
  await expect(page.locator('#viewBulletin')).toHaveClass(/active/);
});

test('plain text on bulletin creates a note, not a chore prompt', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'bulletin');
  await sendInput(page, 'pick up dry cleaning');
  const toast = page.locator('.toast').first();
  await expect(toast).not.toContainText(/which kid/i);
  await expect(toast).not.toContainText(/whose/i);
});

test('"pin" command creates a note from bulletin tab', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'bulletin');
  await sendInput(page, 'pin remember dentist');
  const toast = page.locator('.toast').first();
  await expect(toast).not.toContainText(/which kid/i);
});

// ─── Chores ───────────────────────────────────────────────────────────────────

test('logging a chore shows "Got it" toast', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'chores');
  await sendInput(page, 'alex made bed');
  const toast = page.locator('.toast').first();
  await expect(toast).toContainText(/got it/i);
});

test('chore without kid name shows "which kid" prompt', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'chores');
  await sendInput(page, 'made bed');
  const toast = page.locator('.toast').first();
  await expect(toast).toContainText(/which kid|whose/i);
});

// ─── Bank ─────────────────────────────────────────────────────────────────────

test('bank tab renders kid card view', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'bank');
  // Kid picker buttons should be visible
  await expect(page.locator('[data-bank-kid]').first()).toBeVisible();
});

test('bank refreshes after recording a transaction', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'bank');
  // Click Alex's card
  await page.locator('[data-bank-kid="alex"]').click();
  await page.waitForTimeout(500);
  // Record a payment
  await sendInput(page, 'alex earned 1');
  // Card should still be visible (not broken/blank)
  await expect(page.locator('[data-bank-kid="alex"]')).toBeVisible();
});

// ─── Fun Tab ──────────────────────────────────────────────────────────────────

test('fun tab shows activity tiles', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'fun');
  await expect(page.locator('[data-fun-open]').first()).toBeVisible();
});

test('tic tac toe opens and shows 9 cells', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'fun');
  await page.click('[data-fun-open="ttt"]');
  await expect(page.locator('.ttt-cell')).toHaveCount(9);
});

// ─── Lists ────────────────────────────────────────────────────────────────────

test('lists tab renders list content area', async ({ page }) => {
  await loginAs(page);
  await switchTab(page, 'lists');
  await expect(page.locator('#listsContent')).toBeVisible();
});

// ─── Mobile ───────────────────────────────────────────────────────────────────

test('no horizontal scroll at 375px width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAs(page);
  const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});
