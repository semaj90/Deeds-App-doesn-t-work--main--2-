import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema-new'; // Use unified schema
import { eq, count } from 'drizzle-orm';
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
    const { title } = Object.fromEntries(form) as { title: string };
    if (!title) return fail(400, { message: 'Title required' });    await db.insert(evidence).values({ 
      title, 
      evidenceType: 'document',
    });
    return { success: true };
  },
  delete: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Not authenticated' });
    const { id } = Object.fromEntries(await request.formData()) as { id: string };
    if (!id) return fail(400, { message: 'ID required' });
    await db.delete(evidence).where(eq(evidence.id, id)); // Ensure ID is UUID
    return { success: true };
  }
};
