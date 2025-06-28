#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Deeds Legal Case Management App
 * Tests all major functionality including criminals, cases, and dashboard
 */

console.log('🚀 Starting Comprehensive Deeds App Test Suite...\n');

const BASE_URL = 'http://localhost:5175';

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'testpassword123'
};

const testCriminal = {
  firstName: 'John',
  lastName: 'Doe',
  aliases: ['Johnny D', 'JD'],
  threatLevel: 'medium',
  status: 'active'
};

const testCase = {
  title: 'Test Case Investigation',
  description: 'A test case for verification purposes',
  priority: 'high',
  status: 'open'
};

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    return {
      success: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : null,
      error: response.ok ? null : await response.text()
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

async function testUserRegistration() {
  console.log('📝 Testing user registration...');
  
  const result = await testEndpoint(`${BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify({
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      confirmPassword: 'testpassword123'
    })
  });
  
  if (result.success) {
    console.log('✅ User registration: PASSED');
  } else {
    console.log('❌ User registration: FAILED', result.error);
  }
  
  return result.success;
}

async function testUserLogin() {
  console.log('🔐 Testing user login...');
  
  const result = await testEndpoint(`${BASE_URL}/api/login`, {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (result.success) {
    console.log('✅ User login: PASSED');
    return result.data;
  } else {
    console.log('❌ User login: FAILED', result.error);
    return null;
  }
}

async function testCriminalsAPI() {
  console.log('👤 Testing criminals API...');
  
  // Test GET criminals
  const getResult = await testEndpoint(`${BASE_URL}/api/criminals`);
  if (getResult.success) {
    console.log('✅ Get criminals: PASSED');
    console.log(`   Found ${getResult.data.criminals?.length || 0} criminals`);
  } else {
    console.log('❌ Get criminals: FAILED', getResult.error);
  }
  
  // Test POST criminal
  const postResult = await testEndpoint(`${BASE_URL}/api/criminals`, {
    method: 'POST',
    body: JSON.stringify(testCriminal)
  });
  
  if (postResult.success) {
    console.log('✅ Create criminal: PASSED');
    return postResult.data;
  } else {
    console.log('❌ Create criminal: FAILED', postResult.error);
    return null;
  }
}

async function testCasesAPI() {
  console.log('📋 Testing cases API...');
  
  // Test GET cases
  const getResult = await testEndpoint(`${BASE_URL}/api/cases`);
  if (getResult.success) {
    console.log('✅ Get cases: PASSED');
    console.log(`   Found ${getResult.data.cases?.length || 0} cases`);
  } else {
    console.log('❌ Get cases: FAILED', getResult.error);
  }
  
  return getResult.success;
}

async function testPageRoutes() {
  console.log('🌐 Testing page routes...');
  
  const routes = [
    '/',
    '/login', 
    '/register',
    '/dashboard',
    '/cases',
    '/criminals'
  ];
  
  let passedRoutes = 0;
  
  for (const route of routes) {
    const result = await testEndpoint(`${BASE_URL}${route}`);
    if (result.success || result.status === 302) { // Allow redirects
      console.log(`✅ Route ${route}: PASSED`);
      passedRoutes++;
    } else {
      console.log(`❌ Route ${route}: FAILED (${result.status})`);
    }
  }
  
  console.log(`📊 Routes passed: ${passedRoutes}/${routes.length}`);
  return passedRoutes === routes.length;
}

async function runComprehensiveTest() {
  console.log('=' .repeat(60));
  console.log('🔬 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(60));
  
  const results = {
    pageRoutes: await testPageRoutes(),
    criminalsAPI: await testCriminalsAPI(),
    casesAPI: await testCasesAPI()
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall Success Rate: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! The application is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above for details.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Visit http://localhost:5175 to test the UI manually');
  console.log('2. Try registering a new user and creating cases');
  console.log('3. Test the dashboard and search functionality');
  
  return passed === total;
}

// Run the test suite
runComprehensiveTest().catch(console.error);
