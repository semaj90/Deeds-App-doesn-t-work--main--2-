// End-to-end automation for prosecutor app: registration, login, dashboard, CRUD, and Postgres check
// Requires: npm install -D playwright pg

import { writeFile } from 'fs/promises';
import { chromium, Browser, Page } from 'playwright';
import { Client } from 'pg';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const TEST_USER = {
  name: 'Test User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPassword123!'
};
const TEST_CASE = {
  title: 'Test Case',
  description: 'Automated test case.'
};

async function register(page: Page) {
  await page.goto(`${BASE_URL}/register`);
  await page.fill('input[name="name"]', TEST_USER.name);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.fill('input[name="confirmPassword"]', TEST_USER.password);
  await page.check('input[name="agreeToTerms"]');
  await Promise.all([
    page.waitForURL(/\/login\?registered=true/),
    page.click('button[type="submit"]'),
  ]);
  // Check for form error alert
  if (await page.isVisible('.alert-error')) {
    const errorText = await page.textContent('.alert-error');
    throw new Error('Registration form error: ' + errorText);
  }
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL(/dashboard|\/$/);
  } catch (e) {
    // Capture screenshot and HTML if login fails
    await page.screenshot({ path: 'login-failure.png', fullPage: true });
    const html = await page.content();
    await writeFile('login-failure.html', html);
    throw new Error('Login failed: see login-failure.png and login-failure.html');
  }
}

async function checkDashboard(page: Page) {
  await page.waitForSelector('text=Welcome');
  const welcomeText = await page.textContent('text=Welcome');
  if (!welcomeText?.includes(TEST_USER.name)) {
    throw new Error(`Dashboard doesn't show user name: ${welcomeText}`);
  }
}

async function createCase(page: Page) {
  await page.goto(`${BASE_URL}/cases`);
  await page.click('text=Create New Case');
  await page.fill('input[name="title"]', TEST_CASE.title);
  await page.fill('textarea[name="description"]', TEST_CASE.description);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/cases\/\d+/);
}

async function checkPostgres() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'prosecutor_db',
    password: 'postgres',
    port: 5433,
  });
  await client.connect();
  
  // Check user exists
  const userResult = await client.query('SELECT * FROM users WHERE email = $1', [TEST_USER.email]);
  if (userResult.rows.length === 0) {
    throw new Error('User not found in Postgres');
  }
  
  // Check case exists
  const caseResult = await client.query('SELECT * FROM cases WHERE title = $1', [TEST_CASE.title]);
  if (caseResult.rows.length === 0) {
    throw new Error('Case not found in Postgres');
  }
  
  await client.end();
}

async function main() {
  let browser: Browser | undefined;
  try {
    console.log('Starting E2E flow...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    console.log('1. Registering user...');
    await register(page);
    console.log('✓ Registration successful');
    
    console.log('2. Logging in...');
    await login(page);
    console.log('✓ Login successful');
    
    console.log('3. Checking dashboard...');
    await checkDashboard(page);
    console.log('✓ Dashboard shows user correctly');
    
    console.log('4. Creating case...');
    await createCase(page);
    console.log('✓ Case created successfully');
    
    console.log('5. Checking Postgres...');
    await checkPostgres();
    console.log('✓ Data persisted to Postgres');
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();
