import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '../../tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disabled for better debugging
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1, // Allow retries locally too
  /* Opt out of parallel tests on CI. */
  workers: 1, // Force single worker for stability
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Global timeout for entire test suite */
  globalTimeout: 60000,
  /* Timeout for each test */
  timeout: 30000,
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Navigation timeout */
    navigationTimeout: 15000,
    /* Action timeout */
    actionTimeout: 10000,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Add Chrome args for better connectivity
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-extensions',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev -- --host localhost --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for server to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
