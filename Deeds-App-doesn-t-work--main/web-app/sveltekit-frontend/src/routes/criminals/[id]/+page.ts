import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data }) => {
    return {
        criminal: data.criminal || null
    };
};