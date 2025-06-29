import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  
  return {
    user: locals.user
  };
};

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { cases, criminals } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.session || !locals.user) {
        throw redirect(302, '/login');
    }

    // Get recent cases
    const recentCases = await db.select()
        .from(cases)
        .limit(5)
        .orderBy(cases.createdAt);

    // Get recent criminals/POIs
    const recentCriminals = await db.select()
        .from(criminals)
        .limit(6)
        .orderBy(criminals.createdAt);

    return {
        recentCases,
        recentCriminals
    };
};
