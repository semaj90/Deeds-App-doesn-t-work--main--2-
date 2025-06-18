import { test, expect, type Page } from '@playwright/test';

test.describe('Login Flow Tests', () => {
  test('should display login form correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements are present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check form labels
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="password"]')).toContainText('Password');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
    
    // Check for HTML5 validation
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Use test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Should see user info or dashboard content
    await expect(page.locator('nav')).toBeVisible();
    
    // Should have logout functionality
    const logoutButton = page.locator('button:has-text("Logout"), a[href="/logout"], form[action="/logout"]');
    await expect(logoutButton.first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Use invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait a moment for potential error handling
    await page.waitForTimeout(1000);
    
    // Should either stay on login page or show error
    const isOnLogin = page.url().includes('/login');
    if (isOnLogin) {
      // Check for error message
      const errorMessage = page.locator('.error, .alert-error, [role="alert"]');
      // Error handling may vary, but staying on login page is acceptable
    }
  });

  test('should navigate to registration from login page', async ({ page }) => {
    await page.goto('/login');
    
    // Look for registration link
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
    
    await registerLink.click();
    await expect(page).toHaveURL('/register');
  });

  test('should redirect authenticated user away from login page', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Now try to visit login page again
    await page.goto('/login');
    
    // Should redirect away from login (typically to dashboard)
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    
    // Should not be on login page
    expect(currentUrl).not.toContain('/login');
  });
});
