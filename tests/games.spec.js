// tests/games.spec.js: Fun tab vs games (player picker, alternating starts,
// Memory Match, and the pass-the-phone arcade games).
//
// Run against a local build:
//   TEST_URL=http://localhost:8080 FAMILY_CODE=TESTFAM1 npx playwright test tests/games.spec.js --project=chromium

const { test, expect } = require('@playwright/test');
const { loginAs, switchTab } = require('./helpers');

test.beforeEach(async ({ page }) => {
  // Each test gets a fresh browser context, so starters, levels and records start empty.
  await loginAs(page);
  await switchTab(page, 'fun');
});

test('shows the new game tiles', async ({ page }) => {
  for (const id of ['memory', 'snake', 'bricks', 'blocks']) {
    await expect(page.locator(`[data-fun-open="${id}"]`)).toBeVisible();
  }
});

test('player picker offers the family and swaps on a duplicate pick', async ({ page }) => {
  await page.click('[data-fun-open="ttt"]');
  const p1 = page.locator('select.game-player-select.p1');
  const p2 = page.locator('select.game-player-select.p2');
  await expect(p1.locator('option')).toHaveText(['Dad', 'Mom', 'Alex', 'Louisa']);
  await expect(p1).toHaveValue('Alex');
  await expect(p2).toHaveValue('Louisa');

  await page.locator('select.game-player-select.p1').selectOption('Dad');
  await expect(page.locator('select.game-player-select.p1')).toHaveValue('Dad');
  await expect(page.locator('.game-scoreboard')).toContainText('Dad');

  // Picking the other seat's player swaps them.
  await page.locator('select.game-player-select.p2').selectOption('Dad');
  await expect(page.locator('select.game-player-select.p1')).toHaveValue('Louisa');
  await expect(page.locator('select.game-player-select.p2')).toHaveValue('Dad');
});

test('who goes first alternates each new game', async ({ page }) => {
  await page.click('[data-fun-open="ttt"]');
  const status = page.locator('.ttt-status');
  const first = (await status.textContent()).trim();
  expect(first).toMatch(/goes first/);
  await page.click('#funTTTNewBtn');
  const second = (await status.textContent()).trim();
  expect(second).toMatch(/goes first/);
  expect(second).not.toEqual(first);
  await page.click('#funTTTNewBtn');
  await expect(status).toHaveText(first);
});

test('memory match: a miss passes the turn, size chips change the board', async ({ page }) => {
  await page.click('[data-fun-open="memory"]');
  await expect(page.locator('.mm-card')).toHaveCount(16);

  const starter = (await page.locator('.mm-status').textContent()).split(' goes first')[0].trim();
  const other = starter === 'Alex' ? 'Louisa' : 'Alex';

  // Find two cards that do not match by reading the shuffled deck from the page.
  const emojis = [];
  for (let i = 0; i < 16; i += 1) {
    await page.click(`[data-mm-card="${i}"]`);
    emojis.push((await page.locator(`[data-mm-card="${i}"]`).textContent()).trim());
    if (emojis.length === 2) break;
  }
  if (emojis[0] === emojis[1]) {
    await expect(page.locator('.mm-status')).toContainText(`Match! ${starter} goes again`);
  } else {
    await expect(page.locator('.mm-status')).toContainText('No match');
    await expect(page.locator('.mm-status')).toContainText(`${other}'s turn`, { timeout: 4000 });
  }

  await page.click('[data-mm-size="12"]');
  await expect(page.locator('.mm-card')).toHaveCount(12);
  await page.click('[data-mm-size="20"]');
  await expect(page.locator('.mm-card')).toHaveCount(20);
});

test('snake: both players take a turn and a winner is declared', async ({ page }) => {
  await page.click('[data-fun-open="snake"]');
  await expect(page.locator('#funArcadeStartBtn')).toBeVisible();
  // Fast mode has walls, so an idle snake crashes quickly.
  await page.click('[data-arcade-player="p1"][data-arcade-level="fast"]');
  await page.click('[data-arcade-player="p2"][data-arcade-level="fast"]');
  await page.click('#funArcadeStartBtn');

  await expect(page.locator('.arcade-canvas')).toBeVisible();
  await expect(page.locator('.arcade-btn')).toHaveCount(4);

  await expect(page.locator('#funArcadeGoBtn')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.arcade-handoff')).toContainText('Pass the phone to');
  await page.click('#funArcadeGoBtn');

  await expect(page.locator('.arcade-result-row')).toHaveCount(2, { timeout: 15000 });
  await expect(page.locator('.mm-status')).toContainText(/wins!|tie/);
});

test('brick breaker and block drop mount their boards and controls', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.click('[data-fun-open="bricks"]');
  await page.click('#funArcadeStartBtn');
  await expect(page.locator('.arcade-canvas')).toBeVisible();
  await expect(page.locator('.arcade-btn')).toHaveCount(2);
  await page.waitForTimeout(4500); // countdown, then a little play
  await page.locator('.arcade-btn').first().dispatchEvent('pointerdown');
  await page.waitForTimeout(300);
  await page.locator('.arcade-btn').first().dispatchEvent('pointerup');

  await page.click('[data-fun-open="home"]');
  await page.click('[data-fun-open="blocks"]');
  await page.click('#funArcadeStartBtn');
  await expect(page.locator('.arcade-btn')).toHaveCount(5);
  await page.waitForTimeout(4200);
  await page.locator('.arcade-btn[aria-label="Drop"]').dispatchEvent('pointerdown');
  await expect(page.locator('.arcade-score')).not.toHaveText('0');

  expect(errors).toEqual([]);
});
