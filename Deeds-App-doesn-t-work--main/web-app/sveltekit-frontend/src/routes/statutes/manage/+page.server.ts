import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema-new'; // Use unified schema
import { sql, count, ilike } from 'drizzle-orm';

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

    let query = db.query.statutes.findMany().$dynamic(); // Use findMany
    let countQuery = db.select({ count: count() }).from(statutes).$dynamic(); // Use count()

    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(
            ilike(statutes.title, searchPattern) || ilike(statutes.description, searchPattern) || ilike(statutes.code, searchPattern) // Use ilike for search
        );
        countQuery = countQuery.where(
            ilike(statutes.title, searchPattern) || ilike(statutes.description, searchPattern) || ilike(statutes.code, searchPattern)
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