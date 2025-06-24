// @ts-nocheck
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const user = locals.user;
  const session = locals.session;
  
  if (!session || !user) {
    throw redirect(302, '/login');
  }
  try {
    // Fetch all cases for the current user only
    const userCases = await db.select().from(cases).where(eq(cases.createdBy, user.id));
    return {
      session,
      user,
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
