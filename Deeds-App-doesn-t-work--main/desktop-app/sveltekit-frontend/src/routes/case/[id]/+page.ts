import type { Load } from '@sveltejs/kit';
import type { Case } from '$lib/data/types';

export const load: Load = async ({ params, fetch }) => {
    if (!params.id) {
        return {
            status: 400,
            error: new Error('Case ID is required')
        };
    }
    const caseId = parseInt(params.id);
    if (isNaN(caseId)) {
        return {
            status: 400,
            error: new Error('Invalid case ID')
        };
    }
    const response = await fetch(`/api/cases/${caseId}`);

    if (!response.ok) {
        // Handle error, e.g., throw an error or return an error object
        return {
            status: response.status,
            error: new Error('Could not load case')
        };
    }

    const caseItem = await response.json();
    return {
        case: caseItem
    };
};