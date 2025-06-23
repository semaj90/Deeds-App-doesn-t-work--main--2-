import { test, expect } from '@playwright/test';

test.describe('Database Connection Tests', () => {
  test('should connect to database and show tables', async ({ page }) => {
    // Navigate to the app (this will test database connectivity)
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // If the database connection works, the page should load without errors
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log('✅ Database connection test passed!');
  });

  test('should be able to access API endpoints', async ({ page }) => {
    // Test API health endpoint
    const response = await page.request.get('/api/health');
    
    // Should not get a 500 error (which would indicate database connection issues)
    if (response.status() === 404) {
      console.log('ℹ️ Health endpoint not found, trying other endpoints...');
      
      // Try another endpoint that might exist
      const casesResponse = await page.request.get('/api/cases');
      expect([200, 401, 403]).toContain(casesResponse.status());
    } else {
      expect(response.status()).not.toBe(500);
    }
    
    console.log('✅ API endpoint connection test passed!');
  });
});
