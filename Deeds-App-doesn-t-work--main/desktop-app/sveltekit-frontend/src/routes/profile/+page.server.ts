import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session?.user) {
    throw redirect(302, '/login');
  }
  return {
    session: locals.session
  };
};
