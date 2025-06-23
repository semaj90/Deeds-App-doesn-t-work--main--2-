import { redirect } from "@sveltejs/kit";
import type { Actions, ServerLoad } from "@sveltejs/kit";
import type { Case, Criminal } from '$lib/data/types';
import { db } from '$lib/server/db';
import { criminals, cases } from '$lib/server/db/schema-new';

export const load: ServerLoad = async ({ url }) => {
    console.log('[+page.server.ts] Load function called');
    
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';

    try {
        // Fetch criminals directly from database
        console.log('[+page.server.ts] Fetching criminals from database...');
        const fetchedCriminals = await db.select().from(criminals).limit(limit);
        console.log('[+page.server.ts] Successfully fetched criminals:', fetchedCriminals.length);

        // Fetch cases directly from database
        console.log('[+page.server.ts] Fetching cases from database...');
        const fetchedCases = await db.select().from(cases).limit(limit);
        console.log('[+page.server.ts] Successfully fetched cases:', fetchedCases.length);

        return {
            criminals: fetchedCriminals,
            cases: fetchedCases,
            currentPage: page,
            limit: limit,
            totalCriminals: fetchedCriminals.length,
            searchTerm: searchTerm,
            filterStatus: filterStatus,
            filterThreatLevel: filterThreatLevel
        };
    } catch (error) {
        console.error('[+page.server.ts] Database error:', error);
        
        // Return empty data if database fails
        return {
            criminals: [],
            cases: [],
            currentPage: page,
            limit: limit,
            totalCriminals: 0,
            searchTerm: searchTerm,
            filterStatus: filterStatus,
            filterThreatLevel: filterThreatLevel
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
