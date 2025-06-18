import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'testuser@example.com';
  const password = 'testpassword';
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = randomUUID();

  try {
    await db.insert(users).values({
      id,
      name: 'Test User',
      email,
      hashedPassword, // <-- use hashedPassword, not password_hash
      role: 'user',
    });
    console.log('Test user created:', { email, password });
  } catch (e) {
    console.error('Error seeding test user:', e);
  }
  process.exit(0);
}

main();
