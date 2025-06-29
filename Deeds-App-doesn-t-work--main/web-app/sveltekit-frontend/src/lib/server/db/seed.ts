// src/lib/server/db/seed.ts
import 'dotenv/config';
import { db } from './seed-db'; // Use standalone db connection for seeding
import { users } from './schema';
// The import path now includes the .ts extension, which is required
// when running the script directly with a tool like tsx.
import { hashPassword } from '../authUtils.ts';
import { eq } from 'drizzle-orm';

/**
 * Seeds the database with a default admin and user.
 * Checks if the admin user already exists to prevent duplicates.
 */
async function seedDefaultUsers() {
	console.log('Starting to seed database...');

	const adminEmail = 'admin@example.com';
	const userEmail = 'user@example.com';

	// Check if the admin user already exists
	const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

	if (existingAdmin.length > 0) {
		console.log('Database has already been seeded. Exiting.');
		return { message: 'Database has already been seeded.' };
	}

	console.log('Seeding default users...');

	// Hash passwords for the new users
	const adminPassword = await hashPassword('admin123');
	const userPassword = await hashPassword('user123');

	// Insert the default users into the database
	await db.insert(users).values([
		{
			email: adminEmail,
			hashedPassword: adminPassword,
			name: 'Admin User',
			id: 'user_admin01'
		},
		{
			email: userEmail,
			hashedPassword: userPassword,
			name: 'Regular User',
			id: 'user_regular01'
		}
	]);

	console.log('✅ Seeding complete!');
	return { message: 'Seeded default users successfully!' };
}

// Execute the function
seedDefaultUsers()
	.catch((e) => {
		console.error('Error during seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		// You might not need to end the connection if the script exits,
		// but it's good practice in some environments.
		console.log('Seed script finished.');
	});
