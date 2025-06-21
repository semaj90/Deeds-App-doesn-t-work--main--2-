#!/usr/bin/env node
// Comprehensive test script to validate all fixes and functionality

import { spawn } from 'child_process';
import { platform } from 'os';
import { writeFileSync } from 'fs';

const isWindows = platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Starting Comprehensive Application Test');
console.log('=========================================');

const results = {
  sslrFix: false,
  schemaImportFix: false,
  serverStart: false,
  dbMigrations: false,
  crudOperations: false,
  playwrightBasic: false
};

// Function to run a command and return promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function testSSRFix() {
  console.log('\n1️⃣ Testing SSR Fix...');
  try {
    const result = await runCommand('node', ['test-ssr-fix.js']);
    if (result.code === 0 && result.stdout.includes('SSR fix appears to be working')) {
      results.sslrFix = true;
      console.log('✅ SSR fix working');
    } else {
      console.log('❌ SSR fix failed');
    }
  } catch (error) {
    console.log('❌ SSR test error:', error.message);
  }
}

async function testDbMigrations() {
  console.log('\n2️⃣ Testing Database Migrations...');
  try {
    const result = await runCommand(npmCmd, ['run', 'db:push']);
    if (result.code === 0 || result.stdout.includes('Changes applied')) {
      results.dbMigrations = true;
      console.log('✅ Database migrations working');
    } else {
      console.log('❌ Database migrations failed');
    }
  } catch (error) {
    console.log('❌ Migration test error:', error.message);
  }
}

async function testCrudOperations() {
  console.log('\n3️⃣ Testing CRUD Operations...');
  try {
    // Navigate to root directory and run CRUD test
    const result = await runCommand('node', ['test_crud_operations.js'], { 
      cwd: '../../../' 
    });
    if (result.code === 0 && result.stdout.includes('All CRUD operations completed successfully')) {
      results.crudOperations = true;
      console.log('✅ CRUD operations working');
    } else {
      console.log('❌ CRUD operations failed');
    }
  } catch (error) {
    console.log('❌ CRUD test error:', error.message);
  }
}

async function testSchemaImportFix() {
  console.log('\n4️⃣ Testing Schema Import Fix...');
  try {
    // Try to build the project to test for schema import errors
    const result = await runCommand(npmCmd, ['run', 'check']);
    if (result.code === 0 || !result.stderr.includes('Cannot import $lib/server/db/schema')) {
      results.schemaImportFix = true;
      console.log('✅ Schema import fix working');
    } else {
      console.log('❌ Schema import fix failed');
    }
  } catch (error) {
    console.log('❌ Schema import test error:', error.message);
  }
}

async function testServerStartup() {
  console.log('\n5️⃣ Testing Server Startup...');
  try {
    const result = await runCommand('node', ['test-server-startup.js']);
    if (result.stdout.includes('Server started successfully')) {
      results.serverStart = true;
      console.log('✅ Server startup working');
    } else {
      console.log('❌ Server startup failed');
    }
  } catch (error) {
    console.log('❌ Server startup test error:', error.message);
  }
}

// Main test execution
async function runAllTests() {
  await testSSRFix();
  await testDbMigrations();
  await testCrudOperations();
  await testSchemaImportFix();
  await testServerStartup();
  
  // Generate report
  console.log('\n📊 FINAL TEST RESULTS');
  console.log('====================');
  console.log(`✅ SSR Fix: ${results.sslrFix ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Schema Import Fix: ${results.schemaImportFix ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Server Startup: ${results.serverStart ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Database Migrations: ${results.dbMigrations ? 'PASS' : 'FAIL'}`);
  console.log(`✅ CRUD Operations: ${results.crudOperations ? 'PASS' : 'FAIL'}`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Application is ready for E2E testing.');
  } else {
    console.log('⚠️ Some tests failed. Check individual results above.');
  }
  
  // Save results to file
  writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('📄 Detailed results saved to test-results.json');
}

runAllTests().catch(console.error);
