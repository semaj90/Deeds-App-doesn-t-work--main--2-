import { expect, test } from '@playwright/test';

test.describe('Citation Point System', () => {
  test('should display citation manager', async ({ page }) => {
    // Navigate to citations page
    await page.goto('/citations');
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Citation Point System Demo');
    
    // Check for tab navigation
    await expect(page.locator('.tab-button')).toHaveCount(3);
    
    // Check citation manager tab is active by default
    await expect(page.locator('.tab-button.active')).toContainText('Citation Manager');
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/citations');
    
    // Click on Search Demo tab
    await page.locator('.tab-button:has-text("Search Demo")').click();
    await expect(page.locator('.tab-button.active')).toContainText('Search Demo');
    
    // Check for search input
    await expect(page.locator('input[placeholder*="Search citations"]')).toBeVisible();
    
    // Click on API Demo tab
    await page.locator('.tab-button:has-text("API Demo")').click();
    await expect(page.locator('.tab-button.active')).toContainText('API Demo');
    
    // Check for API action buttons
    await expect(page.locator('button:has-text("Create Test Citation")')).toBeVisible();
    await expect(page.locator('button:has-text("Generate AI Summary")')).toBeVisible();
  });

  test('should create new citation', async ({ page }) => {
    await page.goto('/citations');
    
    // Wait for citation manager to load
    await page.waitForSelector('.citation-manager');
    
    // Click create citation button
    await page.locator('button:has-text("Create Citation")').click();
    
    // Check form appears
    await expect(page.locator('.create-form')).toBeVisible();
    await expect(page.locator('h3:has-text("Create New Citation Point")')).toBeVisible();
    
    // Fill out form
    await page.fill('input#source', 'test/evidence_001');
    await page.fill('textarea#summary', 'Test citation summary for automated testing');
    await page.fill('input#labels', 'test, automation, demo');
    
    // Submit form
    await page.locator('button:has-text("Create Citation")').click();
    
    // Check form closes
    await expect(page.locator('.create-form')).not.toBeVisible();
  });

  test('should search citations', async ({ page }) => {
    await page.goto('/citations');
    
    // Switch to search tab
    await page.locator('.tab-button:has-text("Search Demo")').click();
    
    // Enter search query
    await page.fill('input[placeholder*="Search citations"]', 'forensics');
    
    // Click search button
    await page.locator('button:has-text("Search")').click();
    
    // Wait for results (may show no results or mock data)
    await page.waitForTimeout(1000);
    
    // Should show either results or no results message
    const hasResults = await page.locator('.results-grid').isVisible();
    const hasNoResults = await page.locator('.no-results').isVisible();
    
    expect(hasResults || hasNoResults).toBe(true);
  });

  test('should test API endpoints', async ({ page }) => {
    await page.goto('/citations');
    
    // Switch to API demo tab
    await page.locator('.tab-button:has-text("API Demo")').click();
    
    // Test create citation API
    await page.locator('button:has-text("Create Test Citation")').click();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Test AI summarization API
    await page.locator('button:has-text("Generate AI Summary")').click();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Check API endpoints are displayed
    await expect(page.locator('.endpoint')).toHaveCount(4);
    await expect(page.locator('.method.get')).toContainText('GET');
    await expect(page.locator('.method.post')).toContainText('POST');
    await expect(page.locator('.method.put')).toContainText('PUT');
    await expect(page.locator('.method.delete')).toContainText('DELETE');
  });

  test('should show feature highlights', async ({ page }) => {
    await page.goto('/citations');
    
    // Scroll to footer
    await page.locator('.demo-footer').scrollIntoViewIfNeeded();
    
    // Check feature highlights
    await expect(page.locator('h3:has-text("Key Features")')).toBeVisible();
    await expect(page.locator('li:has-text("AI-Powered Summarization")')).toBeVisible();
    await expect(page.locator('li:has-text("Hybrid Search")')).toBeVisible();
    await expect(page.locator('li:has-text("Case Linking")')).toBeVisible();
    await expect(page.locator('li:has-text("Fast Operations")')).toBeVisible();
    await expect(page.locator('li:has-text("Responsive UI")')).toBeVisible();
    await expect(page.locator('li:has-text("API Ready")')).toBeVisible();
  });
});
