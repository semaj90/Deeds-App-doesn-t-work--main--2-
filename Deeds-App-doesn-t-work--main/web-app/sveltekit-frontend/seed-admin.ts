import { db } from './src/lib/server/db';
import { users } from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedAdminUser() {
  const email = 'admin@example.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      console.log(`Admin user already exists: ${email}`);
      return;
    }

    await db.insert(users).values({
      id: uuidv4(),
      email,
      name: 'Admin User',
      hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`✅ Successfully seeded admin user: ${email}`);
    console.log(`🔑 Password: ${password}`);
  } catch (error) {
    console.error(`❌ Error seeding admin user: ${email}`, error);
  }
}

seedAdminUser().catch((e) => {
  console.error('Failed to seed admin user:', e);
  process.exit(1);
});
