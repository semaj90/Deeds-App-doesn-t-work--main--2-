import { error, redirect } from '@sveltejs/kit';
import type { Actions, ServerLoad } from '@sveltejs/kit';
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

    const crimeResponse = await fetch(`/api/crimes/${crimeId}`);

    if (!crimeResponse.ok) {
        throw error(crimeResponse.status, 'Crime not found');
    }

    const crimeItem: Crime & { criminal: Criminal; statute: Statute } = await crimeResponse.json();
    const allCriminals = await db.select().from(criminals);
    const allStatutes = await db.select().from(statutes);

    return {
        crime: crimeItem,
        criminals: allCriminals,
        statutes: allStatutes
    };
};

export const actions: Actions = {
    default: async ({ request, params, fetch }) => {
        const crimeId = parseInt(params.id || '');
        if (isNaN(crimeId)) {
            return {
                status: 400,
                body: {
                    message: 'Invalid crime ID'
                }
            };
        }

        const data = await request.formData();
        const name = data.get('name')?.toString();
        const description = data.get('description')?.toString();
        const statuteId = data.get('statuteId')?.toString();
        const criminalId = data.get('criminalId')?.toString();

        if (!name || !statuteId || !criminalId) {
            return {
                status: 400,
                body: {
                    message: 'Name, statute ID, and criminal ID are required'
                }
            };
        }

        const response = await fetch(`/api/crimes/${crimeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, statuteId, criminalId })
        });

        if (response.ok) {
            throw redirect(303, `/crimes/manage/${crimeId}`);
        } else {
            const errorData = await response.json();
            return {
                status: response.status,
                body: {
                    message: errorData.message || 'Failed to update crime'
                }
            };
        }
    }
};