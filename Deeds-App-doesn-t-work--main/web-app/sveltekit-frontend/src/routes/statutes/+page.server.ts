import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema-new'; // Use unified schema
import { eq, count } from 'drizzle-orm';
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
    const { title, code } = Object.fromEntries(form) as { title: string, code: string };
    if (!title || !code) return fail(400, { message: 'Title and code required' });
    await db.insert(statutes).values({ title, code }); // ID is auto-generated UUID
    return { success: true };
  },
  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });
    const { id } = Object.fromEntries(await request.formData()) as { id: string };
    if (!id) return fail(400, { message: 'ID required' });
    await db.delete(statutes).where(eq(statutes.id, id)); // Ensure ID is UUID
    return { success: true };
  }
};