import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types'; // Correct type
import type { Crime, Criminal, Statute } from '$lib/data/types';
import { db } from '$lib/server/db';
import { crimes, criminals, statutes } from '$lib/server/db/schema';
import { sql, eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
    const user = event.locals.user;
    const session = event.locals.session;

    if (!session || !user) {
        throw redirect(302, '/login');
    }

    const page = parseInt(event.url.searchParams.get('page') || '1');
    const limit = parseInt(event.url.searchParams.get('limit') || '10');
    const searchTerm = event.url.searchParams.get('search') || '';    const offset = (page - 1) * limit;

    let query = db
    .select({
        crime: crimes,
        criminal: criminals,
        statute: statutes
    })
    .from(crimes)
    .innerJoin(criminals, eq(crimes.criminalId, criminals.id))
    .innerJoin(statutes, eq(crimes.statuteId, statutes.id))
    .$dynamic();

    let countQuery = db
    .select({ count: sql`count(*)` })
    .from(crimes)
    .innerJoin(criminals, eq(crimes.criminalId, criminals.id))
    .innerJoin(statutes, eq(crimes.statuteId, statutes.id))
    .$dynamic();    if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.where(
            sql`${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern} OR ${statutes.code} ILIKE ${searchPattern} OR ${statutes.title} ILIKE ${searchPattern}`
        );
        countQuery = countQuery.where(
            sql`${crimes.name} ILIKE ${searchPattern} OR ${crimes.description} ILIKE ${searchPattern} OR ${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern} OR ${statutes.title} ILIKE ${searchPattern} OR ${statutes.code} ILIKE ${searchPattern}`
        );
    }

    const fetchedCrimes = await query.limit(limit).offset(offset);
    const totalCrimesResult = await countQuery;
    const totalCrimes = totalCrimesResult[0].count;

    // Flatten the structure for easier consumption in Svelte component
    const crimesWithDetails = fetchedCrimes.map(row => ({
        ...row.crime,
        criminal: row.criminal,
        statute: row.statute
    }));    return {
        userId: user.id,
        username: user.name,
        crimes: crimesWithDetails,
        currentPage: page,
        limit: limit,
        totalCrimes: totalCrimes,
        searchTerm: searchTerm
    };
};