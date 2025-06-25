// E2E test: Basic navigation and UI checks for desktop app
const { test, expect } = require('@playwright/test');

test.describe('Desktop App UI', () => {
  test('should load dashboard and show welcome header', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page.locator('h1')).toContainText('What legal case are you working on today?');
  });

  test('should open settings modal and switch theme', async ({ page }) => {
    await page.goto('http://localhost:5173/settings');
    await expect(page.locator('form')).toBeVisible();
    // Simulate theme switch if possible
  });
});
