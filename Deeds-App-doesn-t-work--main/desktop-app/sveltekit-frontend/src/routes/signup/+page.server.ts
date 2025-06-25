import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/authUtils';
import { eq } from 'drizzle-orm';
import { DrizzleError } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		throw redirect(302, "/");
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'Name, email and password are required.' });
		}

		const hashedPassword = await hashPassword(password);

		try {
			await db.insert(users).values({
				name,
				email,
				username: email.split('@')[0], // Generate username from email
				password: hashedPassword, // Use password field
				role: 'user'
			});
		} catch (e) {
			if (e instanceof DrizzleError && e.message.includes('UNIQUE constraint failed')) {
				return fail(409, { error: 'A user with this email already exists.' });
			}
			console.error(e);
			return fail(500, { error: 'An unexpected error occurred.' });
		}

		throw redirect(303, '/login');
	}
};