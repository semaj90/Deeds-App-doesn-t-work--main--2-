#!/usr/bin/env node

/**
 * Test runner to verify all components are working
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5175';

async function runAllTests() {
  console.log('🚀 Starting Deeds App Test Suite...\n');
  console.log('=' .repeat(50));

  // Test 1: Server Health Check
  console.log('📊 Test 1: Server Health Check');
  try {
    const response = await fetch(`${BASE_URL}/`);
    if (response.ok) {
      console.log('✅ Server is running and responding');
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Server health check failed: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(50));
  
  // Test 2: API Endpoints
  console.log('🔗 Test 2: API Endpoints Check');
  const apiEndpoints = [
    '/api/health',
    '/api/auth/me',
    '/api/cases',
    '/api/criminals'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      console.log(`${response.ok ? '✅' : '⚠️'} ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  
  // Test 3: Static Assets
  console.log('📁 Test 3: Static Assets Check');
  const staticAssets = [
    '/favicon.ico',
    '/_app/immutable/entry/start.js',
    '/_app/immutable/entry/app.js'
  ];

  for (const asset of staticAssets) {
    try {
      const response = await fetch(`${BASE_URL}${asset}`);
      console.log(`${response.ok ? '✅' : '⚠️'} ${asset}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${asset}: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Test Suite Complete!');
  console.log('\nNext steps:');
  console.log('- Run: npm run test (for Playwright tests)');
  console.log('- Run: npm run test:ui (for interactive testing)');
  console.log('- Run: npm run test:headed (for visual testing)');
}

runAllTests().catch(console.error);
