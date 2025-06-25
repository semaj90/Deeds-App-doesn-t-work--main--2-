import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../authUtils'; // Updated import
import { eq } from 'drizzle-orm'; // Import eq

export async function seedDefaultUsers() {
    const existing = await db.select().from(users).where(eq(users.email, 'admin@example.com')); // Use eq function
    if (existing.length > 0) return { message: 'Already seeded' };

    await db.insert(users).values([
        {
            username: 'admin',
            email: 'admin@example.com',
            password: await hashPassword('admin123'),
            role: 'admin'
        },
        {
            username: 'user',
            email: 'user@example.com',
            password: await hashPassword('user123'),
            role: 'user'
        }
    ]);
    return { message: 'Seeded successfully' };
}