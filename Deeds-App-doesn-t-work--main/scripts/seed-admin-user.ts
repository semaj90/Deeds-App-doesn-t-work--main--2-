import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedAdminUser() {
  const email = 'admin@example.com';
  const password = 'password123'; // You can change this to your desired password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      id: uuidv4(),
      email,
      name: 'Admin User',
      hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
    });
    console.log(`Successfully seeded admin user: ${email}`);
  } catch (error) {
    console.error(`Error seeding admin user: ${email}`, error);
  } finally {
    // It's good practice to close the database connection in a standalone script
    // if your 'db' object has a way to close the pool.
    // For drizzle with node-postgres, the pool is managed by the 'pg' library.
    // If 'db' is just the drizzle instance, you might not need to explicitly close it here
    // unless you have direct access to the underlying pool.
  }
}

seedAdminUser().catch((e) => {
  console.error('Failed to seed admin user:', e);
  process.exit(1);
});