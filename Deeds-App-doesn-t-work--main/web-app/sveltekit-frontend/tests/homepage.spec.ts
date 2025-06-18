import { test, expect, type Page } from '@playwright/test';

// Helper function to login a user
async function loginUser(page: Page, email: string = 'test@example.com', password: string = 'password123') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect after login
  await page.waitForURL('/dashboard');
}

test.describe('Homepage Tests', () => {
  test('should load homepage with correct title and navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Prosecutor/);
    
    // Check main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    
    // Check hero section
    await expect(page.locator('h1')).toContainText(/Prosecutor/i);
    
    // Check CTA buttons
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
  });

  test('should navigate to registration from homepage', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to login from homepage', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
  });
});
