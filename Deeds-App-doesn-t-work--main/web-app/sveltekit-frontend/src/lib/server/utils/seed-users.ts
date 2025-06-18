import { db } from '../db';
import { userTable } from '../db/schema';
import { hashPassword } from '../authUtils'; // Updated import
import { eq } from 'drizzle-orm'; // Import eq

export async function seedDefaultUsers() {
    const existing = await db.select().from(userTable).where(eq(userTable.email, 'admin@example.com')); // Use eq function
    if (existing.length > 0) return { message: 'Already seeded' };

    await db.insert(userTable).values([
        {
            id: crypto.randomUUID(),
            username: 'admin',
            email: 'admin@example.com',
            hashedPassword: await hashPassword('admin123'),
            role: 'admin'
        },
        {
            id: crypto.randomUUID(),
            username: 'user',
            email: 'user@example.com',
            hashedPassword: await hashPassword('user123'),
            role: 'user'
        }
    ]);
    return { message: 'Seeded successfully' };
}