#!/usr/bin/env node

/**
 * Final Verification & Status Report
 * Legal Intelligence CMS - Complete E2E Test
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

console.log('🎯 Legal Intelligence CMS - Final Verification\n');
console.log('==============================================\n');

const report = {
  timestamp: new Date().toISOString(),
  applicationName: 'Legal Intelligence CMS',
  version: '1.0.0',
  checks: [],
  summary: {}
};

function runCheck(name, testFn, criticalLevel = 'medium') {
  console.log(`🔍 Testing: ${name}...`);
  
  try {
    const result = testFn();
    const passed = result === true || (typeof result === 'object' && result.success);
    
    const checkResult = {
      name,
      status: passed ? 'PASS' : 'FAIL',
      criticalLevel,
      details: typeof result === 'string' ? result : (result.message || 'OK'),
      timestamp: new Date().toISOString()
    };
    
    report.checks.push(checkResult);
    
    if (passed) {
      console.log(`✅ ${name} - PASSED`);
    } else {
      console.log(`❌ ${name} - FAILED: ${checkResult.details}`);
    }
    
    return passed;
  } catch (error) {
    const checkResult = {
      name,
      status: 'ERROR',
      criticalLevel,
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    report.checks.push(checkResult);
    console.log(`💥 ${name} - ERROR: ${error.message}`);
    return false;
  }
}

console.log('📋 1. CORE CONFIGURATION CHECKS\n');

// Check 1: Environment Setup
runCheck('Environment Configuration', () => {
  if (!existsSync('.env')) return 'Missing .env file';
  const env = readFileSync('.env', 'utf8');
  const required = ['DATABASE_URL', 'POSTGRES_HOST', 'AUTH_SECRET'];
  const missing = required.filter(key => !env.includes(key));
  return missing.length === 0 ? true : `Missing: ${missing.join(', ')}`;
}, 'high');

// Check 2: Package Configuration
runCheck('Package Dependencies', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const adapter = pkg.devDependencies['@sveltejs/adapter-static'];
  const svelteKit = pkg.devDependencies['@sveltejs/kit'];
  
  if (!adapter) return 'Missing static adapter - not ready for desktop';
  if (!svelteKit) return 'Missing SvelteKit dependency';
  
  return true;
}, 'high');

// Check 3: SvelteKit Configuration
runCheck('SvelteKit Config', () => {
  if (!existsSync('svelte.config.js')) return 'Missing svelte.config.js';
  const config = readFileSync('svelte.config.js', 'utf8');
  
  if (config.includes('@sveltejs/adapter-vercel')) {
    return 'Still using Vercel adapter - should use static for desktop';
  }
  
  if (!config.includes('@sveltejs/adapter-static')) {
    return 'Not using static adapter - required for desktop deployment';
  }
  
  return true;
}, 'high');

console.log('\\n📱 2. APPLICATION STRUCTURE CHECKS\\n');

// Check 4: Critical Routes
runCheck('Core Routes Present', () => {
  const routes = [
    'src/routes/+layout.svelte',
    'src/routes/dashboard/+page.svelte',
    'src/routes/cases/+page.svelte',
    'src/routes/evidence/+page.svelte',
    'src/routes/ai-assistant/+page.svelte',
    'src/routes/upload/+page.svelte'
  ];
  
  const missing = routes.filter(route => !existsSync(route));
  return missing.length === 0 ? true : `Missing routes: ${missing.join(', ')}`;
}, 'high');

// Check 5: API Endpoints
runCheck('API Endpoints', () => {
  const apis = [
    'src/routes/api/health/+server.ts',
    'src/routes/api/ai/search/+server.ts',
    'src/routes/api/cases/+server.ts',
    'src/routes/api/evidence/+server.ts'
  ];
  
  const missing = apis.filter(api => !existsSync(api));
  return missing.length === 0 ? true : `Missing APIs: ${missing.join(', ')}`;
}, 'medium');

// Check 6: Components
runCheck('Essential Components', () => {
  const components = [
    'src/lib/components/Settings.svelte'
  ];
  
  const missing = components.filter(comp => !existsSync(comp));
  return missing.length === 0 ? true : `Missing components: ${missing.join(', ')}`;
}, 'medium');

console.log('\\n🔧 3. BUILD & COMPILATION CHECKS\\n');

// Check 7: TypeScript Compilation
runCheck('TypeScript Check', () => {
  try {
    execSync('npx svelte-check --tsconfig ./tsconfig.json', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return 'TypeScript compilation errors detected';
  }
}, 'high');

// Check 8: Build Process
runCheck('Application Build', () => {
  try {
    execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
    
    // Check if build directory was created
    if (!existsSync('build')) {
      return 'Build directory not created';
    }
    
    // Check if index.html exists in build
    if (!existsSync('build/index.html')) {
      return 'Build output missing index.html';
    }
    
    return true;
  } catch (error) {
    return `Build failed: ${error.message}`;
  }
}, 'high');

console.log('\\n🧪 4. FUNCTIONAL TESTS\\n');

// Check 9: Test Suite
runCheck('Playwright Tests', () => {
  try {
    const result = execSync('npx playwright test --reporter=json', { stdio: 'pipe', timeout: 120000 });
    const testResults = JSON.parse(result.toString());
    
    if (testResults.stats && testResults.stats.expected === testResults.stats.passed) {
      return true;
    } else {
      return `${testResults.stats?.failed || 'unknown'} tests failed`;
    }
  } catch (error) {
    return 'Test execution failed';
  }
}, 'medium');

console.log('\\n📊 5. FINAL ASSESSMENT\\n');

// Calculate summary
const totalChecks = report.checks.length;
const passedChecks = report.checks.filter(c => c.status === 'PASS').length;
const failedChecks = report.checks.filter(c => c.status === 'FAIL').length;
const errorChecks = report.checks.filter(c => c.status === 'ERROR').length;
const criticalIssues = report.checks.filter(c => c.status !== 'PASS' && c.criticalLevel === 'high').length;

report.summary = {
  totalChecks,
  passedChecks,
  failedChecks,
  errorChecks,
  criticalIssues,
  successRate: `${((passedChecks / totalChecks) * 100).toFixed(1)}%`,
  readyForProduction: criticalIssues === 0 && passedChecks >= (totalChecks * 0.8)
};

console.log('=' .repeat(50));
console.log('🎯 FINAL VERIFICATION SUMMARY');
console.log('=' .repeat(50));
console.log(`✅ Checks Passed: ${passedChecks}/${totalChecks}`);
console.log(`❌ Checks Failed: ${failedChecks}`);
console.log(`💥 Errors: ${errorChecks}`);
console.log(`⚠️  Critical Issues: ${criticalIssues}`);
console.log(`📈 Success Rate: ${report.summary.successRate}`);

if (report.summary.readyForProduction) {
  console.log('\\n🎉 APPLICATION STATUS: READY FOR PRODUCTION!');
  console.log('\\n✅ DESKTOP DEPLOYMENT READY:');
  console.log('   - All critical checks passed');
  console.log('   - Static adapter configured');
  console.log('   - Build process working');
  console.log('   - Core features functional');
  
  console.log('\\n🚀 NEXT STEPS:');
  console.log('1. Install Tauri CLI: npm install -g @tauri-apps/cli');
  console.log('2. Create Tauri project: npx tauri init');
  console.log('3. Configure Tauri to use this build output');
  console.log('4. Package as executable: npx tauri build');
} else {
  console.log('\\n⚠️  APPLICATION STATUS: NEEDS ATTENTION');
  console.log(`\\n🔧 Fix ${criticalIssues} critical issue(s) before production deployment`);
  
  const criticalFailures = report.checks.filter(c => c.status !== 'PASS' && c.criticalLevel === 'high');
  if (criticalFailures.length > 0) {
    console.log('\\n❌ CRITICAL ISSUES TO FIX:');
    criticalFailures.forEach(issue => {
      console.log(`   - ${issue.name}: ${issue.details}`);
    });
  }
}

// Save detailed report
writeFileSync('final-verification-report.json', JSON.stringify(report, null, 2));
console.log('\\n📄 Detailed report saved to: final-verification-report.json');

console.log('\\n🎯 Legal Intelligence CMS verification complete!');
process.exit(report.summary.readyForProduction ? 0 : 1);
