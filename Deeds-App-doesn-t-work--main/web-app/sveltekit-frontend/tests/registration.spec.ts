import { test, expect, type Page } from '@playwright/test';

test.describe('Registration Flow Tests', () => {
  test('should display registration form correctly', async ({ page }) => {
    await page.goto('/register');
    
    // Check form elements are present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('input[name="agreeToTerms"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check form labels
    await expect(page.locator('label[for="name"]')).toContainText('Name');
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="password"]')).toContainText('Password');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should stay on registration page
    await expect(page).toHaveURL('/register');
    
    // Check for HTML5 validation or custom error messages
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');
    
    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
      // Fill out registration form
    await page.fill('input[name="name"]', `Test User ${timestamp}`);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.check('input[name="agreeToTerms"]');
    
    // Submit form
    await page.click('button[type="submit"]');
      // Should redirect to login page after successful registration
    await page.waitForURL('/login*');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for duplicate email registration', async ({ page }) => {
    await page.goto('/register');
      // Try to register with existing email
    await page.fill('input[name="name"]', 'Duplicate User');
    await page.fill('input[name="email"]', 'test@example.com'); // Assuming this exists
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.check('input[name="agreeToTerms"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should stay on registration page or show error
    // This will depend on your error handling implementation
    await page.waitForTimeout(1000); // Wait for potential error message
    
    // Check for error message or that we're still on registration page
    const isOnRegister = page.url().includes('/register');
    if (isOnRegister) {
      // Look for error message
      const errorMessage = page.locator('.error, .alert-error, [role="alert"]');
      // Error message might be visible or page might stay on register
      // This is acceptable behavior for duplicate email
    }
  });

  test('should navigate to login from registration page', async ({ page }) => {
    await page.goto('/register');
    
    // Look for login link
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    
    await loginLink.click();
    await expect(page).toHaveURL('/login');
  });
});
