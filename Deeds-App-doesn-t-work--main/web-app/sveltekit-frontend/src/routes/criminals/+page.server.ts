import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema-new'; // Use unified schema
import { eq, sql, count } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import type { Criminal } from '$lib/data/types';

export const load: ServerLoad = async ({ locals, fetch, url }) => {
    const user = locals.user;
    if (!user) throw redirect(302, '/login');

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    const list = await db
        .query.criminals.findMany({ // Use findMany
            // where: eq(criminals.createdBy, user.id), // Assuming criminals are created by user
            // For now, fetch all criminals, as createdBy might not be set for all
        })
        .where(eq(criminals.createdBy, user.id))
        .limit(limit)
        .offset((page - 1) * limit);

    const totalCriminals = (await db.select({ count: count() }).from(criminals).where(eq(criminals.createdBy, user.id)))[0].count;

    return {
        userId: user.id,
        username: user.name,
        criminals: list,
        currentPage: page,
        limit: limit,
        totalCriminals: totalCriminals,
        searchTerm: searchTerm
    };
};

export const actions = {
    create: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Not authenticated' });
        const { firstName, lastName } = Object.fromEntries(await request.formData()) as { firstName: string, lastName: string };
        if (!firstName || !lastName) return fail(400, { message: 'First and last name required' });
        await db.insert(criminals).values({ firstName, lastName, createdBy: user.id }); // ID is auto-generated UUID
        return { success: true };
    },
    delete: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Not authenticated' });
        const { id } = Object.fromEntries(await request.formData()) as { id: string };
        if (!id) return fail(400, { message: 'ID required' });
        await db.delete(criminals).where(eq(criminals.id, id)); // Ensure ID is UUID
        return { success: true };
    }
};