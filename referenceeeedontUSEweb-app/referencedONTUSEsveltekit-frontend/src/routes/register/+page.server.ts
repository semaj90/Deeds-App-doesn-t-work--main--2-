import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { Actions } from './$types';

const SALT_ROUNDS = 10;

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const email = formData.get('email')?.toString();
		const password = formData.get('password')?.toString();

		if (!name || !email || !password) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.' });
		}

		try {
			const existingUserResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
			const existingUser = existingUserResults[0];

			if (existingUser) {
				return fail(400, { error: 'User with this email already exists.' });
			}

			const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

			// Split name into first and last name (simple split by space)
			const nameParts = name.trim().split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts.slice(1).join(' ') || '';

			await db.insert(users).values({
				id: uuidv4(), // Generate a unique ID
				firstName,
				lastName,
				name, // Also store the full name
				email,
				hashedPassword,
				role: 'prosecutor', // Default role
			});

		} catch (e) {
			console.error("Registration error:", e);
			return fail(500, { error: 'Could not register user. Please try again later.' });
		}

		throw redirect(303, '/login?registered=true');
	},
};
