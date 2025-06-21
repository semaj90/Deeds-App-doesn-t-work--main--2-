#!/usr/bin/env node
import { spawn } from 'child_process';
import { platform } from 'os';

console.log('🚀 Starting development server...');

const isWindows = platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  detached: false
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

console.log('✅ Server started. Press Ctrl+C to stop.');
