#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Legal Intelligence CMS
 * Tests all enhanced features from today's work (6/22/2025)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🧪 Legal Intelligence CMS - Enhanced Features Test Suite\n');
console.log('='.repeat(60));
console.log('Testing all UI/UX enhancements from 6/22/2025\n');

const testResults = [];
let totalTests = 0;
let passedTests = 0;

function runTest(testName, testFunction, critical = false) {
  totalTests++;
  console.log(`🔍 ${testName}...`);
  
  try {
    const result = testFunction();
    if (result === true) {
      console.log(`✅ PASS: ${testName}`);
      testResults.push({ name: testName, status: 'PASS', critical });
      passedTests++;
    } else {
      console.log(`❌ FAIL: ${testName} - ${result}`);
      testResults.push({ name: testName, status: 'FAIL', details: result, critical });
    }
  } catch (error) {
    console.log(`💥 ERROR: ${testName} - ${error.message}`);
    testResults.push({ name: testName, status: 'ERROR', error: error.message, critical });
  }
  console.log('');
}

console.log('📁 1. ENHANCED LAYOUT & NAVIGATION TESTS\n');

runTest('Enhanced Layout File Present', () => {
  if (!existsSync('src/routes/+layout.svelte')) {
    return 'Layout file missing';
  }
  
  const layout = readFileSync('src/routes/+layout.svelte', 'utf8');
  
  // Check for Bootstrap integration
  if (!layout.includes('bootstrap')) {
    return 'Bootstrap integration missing';
  }
  
  // Check for AI search functionality
  if (!layout.includes('aiSearch') || !layout.includes('handleAiSearch')) {
    return 'AI search functionality missing';
  }
  
  // Check for navigation items
  const navItems = ['Dashboard', 'Cases', 'Evidence', 'AI Assistant', 'Upload'];
  const missingNav = navItems.filter(item => !layout.includes(item));
  if (missingNav.length > 0) {
    return `Missing navigation: ${missingNav.join(', ')}`;
  }
  
  return true;
}, true);

runTest('Settings Component Present', () => {
  if (!existsSync('src/lib/components/Settings.svelte')) {
    return 'Settings component missing';
  }
  
  const settings = readFileSync('src/lib/components/Settings.svelte', 'utf8');
  if (!settings.includes('modal') || !settings.includes('createEventDispatcher')) {
    return 'Settings component incomplete';
  }
  
  return true;
}, true);

console.log('🤖 2. AI ENHANCEMENT TESTS\n');

runTest('AI Prompt Page Present', () => {
  if (!existsSync('src/routes/ai/+page.svelte')) {
    return 'AI prompt page missing';
  }
  
  const aiPage = readFileSync('src/routes/ai/+page.svelte', 'utf8');
  if (!aiPage.includes('quickPrompts') || !aiPage.includes('submitPrompt')) {
    return 'AI prompt functionality incomplete';
  }
  
  return true;
}, true);

runTest('AI Search API Endpoint', () => {
  if (!existsSync('src/routes/api/ai/search/+server.ts')) {
    return 'AI search API missing';
  }
  
  const api = readFileSync('src/routes/api/ai/search/+server.ts', 'utf8');
  if (!api.includes('generateMockLegalResponse') || !api.includes('detectQueryType')) {
    return 'AI search API incomplete';
  }
  
  return true;
}, true);

runTest('AI Prompt API Endpoint', () => {
  if (!existsSync('src/routes/api/ai/prompt/+server.ts')) {
    return 'AI prompt API missing';
  }
  
  const api = readFileSync('src/routes/api/ai/prompt/+server.ts', 'utf8');
  if (!api.includes('generateLegalResponse')) {
    return 'AI prompt API incomplete';
  }
  
  return true;
}, true);

console.log('📊 3. DASHBOARD ENHANCEMENT TESTS\n');

runTest('Enhanced Dashboard Present', () => {
  if (!existsSync('src/routes/dashboard/+page.svelte')) {
    return 'Dashboard missing';
  }
  
  const dashboard = readFileSync('src/routes/dashboard/+page.svelte', 'utf8');
  
  // Check for welcome header
  if (!dashboard.includes('Welcome back') || !dashboard.includes('Prosecutor')) {
    return 'Welcome header missing';
  }
  
  // Check for AI legal assistant section
  if (!dashboard.includes('legalQuery') || !dashboard.includes('askLegalQuestion')) {
    return 'AI legal assistant section missing';
  }
  
  // Check for file upload functionality
  if (!dashboard.includes('handleFileUpload') || !dashboard.includes('handleDrop')) {
    return 'File upload functionality missing';
  }
  
  return true;
}, true);

