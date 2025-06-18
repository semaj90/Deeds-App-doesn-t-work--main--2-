import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'; // Import PageServerLoad

export const load: PageServerLoad = async ({ locals }) => {    // Check if user is logged in and has admin role
    if (!locals.user || locals.user.role !== 'admin') {
        throw redirect(302, '/login'); // Redirect to login if not authorized
    }

    // Fetch all users from the database
    const allUsers = await db.select().from(users);
    return { users: allUsers };
};