import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
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
        .select()
        .from(criminals)
        .where(eq(criminals.createdBy, user.id))
        .limit(limit)
        .offset((page - 1) * limit);

    // SQLite-compatible count query (returns string, so parseInt)
    const countResult = await db.select({ count: sql`count(*)` }).from(criminals).where(eq(criminals.createdBy, user.id));
    const totalCriminals = countResult[0]?.count ? parseInt(countResult[0].count as string) : 0;

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
        const form = await request.formData();
        const firstName = form.get('firstName')?.toString();
        const lastName = form.get('lastName')?.toString();
        if (!firstName || !lastName) return fail(400, { error: 'First and last name required' });
        await db.insert(criminals).values({ firstName, lastName, createdBy: user.id });
        return { success: true };
    },
    delete: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Not authenticated' });
        const id = (await request.formData()).get('id');
        if (!id || typeof id !== 'string') return fail(400, { error: 'ID required' });
        await db.delete(criminals).where(eq(criminals.id, id));
        return { success: true };
    }
};