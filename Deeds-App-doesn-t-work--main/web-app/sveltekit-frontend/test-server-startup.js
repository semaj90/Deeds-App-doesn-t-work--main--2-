#!/usr/bin/env node
// Simple test to verify the app can start without SSR errors
import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🧪 Testing server startup (SSR validation)...');

const server = spawn(npmCmd, ['run', 'dev'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let serverOutput = '';
let hasError = false;
let serverStarted = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('📺 Server:', output.trim());
  
  // Check for successful server start
  if (output.includes('Local:') || output.includes('localhost') || output.includes('ready')) {
    serverStarted = true;
    console.log('✅ Server started successfully!');
    setTimeout(() => {
      console.log('🛑 Stopping server after successful start...');
      server.kill('SIGTERM');
    }, 2000);
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('⚠️ Server Error:', output.trim());
  
  // Check for SSR errors
  if (output.includes('document is not defined') || output.includes('Bootstrap') || output.includes('ReferenceError')) {
    hasError = true;
    console.log('❌ SSR error detected!');
  }
});

server.on('close', (code) => {
  console.log(`\n📊 Server Test Results:`);
  console.log(`Exit code: ${code}`);
  console.log(`Server started: ${serverStarted}`);
  console.log(`SSR errors: ${hasError}`);
  
  if (serverStarted && !hasError) {
    console.log('🎉 SUCCESS: Server starts without SSR errors!');
    process.exit(0);
  } else if (hasError) {
    console.log('❌ FAILURE: SSR errors detected');
    process.exit(1);
  } else {
    console.log('⚠️ UNCLEAR: Server may not have started properly');
    process.exit(1);
  }
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - killing server');
  server.kill('SIGKILL');
}, 30000);
