// Test to create a user exactly like the E2E test does vs seeded user
import { db } from './src/lib/server/db/index.js';
import { users } from './src/lib/server/db/schema.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function compareUserCreation() {
  console.log('=== Comparing E2E vs Seeded User Creation ===');
  
  // E2E style user creation (like registration API)
  const testEmail = 'e2e-test@example.com';
  const testPassword = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  try {
    const e2eUser = await db.insert(users).values({
      id: uuidv4(),
      email: testEmail,
      name: 'E2E Test User',
      hashedPassword,
      role: 'user',
      emailVerified: null, // E2E users don't get email verification
    }).returning();
    
    console.log('E2E style user created:', e2eUser[0]);
    
    // Test login with this user
    const loginTest = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Password verification works:', loginTest);
    
    // Cleanup
    await db.delete(users).where({ email: testEmail });
    console.log('Cleaned up test user');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

compareUserCreation();
