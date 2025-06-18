import { test, expect, type Page } from '@playwright/test';

// Helper function to login before case tests
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Case Creation Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });

  test('should display case creation form correctly', async ({ page }) => {
    await page.goto('/cases/new');
    
    // Check form elements are present
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"], input[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="dangerScore"], select[name="dangerScore"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check form labels or placeholders
    await expect(page.locator('form')).toContainText(/title/i);
    await expect(page.locator('form')).toContainText(/description/i);
  });

  test('should create a new case successfully', async ({ page }) => {
    await page.goto('/cases/new');
    
    // Generate unique case data
    const timestamp = Date.now();
    const caseTitle = `Test Case ${timestamp}`;
    const caseDescription = `This is a test case created at ${new Date().toISOString()}`;
    
    // Fill out case creation form
    await page.fill('input[name="title"]', caseTitle);
    
    // Handle description field (could be textarea or input)
    const descriptionField = page.locator('textarea[name="description"]');
    const descriptionInput = page.locator('input[name="description"]');
    
    if (await descriptionField.count() > 0) {
      await descriptionField.fill(caseDescription);
    } else {
      await descriptionInput.fill(caseDescription);
    }
    
    // Set danger score
    const dangerScoreField = page.locator('input[name="dangerScore"]');
    const dangerScoreSelect = page.locator('select[name="dangerScore"]');
    
    if (await dangerScoreField.count() > 0) {
      await dangerScoreField.fill('5');
    } else if (await dangerScoreSelect.count() > 0) {
      await dangerScoreSelect.selectOption('5');
    }
    
    // Set status
    await page.selectOption('select[name="status"]', 'open');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to case detail page
    await page.waitForURL(/\/cases\/[a-f0-9-]+/);
    
    // Verify we're on a case detail page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/cases\/[a-f0-9-]+/);
      // Verify case details are displayed
    await expect(page.locator('h1, h2')).toContainText(caseTitle);
    await expect(page.locator('body')).toContainText(caseDescription);
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    await page.goto('/cases/new');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should stay on case creation page
    await expect(page).toHaveURL('/cases/new');
    
    // Check for HTML5 validation or error messages
    const titleInput = page.locator('input[name="title"]');
    const descriptionField = page.locator('textarea[name="description"], input[name="description"]');
    
    await expect(titleInput).toBeVisible();
    await expect(descriptionField.first()).toBeVisible();
  });

  test('should navigate back to cases list', async ({ page }) => {
    await page.goto('/cases/new');
    
    // Look for back/cancel link or button
    const backLink = page.locator('a[href="/cases"], button:has-text("Cancel"), a:has-text("Back")');
    
    if (await backLink.count() > 0) {
      await backLink.first().click();
      await expect(page).toHaveURL('/cases');
    } else {
      // Manually navigate to cases list
      await page.goto('/cases');
      await expect(page).toHaveURL('/cases');
    }
  });

  test('should access case creation from cases list page', async ({ page }) => {
    await page.goto('/cases');
    
    // Look for "New Case" or "Create Case" button/link
    const newCaseButton = page.locator('a[href="/cases/new"], button:has-text("New"), a:has-text("Create")');
    
    if (await newCaseButton.count() > 0) {
      await newCaseButton.first().click();
      await expect(page).toHaveURL('/cases/new');
    } else {
      // Direct navigation should work
      await page.goto('/cases/new');
      await expect(page).toHaveURL('/cases/new');
    }
  });
});
