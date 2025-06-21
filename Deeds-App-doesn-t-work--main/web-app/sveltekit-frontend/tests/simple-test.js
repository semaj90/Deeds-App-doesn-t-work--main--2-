/**
 * Simple Login Test for WardenNet
 */

// Polyfill fetch for Node.js if not available
// @ts-ignore
if (typeof fetch === 'undefined') {
  // @ts-ignore
  global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

const baseUrl = 'http://localhost:5173';

async function testLogin() {
  console.log('🔐 Testing Login with Demo User');
  console.log('=====================================');
  
  try {
    const loginData = {
      email: 'demo@prosecutor.com',
      password: 'password123'
    };
    
    console.log(`Attempting to login: ${loginData.email}`);
    
    const response = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log(`Login Status: ${response.status}`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('User Data:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorData = await response.text();
      console.log('❌ Login failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

async function testHomepage() {
  console.log('\n🏠 Testing Homepage Access');
  console.log('============================');
  
  try {
    const response = await fetch(`${baseUrl}/`);
    console.log(`Homepage Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Homepage accessible');
      return true;
    } else {
      console.log('❌ Homepage failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Homepage error:', error);
    return false;
  }
}

async function testRegisterPage() {
  console.log('\n📝 Testing Registration Page Access');
  console.log('====================================');
  
  try {
    const response = await fetch(`${baseUrl}/register`);
    console.log(`Register Page Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Registration page accessible');
      return true;
    } else {
      console.log('❌ Registration page failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Registration page error:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 WardenNet Simple Test Suite\n');
  
  // Test 1: Homepage
  await testHomepage();
  
  // Test 2: Register Page
  await testRegisterPage();
  
  // Test 3: Login
  await testLogin();
  
  console.log('\n🏁 All simple tests complete.');
}

runTests();
