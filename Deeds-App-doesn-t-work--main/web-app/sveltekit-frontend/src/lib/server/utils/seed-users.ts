import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword } from '../authUtils'; // Updated import
import { eq } from 'drizzle-orm'; // Import eq
import crypto from 'crypto'; // Node.js crypto import for randomUUID

export async function seedDefaultUsers() {
    const existing = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
    if (existing.length > 0) return { message: 'Already seeded' };

    await db.insert(users).values([
        {
            id: crypto.randomUUID(),
            name: 'Administrator',
            email: 'admin@example.com',
            hashedPassword: await hashPassword('admin123'),
            bio: 'System Administrator',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: crypto.randomUUID(),
            name: 'Test User',
            email: 'user@example.com',
            hashedPassword: await hashPassword('user123'),
            bio: 'Test User Account',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
}

// Allow running as a script
const isMain = (() => {
  const scriptPath = process.argv[1]?.replace(/\\/g, '/');
  return import.meta.url === `file://${scriptPath}` || import.meta.url === `file:///${scriptPath}`;
})();

if (isMain) {
    seedDefaultUsers().then((result) => {
        console.log(result?.message || 'Users seeded successfully!');
        process.exit(0);
    }).catch((err) => {
        console.error('Error seeding users:', err);
        process.exit(1);
    });
}