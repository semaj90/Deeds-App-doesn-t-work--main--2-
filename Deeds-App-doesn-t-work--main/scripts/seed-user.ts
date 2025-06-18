import bcrypt from 'bcryptjs';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';

async function seedUser() {
  const email = 'admin@example.com';
  const password = 'yourpassword'; // Change this!
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    name: 'Admin',
    hashedPassword,
    role: 'admin'
  });

  console.log('Seeded admin user:', email);
}

seedUser().catch(console.error);