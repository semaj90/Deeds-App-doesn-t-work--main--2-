// Test script to register users and add CRUD data
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';

// Helper function to make requests
async function makeRequest(url, method = 'GET', body = null, sessionCookie = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (sessionCookie) {
    options.headers['Cookie'] = sessionCookie;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${url}`, options);
    if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
    }
    const text = await response.text();
    return { success: response.ok, data: text, status: response.status };

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
    name: 'John Prosecutor',
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
  
  return result.success ? result.data.sessionCookie : null;
}

// Test creating a case
async function testCreateCase(sessionCookie) {
  console.log('\n=== Testing Case Creation ===');
  
  const newCase = {
    title: 'State vs. Smith - Fraud Investigation',
    description: 'Investigation into financial fraud allegations involving multiple victims',
    status: 'open',
    priority: 'high',
  };
  
  const result = await makeRequest('/api/cases', 'POST', newCase, sessionCookie);
  console.log('Case creation result:', result);
  
  return result.data?.id;
}

// Test creating a criminal
async function testCreateCriminal(sessionCookie) {
  console.log('\n=== Testing Criminal Creation ===');
  
  const newCriminal = {
    firstName: 'Robert',
    lastName: 'Smith',
    aliases: ['Bob'],
  };
  
  const result = await makeRequest('/api/criminals', 'POST', newCriminal, sessionCookie);
  console.log('Criminal creation result:', result);
  return result.data?.id;
}

// Test linking a criminal to a case
async function testLinkCriminalToCase(caseId, criminalId, sessionCookie) {
    console.log('\n=== Testing Linking Criminal to Case ===');
    const linkData = { criminalId, role: 'Primary Suspect' };
    const result = await makeRequest(`/api/cases/${caseId}/criminals`, 'POST', linkData, sessionCookie);
    console.log('Link criminal to case result:', result);
    return result.success;
}

async function runCrudTests() {
    console.log('\n🚀 Running CRUD Feature Tests...');
    const registrationSuccess = await testRegistration();
    if (!registrationSuccess) {
        console.error('Registration failed. Aborting tests.');
        return;
    }

    const sessionCookie = await testLogin('john.prosecutor@justice.gov', 'SecurePass123!');
    if (!sessionCookie) {
        console.error('Login failed. Aborting tests.');
        return;
    }

    const caseId = await testCreateCase(sessionCookie);
    if (!caseId) {
        console.error('Case creation failed. Aborting tests.');
        return;
    }

    const criminalId = await testCreateCriminal(sessionCookie);
    if (!criminalId) {
        console.error('Criminal creation failed. Aborting tests.');
        return;
    }

    await testLinkCriminalToCase(caseId, criminalId, sessionCookie);

    console.log('\n🎉 CRUD tests completed!');
}

runCrudTests();
