import type { PageLoad } from './$types';
import type { Criminal } from '$lib/data/types';

export const load: PageLoad = async ({ parent }) => {
    const data = await parent();
    return {
        criminal: data.criminal as Criminal
    };
};