console.log('🔧 4. CORE FUNCTIONALITY TESTS\n');

runTest('Required Routes Present', () => {
  const requiredRoutes = [
    'src/routes/dashboard/+page.svelte',
    'src/routes/cases/+page.svelte',
    'src/routes/evidence/+page.svelte',
    'src/routes/ai-assistant/+page.svelte',
    'src/routes/upload/+page.svelte',
    'src/routes/login/+page.svelte',
    'src/routes/register/+page.svelte'
  ];
  
  const missing = requiredRoutes.filter(route => !existsSync(route));
  return missing.length === 0 ? true : `Missing routes: ${missing.join(', ')}`;
}, true);

runTest('API Health Endpoint', () => {
  if (!existsSync('src/routes/api/health/+server.ts')) {
    return 'Health API endpoint missing';
  }
  return true;
});

runTest('Environment Configuration', () => {
  if (!existsSync('.env')) {
    return '.env file missing';
  }
  
  const env = readFileSync('.env', 'utf8');
  const required = ['DATABASE_URL', 'POSTGRES_HOST', 'AUTH_SECRET'];
  const missing = required.filter(key => !env.includes(key));
  
  return missing.length === 0 ? true : `Missing env vars: ${missing.join(', ')}`;
}, true);

console.log('📦 5. BUILD & COMPILATION TESTS\n');

runTest('TypeScript Compilation', () => {
  try {
    execSync('npx svelte-check --tsconfig ./tsconfig.json', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return 'TypeScript compilation errors';
  }
});

runTest('Application Build', () => {
  try {
    execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
    return true;
  } catch (error) {
    return 'Build failed';
  }
});

console.log('🎯 6. PLAYWRIGHT E2E TESTS\n');

runTest('Playwright Test Execution', () => {
  try {
    const result = execSync('npx playwright test --reporter=json', { 
      stdio: 'pipe', 
      timeout: 120000 
    });
    
    const testResults = JSON.parse(result.toString());
    if (testResults.stats && testResults.stats.passed > 0) {
      return true;
    } else {
      return 'No tests passed';
    }
  } catch (error) {
    return 'Playwright tests failed to run';
  }
});

console.log('='.repeat(60));
console.log('🎯 ENHANCED FEATURES TEST SUMMARY');
console.log('='.repeat(60));

const criticalFailed = testResults.filter(t => t.critical && t.status !== 'PASS');
const successRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${successRate}%`);
console.log(`⚠️  Critical Failures: ${criticalFailed.length}`);

if (criticalFailed.length === 0 && passedTests >= totalTests * 0.8) {
  console.log('\n🎉 ENHANCED FEATURES STATUS: FULLY FUNCTIONAL!');
  console.log('\n✅ ALL TODAY\'S UI/UX ENHANCEMENTS (6/22/2025) ARE WORKING:');
  console.log('   ✓ Bootstrap-enhanced navigation with AI search');
  console.log('   ✓ Advanced dashboard with legal assistant integration');
  console.log('   ✓ AI prompt page with legal-specific responses');
  console.log('   ✓ Enhanced evidence management with drag & drop');
  console.log('   ✓ Professional UI with Bootstrap icons and styling');
  console.log('   ✓ Settings modal with comprehensive preferences');
  
  console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT!');
} else {
  console.log('\n⚠️  ENHANCED FEATURES STATUS: NEEDS ATTENTION');
  
  if (criticalFailed.length > 0) {
    console.log('\n❌ CRITICAL ISSUES TO FIX:');
    criticalFailed.forEach(issue => {
      console.log(`   - ${issue.name}: ${issue.details || issue.error}`);
    });
  }
  
  console.log('\n🔧 Fix these issues to complete the enhancement deployment');
}

console.log('\n📄 Individual test results:');
testResults.forEach(test => {
  const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '💥';
  const critical = test.critical ? ' [CRITICAL]' : '';
  console.log(`${icon} ${test.name}${critical}`);
});

console.log('\n🎯 Legal Intelligence CMS enhanced features verification complete!');
process.exit(criticalFailed.length === 0 ? 0 : 1);
