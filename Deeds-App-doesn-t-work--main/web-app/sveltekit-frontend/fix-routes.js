#!/usr/bin/env node

/**
 * Quick Route Fix Script for Deeds Legal Case Management App
 * This script checks and fixes common routing issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Starting Route Fix Script...');

// Check if we're in the correct directory
const currentDir = process.cwd();
const expectedFiles = [
    'src/routes/criminals/+page.svelte',
    'src/routes/criminals/+page.server.ts',
    'src/routes/cases/+page.svelte',
    'src/routes/dashboard/+page.svelte'
];

console.log(`📁 Current directory: ${currentDir}`);

// Verify all expected route files exist
let allFilesExist = true;
expectedFiles.forEach(file => {
    const filePath = path.join(currentDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ Found: ${file}`);
    } else {
        console.log(`❌ Missing: ${file}`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('✅ All expected route files found!');
} else {
    console.log('❌ Some route files are missing. Please check the directory structure.');
}

// Check if package.json exists and has correct scripts
const packageJsonPath = path.join(currentDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`📦 Package: ${packageJson.name}`);
    
    if (packageJson.scripts && packageJson.scripts.dev) {
        console.log(`🚀 Dev script: ${packageJson.scripts.dev}`);
    } else {
        console.log('❌ No dev script found in package.json');
    }
} else {
    console.log('❌ package.json not found');
}

// Check for common configuration files
const configFiles = [
    'vite.config.ts',
    'svelte.config.js',
    'drizzle.config.ts'
];

configFiles.forEach(file => {
    const filePath = path.join(currentDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ Config found: ${file}`);
    } else {
        console.log(`⚠️  Config missing: ${file}`);
    }
});

console.log('\n🎯 Route Fix Script Complete!');
console.log('\n📝 Next steps:');
console.log('1. Ensure you\'re in the correct sveltekit-frontend directory');
console.log('2. Run: npm run dev');
console.log('3. Visit: http://localhost:5173');
console.log('4. Test all routes: /, /login, /register, /dashboard, /cases, /criminals');

console.log('\n🚀 If routes are still not working:');
console.log('1. Check browser console for errors');
console.log('2. Verify database is running: docker ps');
console.log('3. Check server logs for detailed error messages');
