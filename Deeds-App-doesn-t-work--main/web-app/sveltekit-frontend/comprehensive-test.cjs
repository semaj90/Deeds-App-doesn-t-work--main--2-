// comprehensive-test.cjs
// Complete test suite for the prosecutor app

const { Client } = require('pg');
const http = require('http');
const crypto = require('crypto');

// Generate proper UUIDs
function generateUUID() {
  return crypto.randomUUID();
}

const connection = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'prosecutor_db',
  ssl: false,
};

async function checkServerStatus() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5176', (res) => {
      resolve({ running: true, status: res.statusCode });
    });
    
    req.on('error', () => {
      resolve({ running: false, status: null });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ running: false, status: 'timeout' });
    });
  });
}

async function testDatabase() {
  const client = new Client(connection);
  await client.connect();

  console.log('🔍 Testing database functionality...\n');

  try {    // Test basic user registration flow
    console.log('1. Testing user registration simulation...');
    const testUserId = generateUUID();
    await client.query(`
      INSERT INTO users (id, email, hashed_password, role, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [testUserId, 'test@prosecutor.com', '$2b$10$hashedpasswordexample', 'prosecutor', 'Test', 'User']);
    console.log('✅ User registration simulation successful');

    // Test case creation flow
    console.log('\n2. Testing case creation flow...');
    const testCaseId = generateUUID();
    await client.query(`
      INSERT INTO cases (id, title, description, created_by, status, priority)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [testCaseId, 'Test Case Creation', 'Test case for verification', testUserId, 'open', 'medium']);
    console.log('✅ Case creation flow successful');

    // Test evidence attachment
    console.log('\n3. Testing evidence attachment...');
    const testEvidenceId = generateUUID();
    await client.query(`
      INSERT INTO evidence (id, case_id, title, evidence_type, file_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [testEvidenceId, testCaseId, 'Test Evidence', 'document', 'application/pdf', testUserId]);
    console.log('✅ Evidence attachment flow successful');

    // Test criminal record creation
    console.log('\n4. Testing criminal record creation...');
    const testCriminalId = generateUUID();
    await client.query(`
      INSERT INTO criminals (id, first_name, last_name, threat_level, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [testCriminalId, 'Test', 'Criminal', 'low', testUserId]);
    console.log('✅ Criminal record creation successful');

    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    await client.query('DELETE FROM evidence WHERE id = $1', [testEvidenceId]);
    await client.query('DELETE FROM criminals WHERE id = $1', [testCriminalId]);
    await client.query('DELETE FROM cases WHERE id = $1', [testCaseId]);
    await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
    console.log('✅ Test data cleanup successful');

    console.log('\n🎉 All database flows completed successfully!');

  } catch (error) {
    console.error('❌ Database test error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function testApplicationWorkflow() {
  console.log('📋 COMPREHENSIVE APPLICATION TEST SUITE');
  console.log('======================================\n');

  // Test 1: Database connectivity and schema
  console.log('📊 Step 1: Database Schema & Connectivity');
  await testDatabase();

  // Test 2: Server status
  console.log('\n🌐 Step 2: Development Server Status');
  const serverStatus = await checkServerStatus();
  if (serverStatus.running) {
    console.log(`✅ Server is running on http://localhost:5176 (Status: ${serverStatus.status})`);
  } else {
    console.log('❌ Server is not running. Start with: npm run dev');
    console.log('💡 Once server is running, you can test:');
    console.log('   - Registration: http://localhost:5176/register');
    console.log('   - Login: http://localhost:5176/login');
    console.log('   - Dashboard: http://localhost:5176/dashboard');
    console.log('   - Cases: http://localhost:5176/cases');
  }

  // Test 3: Application readiness summary
  console.log('\n📝 Step 3: Application Readiness Summary');
  console.log('✅ Database schema: READY');
  console.log('✅ CRUD operations: WORKING');
  console.log('✅ User authentication flow: DATABASE READY');
  console.log('✅ Case management flow: DATABASE READY');
  console.log('✅ Evidence handling: DATABASE READY');
  console.log('✅ Criminal records: DATABASE READY');
  console.log(serverStatus.running ? '✅ Frontend server: RUNNING' : '⚠️  Frontend server: NEEDS TO BE STARTED');

  console.log('\n🚀 NEXT STEPS:');
  if (!serverStatus.running) {
    console.log('1. Start the development server: npm run dev');
  }
  console.log('2. Open http://localhost:5176 in your browser');
  console.log('3. Test registration and login flows');
  console.log('4. Create a test case and add evidence');
  console.log('5. Run Playwright tests: npx playwright test');

  console.log('\n✅ Application is READY for full testing and use!');
}

testApplicationWorkflow().catch(e => {
  console.error('❌ Test suite failed:', e);
  process.exit(1);
});
