#!/usr/bin/env node

/**
 * Simple Login Test for WardenNet
 */

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
  const homepageResult = await testHomepage();
  
  // Test 2: Registration page
  const registerResult = await testRegisterPage();
  
  // Test 3: Login
  const loginResult = await testLogin();
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Homepage: ${homepageResult ? '✅' : '❌'}`);
  console.log(`Register Page: ${registerResult ? '✅' : '❌'}`);
  console.log(`Login API: ${loginResult ? '✅' : '❌'}`);
  
  if (homepageResult && registerResult && loginResult) {
    console.log('\n🎉 All basic tests passed! Your application is working.');
    console.log('\nTry these in your browser:');
    console.log(`- Homepage: ${baseUrl}/`);
    console.log(`- Register: ${baseUrl}/register`);
    console.log(`- Login: ${baseUrl}/login`);
    console.log(`- Demo login: demo@prosecutor.com / password123`);
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
}

runTests();
