import { error, redirect } from '@sveltejs/kit';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import type { Statute } from '$lib/data/types';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: ServerLoad = async ({ params, fetch }) => {
    if (!params.id) {
        throw error(400, 'Statute ID is required');
    }
    const statuteId = parseInt(params.id);
    if (isNaN(statuteId)) {
        throw error(400, 'Invalid statute ID');
    }

    const response = await fetch(`/api/statutes/${statuteId}`);

    if (!response.ok) {
        throw error(response.status, 'Statute not found');
    }

    const statuteItem: Statute = await response.json();
    return {
        statute: statuteItem
    };
};

export const actions: Actions = {
    default: async ({ request, params, fetch }) => {
        const statuteId = parseInt(params.id || '');
        if (isNaN(statuteId)) {
            return {
                status: 400,
                body: {
                    message: 'Invalid statute ID'
                }
            };
        }

        const data = await request.formData();
        const name = data.get('name')?.toString();
        const description = data.get('description')?.toString();
        const sectionNumber = data.get('sectionNumber')?.toString();

        if (!name || !sectionNumber) {
            return {
                status: 400,
                body: {
                    message: 'Name and section number are required'
                }
            };
        }

        const response = await fetch(`/api/statutes/${statuteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, sectionNumber })
        });

        if (response.ok) {
            throw redirect(303, `/statutes/manage/${statuteId}`);
        } else {
            const errorData = await response.json();
            return {
                status: response.status,
                body: {
                    message: errorData.message || 'Failed to update statute'
                }
            };
        }
    }
};