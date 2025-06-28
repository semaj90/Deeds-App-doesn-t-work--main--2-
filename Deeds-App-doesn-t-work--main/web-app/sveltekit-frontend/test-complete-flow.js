import { test, expect } from '@playwright/test';

test.describe('User Registration and Login Flow', () => {
  test('should register a new user, login, create a case, and edit it', async ({ page }) => {
    // Generate unique email for test
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = 'testpassword123';
    
    // Step 1: Go to homepage
    await page.goto('http://localhost:5174');
    
    // Step 2: Navigate to registration
    await page.click('a[href="/register"]');
    
    // Step 3: Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for redirect after successful registration
    await page.waitForURL('**/login*');
    
    // Step 4: Login with new account
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or cases
    await page.waitForURL(/\/(dashboard|cases|$)/);
    
    // Step 5: Navigate to cases page
    await page.goto('http://localhost:5174/cases');
    
    // Step 6: Create a new case
    await page.click('a[href="/cases/new"]');
    
    // Fill case form
    await page.fill('input[name="title"]', 'Test Case - Automated');
    await page.fill('textarea[name="description"]', 'This is a test case created by automated testing.');
    await page.selectOption('select[name="status"]', 'open');
    
    // Submit case creation
    await page.click('button[type="submit"]');
    
    // Wait for redirect to case details
    await page.waitForURL('**/cases/*');
    
    // Step 7: Verify case was created
    await expect(page.locator('h1')).toContainText('Test Case - Automated');
    
    // Step 8: Edit the case (if edit functionality exists)
    const editButton = page.locator('a[href*="/edit"], button:has-text("Edit")');
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Update case title
      await page.fill('input[name="title"]', 'Test Case - Automated (Updated)');
      await page.click('button[type="submit"]');
      
      // Verify update
      await expect(page.locator('h1')).toContainText('Test Case - Automated (Updated)');
    }
    
    // Step 9: Go back to cases list and verify case appears
    await page.goto('http://localhost:5174/cases');
    await expect(page.locator('text=Test Case - Automated')).toBeVisible();
    
    console.log('✅ Complete user flow test passed!');
  });
  
  test('should handle login with existing user', async ({ page }) => {
    // Test with the admin user we created earlier
    await page.goto('http://localhost:5174/login');
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or cases
    await page.waitForURL(/\/(dashboard|cases|$)/);
    
    // Verify we're logged in by checking for logout link
    await expect(page.locator('a[href="/logout"], a:has-text("Logout")')).toBeVisible();
    
    console.log('✅ Existing user login test passed!');
  });
});

// Manual test instructions
console.log(`
🧪 MANUAL TESTING INSTRUCTIONS

1. Open browser to http://localhost:5174
2. Test Registration:
   - Click "Register"
   - Fill: email@test.com, password123, password123
   - Submit and verify redirect to login

3. Test Login:
   - Fill: email@test.com, password123
   - Submit and verify redirect to dashboard/cases

4. Test Case Creation:
   - Go to /cases
   - Click "Create New Case" or "+"
   - Fill: Title, Description, Status
   - Submit and verify case appears

5. Test Case Editing:
   - Click on created case
   - Click "Edit" if available
   - Update title/description
   - Submit and verify changes

6. Test Navigation:
   - Verify all navigation links work
   - Check responsive design on mobile
   - Test logout functionality

🎯 EXPECTED RESULTS:
- Registration creates new user
- Login works with session persistence
- Cases can be created and saved
- Cases can be edited and updated
- Navigation is smooth and error-free
- CSS layouts are properly formatted
`);
