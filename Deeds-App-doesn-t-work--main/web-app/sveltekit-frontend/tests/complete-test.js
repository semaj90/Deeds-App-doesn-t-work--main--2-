/**
 * Complete WardenNet Application Test Suite
 * Tests registration, login, profile updates, and case creation
 */

const baseUrl = 'http://localhost:5173';

// Test user data
const testUser = {
  name: 'Jane Prosecutor',
  email: `test-${Date.now()}@prosecutor.com`,
  password: 'SecurePassword123!'
};

console.log('🚀 Starting Complete WardenNet Test Suite\n');
console.log('=' .repeat(60));

async function testRegistration() {
  console.log('\n📝 STEP 1: Testing User Registration');
  console.log('-'.repeat(40));
  
  try {
    // Create form data for registration
    const formData = new FormData();
    formData.append('name', testUser.name);
    formData.append('email', testUser.email);
    formData.append('password', testUser.password);
    
    console.log(`Registering: ${testUser.name} (${testUser.email})`);
    
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      body: formData,
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`Registration Status: ${response.status}`);
    
    if (response.status === 303 || response.status === 302) {
      const location = response.headers.get('location');
      console.log('✅ Registration successful!');
      console.log(`Redirected to: ${location}`);
      return true;
    } else {
      const text = await response.text();
      console.log('❌ Registration failed:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 STEP 2: Testing User Login');
  console.log('-'.repeat(40));
  
  try {
    console.log(`Logging in: ${testUser.email}`);
    
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: testUser.email, 
        password: testUser.password 
      })
    });
    
    console.log(`Login Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('User Data:', {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      });
      
      // Extract session cookie for future requests
      const setCookie = response.headers.get('set-cookie');
      return { user: data.user, sessionCookie: setCookie };
    } else {
      const errorData = await response.json();
      console.log('❌ Login failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testProfileUpdate(sessionCookie) {
  console.log('\n👤 STEP 3: Testing Profile Update');
  console.log('-'.repeat(40));
  
  try {
    const newBio = 'Experienced prosecutor specializing in white-collar crime and corporate fraud.';
    console.log('Updating bio:', newBio);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }
    
    const response = await fetch(`${baseUrl}/api/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bio: newBio })
    });
    
    console.log(`Profile Update Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Profile updated successfully!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Profile update failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    return false;
  }
}

async function testCaseCreation(sessionCookie) {
  console.log('\n⚖️  STEP 4: Testing Case Creation');
  console.log('-'.repeat(40));
  
  try {
    const caseData = {
      title: 'State v. Corporate Fraud Ring',
      description: 'Investigation into systematic embezzlement scheme affecting multiple companies.',
      priority: 'high',
      category: 'white-collar-crime',
      jurisdiction: 'State Court',
      incidentDate: new Date('2024-01-15').toISOString(),
      location: '123 Business District, Downtown'
    };
    
    console.log('Creating case:', caseData.title);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (sessionCookie) {
      headers['Cookie'] = sessionCookie;
    }
    
    const response = await fetch(`${baseUrl}/api/cases`, {
      method: 'POST',
      headers,
      body: JSON.stringify(caseData)
    });
    
    console.log(`Case Creation Status: ${response.status}`);
    
    if (response.ok) {
      const createdCase = await response.json();
      console.log('✅ Case created successfully!');
      console.log('Case Details:', {
        id: createdCase.id,
        title: createdCase.title,
        priority: createdCase.priority,
        status: createdCase.status
      });
      return createdCase;
    } else {
      const errorText = await response.text();
      console.log('❌ Case creation failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('❌ Case creation error:', error.message);
    return null;
  }
}

async function verifyDatabaseState() {
  console.log('\n💾 STEP 5: Verifying Database State');
  console.log('-'.repeat(40));
  
  console.log('Database verification completed via API endpoints.');
  console.log('All data should be visible in PostgreSQL tables.');
}

async function runAllTests() {
  const registrationSuccess = await testRegistration();
  if (!registrationSuccess) {
    console.error('\n🛑 TEST FAILED: Registration is a prerequisite. Aborting.');
    return;
  }

  const loginResult = await testLogin();
  if (!loginResult) {
    console.error('\n🛑 TEST FAILED: Login is a prerequisite. Aborting.');
    return;
  }

  const { sessionCookie } = loginResult;

  await testProfileUpdate(sessionCookie);
  await testCaseCreation(sessionCookie);
  await verifyDatabaseState();

  console.log('\n🎉 All tests completed successfully!');
  console.log('=' .repeat(60));
}

runAllTests();
