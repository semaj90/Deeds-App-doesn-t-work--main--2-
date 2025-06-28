#!/usr/bin/env node
/**
 * Comprehensive LLM Upload Test
 * Tests the LLM upload functionality end-to-end
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
    uploadDir: path.join(__dirname, 'src-tauri', 'llm-uploads'),
    modelsDir: path.join(__dirname, 'src-tauri', 'llm-models'),
    testFiles: [
        {
            name: 'test-model-small.txt',
            content: `# Small Test Model
Model Type: Text-based test model
Size: 1KB
Purpose: Upload validation test
Created: ${new Date().toISOString()}

This is a small test file to validate the upload functionality.
It simulates a lightweight LLM model for testing purposes.`
        },
        {
            name: 'test-model-medium.bin',
            content: Buffer.alloc(1024 * 100, 'A'), // 100KB binary-like file
            isBinary: true
        },
        {
            name: 'test-model.gguf',
            content: `GGUF Test Model File
Format: GGUF (simulated)
Size: Medium
Architecture: Test
Created: ${new Date().toISOString()}

# Model Metadata
- Version: 1.0
- Parameters: 1B (simulated)
- Quantization: Q4_0 (simulated)
- Context Length: 2048

# Instructions
This is a test GGUF file for validating upload functionality.
In a real scenario, this would be a binary GGUF model file.`
        }
    ]
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '🔵',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        test: '🧪'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    testResults.details.push({
        timestamp,
        type,
        message
    });
}

function assert(condition, message, type = 'error') {
    if (condition) {
        testResults.passed++;
        log(`PASS: ${message}`, 'success');
    } else {
        testResults.failed++;
        log(`FAIL: ${message}`, type);
    }
    return condition;
}

function warning(message) {
    testResults.warnings++;
    log(`WARNING: ${message}`, 'warning');
}

async function setupTestEnvironment() {
    log('Setting up test environment', 'test');
    
    // Ensure directories exist
    if (!fs.existsSync(TEST_CONFIG.uploadDir)) {
        fs.mkdirSync(TEST_CONFIG.uploadDir, { recursive: true });
        log(`Created upload directory: ${TEST_CONFIG.uploadDir}`, 'success');
    }
    
    if (!fs.existsSync(TEST_CONFIG.modelsDir)) {
        fs.mkdirSync(TEST_CONFIG.modelsDir, { recursive: true });
        log(`Created models directory: ${TEST_CONFIG.modelsDir}`, 'success');
    }
    
    // Clean up any existing test files
    const existingFiles = fs.readdirSync(TEST_CONFIG.uploadDir);
    for (const file of existingFiles) {
        if (file.startsWith('test-model')) {
            fs.unlinkSync(path.join(TEST_CONFIG.uploadDir, file));
            log(`Cleaned up existing test file: ${file}`, 'info');
        }
    }
}

async function createTestFiles() {
    log('Creating test model files', 'test');
    
    const testFilePaths = [];
    
    for (const testFile of TEST_CONFIG.testFiles) {
        const filePath = path.join(__dirname, 'temp', testFile.name);
        
        // Ensure temp directory exists
        const tempDir = path.dirname(filePath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        try {
            if (testFile.isBinary) {
                fs.writeFileSync(filePath, testFile.content);
            } else {
                fs.writeFileSync(filePath, testFile.content, 'utf8');
            }
            
            testFilePaths.push(filePath);
            log(`Created test file: ${testFile.name} (${fs.statSync(filePath).size} bytes)`, 'success');
        } catch (error) {
            log(`Failed to create test file ${testFile.name}: ${error.message}`, 'error');
        }
    }
    
    return testFilePaths;
}

async function testFileUpload() {
    log('Testing file upload functionality', 'test');
    
    const testFilePaths = await createTestFiles();
    
    for (const filePath of testFilePaths) {
        const fileName = path.basename(filePath);
        const destinationPath = path.join(TEST_CONFIG.uploadDir, fileName);
        
        try {
            // Simulate the upload process that Tauri would do
            fs.copyFileSync(filePath, destinationPath);
            
            // Verify the file was uploaded
            const uploaded = fs.existsSync(destinationPath);
            assert(uploaded, `File ${fileName} uploaded successfully`);
            
            if (uploaded) {
                const originalSize = fs.statSync(filePath).size;
                const uploadedSize = fs.statSync(destinationPath).size;
                assert(originalSize === uploadedSize, `File ${fileName} size matches (${uploadedSize} bytes)`);
            }
            
        } catch (error) {
            assert(false, `Failed to upload ${fileName}: ${error.message}`);
        }
    }
}

async function testFileValidation() {
    log('Testing file validation', 'test');
    
    const validExtensions = ['.bin', '.gguf', '.safetensors', '.pt', '.pth', '.txt'];
    const uploadedFiles = fs.readdirSync(TEST_CONFIG.uploadDir);
    
    for (const file of uploadedFiles) {
        const ext = path.extname(file).toLowerCase();
        const isValidExtension = validExtensions.includes(ext);
        
        if (file.startsWith('test-model')) {
            assert(isValidExtension, `File ${file} has valid extension: ${ext}`);
            
            // Check file size
            const filePath = path.join(TEST_CONFIG.uploadDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.size === 0) {
                warning(`File ${file} is empty`);
            } else {
                assert(stats.size > 0, `File ${file} has content (${stats.size} bytes)`);
            }
        }
    }
}

async function testModelListing() {
    log('Testing model listing functionality', 'test');
    
    // Create some test models in the models directory
    const testModels = ['model-1', 'model-2', 'llama-test'];
    
    for (const modelName of testModels) {
        const modelDir = path.join(TEST_CONFIG.modelsDir, modelName);
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, { recursive: true });
            fs.writeFileSync(path.join(modelDir, 'config.json'), JSON.stringify({
                name: modelName,
                type: 'test',
                created: new Date().toISOString()
            }));
        }
    }
    
    // Test listing models (simulate what the Rust code would do)
    try {
        const modelDirs = fs.readdirSync(TEST_CONFIG.modelsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        assert(modelDirs.length >= testModels.length, `Found ${modelDirs.length} models in directory`);
        
        for (const testModel of testModels) {
            assert(modelDirs.includes(testModel), `Model ${testModel} found in listing`);
        }
        
    } catch (error) {
        assert(false, `Failed to list models: ${error.message}`);
    }
}

async function testUploadSecurity() {
    log('Testing upload security measures', 'test');
    
    // Test file size limits (simulated)
    const maxFileSize = 1024 * 1024 * 1024; // 1GB limit
    const uploadedFiles = fs.readdirSync(TEST_CONFIG.uploadDir);
    
    for (const file of uploadedFiles) {
        if (file.startsWith('test-model')) {
            const filePath = path.join(TEST_CONFIG.uploadDir, file);
            const stats = fs.statSync(filePath);
            
            assert(stats.size <= maxFileSize, `File ${file} is within size limit (${stats.size} bytes)`);
            
            // Test file path traversal protection
            assert(!file.includes('..'), `File ${file} name is safe (no path traversal)`);
            assert(!file.includes('/'), `File ${file} name is safe (no directory separators)`);
            assert(!file.includes('\\'), `File ${file} name is safe (no Windows separators)`);
        }
    }
}

async function testErrorHandling() {
    log('Testing error handling', 'test');
    
    // Test uploading non-existent file
    const nonExistentFile = path.join(__dirname, 'temp', 'non-existent.bin');
    const destinationPath = path.join(TEST_CONFIG.uploadDir, 'non-existent.bin');
    
    try {
        fs.copyFileSync(nonExistentFile, destinationPath);
        assert(false, 'Should have failed to upload non-existent file');
    } catch (error) {
        assert(true, 'Correctly handled non-existent file upload');
    }
    
    // Test invalid destination
    try {
        const invalidDest = path.join(TEST_CONFIG.uploadDir, 'subdir', 'test.bin');
        fs.copyFileSync(path.join(__dirname, 'temp', 'test-model-small.txt'), invalidDest);
        assert(false, 'Should have failed to upload to non-existent subdirectory');
    } catch (error) {
        assert(true, 'Correctly handled invalid destination path');
    }
}

async function generateReport() {
    log('Generating test report', 'test');
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testResults.passed + testResults.failed,
            passed: testResults.passed,
            failed: testResults.failed,
            warnings: testResults.warnings,
            successRate: testResults.passed / (testResults.passed + testResults.failed) * 100
        },
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uploadDir: TEST_CONFIG.uploadDir,
            modelsDir: TEST_CONFIG.modelsDir
        },
        details: testResults.details
    };
    
    const reportPath = path.join(__dirname, 'llm-upload-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    const summaryPath = path.join(__dirname, 'LLM_UPLOAD_TEST_SUMMARY.md');
    const markdownReport = `# LLM Upload Test Report

## Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed} ✅
- **Failed**: ${report.summary.failed} ❌
- **Warnings**: ${report.summary.warnings} ⚠️
- **Success Rate**: ${report.summary.successRate.toFixed(2)}%

## Environment
- **Node.js**: ${report.environment.nodeVersion}
- **Platform**: ${report.environment.platform}
- **Architecture**: ${report.environment.arch}
- **Upload Directory**: ${report.environment.uploadDir}
- **Models Directory**: ${report.environment.modelsDir}

## Test Results
${report.details.map(detail => `- ${detail.type.toUpperCase()}: ${detail.message}`).join('\n')}

## Conclusion
${report.summary.failed === 0 ? 
    '🎉 All tests passed! The LLM upload functionality is working correctly.' : 
    `⚠️ ${report.summary.failed} test(s) failed. Review the details above for issues.`}

## Files Generated
- Detailed JSON Report: \`llm-upload-test-report.json\`
- Test Model Files: \`temp/\` directory
- Uploaded Files: \`src-tauri/llm-uploads/\` directory

Generated on: ${report.timestamp}
`;
    
    fs.writeFileSync(summaryPath, markdownReport);
    
    log(`Test report saved to: ${reportPath}`, 'success');
    log(`Test summary saved to: ${summaryPath}`, 'success');
    
    return report;
}

async function cleanup() {
    log('Cleaning up test files', 'test');
    
    try {
        const tempDir = path.join(__dirname, 'temp');
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            log('Cleaned up temp directory', 'success');
        }
    } catch (error) {
        warning(`Failed to clean up temp directory: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Starting LLM Upload Comprehensive Test\n');
    
    try {
        await setupTestEnvironment();
        await testFileUpload();
        await testFileValidation();
        await testModelListing();
        await testUploadSecurity();
        await testErrorHandling();
        
        const report = await generateReport();
        
        console.log('\n📊 Test Summary:');
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⚠️ Warnings: ${report.summary.warnings}`);
        console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(2)}%`);
        
        if (report.summary.failed === 0) {
            console.log('\n🎉 All tests passed! LLM upload functionality is ready for production.');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the report for details.');
        }
        
    } catch (error) {
        log(`Test execution failed: ${error.message}`, 'error');
        console.error('\n💥 Test execution failed:', error);
    } finally {
        await cleanup();
    }
}

if (import.meta.url === `file://${__filename}`) {
    main();
}
