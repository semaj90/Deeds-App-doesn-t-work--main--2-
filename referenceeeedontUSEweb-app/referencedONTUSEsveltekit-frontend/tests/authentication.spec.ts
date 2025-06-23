import { test, expect } from '@playwright/test';

test.describe('Authentication Flow Tests', () => {
  const generateTestUser = () => {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    };
  };

  test('should complete registration flow', async ({ page }) => {
    const testUser = generateTestUser();
    
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Fill registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // Handle different possible field names for confirmation
    const confirmPasswordSelectors = [
      'input[name="confirmPassword"]',
      'input[name="confirm_password"]',
      'input[name="passwordConfirm"]',
      'input[id="confirmPassword"]'
    ];
    
    for (const selector of confirmPasswordSelectors) {
      const input = page.locator(selector);
      if (await input.count() > 0) {
        await input.fill(testUser.password);
        break;
      }
    }
    
    // Handle name field if present
    const nameSelectors = [
      'input[name="name"]',
      'input[name="firstName"]',
      'input[name="fullName"]'
    ];
    
    for (const selector of nameSelectors) {
      const input = page.locator(selector);
      if (await input.count() > 0) {
        await input.fill(testUser.name);
        break;
      }
    }
    
    // Handle terms and conditions checkbox if present
    const termsCheckbox = page.locator('input[type="checkbox"]');
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.check();
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for registration to complete
    await page.waitForLoadState('networkidle');
    
    // Check if registration was successful (redirect or success message)
    const currentUrl = page.url();
    const hasSuccessMessage = await page.locator('text=success').count() > 0;
    const hasLoginRedirect = currentUrl.includes('/login');
    const hasDashboardRedirect = currentUrl.includes('/dashboard');
    
    expect(hasSuccessMessage || hasLoginRedirect || hasDashboardRedirect).toBeTruthy();
  });

  test('should complete login flow with demo user', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login with demo credentials
    await page.fill('input[name="email"]', 'demo@prosecutor.com');
    await page.fill('input[name="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Check if login was successful
    const currentUrl = page.url();
    const hasAuthCookie = await page.context().cookies();
    
    // Should either redirect away from login or set auth cookies
    expect(!currentUrl.includes('/login') || hasAuthCookie.length > 0).toBeTruthy();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Should stay on login page or show error
    const currentUrl = page.url();
    expect(currentUrl.includes('/login')).toBeTruthy();
  });
});
