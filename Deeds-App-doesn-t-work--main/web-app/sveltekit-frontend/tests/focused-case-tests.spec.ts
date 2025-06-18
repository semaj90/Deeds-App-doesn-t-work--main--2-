import { test, expect } from '@playwright/test';

// Simple, focused test for case management functionality
test.describe('Case Management E2E Tests', () => {
  // Test the cases list page
  test('should load cases page and show empty state or case list', async ({ page }) => {
    // First, login with test user  
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard');
    
    // Navigate to cases page
    await page.goto('http://localhost:5174/cases');
    
    // Page should load successfully
    await expect(page).toHaveURL('**/cases');
    
    // Should have page title or heading
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Should have new case button or link
    const newCaseButton = page.locator('a[href*="/cases/new"], button:has-text("New"), a:has-text("Create")');
    await expect(newCaseButton.first()).toBeVisible();
  });

  // Test case creation and detail view
  test('should create a new case and display it with unique ID', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Go to case creation page
    await page.goto('http://localhost:5174/cases/new');
    
    // Verify we're on the new case page
    await expect(page).toHaveURL('**/cases/new');
    
    // Fill out case form
    const timestamp = Date.now();
    const caseTitle = `E2E Test Case ${timestamp}`;
    const caseDescription = `Test case created via Playwright at ${new Date().toISOString()}`;
    
    await page.fill('input[name="title"]', caseTitle);
    
    // Find description field (could be textarea or input)
    const descriptionField = page.locator('textarea[name="description"], input[name="description"]');
    await descriptionField.first().fill(caseDescription);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to case detail page with UUID
    await page.waitForURL(/.*\/cases\/[a-f0-9-]+/);
    
    // Extract case ID from URL
    const currentUrl = page.url();
    const caseId = currentUrl.split('/cases/')[1];
    
    // Verify case ID is a valid UUID format
    expect(caseId).toMatch(/^[a-f0-9-]+$/);
    
    // Verify case details are displayed via SSR
    await expect(page.locator('body')).toContainText(caseTitle);
    await expect(page.locator('body')).toContainText(caseDescription);
    
    // Verify case ID is displayed on the page
    await expect(page.locator('body')).toContainText(caseId);
    
    // Verify specific case ID badge (from our SSR implementation)
    const idBadge = page.locator('.badge').filter({ hasText: caseId });
    await expect(idBadge).toBeVisible();
  });

  // Test direct URL access to case detail (SSR verification)
  test('should access case detail directly via URL and render SSR content', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Create a case first
    await page.goto('http://localhost:5174/cases/new');
    await page.fill('input[name="title"]', 'SSR Test Case');
    await page.fill('textarea[name="description"], input[name="description"]', 'Testing SSR rendering');
    await page.click('button[type="submit"]');
    
    // Get the case ID from URL
    await page.waitForURL(/.*\/cases\/[a-f0-9-]+/);
    const caseId = page.url().split('/cases/')[1];
    
    // Now navigate directly to the case URL (simulating direct link access)
    await page.goto(`http://localhost:5174/cases/${caseId}`);
    
    // Verify SSR content loads immediately
    await expect(page.locator('body')).toContainText('SSR Test Case');
    await expect(page.locator('body')).toContainText('Testing SSR rendering');
    await expect(page.locator('body')).toContainText(caseId);
    
    // Verify page has proper structure
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  // Test error handling for non-existent case
  test('should handle non-existent case ID gracefully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Try to access non-existent case
    await page.goto('http://localhost:5174/cases/non-existent-id-12345');
    
    // Should redirect to cases list (based on our SSR implementation)
    await page.waitForURL('**/cases');
    await expect(page).toHaveURL('**/cases');
  });
});
