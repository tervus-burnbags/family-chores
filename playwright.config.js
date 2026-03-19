// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  reporter: 'list',

  use: {
    // Point at Vercel prod by default. Override with TEST_URL env var.
    baseURL: process.env.TEST_URL || 'https://family-chores-psi.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-android',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-ios',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
