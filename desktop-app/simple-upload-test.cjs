const fs = require('fs');
const path = require('path');

console.log('🚀 Starting LLM Upload Test...');

// Test directories
const uploadDir = path.join(__dirname, 'src-tauri', 'llm-uploads');
const modelsDir = path.join(__dirname, 'src-tauri', 'llm-models');

console.log(`Upload directory: ${uploadDir}`);
console.log(`Models directory: ${modelsDir}`);

// Check if directories exist
console.log(`\n📁 Checking directories:`);
console.log(`Upload dir exists: ${fs.existsSync(uploadDir)}`);
console.log(`Models dir exists: ${fs.existsSync(modelsDir)}`);

// Create test files
console.log(`\n🛠️ Creating test files:`);

const testFiles = [
    {
        name: 'test-model-1.txt',
        content: 'This is a test model file for upload testing.\nCreated: ' + new Date().toISOString()
    },
    {
        name: 'test-model-2.gguf',
        content: 'GGUF test model content\nSize: small\nPurpose: validation'
    }
];

// Create temp directory for test files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`✅ Created temp directory: ${tempDir}`);
}

// Generate test files
testFiles.forEach(testFile => {
    const filePath = path.join(tempDir, testFile.name);
    fs.writeFileSync(filePath, testFile.content);
    console.log(`✅ Created test file: ${testFile.name} (${fs.statSync(filePath).size} bytes)`);
});

// Simulate upload process
console.log(`\n📤 Simulating upload process:`);

testFiles.forEach(testFile => {
    const sourcePath = path.join(tempDir, testFile.name);
    const destPath = path.join(uploadDir, testFile.name);
    
    try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Uploaded: ${testFile.name}`);
        
        // Verify upload
        const sourceSize = fs.statSync(sourcePath).size;
        const destSize = fs.statSync(destPath).size;
        console.log(`   Size verification: ${sourceSize === destSize ? 'PASS' : 'FAIL'} (${destSize} bytes)`);
        
    } catch (error) {
        console.log(`❌ Failed to upload: ${testFile.name} - ${error.message}`);
    }
});

// List uploaded files
console.log(`\n📋 Uploaded files:`);
try {
    const uploadedFiles = fs.readdirSync(uploadDir);
    if (uploadedFiles.length === 0) {
        console.log('   No files found');
    } else {
        uploadedFiles.forEach(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   📄 ${file} (${stats.size} bytes, modified: ${stats.mtime.toISOString()})`);
        });
    }
} catch (error) {
    console.log(`❌ Error listing files: ${error.message}`);
}

// Test model listing (simulate what Rust code would do)
console.log(`\n🤖 Testing model listing:`);
try {
    const modelDirs = fs.readdirSync(modelsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    console.log(`   Found ${modelDirs.length} model directories:`);
    modelDirs.forEach(dir => {
        console.log(`   📁 ${dir}`);
    });
    
    if (modelDirs.length === 0) {
        console.log('   Creating test model directories...');
        const testModels = ['llama-test', 'gemma-test'];
        testModels.forEach(modelName => {
            const modelDir = path.join(modelsDir, modelName);
            fs.mkdirSync(modelDir, { recursive: true });
            fs.writeFileSync(path.join(modelDir, 'config.json'), JSON.stringify({
                name: modelName,
                type: 'test',
                created: new Date().toISOString()
            }));
            console.log(`   ✅ Created test model: ${modelName}`);
        });
    }
} catch (error) {
    console.log(`❌ Error with model listing: ${error.message}`);
}

// Test file security validation
console.log(`\n🔒 Testing file security:`);
testFiles.forEach(testFile => {
    const fileName = testFile.name;
    const validExtensions = ['.txt', '.gguf', '.bin', '.safetensors', '.pt', '.pth'];
    const ext = path.extname(fileName).toLowerCase();
    const isValid = validExtensions.includes(ext);
    
    console.log(`   ${fileName}: Extension ${ext} is ${isValid ? 'VALID' : 'INVALID'}`);
    
    // Check for path traversal
    const hasPathTraversal = fileName.includes('..') || fileName.includes('/') || fileName.includes('\\');
    console.log(`   ${fileName}: Path traversal check ${hasPathTraversal ? 'FAILED' : 'PASSED'}`);
});

// Cleanup temp directory
console.log(`\n🧹 Cleaning up:`);
try {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`✅ Cleaned up temp directory`);
} catch (error) {
    console.log(`⚠️ Warning: Could not clean up temp directory: ${error.message}`);
}

console.log(`\n🎉 Test completed! Check the upload directory: ${uploadDir}`);
