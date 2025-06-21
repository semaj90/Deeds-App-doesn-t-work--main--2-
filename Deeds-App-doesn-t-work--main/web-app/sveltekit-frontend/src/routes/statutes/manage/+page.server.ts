import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema-new'; // Use unified schema
import { sql, count, ilike, or, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
    const user = locals.user;
    const session = locals.session;
    if (!user || !session) {
        throw redirect(302, '/login');
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const whereConditions = [];
    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        whereConditions.push(
            or(
                ilike(statutes.title, searchPattern),
                ilike(statutes.description, searchPattern),
                ilike(statutes.code, searchPattern)
            )
        );
    }

    const query = db.query.statutes.findMany({
        where: and(...whereConditions),
        limit: limit,
        offset: offset,
    });

    const countQuery = db.select({ count: count() }).from(statutes).where(and(...whereConditions));

    const [fetchedStatutes, totalStatutesResult] = await Promise.all([query, countQuery]);
    
    const totalStatutes = totalStatutesResult[0].count;

    return {
        userId: user.id,
        username: user.username,
        statutes: fetchedStatutes,
        currentPage: page,
        limit: limit,
        totalStatutes: totalStatutes,
        searchTerm: searchTerm
    };
};