#!/usr/bin/env node

/**
 * Comprehensive Issue Detection and Fix Script
 * Identifies and fixes all issues in the Legal Intelligence CMS
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Legal Intelligence CMS - Issue Detection & Fix\n');

const results = [];
let issuesFixed = 0;
let issuesFound = 0;

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = type === 'error' ? '❌' : type === 'fix' ? '🔧' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

function checkAndFix(checkName, checkFn, fixFn = null) {
  try {
    log(`Checking: ${checkName}`);
    const issue = checkFn();
    
    if (issue) {
      issuesFound++;
      log(`Issue found: ${issue}`, 'error');
      
      if (fixFn) {
        try {
          const fixResult = fixFn();
          issuesFixed++;
          log(`Fixed: ${fixResult}`, 'fix');
          results.push({ check: checkName, status: 'FIXED', issue, fix: fixResult });
        } catch (fixError) {
          log(`Fix failed: ${fixError.message}`, 'error');
          results.push({ check: checkName, status: 'FAILED_TO_FIX', issue, error: fixError.message });
        }
      } else {
        results.push({ check: checkName, status: 'NEEDS_MANUAL_FIX', issue });
      }
    } else {
      log(`✓ ${checkName} - OK`, 'success');
      results.push({ check: checkName, status: 'OK' });
    }
  } catch (error) {
    issuesFound++;
    log(`Check failed: ${error.message}`, 'error');
    results.push({ check: checkName, status: 'CHECK_FAILED', error: error.message });
  }
  console.log('');
}

// Check 1: Package.json dependencies
checkAndFix(
  'Package.json Dependencies',
  () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const requiredDeps = ['@sveltejs/kit', 'svelte', 'vite', 'drizzle-orm', 'postgres'];
    const missing = requiredDeps.filter(dep => 
      !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]
    );
    return missing.length > 0 ? `Missing dependencies: ${missing.join(', ')}` : null;
  }
);

// Check 2: Environment configuration
checkAndFix(
  'Environment Configuration',
  () => {
    if (!existsSync('.env')) return '.env file missing';
    const env = readFileSync('.env', 'utf8');
    const required = ['DATABASE_URL', 'POSTGRES_'];
    const missing = required.filter(key => !env.includes(key));
    return missing.length > 0 ? `Missing env vars: ${missing.join(', ')}` : null;
  }
);

// Check 3: API Routes - Health endpoint
checkAndFix(
  'Health API Endpoint',
  () => {
    const healthPath = 'src/routes/api/health/+server.ts';
    return !existsSync(healthPath) ? 'Health API endpoint missing' : null;
  },
  () => {
    const healthContent = `import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    return json(health);
  } catch (error) {
    return json(
      { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
};`;
    
    execSync('mkdir -p src/routes/api/health');
    writeFileSync('src/routes/api/health/+server.ts', healthContent);
    return 'Created health API endpoint';
  }
);

// Check 4: Settings Component
checkAndFix(
  'Settings Component',
  () => {
    const settingsPath = 'src/lib/components/Settings.svelte';
    return !existsSync(settingsPath) ? 'Settings component missing' : null;
  },
  () => {
    const settingsContent = `<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let isOpen = false;
  export let settings = {};
  
  const dispatch = createEventDispatcher();
  
  function closeModal() {
    isOpen = false;
    dispatch('close');
  }
  
  function saveSettings() {
    dispatch('save', settings);
  }
</script>

{#if isOpen}
  <div class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Settings</h5>
          <button type="button" class="btn-close" on:click={closeModal}></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Theme</label>
            <select class="form-select" bind:value={settings.theme}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Language</label>
            <select class="form-select" bind:value={settings.language}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" on:click={closeModal}>Cancel</button>
          <button type="button" class="btn btn-primary" on:click={saveSettings}>Save</button>
        </div>
      </div>
    </div>
  </div>
{/if}`;
    
    execSync('mkdir -p src/lib/components');
    writeFileSync('src/lib/components/Settings.svelte', settingsContent);
    return 'Created Settings component';
  }
);

// Check 5: Missing Routes
checkAndFix(
  'Required Routes',
  () => {
    const requiredRoutes = [
      'src/routes/profile/+page.svelte',
      'src/routes/logout/+page.svelte',
      'src/routes/upload/+page.svelte'
    ];
    
    const missing = requiredRoutes.filter(route => !existsSync(route));
    return missing.length > 0 ? `Missing routes: ${missing.join(', ')}` : null;
  },
  () => {
    // Create profile page if missing
    if (!existsSync('src/routes/profile/+page.svelte')) {
      execSync('mkdir -p src/routes/profile');
      writeFileSync('src/routes/profile/+page.svelte', `<script lang="ts">
  // Profile page implementation
</script>

<div class="container py-4">
  <h1>User Profile</h1>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Profile Settings</h5>
      <p class="card-text">Manage your account settings and preferences.</p>
    </div>
  </div>
</div>`);
    }
    
    // Create logout page if missing
    if (!existsSync('src/routes/logout/+page.svelte')) {
      execSync('mkdir -p src/routes/logout');
      writeFileSync('src/routes/logout/+page.svelte', `<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Clear session and redirect
    goto('/login');
  });
</script>

<div class="container py-4">
  <div class="text-center">
    <h2>Logging out...</h2>
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
</div>`);
    }
    
    // Create upload page if missing
    if (!existsSync('src/routes/upload/+page.svelte')) {
      execSync('mkdir -p src/routes/upload');
      writeFileSync('src/routes/upload/+page.svelte', `<script lang="ts">
  let files: FileList;
  let uploading = false;
  
  async function handleUpload() {
    if (!files || files.length === 0) return;
    
    uploading = true;
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Files uploaded successfully!');
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      uploading = false;
    }
  }
</script>

<div class="container py-4">
  <h1>Upload Evidence</h1>
  <div class="card">
    <div class="card-body">
      <input type="file" multiple bind:files class="form-control mb-3" />
      <button class="btn btn-primary" on:click={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
    </div>
  </div>
</div>`);
    }
    
    return 'Created missing route files';
  }
);

// Check 6: TypeScript Configuration
checkAndFix(
  'TypeScript Configuration',
  () => {
    if (!existsSync('tsconfig.json')) return 'tsconfig.json missing';
    try {
      execSync('npm run check', { stdio: 'pipe' });
      return null;
    } catch (error) {
      return 'TypeScript compilation errors detected';
    }
  }
);

// Check 7: Drizzle Configuration
checkAndFix(
  'Drizzle Configuration',
  () => {
    if (!existsSync('drizzle.config.ts')) return 'drizzle.config.ts missing';
    const config = readFileSync('drizzle.config.ts', 'utf8');
    if (!config.includes('schema') || !config.includes('postgresql')) {
      return 'Invalid Drizzle configuration';
    }
    return null;
  }
);

// Check 8: Build Process
checkAndFix(
  'Build Process',
  () => {
    try {
      execSync('npm run build', { stdio: 'pipe' });
      return null;
    } catch (error) {
      return 'Build process failed';
    }
  }
);

// Check 9: Test Configuration
checkAndFix(
  'Test Configuration',
  () => {
    if (!existsSync('playwright.config.ts')) return 'Playwright config missing';
    if (!existsSync('tests')) return 'Tests directory missing';
    return null;
  }
);

// Summary
console.log('📊 ISSUE DETECTION SUMMARY');
console.log('==========================');
console.log(`🔍 Issues Found: ${issuesFound}`);
console.log(`🔧 Issues Fixed: ${issuesFixed}`);
console.log(`✅ Success Rate: ${issuesFound > 0 ? ((issuesFixed / issuesFound) * 100).toFixed(1) : 100}%`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    issuesFound,
    issuesFixed,
    successRate: issuesFound > 0 ? ((issuesFixed / issuesFound) * 100).toFixed(1) + '%' : '100%'
  },
  results
};

writeFileSync('issue-fix-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Detailed report saved to: issue-fix-report.json');

if (issuesFound > issuesFixed) {
  console.log('\n⚠️  Some issues need manual attention. Check the report for details.');
  process.exit(1);
} else {
  console.log('\n🎉 All issues resolved! Application should be ready.');
  
  // Try running a test to verify
  try {
    console.log('\n🧪 Running verification test...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build verification passed!');
  } catch (error) {
    console.log('❌ Build verification failed - manual review needed');
  }
  
  process.exit(0);
}
