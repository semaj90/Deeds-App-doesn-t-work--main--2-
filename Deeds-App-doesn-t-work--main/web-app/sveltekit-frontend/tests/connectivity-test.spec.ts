import { test, expect } from '@playwright/test';

test.describe('Server Connectivity Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up longer timeouts for connection attempts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
  });

  test('can connect to server', async ({ page }) => {
    console.log('Attempting to connect to http://localhost:5174');
    
    try {
      const response = await page.goto('/', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      console.log('Response status:', response?.status());
      console.log('Response URL:', response?.url());
      
      expect(response?.status()).toBe(200);
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check if we can see any content
      const body = await page.textContent('body');
      console.log('Page body contains text:', body ? body.length > 0 : false);
      
      expect(body).toBeTruthy();
      
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  });

  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png' });
    
    // Check for common elements
    const title = await page.title();
    console.log('Page title:', title);
    
    expect(title).toBeTruthy();
  });

  test('server responds to API endpoints', async ({ page }) => {
    // Test a simple API endpoint
    const response = await page.request.get('/api/health');
    
    if (response.status() === 404) {
      console.log('Health endpoint not found, testing auth endpoint instead');
      const authResponse = await page.request.get('/api/auth');
      console.log('Auth endpoint status:', authResponse.status());
    } else {
      console.log('Health endpoint status:', response.status());
      expect(response.status()).toBeLessThan(500);
    }
  });
});
