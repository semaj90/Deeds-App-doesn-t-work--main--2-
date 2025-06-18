import { test, expect, type Page } from '@playwright/test';

test.describe('End-to-End Integration Tests', () => {
  test('complete user journey: register -> login -> create case -> view case', async ({ page }) => {
    // Generate unique user data
    const timestamp = Date.now();
    const testEmail = `e2e${timestamp}@example.com`;
    const testName = `E2E User ${timestamp}`;
    const caseTitle = `E2E Test Case ${timestamp}`;
    
    // Step 1: Visit homepage
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Step 2: Navigate to registration
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');
    
    // Step 3: Register new user
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.selectOption('select[name="role"]', 'prosecutor');
    await page.click('button[type="submit"]');
    
    // Wait for registration to complete and redirect
    await page.waitForURL(/\/(dashboard|login)/);
    
    // Step 4: Login if not automatically logged in
    if (page.url().includes('/login')) {
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    }
    
    // Step 5: Navigate to cases
    const casesLink = page.locator('a[href="/cases"]');
    if (await casesLink.count() > 0) {
      await casesLink.click();
    } else {
      await page.goto('/cases');
    }
    await expect(page).toHaveURL('/cases');
    
    // Step 6: Create new case
    const newCaseButton = page.locator('a[href="/cases/new"], button:has-text("New"), a:has-text("Create")');
    if (await newCaseButton.count() > 0) {
      await newCaseButton.first().click();
    } else {
      await page.goto('/cases/new');
    }
    await expect(page).toHaveURL('/cases/new');
    
    // Fill case form
    await page.fill('input[name="title"]', caseTitle);
    
    const descriptionField = page.locator('textarea[name="description"]');
    const descriptionInput = page.locator('input[name="description"]');
    const caseDescription = `This is an end-to-end test case created by ${testName}`;
    
    if (await descriptionField.count() > 0) {
      await descriptionField.fill(caseDescription);
    } else {
      await descriptionInput.fill(caseDescription);
    }
    
    // Set danger score
    const dangerScoreField = page.locator('input[name="dangerScore"]');
    if (await dangerScoreField.count() > 0) {
      await dangerScoreField.fill('6');
    }
    
    await page.selectOption('select[name="status"]', 'open');
    await page.click('button[type="submit"]');
    
    // Step 7: Verify case creation and detail view
    await page.waitForURL(/\/cases\/[a-f0-9-]+/);
    
    // Extract case ID from URL
    const caseId = page.url().split('/cases/')[1];
    expect(caseId).toMatch(/[a-f0-9-]+/);
    
    // Verify case details are displayed via SSR
    await expect(page.locator('h1, h2')).toContainText(caseTitle);
    await expect(page.locator('body')).toContainText(caseDescription);
    await expect(page.locator('body')).toContainText(caseId);
    await expect(page.locator('body')).toContainText(/danger.*6|score.*6/i);
    await expect(page.locator('body')).toContainText(/status.*open/i);
    
    // Step 8: Navigate back to cases list and verify case appears
    const backToCases = page.locator('a[href="/cases"]');
    if (await backToCases.count() > 0) {
      await backToCases.first().click();
    } else {
      await page.goto('/cases');
    }
    
    await expect(page).toHaveURL('/cases');
    await expect(page.locator('body')).toContainText(caseTitle);
    
    // Step 9: Return to case detail via link
    const caseDetailLink = page.locator(`a[href="/cases/${caseId}"]`);
    if (await caseDetailLink.count() > 0) {
      await caseDetailLink.first().click();
      await expect(page).toHaveURL(`/cases/${caseId}`);
      await expect(page.locator('body')).toContainText(caseTitle);
    }
  });

  test('authentication flow: protected routes redirect to login', async ({ page }) => {
    // Try to access protected routes without authentication
    const protectedRoutes = ['/dashboard', '/cases', '/cases/new', '/profile'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to login
      await page.waitForURL('/login');
      await expect(page).toHaveURL('/login');
    }
  });

  test('case management: create, view, and update case', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Create case
    await page.goto('/cases/new');
    const timestamp = Date.now();
    const originalTitle = `Management Test ${timestamp}`;
    
    await page.fill('input[name="title"]', originalTitle);
    
    const descriptionField = page.locator('textarea[name="description"], input[name="description"]');
    await descriptionField.first().fill('Original description for management test');
    
    await page.selectOption('select[name="status"]', 'open');
    await page.click('button[type="submit"]');
    
    // Get case ID from URL
    await page.waitForURL(/\/cases\/[a-f0-9-]+/);
    const caseId = page.url().split('/cases/')[1];
    
    // Verify creation
    await expect(page.locator('body')).toContainText(originalTitle);
    
    // Update case (if editing is available on detail page)
    const editableTitle = page.locator('input[name="title"]');
    if (await editableTitle.count() > 0) {
      const updatedTitle = `Updated ${originalTitle}`;
      await editableTitle.fill(updatedTitle);
      
      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      if (await saveButton.count() > 0) {
        await saveButton.first().click();
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toContainText(updatedTitle);
      }
    }
    
    // Verify persistence by reloading page
    await page.reload();
    await expect(page.locator('body')).toContainText(originalTitle); // or updatedTitle if edit worked
    await expect(page.locator('body')).toContainText(caseId);
  });

  test('responsive design: mobile viewport navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test homepage
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    
    // Test navigation menu (might be collapsed on mobile)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("Menu"), .hamburger');
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
    }
    
    // Should be able to navigate to login
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    
    // Login form should be usable on mobile
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Test login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Dashboard should be responsive
    await expect(page.locator('nav')).toBeVisible();
  });
});
