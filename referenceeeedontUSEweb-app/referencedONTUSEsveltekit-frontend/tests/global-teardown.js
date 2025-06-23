/**
 * Global teardown for Playwright tests
 * Cleanup after all tests are complete
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Any cleanup logic can go here
    // For now, just log completion
    console.log('✅ Test environment cleanup complete');
    
  } catch (error) {
    console.error('❌ Failed to clean up test environment:', error);
    // Don't throw error here to avoid masking test results
  }
}

export default globalTeardown;
