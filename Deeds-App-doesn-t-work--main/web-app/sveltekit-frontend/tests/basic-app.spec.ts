import { test, expect } from '@playwright/test';

test.describe('Basic Application Tests', () => {
  test('homepage loads without SSR errors', async ({ page }) => {
    // Go to the homepage
    await page.goto('http://localhost:5173/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded without JavaScript errors
    const title = await page.title();
    expect(title).toContain('Legal Intelligence CMS');
    
    // Check that the navigation bar is present
    const navbar = page.locator('nav.navbar');
    await expect(navbar).toBeVisible();
    
    // Check for Bootstrap components (confirming Bootstrap loaded)
    const navbarBrand = page.locator('.navbar-brand');
    await expect(navbarBrand).toBeVisible();
  });

  test('login page loads correctly', async ({ page }) => {
    // Go to the login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that login form is present
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // Check for email and password fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('statutes page loads without client-side schema import errors', async ({ page }) => {
    // This specifically tests our fix for client-side schema imports
    await page.goto('http://localhost:5173/statutes');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded successfully
    const heading = page.locator('h1, h2, .card-title');
    await expect(heading.first()).toBeVisible();
    
    // Check that no JavaScript errors occurred
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error));
    
    // Navigate to trigger any potential errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Assert no client-side errors
    expect(pageErrors).toHaveLength(0);
  });
});
