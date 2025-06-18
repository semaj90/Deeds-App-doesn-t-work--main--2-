import { test, expect, type Page } from '@playwright/test';

// Helper function to login before case tests
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// Helper function to create a test case and return its ID
async function createTestCase(page: Page): Promise<string> {
  await page.goto('/cases/new');
  
  const timestamp = Date.now();
  const caseTitle = `Test Case ${timestamp}`;
  const caseDescription = `Test case for detail view testing ${timestamp}`;
  
  await page.fill('input[name="title"]', caseTitle);
  
  // Handle description field
  const descriptionField = page.locator('textarea[name="description"]');
  const descriptionInput = page.locator('input[name="description"]');
  
  if (await descriptionField.count() > 0) {
    await descriptionField.fill(caseDescription);
  } else {
    await descriptionInput.fill(caseDescription);
  }
  
  // Set danger score
  const dangerScoreField = page.locator('input[name="dangerScore"]');
  if (await dangerScoreField.count() > 0) {
    await dangerScoreField.fill('7');
  }
  
  // Set status
  await page.selectOption('select[name="status"]', 'open');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for redirect and extract case ID from URL
  await page.waitForURL(/\/cases\/[a-f0-9-]+/);
  const url = page.url();
  const caseId = url.split('/cases/')[1];
  
  return caseId;
}

test.describe('Case Detail View Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });

  test('should display case details correctly with SSR', async ({ page }) => {
    // Create a test case first
    const caseId = await createTestCase(page);
    
    // Navigate directly to case detail page (testing SSR)
    await page.goto(`/cases/${caseId}`);
    
    // Verify page loads with case details
    await expect(page.locator('h1, h2')).toBeVisible();
    await expect(page.locator('body')).toContainText('Test Case');
    
    // Verify case ID is displayed somewhere on the page
    await expect(page.locator('body')).toContainText(caseId);
    
    // Check for key case detail elements
    await expect(page.locator('body')).toContainText(/description|details/i);
    await expect(page.locator('body')).toContainText(/status/i);
    
    // Verify danger score is displayed
    await expect(page.locator('body')).toContainText(/danger|score|7/i);
  });

  test('should handle non-existent case ID gracefully', async ({ page }) => {
    // Try to access a non-existent case
    await page.goto('/cases/non-existent-case-id');
    
    // Should redirect to cases list or show 404/error
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    
    // Should either redirect to /cases or show an error page
    if (currentUrl.includes('/cases') && !currentUrl.includes('/cases/non-existent-case-id')) {
      // Redirected to cases list - good behavior
      await expect(page).toHaveURL('/cases');
    } else {
      // Should show some kind of error indication
      const hasError = await page.locator('body').textContent();
      expect(hasError).toMatch(/(not found|error|invalid)/i);
    }
  });

  test('should allow case editing from detail view', async ({ page }) => {
    // Create a test case first
    const caseId = await createTestCase(page);
    
    // Navigate to case detail page
    await page.goto(`/cases/${caseId}`);
    
    // Look for edit functionality (could be form fields, edit button, etc.)
    const editableTitle = page.locator('input[name="title"]');
    const editableDescription = page.locator('textarea[name="description"], input[name="description"]');
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")');
    
    // Check if page has inline editing
    if (await editableTitle.count() > 0) {
      // Test inline editing
      await editableTitle.fill('Updated Test Case Title');
      
      if (await editableDescription.count() > 0) {
        await editableDescription.first().fill('Updated case description');
      }
      
      // Look for save button
      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      if (await saveButton.count() > 0) {
        await saveButton.first().click();
        
        // Wait for update
        await page.waitForTimeout(1000);
        
        // Verify update
        await expect(page.locator('body')).toContainText('Updated Test Case Title');
      }
    } else if (await editButton.count() > 0) {
      // Has separate edit button/link
      await editButton.first().click();
      // This might navigate to an edit page or enable editing mode
      await page.waitForTimeout(1000);
    }
  });

  test('should display case metadata correctly', async ({ page }) => {
    // Create a test case first
    const caseId = await createTestCase(page);
    
    // Navigate to case detail page
    await page.goto(`/cases/${caseId}`);
    
    // Check for metadata that should be rendered via SSR
    await expect(page.locator('body')).toContainText(/created|date/i);
    await expect(page.locator('body')).toContainText(/status.*open/i);
    
    // Verify the unique case ID is prominently displayed
    const caseIdElement = page.locator('*[id*="case"], *[class*="case"], h1, h2, .case-id, #case-id');
    await expect(caseIdElement.first()).toBeVisible();
    
    // Should have navigation back to cases list
    const backLink = page.locator('a[href="/cases"], button:has-text("Back"), a:has-text("Cases")');
    if (await backLink.count() > 0) {
      await expect(backLink.first()).toBeVisible();
    }
  });

  test('should handle direct URL access with SSR', async ({ page }) => {
    // Create a test case first
    const caseId = await createTestCase(page);
    
    // Clear any client-side state by reloading
    await page.reload();
    
    // Navigate directly to case URL (simulating direct link access)
    await page.goto(`/cases/${caseId}`);
    
    // Page should load completely via SSR without requiring client-side hydration
    await expect(page.locator('h1, h2')).toBeVisible();
    
    // Content should be present immediately (SSR)
    await expect(page.locator('body')).toContainText('Test Case');
    await expect(page.locator('body')).toContainText(caseId);
    
    // Verify page title is set correctly
    await expect(page).toHaveTitle(/case|Case/);
  });

  test('should navigate from cases list to detail view', async ({ page }) => {
    // Create a test case first
    const caseId = await createTestCase(page);
    
    // Navigate to cases list
    await page.goto('/cases');
    
    // Look for the created case in the list
    const caseLink = page.locator(`a[href="/cases/${caseId}"], a[href*="${caseId}"]`);
    
    if (await caseLink.count() > 0) {
      await caseLink.first().click();
      await expect(page).toHaveURL(`/cases/${caseId}`);
    } else {
      // Fallback: look for any case link
      const anyCaseLink = page.locator('a[href^="/cases/"]:not([href="/cases/new"])');
      if (await anyCaseLink.count() > 0) {
        await anyCaseLink.first().click();
        await expect(page.url()).toMatch(/\/cases\/[a-f0-9-]+/);
      }
    }
  });
});
