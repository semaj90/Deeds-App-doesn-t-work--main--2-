import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Criminal } from '$lib/data/types';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const criminalId = params.id;
    const response = await fetch(`http://localhost:5173/api/criminals/${criminalId}`);

    if (!response.ok) {
        throw error(response.status, 'Criminal not found');
    }

    const criminalItem: Criminal = await response.json();
    return {
        criminal: criminalItem
    };
};