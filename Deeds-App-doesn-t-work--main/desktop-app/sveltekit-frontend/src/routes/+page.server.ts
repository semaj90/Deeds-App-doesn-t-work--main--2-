import { redirect } from "@sveltejs/kit";
import type { Actions, ServerLoad } from "@sveltejs/kit";
import type { Case, Criminal } from '$lib/data/types';

export const load: ServerLoad = async ({ url, fetch }) => {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || '';
    const filterThreatLevel = url.searchParams.get('threat') || '';

    // Fetch criminals
    const criminalResponse = await fetch(
        `/api/criminals?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}&status=${encodeURIComponent(filterStatus)}&threat=${encodeURIComponent(filterThreatLevel)}`
    );
    let criminals: Criminal[] = [];
    let totalCriminals: number = 0;

    if (criminalResponse.ok) {
        const data = await criminalResponse.json();
        criminals = data.criminals;
        totalCriminals = data.totalCriminals;
        console.log('[+page.server.ts] Successfully fetched criminals.');
    } else {
        console.error('[+page.server.ts] Failed to fetch criminals:', criminalResponse.status, criminalResponse.statusText);
        console.error('[+page.server.ts] Criminals API response:', await criminalResponse.text());
    }

    // Fetch recent cases (e.g., last 5, or all if few)
    // Fetch cases for the logged-in user
    const caseResponse = await fetch('/api/cases');
    let cases: Case[] = [];
    if (caseResponse.ok) {
        const data = await caseResponse.json();
        cases = data;
        console.log('[+page.server.ts] Successfully fetched cases.');
    } else {
        console.error('[+page.server.ts] Failed to fetch cases:', caseResponse.status, caseResponse.statusText);
        console.error('[+page.server.ts] Cases API response:', await caseResponse.text());
    }

    return {
        criminals: criminals,
        cases: cases,
        currentPage: page,
        limit: limit,
        totalCriminals: totalCriminals,
        searchTerm: searchTerm,
        filterStatus: filterStatus,
        filterThreatLevel: filterThreatLevel
    };
};

export const actions: Actions = {
    logout: async ({ locals }) => {
            // Redirect to the Auth.js default signout endpoint.
        // The Auth.js hook will handle the actual signout and cookie clearing.
        throw redirect(303, "/auth/signout");
    }
};