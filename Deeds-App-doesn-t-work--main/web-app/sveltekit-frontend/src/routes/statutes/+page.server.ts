import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(302, '/login');
  const list = await db.select().from(statutes);
  return { statutes: list };
};

export const actions = {
  create: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });
    const form = await request.formData();
    const title = form.get('title')?.toString();
    const code = form.get('code')?.toString();
    if (!title || !code) return fail(400, { error: 'Title and code required' });
    await db.insert(statutes).values({ title, code });
    return { success: true };
  },
  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });
    const id = (await request.formData()).get('id');
    if (!id || typeof id !== 'string') return fail(400, { error: 'ID required' });
    await db.delete(statutes).where(eq(statutes.id, id));
    return { success: true };
  }
};