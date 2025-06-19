import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173';

async function testIntegration() {
  console.log('Testing SvelteKit Application Integration...');
  
  try {
    // Test 1: Check if server is responding
    console.log('\n1. Testing server response...');
    const homeResponse = await fetch(BASE_URL);
    console.log(`Home page status: ${homeResponse.status}`);
    
    // Test 2: Test registration endpoint
    console.log('\n2. Testing registration endpoint...');
    const registerData = {
      name: 'Integration Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const registerResponse = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    console.log(`Registration status: ${registerResponse.status}`);
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('Registration successful:', registerResult);
      
      // Test 3: Test login with the newly created user
      console.log('\n3. Testing login endpoint...');
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };
      
      const loginResponse = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      console.log(`Login status: ${loginResponse.status}`);
      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        console.log('Login successful:', loginResult);
      } else {
        const loginError = await loginResponse.text();
        console.log('Login error:', loginError);
      }
    } else {
      const registerError = await registerResponse.text();
      console.log('Registration error:', registerError);
    }
    
    // Test 4: Check database data directly
    console.log('\n4. Checking database...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout } = await execAsync('docker exec deeds-app-doesn-t-work--main-db-1 psql -U postgres -d prosecutor_db -c "SELECT COUNT(*) FROM users;"');
      console.log('Total users in database:', stdout.trim());
    } catch (error) {
      console.log('Database check error:', error.message);
    }
    
  } catch (error) {
    console.error('Integration test error:', error);
  }
}

testIntegration();
