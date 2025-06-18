import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const load: ServerLoad = async ({ locals, fetch, url }) => {
    const user = locals.user;
    const session = locals.session;
    if (!user || !session) {
        throw redirect(302, '/login');
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    let query = db.select().from(statutes).$dynamic();
    let countQuery = db.select({ count: sql`count(*)` }).from(statutes).$dynamic();

    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(
            sql`${statutes.name} ILIKE ${searchPattern} OR ${statutes.description} ILIKE ${searchPattern} OR ${statutes.sectionNumber} ILIKE ${searchPattern}`
        );
        countQuery = countQuery.where(
            sql`${statutes.name} ILIKE ${searchPattern} OR ${statutes.description} ILIKE ${searchPattern} OR ${statutes.sectionNumber} ILIKE ${searchPattern}`
        );
    }

    const fetchedStatutes = await query.limit(limit).offset(offset);
    const totalStatutesResult = await countQuery;
    const totalStatutes = totalStatutesResult[0].count;

    return {
        userId: user.id, // Changed from user.userId to user.id
        username: user.username,
        statutes: fetchedStatutes,
        currentPage: page,
        limit: limit,
        totalStatutes: totalStatutes,
        searchTerm: searchTerm
    };
};