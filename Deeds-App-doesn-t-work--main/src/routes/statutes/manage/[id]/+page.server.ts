import { error, redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import type { Statute } from '$lib/data/types';

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