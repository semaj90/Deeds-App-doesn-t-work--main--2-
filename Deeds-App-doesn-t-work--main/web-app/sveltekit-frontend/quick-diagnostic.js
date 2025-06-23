#!/usr/bin/env node

/**
 * Quick Issue Identifier
 * Identifies the most critical blocking issues
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🔍 Quick Issue Detection for Legal Intelligence CMS\n');

function checkIssue(name, checkFn) {
  try {
    console.log(`Checking: ${name}...`);
    const result = checkFn();
    if (result === true) {
      console.log(`✅ ${name} - OK`);
    } else {
      console.log(`❌ ${name} - ${result}`);
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.message}`);
  }
  console.log('');
}

// Check if PostgreSQL environment variables are properly set
checkIssue('Environment Variables', () => {
  if (!existsSync('.env')) return '.env file missing';
  const env = readFileSync('.env', 'utf8');
  const required = ['DATABASE_URL', 'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
  const missing = required.filter(key => !env.includes(key));
  return missing.length === 0 ? true : `Missing: ${missing.join(', ')}`;
});

// Check if critical files exist
checkIssue('Critical Files', () => {
  const criticalFiles = [
    'src/routes/+layout.svelte',
    'src/routes/dashboard/+page.svelte',
    'src/lib/components/Settings.svelte',
    'package.json',
    'tsconfig.json',
    'svelte.config.js',
    'drizzle.config.ts'
  ];
  
  const missing = criticalFiles.filter(file => !existsSync(file));
  return missing.length === 0 ? true : `Missing files: ${missing.join(', ')}`;
});

// Check if package.json has required dependencies
checkIssue('Dependencies', () => {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const required = ['@sveltejs/kit', 'svelte', 'vite', 'drizzle-orm'];
    const missing = required.filter(dep => 
      !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]
    );
    return missing.length === 0 ? true : `Missing deps: ${missing.join(', ')}`;
  } catch (error) {
    return 'Cannot read package.json';
  }
});

// Check TypeScript compilation
checkIssue('TypeScript Check', () => {
  try {
    execSync('npx svelte-check --tsconfig ./tsconfig.json', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return 'TypeScript compilation has errors';
  }
});

// Check if build works
checkIssue('Build Process', () => {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return 'Build process fails';
  }
});

console.log('🎯 Quick diagnostic complete!');
console.log('Focus on fixing the items marked with ❌ first.');
