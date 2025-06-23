// Test script to register users and add CRUD data
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';

// Helper function to make requests
async function makeRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`Error with ${method} ${url}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test user registration
async function testRegistration() {
  console.log('\n=== Testing User Registration ===');
  
  const newUser = {
    email: 'john.prosecutor@justice.gov',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Prosecutor',
    title: 'Senior District Attorney',
    department: 'Criminal Justice Division'
  };
  
  const result = await makeRequest('/api/auth/register', 'POST', newUser);
  console.log('Registration result:', result);
  
  return result.success;
}

// Test login
async function testLogin(email, password) {
  console.log('\n=== Testing User Login ===');
  
  const credentials = { email, password };
  const result = await makeRequest('/api/auth/login', 'POST', credentials);
  console.log('Login result:', result);
  
  return result.success;
}

// Test creating a case
async function testCreateCase() {
  console.log('\n=== Testing Case Creation ===');
  
  const newCase = {
    title: 'State vs. Smith - Fraud Investigation',
    description: 'Investigation into financial fraud allegations involving multiple victims',
    status: 'investigation',
    priority: 'high',
    caseNumber: 'CASE-2025-001',
    filingDate: new Date().toISOString().split('T')[0],
    jurisdiction: 'State Court',
    courtRoom: 'Courtroom 5A',
    estimatedTrialDate: '2025-08-15'
  };
  
  const result = await makeRequest('/api/cases', 'POST', newCase);
  console.log('Case creation result:', result);
  
  return result.data?.id;
}

// Test creating a criminal
async function testCreateCriminal() {
  console.log('\n=== Testing Criminal Creation ===');
  
  const newCriminal = {
    firstName: 'Robert',
    lastName: 'Smith',
    dateOfBirth: '1985-03-15',
    address: '123 Main Street, Anytown, ST 12345',
    phoneNumber: '555-0123',
    email: 'robert.smith@email.com',
    emergencyContact: 'Jane Smith - Wife - 555-0124',
    occupation: 'Accountant',
    employers: [{ name: 'ABC Accounting Firm', position: 'Senior Accountant' }],
    aliases: ['Bob Smith', 'R. Smith'],
    identifyingMarks: 'Scar on left hand',
    criminalHistory: 'No prior convictions'
  };
  
  const result = await makeRequest('/api/criminals', 'POST', newCriminal);
  console.log('Criminal creation result:', result);
  
  return result.data?.id;
}

// Test creating evidence
async function testCreateEvidence(caseId) {
  console.log('\n=== Testing Evidence Creation ===');
  
  const newEvidence = {
    caseId: caseId,
    fileName: 'financial_records.pdf',
    filePath: '/uploads/evidence/financial_records.pdf',
    fileType: 'application/pdf',
    fileSize: 2048576,
    description: 'Bank statements and financial records showing suspicious transactions',
    tags: ['financial', 'fraud', 'bank-records'],
    summary: 'Contains evidence of unauthorized transfers totaling $50,000'
  };
  
  const result = await makeRequest('/api/evidence', 'POST', newEvidence);
  console.log('Evidence creation result:', result);
  
  return result.data?.id;
}

// Test updating a case
async function testUpdateCase(caseId) {
  console.log('\n=== Testing Case Update ===');
  
  const updates = {
    status: 'active',
    description: 'Investigation into financial fraud allegations involving multiple victims - Updated with new evidence'
  };
  
  const result = await makeRequest(`/api/cases/${caseId}`, 'PUT', updates);
  console.log('Case update result:', result);
  
  return result.success;
}

// Test fetching dashboard data
async function testDashboardData() {
  console.log('\n=== Testing Dashboard Data Retrieval ===');
  
  // Test cases endpoint
  const casesResult = await makeRequest('/api/cases');
  console.log('Cases retrieved:', casesResult.data?.length || 0);
  
  // Test criminals endpoint
  const criminalsResult = await makeRequest('/api/criminals');
  console.log('Criminals retrieved:', criminalsResult.data?.length || 0);
  
  // Test evidence endpoint
  const evidenceResult = await makeRequest('/api/evidence');
  console.log('Evidence items retrieved:', evidenceResult.data?.length || 0);
  
  return {
    cases: casesResult.data?.length || 0,
    criminals: criminalsResult.data?.length || 0,
    evidence: evidenceResult.data?.length || 0
  };
}

// Main test function
async function runTests() {
  console.log('🧪 Starting CRUD and Authentication Tests...\n');
  
  try {
    // Test registration
    await testRegistration();
    
    // Wait a moment for user to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test login with new user
    await testLogin('john.prosecutor@justice.gov', 'SecurePass123!');
    
    // Test login with existing user
    await testLogin('example@example.com', 'password123');
    
    // Test CRUD operations
    const caseId = await testCreateCase();
    await testCreateCriminal();
    
    if (caseId) {
      await testCreateEvidence(caseId);
      await testUpdateCase(caseId);
    }
    
    // Test dashboard data retrieval
    const dashboardData = await testDashboardData();
    
    console.log('\n✅ All tests completed!');
    console.log('📊 Dashboard Summary:', dashboardData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
