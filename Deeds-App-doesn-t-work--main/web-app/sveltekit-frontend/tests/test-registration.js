#!/usr/bin/env node
/**
 * Test script to verify registration and login functionality
 * This script will test the complete authentication flow
 */

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
    // Create form data
    const formData = new FormData();
    formData.append('name', testUser.name);
    formData.append('email', testUser.email);
    formData.append('password', testUser.password);
    
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      body: formData
    });
    
    console.log('Registration response status:', response.status);
    console.log('Registration response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if we were redirected (which means success)
    if (response.status === 303 || response.status === 302) {
      const location = response.headers.get('location');
      console.log('✅ Registration successful! Redirected to:', location);
      return testUser;
    } else {
      const text = await response.text();
      console.log('❌ Registration failed. Response:', text);
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
    const response = await fetch(`${baseUrl}/api/login`, {
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

async function run() {
  await checkDatabaseConnection();
  const user = await testRegistration();
  if (!user) return;
  await testLogin(user.email, user.password);
}

run();
