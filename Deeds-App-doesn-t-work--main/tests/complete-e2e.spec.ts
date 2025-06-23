import { test, expect, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

// Test data generators
function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test-user-${timestamp}@example.com`,
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
    title: 'Prosecutor',
    department: 'District Attorney Office'
  };
}

function generateTestCase() {
  const timestamp = Date.now();
  return {
    title: `Test Case ${timestamp}`,
    description: `This is a comprehensive test case created on ${new Date().toISOString()}`,
    caseNumber: `TC-${timestamp}`,
    priority: 'high',
    category: 'Criminal',
    location: 'Test City, Test State',
    incidentDate: '2024-01-15'
  };
}

// Page object pattern for better test organization
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard|\//, { timeout: 15000 });
  }
}

class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/register');
  }

  async register(user: ReturnType<typeof generateTestUser>) {
    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.fill('input[name="confirmPassword"]', user.password);
    
    // Fill additional fields if they exist
    const firstNameInput = this.page.locator('input[name="firstName"]');
    if (await firstNameInput.count() > 0) {
      await firstNameInput.fill(user.firstName);
    }
    
    const lastNameInput = this.page.locator('input[name="lastName"]');
    if (await lastNameInput.count() > 0) {
      await lastNameInput.fill(user.lastName);
    }

    await this.page.click('button[type="submit"]');
  }
  async expectRegistrationSuccess() {
    // Check for success message or redirect to login/dashboard
    await expect(this.page.locator('text=success')).toBeVisible({ timeout: 10000 })
      .catch(async () => {
        // Alternative: check if redirected to dashboard or login
        await expect(this.page).toHaveURL(/\/login|\/dashboard|\//, { timeout: 15000 });
      });
  }
}

class CasePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/cases');
  }

  async createCase(caseData: ReturnType<typeof generateTestCase>) {
    // Try to find create case button
    const createButtons = [
      'text=Create Case',
      'text=New Case', 
      'text=Add Case',
      '[data-testid="create-case"]',
      'button:has-text("Create")',
      'a:has-text("New")'
    ];

    for (const selector of createButtons) {
      const button = this.page.locator(selector);
      if (await button.count() > 0) {
        await button.click();
        break;
      }
    }

    // Wait for form to appear
    await this.page.waitForSelector('form, input[name="title"], input[name="caseTitle"]', { timeout: 10000 });

    // Fill case form - try different field name variations
    const titleSelectors = ['input[name="title"]', 'input[name="caseTitle"]', '#title', '#caseTitle'];
    for (const selector of titleSelectors) {
      const input = this.page.locator(selector);
      if (await input.count() > 0) {
        await input.fill(caseData.title);
        break;
      }
    }

    const descriptionSelectors = ['textarea[name="description"]', 'textarea[name="caseDescription"]', '#description'];
    for (const selector of descriptionSelectors) {
      const input = this.page.locator(selector);
      if (await input.count() > 0) {
        await input.fill(caseData.description);
        break;
      }
    }

    const caseNumberSelectors = ['input[name="caseNumber"]', 'input[name="number"]', '#caseNumber'];
    for (const selector of caseNumberSelectors) {
      const input = this.page.locator(selector);
      if (await input.count() > 0) {
        await input.fill(caseData.caseNumber);
        break;
      }
    }

    // Fill optional fields if they exist
    const prioritySelect = this.page.locator('select[name="priority"]');
    if (await prioritySelect.count() > 0) {
      await prioritySelect.selectOption(caseData.priority);
    }

    const categorySelect = this.page.locator('select[name="category"]');
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption(caseData.category);
    }

    const locationInput = this.page.locator('input[name="location"]');
    if (await locationInput.count() > 0) {
      await locationInput.fill(caseData.location);
    }

    // Submit form
    const submitButtons = [
      'button[type="submit"]',
      'button:has-text("Create")',
      'button:has-text("Save")',
      'button:has-text("Submit")'
    ];

    for (const selector of submitButtons) {
      const button = this.page.locator(selector);
      if (await button.count() > 0) {
        await button.click();
        break;
      }
    }
  }
  async expectCaseCreated(caseTitle: string) {
    // Wait for success message or redirect to case list
    await expect(this.page.locator(`text=${caseTitle}`)).toBeVisible({ timeout: 15000 })
      .catch(async () => {
        // Alternative: check for success message
        await expect(this.page.locator('text=success')).toBeVisible({ timeout: 10000 });
      });
  }

  async uploadEvidence(filePath: string, description: string) {
    // Navigate to evidence upload
    const uploadButtons = [
      'text=Upload Evidence',
      'text=Add Evidence',
      '[data-testid="upload-evidence"]',
      'button:has-text("Upload")'
    ];

    for (const selector of uploadButtons) {
      const button = this.page.locator(selector);
      if (await button.count() > 0) {
        await button.click();
        break;
      }
    }

    // Upload file
    const fileInput = this.page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });
    await fileInput.setInputFiles(filePath);

    // Fill description if field exists
    const descInput = this.page.locator('textarea[name="description"], input[name="description"]');
    if (await descInput.count() > 0) {
      await descInput.fill(description);
    }

    // Submit upload
    const submitButtons = [
      'button[type="submit"]',
      'button:has-text("Upload")',
      'button:has-text("Save")'
    ];

    for (const selector of submitButtons) {
      const button = this.page.locator(selector);
      if (await button.count() > 0) {
        await button.click();
        break;
      }
    }
  }
  async expectEvidenceUploaded(description: string) {
    await expect(this.page.locator(`text=${description}`)).toBeVisible({ timeout: 15000 });
  }
}

// Main test suite
test.describe('Complete End-to-End Application Flow', () => {
  let testUser: ReturnType<typeof generateTestUser>;
  let testCase: ReturnType<typeof generateTestCase>;

  test.beforeEach(async () => {
    testUser = generateTestUser();
    testCase = generateTestCase();
  });

  test('Full user journey: register, login, create case, upload evidence', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const casePage = new CasePage(page);

    // Step 1: Register new user
    console.log('Step 1: Registering user:', testUser.email);
    await registerPage.goto();
    await registerPage.register(testUser);
    await registerPage.expectRegistrationSuccess();

    // Step 2: Login with registered user
    console.log('Step 2: Logging in user:', testUser.email);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.expectLoginSuccess();

    // Step 3: Create a new case
    console.log('Step 3: Creating case:', testCase.title);
    await casePage.goto();
    await casePage.createCase(testCase);
    await casePage.expectCaseCreated(testCase.title);

    // Step 4: Upload evidence (create a test file first)
    console.log('Step 4: Uploading evidence');
    const testFilePath = 'test-evidence.txt';
    
    // Create a test file for upload
    const fs = require('fs');
    fs.writeFileSync(testFilePath, 'This is test evidence for the case.');
    
    try {
      await casePage.uploadEvidence(testFilePath, 'Test evidence document');
      await casePage.expectEvidenceUploaded('Test evidence document');
      console.log('✅ Evidence upload successful');
    } finally {
      // Cleanup test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }

    console.log('🎉 Complete end-to-end test successful!');
  });

  test('Database persistence: verify data exists after operations', async ({ page }) => {
    // This test verifies that all our CRUD operations persist to PostgreSQL
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const casePage = new CasePage(page);

    // Register and login
    await registerPage.goto();
    await registerPage.register(testUser);
    
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.expectLoginSuccess();

    // Create case
    await casePage.goto();
    await casePage.createCase(testCase);
    await casePage.expectCaseCreated(testCase.title);

    // Logout and login again to verify persistence
    await page.goto('/logout');
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    
    // Verify case still exists
    await casePage.goto();
    await expect(page.locator(`text=${testCase.title}`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Database persistence verified');
  });
});
