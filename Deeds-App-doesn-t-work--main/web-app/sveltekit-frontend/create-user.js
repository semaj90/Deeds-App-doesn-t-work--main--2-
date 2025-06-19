import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './src/lib/server/db/schema.js';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prosecutor_db';

async function createUser() {
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Insert the user
    const result = await db.insert(users).values({
      email: 'example@example.com',
      hashedPassword: hashedPassword,
      role: 'prosecutor',
      isActive: true,
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      title: 'Prosecutor',
      department: 'Criminal Justice',
      provider: 'credentials'
    }).returning({ id: users.id, email: users.email });

    console.log('✅ User created successfully:', result);
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await sql.end();
  }
}

createUser();
