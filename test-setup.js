const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing Deeds App Setup ===');
console.log('Current directory:', process.cwd());

// Change to the sveltekit-frontend directory
const frontendDir = path.join(__dirname, 'web-app', 'sveltekit-frontend');
console.log('Frontend directory:', frontendDir);

try {
  // Check if package.json exists
  const fs = require('fs');
  const packagePath = path.join(frontendDir, 'package.json');
  
  if (fs.existsSync(packagePath)) {
    console.log('✅ package.json found');
    
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('✅ Package name:', packageJson.name);
    console.log('✅ Available scripts:', Object.keys(packageJson.scripts));
    
  } else {
    console.log('❌ package.json not found');
  }
  
  // Check if .env exists
  const envPath = path.join(frontendDir, '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
  } else {
    console.log('❌ .env file not found');
  }
  
  // Check if src directory exists
  const srcPath = path.join(frontendDir, 'src');
  if (fs.existsSync(srcPath)) {
    console.log('✅ src directory found');
    
    // Check routes
    const routesPath = path.join(srcPath, 'routes');
    if (fs.existsSync(routesPath)) {
      const routes = fs.readdirSync(routesPath);
      console.log('✅ Routes found:', routes);
    }
  } else {
    console.log('❌ src directory not found');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n=== Setup Complete ===');
console.log('Next steps:');
console.log('1. cd web-app/sveltekit-frontend');
console.log('2. npm install');
console.log('3. npm run dev');
