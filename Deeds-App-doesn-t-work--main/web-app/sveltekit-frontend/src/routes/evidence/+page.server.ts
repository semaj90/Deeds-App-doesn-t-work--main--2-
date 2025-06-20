import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(302, '/login');
  const list = await db.select().from(evidence).where(eq(evidence.uploadedBy, user.id));
  return { evidence: list };
};

export const actions = {
  create: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });
    const form = await request.formData();
    const title = form.get('title')?.toString();
    if (!title) return fail(400, { error: 'Title required' });
    await db.insert(evidence).values({ title, uploadedBy: user.id });
    return { success: true };
  },
  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });
    const id = (await request.formData()).get('id');
    if (!id || typeof id !== 'string') return fail(400, { error: 'ID required' });
    await db.delete(evidence).where(eq(evidence.id, id));
    return { success: true };
  }
};
