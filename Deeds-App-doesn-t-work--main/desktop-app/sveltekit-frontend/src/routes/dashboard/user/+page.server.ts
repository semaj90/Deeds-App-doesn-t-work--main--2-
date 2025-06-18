import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session?.user) {
    throw redirect(302, '/login');
  }
  // Only fetch cases created by this prosecutor
  const userId = locals.session.user.id ?? '';
  const userCases = await db.select().from(cases).where(eq(cases.createdBy, userId));
  return {
    cases: userCases
  };
};
