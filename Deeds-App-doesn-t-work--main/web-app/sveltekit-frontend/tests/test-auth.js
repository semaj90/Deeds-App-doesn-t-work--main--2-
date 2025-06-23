import { comparePasswords } from '../src/lib/server/auth.js';

async function test() {
  try {
    console.log('Testing comparePasswords...');
    const result = await comparePasswords('test', '$2b$10$dummy');
    console.log('comparePasswords works:', result);
  } catch (error) {
    console.error('comparePasswords error:', error);
  }
}

test();
