# Run all Playwright tests
npm test

# Run Playwright tests with UI
npm run test:ui

# Run tests with browser visible
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run comprehensive Node.js tests
node tests/comprehensive-test.js

# Run individual test suites
node tests/test-password.js
node tests/test-auth.js
node tests/test-crud-features.js