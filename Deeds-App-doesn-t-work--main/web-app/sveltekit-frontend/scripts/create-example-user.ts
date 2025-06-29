import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema-new';
import { hashPassword } from '../src/lib/server/authUtils';
import { eq } from 'drizzle-orm';

async function createExampleUser() {
  console.log('Creating example@example.com user...');
  
  const email = 'example@example.com';
  const password = 'password123';
  
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).then(rows => rows[0]);

    if (existingUser) {
      console.log('User already exists:', email);
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    // Create the user
    const newUser = await db.insert(users).values({
      email,
      hashedPassword,
      role: 'prosecutor',
      name: 'Example User',
      firstName: 'Example',
      lastName: 'User',
      isActive: true,
      emailVerified: new Date()
    }).returning();

    console.log('✅ User created successfully:', {
      email,
      password,
      id: newUser[0].id
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

// Run the function
createExampleUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { createExampleUser };
