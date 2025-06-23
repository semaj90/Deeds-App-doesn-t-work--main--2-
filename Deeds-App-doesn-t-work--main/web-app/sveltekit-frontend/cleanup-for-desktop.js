#!/usr/bin/env node

/**
 * Cleanup Script - Remove unnecessary files and dependencies
 * Prepares the app for Tauri/desktop deployment
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from 'fs';

console.log('🧹 Legal Intelligence CMS - Cleanup & Optimization\n');

let filesRemoved = 0;
let spaceSaved = 0;

function removeFile(filePath, reason) {
  try {
    if (existsSync(filePath)) {
      const stats = require('fs').statSync(filePath);
      if (stats.isDirectory()) {
        rmSync(filePath, { recursive: true, force: true });
      } else {
        unlinkSync(filePath);
      }
      spaceSaved += stats.size || 0;
      filesRemoved++;
      console.log(`🗑️  Removed: ${filePath} (${reason})`);
    }
  } catch (error) {
    console.log(`⚠️  Failed to remove ${filePath}: ${error.message}`);
  }
}

function updatePackageJson(changes, reason) {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    let modified = false;
    
    for (const [section, updates] of Object.entries(changes)) {
      if (pkg[section]) {
        for (const [key, value] of Object.entries(updates)) {
          if (value === null) {
            // Remove dependency
            if (pkg[section][key]) {
              delete pkg[section][key];
              modified = true;
              console.log(`🗑️  Removed dependency: ${key} (${reason})`);
            }
          } else {
            // Update dependency
            pkg[section][key] = value;
            modified = true;
            console.log(`🔄 Updated dependency: ${key} to ${value} (${reason})`);
          }
        }
      }
    }
    
    if (modified) {
      writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    }
    
    return modified;
  } catch (error) {
    console.log(`⚠️  Failed to update package.json: ${error.message}`);
    return false;
  }
}

console.log('1. Removing Vercel-specific files...');
removeFile('.vercel', 'Vercel deployment files not needed for desktop');
removeFile('vercel.json', 'Vercel config not needed');

console.log('\\n2. Removing unnecessary demo/test routes...');
removeFile('src/routes/demo', 'Demo routes not needed in production');
removeFile('src/routes/test', 'Test routes not needed in production');
removeFile('src/routes/hello', 'Hello world route not needed');
removeFile('src/routes/about', 'About route not used in navigation');
removeFile('src/routes/contact', 'Contact route not used in navigation');

console.log('\\n3. Removing unused API endpoints...');
removeFile('src/routes/api/test', 'Test API endpoints not needed');
removeFile('src/routes/api/seed-demo', 'Demo seeding not needed in production');

console.log('\\n4. Updating SvelteKit adapter for desktop deployment...');
const svelteConfigUpdated = updatePackageJson({
  devDependencies: {
    '@sveltejs/adapter-vercel': null,  // Remove Vercel adapter
    '@sveltejs/adapter-static': '^3.0.1'  // Add static adapter for desktop
  }
}, 'Desktop deployment preparation');

console.log('\\n5. Removing development/testing artifacts...');
removeFile('test-results', 'Playwright test results not needed in production');
removeFile('playwright-report', 'Playwright reports not needed');
removeFile('.svelte-kit', 'SvelteKit build cache - will be regenerated');

console.log('\\n6. Cleaning up temporary files...');
removeFile('seed.db', 'Temporary database file');
removeFile('*.temp', 'Temporary files');
removeFile('*.backup', 'Backup files');

console.log('\\n7. Removing unused dependencies...');
updatePackageJson({
  devDependencies: {
    '@types/bootstrap': null,  // Only needed if using Bootstrap TypeScript
    'vite-plugin-devtools-json': null,  // Development tool not needed in production
  }
}, 'Reduce bundle size');

console.log('\\n8. Updating scripts for desktop deployment...');
updatePackageJson({
  scripts: {
    'build:desktop': 'vite build',
    'preview:desktop': 'vite preview --host',
    'package:tauri': 'npm run build:desktop && cd .. && npm run tauri build'
  }
}, 'Add desktop-specific build scripts');

console.log('\\n🎯 CLEANUP SUMMARY');
console.log('==================');
console.log(`🗑️  Files removed: ${filesRemoved}`);
console.log(`💾 Space saved: ${(spaceSaved / 1024 / 1024).toFixed(2)} MB`);

console.log('\\n✅ NEXT STEPS:');
console.log('1. Run: npm install (to install static adapter)');
console.log('2. Run: npm run build:desktop (to test desktop build)');
console.log('3. Run: npm test (to verify everything still works)');
console.log('4. The app is now optimized for Tauri desktop packaging!');

console.log('\\n📋 DESKTOP DEPLOYMENT READY:');
console.log('- Removed Vercel adapter and files');
console.log('- Added static adapter for desktop');
console.log('- Cleaned up unnecessary routes and files');
console.log('- Optimized dependencies for production');
console.log('- Ready for Tauri/Rust integration');

console.log('\\n🚀 To package as desktop app:');
console.log('1. Install Tauri CLI: npm install -g @tauri-apps/cli');
console.log('2. Run: npm run package:tauri');
console.log('3. Executable will be generated in src-tauri/target/release/');
