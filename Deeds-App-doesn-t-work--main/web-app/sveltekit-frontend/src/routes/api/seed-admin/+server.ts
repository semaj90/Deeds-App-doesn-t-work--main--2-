import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
  try {
    const email = 'admin@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser) {
      return json({ 
        success: true, 
        message: 'Admin user already exists',
        user: { email: existingUser.email, name: existingUser.name }
      });
    }

    // Create admin user
    const [newUser] = await db.insert(users).values({
      id: uuidv4(),
      email,
      name: 'Admin User',
      hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: { email: newUser.email, name: newUser.name },
      credentials: { email, password }
    });
  } catch (error) {
    console.error('Error seeding admin user:', error);
    return json({ 
      success: false, 
      message: 'Error creating admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
