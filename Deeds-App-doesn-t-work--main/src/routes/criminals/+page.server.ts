import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "@sveltejs/kit";
import type { Case, Criminal } from '$lib/data/types';
import { db } from '$lib/server/db';
import { criminals, cases } from '$lib/server/db/unified-schema';
import { eq, ilike, sql, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
    console.log('[criminals/+page.server.ts] Load function called');
    
    // Check authentication
    if (!locals.session?.user) {
        throw redirect(302, '/login');
    }
    
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';
    const offset = (page - 1) * limit;

    try {
        // Build dynamic query for criminals
        let criminalsQuery = db.select().from(criminals).$dynamic();
        let countQuery = db.select({ count: count() }).from(criminals).$dynamic();

        // Apply search filter
        if (searchTerm) {
            console.log(`[criminals/+page.server.ts] Search Term: ${searchTerm}`);
            const searchPattern = `%${searchTerm.toLowerCase()}%`;
            criminalsQuery = criminalsQuery.where(
                sql`(${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern})`
            );
            countQuery = countQuery.where(
                sql`(${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern})`
            );
        }

        // Apply status filter
        if (filterStatus) {
            criminalsQuery = criminalsQuery.where(eq(criminals.status, filterStatus));
            countQuery = countQuery.where(eq(criminals.status, filterStatus));
        }

        // Apply threat level filter
        if (filterThreatLevel) {
            criminalsQuery = criminalsQuery.where(eq(criminals.threatLevel, filterThreatLevel));
            countQuery = countQuery.where(eq(criminals.threatLevel, filterThreatLevel));
        }

        // Execute queries
        console.log('[criminals/+page.server.ts] Fetching criminals from database...');
        const fetchedCriminals = await criminalsQuery.limit(limit).offset(offset);
        const totalCriminalsResult = await countQuery;
        const totalCriminals = totalCriminalsResult[0].count;
        
        console.log('[criminals/+page.server.ts] Successfully fetched criminals:', fetchedCriminals.length);

        // Also fetch some recent cases for context (optional)
        console.log('[criminals/+page.server.ts] Fetching recent cases from database...');
        const recentCases = await db.select().from(cases).limit(5).orderBy(sql`${cases.createdAt} DESC`);
        console.log('[criminals/+page.server.ts] Successfully fetched recent cases:', recentCases.length);

        return {
            user: locals.session.user,
            criminals: fetchedCriminals,
            recentCases: recentCases,
            currentPage: page,
            limit: limit,
            totalCriminals: Number(totalCriminals),
            totalPages: Math.ceil(Number(totalCriminals) / limit),
            searchTerm: searchTerm,
            filterStatus: filterStatus,
            filterThreatLevel: filterThreatLevel
        };
    } catch (error) {
        console.error('[criminals/+page.server.ts] Database error:', error);
        
        // Return empty data if database fails
        return {
            user: locals.session.user,
            criminals: [],
            recentCases: [],
            currentPage: page,
            limit: limit,
            totalCriminals: 0,
            totalPages: 0,
            searchTerm: searchTerm,
            filterStatus: filterStatus,
            filterThreatLevel: filterThreatLevel,
            error: 'Failed to load criminals data'
        };
    }
};

export const actions: Actions = {
    logout: async ({ locals }) => {
        // Redirect to the Auth.js default signout endpoint.
        // The Auth.js hook will handle the actual signout and cookie clearing.
        throw redirect(303, "/auth/signout");
    }
};