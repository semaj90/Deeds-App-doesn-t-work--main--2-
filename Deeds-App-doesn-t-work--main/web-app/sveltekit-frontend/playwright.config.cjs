const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration (CommonJS)
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disabled for database safety
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: 1, // Force single worker for database integrity
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Global timeout for entire test suite */
  globalTimeout: 120000,
  /* Timeout for each test */
  timeout: 45000,
  /* Expect timeout for assertions */
  expect: {
    timeout: 15000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
    /* Navigation timeout */
    navigationTimeout: 20000,
    /* Action timeout */
    actionTimeout: 15000,
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-extensions',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-fake-ui-for-media-stream', // For voice tests
            '--use-fake-device-for-media-stream', // For voice tests
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev:with-db',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // 3 minutes for server to start with DB
    stdout: 'pipe',
    stderr: 'pipe',
  },
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
});
