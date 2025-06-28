import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/unified-schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  
  if (!session?.user || !session.user.id) {
    throw redirect(302, '/login');
  }

  try {
    // Fetch all cases for the current user only
    const userCases = await db.select().from(cases).where(eq(cases.createdBy, session.user.id!));
    return {
      session,
      cases: userCases
    };
  } catch (error) {
    console.error('Error loading cases:', error);
    return {
      session,
      cases: []
    };
  }
};
