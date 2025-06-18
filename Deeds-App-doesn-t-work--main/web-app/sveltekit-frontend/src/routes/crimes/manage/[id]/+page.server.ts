import { error, redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import type { Crime, Criminal, Statute } from '$lib/data/types';
import { db } from '$lib/server/db';
import { crimes, criminals, statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: ServerLoad = async ({ params, fetch }) => {
    if (!params.id) {
        throw error(400, 'Crime ID is required');
    }
    const crimeId = parseInt(params.id);
    if (isNaN(crimeId)) {
        throw error(400, 'Invalid crime ID');
    }

    const response = await fetch(`/api/crimes/${crimeId}`);

    if (!response.ok) {
        throw error(response.status, 'Crime not found');
    }

    const crimeItem: Crime & { criminal: Criminal; statute: Statute } = await response.json();
    return {
        crime: crimeItem
    };
};