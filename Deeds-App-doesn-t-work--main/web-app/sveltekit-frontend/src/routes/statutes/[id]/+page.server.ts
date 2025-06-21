import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema-new'; // Use unified schema
import { eq } from 'drizzle-orm'; // Ensure eq is imported
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
    const statuteId = params.id;

    if (!statuteId) {
        throw error(400, 'Invalid statute ID');
    }

    const statuteArr = await db.select().from(statutes).where(eq(statutes.id, statuteId));
    const statute = statuteArr[0];

    if (!statute) {
        throw error(404, 'Statute not found');
    }

    return { statute };
};