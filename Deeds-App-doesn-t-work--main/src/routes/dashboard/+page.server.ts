import { redirect } from "@sveltejs/kit";
import type { Actions, ServerLoad } from "@sveltejs/kit";
import { db } from '../../lib/server/db';
import { criminals, cases } from '../../lib/server/db/schema';
import type { DashboardData } from './types';
import { eq, ilike, sql, count, desc } from 'drizzle-orm';

export const load: ServerLoad = async ({ url, locals }): Promise<DashboardData> => {
    console.log('[dashboard/+page.server.ts] Load function called');
    
    // Check authentication
    if (!locals.session?.user) {
        throw redirect(302, '/login');
    }
    
    const user = locals.session.user;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';

    try {
        // Fetch recent cases (last 10)
        console.log('[dashboard/+page.server.ts] Fetching recent cases...');
        const recentCases = await db
            .select()
            .from(cases)
            .orderBy(desc(cases.createdAt))
            .limit(10);

        // Fetch high-priority cases
        const highPriorityCases = await db
            .select()
            .from(cases)
            .where(eq(cases.priority, 'high'))
            .orderBy(desc(cases.createdAt))
            .limit(5);

        // Fetch recent criminals (last 10)
        console.log('[dashboard/+page.server.ts] Fetching recent criminals...');
        const recentCriminals = await db
            .select()
            .from(criminals)
            .orderBy(desc(criminals.createdAt))
            .limit(10);

        // Fetch high-threat criminals
        const highThreatCriminals = await db
            .select()
            .from(criminals)
            .where(eq(criminals.threatLevel, 'high'))
            .orderBy(desc(criminals.createdAt))
            .limit(5);

        // Get case statistics
        const caseStats = await db
            .select({
                total: count(),
                status: cases.status
            })
            .from(cases)
            .groupBy(cases.status);

        // Get criminal statistics
        const criminalStats = await db
            .select({
                total: count(),
                threatLevel: criminals.threatLevel
            })
            .from(criminals)
            .groupBy(criminals.threatLevel);

        // Build search results if search term is provided
        let searchResults: {
            cases: typeof recentCases;
            criminals: typeof recentCriminals;
        } = { cases: [], criminals: [] };

        if (searchTerm) {
            console.log('[dashboard/+page.server.ts] Performing search for:', searchTerm);
            const searchPattern = `%${searchTerm.toLowerCase()}%`;

            // Search cases
            searchResults.cases = await db
                .select()
                .from(cases)
                .where(
                    sql`(${cases.title} ILIKE ${searchPattern} OR ${cases.description} ILIKE ${searchPattern})`
                )
                .limit(10);

            // Search criminals
            searchResults.criminals = await db
                .select()
                .from(criminals)
                .where(
                    sql`(${criminals.firstName} ILIKE ${searchPattern} OR ${criminals.lastName} ILIKE ${searchPattern})`
                )
                .limit(10);
        }

        console.log('[dashboard/+page.server.ts] Successfully loaded dashboard data');

        return {
            user: user,
            recentCases: recentCases,
            highPriorityCases: highPriorityCases,
            recentCriminals: recentCriminals,
            highThreatCriminals: highThreatCriminals,
            caseStats: caseStats,
            criminalStats: criminalStats,
            searchResults: searchResults,
            searchTerm: searchTerm,
            dashboardStats: {
                totalCases: recentCases.length,
                totalCriminals: recentCriminals.length,
                openCases: caseStats.find((s: any) => s.status === 'open')?.total || 0,
                activeCriminals: criminalStats.find((s: any) => s.threatLevel === 'high')?.total || 0
            }
        };
    } catch (error) {
        console.error('[dashboard/+page.server.ts] Database error:', error);
        
        // Return empty data if database fails
        return {
            user: user,
            recentCases: [],
            highPriorityCases: [],
            recentCriminals: [],
            highThreatCriminals: [],
            caseStats: [],
            criminalStats: [],
            searchResults: { cases: [], criminals: [] },
            searchTerm: searchTerm,
            dashboardStats: {
                totalCases: 0,
                totalCriminals: 0,
                openCases: 0,
                activeCriminals: 0
            },
            error: 'Failed to load dashboard data'
        };
    }
};

export const actions: Actions = {
    search: async ({ request, locals }) => {
        if (!locals.session?.user) {
            throw redirect(302, '/login');
        }

        const data = await request.formData();
        const searchTerm = data.get('search') as string;
        
        // Redirect with search parameter
        throw redirect(302, `/dashboard?search=${encodeURIComponent(searchTerm)}`);
    },

    logout: async ({ locals }) => {
        // Redirect to the Auth.js default signout endpoint.
        throw redirect(303, "/auth/signout");
    }
};
