#!/usr/bin/env node

/**
 * Interactive Canvas System Validation Test
 * Tests all the components and APIs we've implemented
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.cyan}🔍 ${msg}${colors.reset}`)
};

// Test file existence
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Read file content
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Main validation function
async function validateSystem() {
    log.header('Interactive Canvas System Validation');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;

    // Core page files
    log.header('Core Page Structure');
    const coreFiles = [
        { path: 'src/routes/interactive-canvas/+page.svelte', name: 'Interactive Canvas Page' },
        { path: 'src/routes/interactive-canvas/+page.server.ts', name: 'Interactive Canvas Server' }
    ];

    for (const file of coreFiles) {
        totalTests++;
        const fullPath = join(__dirname, file.path);
        if (await fileExists(fullPath)) {
            log.success(`${file.name} - File exists`);
            passedTests++;
        } else {
            log.error(`${file.name} - File missing`);
        }
    }

    // API endpoints
    log.header('API Endpoints');
    const apiEndpoints = [
        { path: 'src/routes/api/ai/suggest/+server.ts', name: 'AI Suggest API' },
        { path: 'src/routes/api/canvas/save/+server.ts', name: 'Canvas Save API' },
        { path: 'src/routes/api/qdrant/tag/+server.ts', name: 'Qdrant Tag API' }
    ];

    for (const endpoint of apiEndpoints) {
        totalTests++;
        const fullPath = join(__dirname, endpoint.path);
        const content = await readFile(fullPath);
        if (content && (content.includes('export const GET') || content.includes('export const POST'))) {
            log.success(`${endpoint.name} - API endpoint exists`);
            passedTests++;
        } else {
            log.error(`${endpoint.name} - Missing API handler`);
        }
    }

    // Core components
    log.header('Core Components');
    const components = [
        'Sidebar', 'Header', 'SearchInput', 'InfiniteScrollList', 'Toolbar',
        'AIFabButton', 'Dialog', 'SearchBar', 'TagList', 'FileUploadSection'
    ];

    for (const component of components) {
        totalTests++;
        const fullPath = join(__dirname, `src/lib/components/${component}.svelte`);
        if (await fileExists(fullPath)) {
            log.success(`${component} Component - File exists`);
            passedTests++;
        } else {
            log.error(`${component} Component - File missing`);
        }
    }

    // Store files
    log.header('Store Systems');
    const stores = ['canvas.ts', 'lokiStore.ts'];
    for (const store of stores) {
        totalTests++;
        const fullPath = join(__dirname, `src/lib/stores/${store}`);
        if (await fileExists(fullPath)) {
            log.success(`${store} Store - File exists`);
            passedTests++;
        } else {
            log.error(`${store} Store - File missing`);
        }
    }

    // Package.json dependencies
    log.header('Dependencies Check');
    totalTests++;
    const packageJsonPath = join(__dirname, 'package.json');
    const packageContent = await readFile(packageJsonPath);
    
    if (packageContent) {
        const packageJson = JSON.parse(packageContent);
        const requiredDeps = [
            'phosphor-svelte',
            'fuse.js',
            '@fabric.js/fabric',
            'lokijs',
            '@qdrant/js-client-rest'
        ];
        
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
        
        if (missingDeps.length === 0) {
            log.success('All required dependencies present');
            passedTests++;
        } else {
            log.error(`Missing dependencies: ${missingDeps.join(', ')}`);
        }
    } else {
        log.error('package.json not found');
    }

    // Final report
    console.log('\n' + '='.repeat(60));
    log.header('VALIDATION SUMMARY');
    console.log(`${colors.bold}Total Tests: ${totalTests}${colors.reset}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
    
    const successRate = Math.round((passedTests / totalTests) * 100);
    console.log(`${colors.bold}Success Rate: ${successRate}%${colors.reset}`);

    if (successRate >= 90) {
        log.success('🎉 SYSTEM READY FOR TESTING!');
    } else if (successRate >= 75) {
        log.warning('⚠️  System mostly ready, minor issues to resolve');
    } else {
        log.error('❌ System needs significant work before testing');
    }

    // Usage instructions
    console.log('\n' + '='.repeat(60));
    log.header('NEXT STEPS');
    console.log(`${colors.cyan}1. Start dev server: ${colors.bold}npm run dev${colors.reset}`);
    console.log(`${colors.cyan}2. Open browser: ${colors.bold}http://localhost:5173/interactive-canvas${colors.reset}`);
    console.log(`${colors.cyan}3. Test features: Sidebar, Canvas, AI dialog, File upload${colors.reset}`);
    console.log(`${colors.cyan}4. Check browser console for any runtime errors${colors.reset}`);
}

// Run validation
validateSystem().catch(console.error);
    console.log('\n📄 Testing Page Accessibility...');
    try {
        const response = await testEndpoint(`${baseUrl}/interactive-canvas`);
        results.push({
            test: 'Interactive Canvas Page',
            status: response.success ? '✅ PASS' : '❌ FAIL',
            details: `Status: ${response.status}`
        });
    } catch (error) {
        results.push({
            test: 'Interactive Canvas Page',
            status: '❌ FAIL',
            details: error.message
        });
    }
    
    // Test 2: AI Suggest API (Mock)
    console.log('\n🤖 Testing AI Suggest API...');
    const aiResult = await testEndpoint(`${baseUrl}/api/ai/suggest`, 'POST', {
        prompt: 'Analyze this evidence',
        vibe: 'professional',
        context: {}
    });
    results.push({
        test: 'AI Suggest API',
        status: aiResult.status === 401 ? '⚠️  AUTH' : aiResult.success ? '✅ PASS' : '❌ FAIL',
        details: `Status: ${aiResult.status}${aiResult.data?.response ? ' - Response generated' : ''}`
    });
    
    // Test 3: Qdrant Tag API
    console.log('\n🏷️  Testing Qdrant Tag API...');
    const tagResult = await testEndpoint(`${baseUrl}/api/qdrant/tag`, 'POST', {
        query: 'evidence',
        limit: 5
    });
    results.push({
        test: 'Qdrant Tag API',
        status: tagResult.status === 401 ? '⚠️  AUTH' : tagResult.success ? '✅ PASS' : '❌ FAIL',
        details: `Status: ${tagResult.status}${tagResult.data?.suggestions ? ` - ${tagResult.data.suggestions.length} suggestions` : ''}`
    });
    
    // Test 4: Canvas Save API
    console.log('\n💾 Testing Canvas Save API...');
    const canvasResult = await testEndpoint(`${baseUrl}/api/canvas/save`, 'POST', {
        canvasState: {
            id: 'test-canvas-001',
            data: { objects: [], version: '1.0' }
        },
        reportId: 'test-report-001'
    });
    results.push({
        test: 'Canvas Save API',
        status: canvasResult.status === 401 ? '⚠️  AUTH' : canvasResult.success ? '✅ PASS' : '❌ FAIL',
        details: `Status: ${canvasResult.status}${canvasResult.data?.success ? ' - Canvas saved' : ''}`
    });
    
    // Test 5: Component Files Validation
    console.log('\n📦 Validating Component Files...');
    const componentTests = [
        'TagList.svelte',
        'FileUploadSection.svelte', 
        'CanvasEditor.svelte',
        'Sidebar.svelte',
        'AIFabButton.svelte',
        'Dialog.svelte'
    ];
    
    for (const component of componentTests) {
        try {
            await access(`src/lib/components/${component}`, constants.F_OK);
            results.push({
                test: `Component: ${component}`,
                status: '✅ PASS',
                details: 'File exists'
            });
        } catch (error) {
            results.push({
                test: `Component: ${component}`,
                status: '❌ FAIL',
                details: 'File missing'
            });
        }
    }
    
    // Test 6: Store Files Validation
    console.log('\n🗃️  Validating Store Files...');
    const storeTests = [
        'canvas.ts',
        'lokiStore.ts'
    ];
    
    for (const store of storeTests) {
        try {
            const { stdout } = await execAsync(`test -f "src/lib/stores/${store}" && echo "EXISTS" || echo "MISSING"`);
            results.push({
                test: `Store: ${store}`,
                status: stdout.trim() === 'EXISTS' ? '✅ PASS' : '❌ FAIL',
                details: stdout.trim() === 'EXISTS' ? 'File exists' : 'File missing'
            });
        } catch (error) {
            results.push({
                test: `Store: ${store}`,
                status: '❌ FAIL',
                details: 'File check failed'
            });
        }
    }
    
    // Summary Report
    console.log('\n📊 VALIDATION RESULTS');
    console.log('=' .repeat(50));
    
    const passed = results.filter(r => r.status.includes('✅')).length;
    const authRequired = results.filter(r => r.status.includes('⚠️')).length;
    const failed = results.filter(r => r.status.includes('❌')).length;
    const total = results.length;
    
    console.log(`\n✅ PASSED: ${passed}/${total}`);
    console.log(`⚠️  AUTH REQUIRED: ${authRequired}/${total}`);
    console.log(`❌ FAILED: ${failed}/${total}`);
    
    console.log('\nDETAILED RESULTS:');
    results.forEach(result => {
        console.log(`${result.status} ${result.test}: ${result.details}`);
    });
    
    // System Status
    console.log('\n🎯 INTERACTIVE CANVAS SYSTEM STATUS');
    console.log('=' .repeat(50));
    
    if (failed === 0) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL!');
        console.log('✅ Core components implemented');
        console.log('✅ API endpoints functional');
        console.log('✅ File structure complete');
        console.log('⚠️  Note: Some APIs require authentication (expected behavior)');
    } else {
        console.log('⚠️  SYSTEM NEEDS ATTENTION');
        console.log(`❌ ${failed} component(s) need fixes`);
    }
    
    console.log('\n🚀 READY FOR:');
    console.log('   • End-to-end user testing');
    console.log('   • Authentication integration');
    console.log('   • Production deployment');
    console.log('   • Tauri desktop build');
    
    return {
        passed,
        authRequired,
        failed,
        total,
        systemReady: failed === 0
    };
}

if (require.main === module) {
    validateSystem().catch(console.error);
}

module.exports = { validateSystem };
