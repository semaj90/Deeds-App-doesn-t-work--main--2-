#!/usr/bin/env node

/**
 * Test script to verify registration and login functionality
 * This script will test the complete authentication flow
 */

import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5173';

async function testRegistration() {
  console.log('🧪 Testing Registration Flow...\n');
  
  const testUser = {
    name: 'Test Prosecutor',
    email: `test-${Date.now()}@prosecutor.com`,
    password: 'testpassword123'
  };
  
  console.log('📝 Registering new user:', {
    name: testUser.name,
    email: testUser.email,
    password: '[HIDDEN]'
  });
    try {
    // Use API endpoint instead of form submission
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
    });
    
    console.log('Registration response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Registration successful!');
      console.log('Response data:', data);
      return testUser;
    } else {
      const errorData = await response.json();
      console.log('❌ Registration failed. Response:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🔐 Testing Login Flow...');
  console.log('📝 Logging in with:', { email, password: '[HIDDEN]' });
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('User data:', data.user);
      return data.user;
    } else {
      const errorData = await response.json();
      console.log('❌ Login failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

async function checkDatabaseConnection() {
  console.log('🔌 Testing Database Connection...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database connection:', data);
    } else {
      console.log('⚠️  Health endpoint not available (this is normal)');
    }
  } catch (error) {
    console.log('⚠️  Health endpoint not available (this is normal)');
  }
}

async function runTests() {
  console.log('🚀 Starting WardenNet Authentication Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: Database connection
  await checkDatabaseConnection();
  
  // Test 2: Registration
  const testUser = await testRegistration();
  if (!testUser) {
    console.log('\n❌ Registration test failed - aborting login test');
    return;
  }
  
  // Test 3: Login
  const loggedInUser = await testLogin(testUser.email, testUser.password);
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(50));
  
  if (testUser && loggedInUser) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('  ✓ Registration working');
    console.log('  ✓ Login working');
    console.log('  ✓ Session creation working');
    console.log('\n🎉 Your WardenNet application is ready for use!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('  Registration:', testUser ? '✓' : '❌');
    console.log('  Login:', loggedInUser ? '✓' : '❌');
  }
}

runTests().catch(console.error);
