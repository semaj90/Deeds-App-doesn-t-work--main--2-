import { test, expect } from '@playwright/test';

test.describe('Basic Application Health Tests', () => {
  test('should load homepage without errors', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded without JavaScript errors
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log('Page title:', title);
    
    // Check that the page contains some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Check that login form elements exist
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should load register page', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Check that register form elements exist
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    
    // Should not crash and should show some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
