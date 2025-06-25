import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import type { Actions } from './$types';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();
    const title = form.get('title')?.toString();
    const description = form.get('description')?.toString();
    const dangerScore = Number(form.get('dangerScore')) || 0;
    const status = form.get('status')?.toString() || 'open';
    const aiSummary = form.get('aiSummary')?.toString() || null;
    if (!title || !description) {
      return fail(400, { error: 'Title and description are required.' });
    }    const id = randomUUID();
    
    // Get session from Auth.js
    const session = await locals.auth();
    const createdBy = session?.user?.id;
    
    if (!createdBy) {
      return fail(401, { error: 'Not authenticated.' });
    }
    try {
      await db.insert(cases).values({
        title,
        description,
        caseNumber: `CASE-${Date.now()}`, // Generate case number
        dangerScore,
        status,
        aiSummary,
        createdBy
      });
      throw redirect(303, `/cases/${id}`);
    } catch (e) {
      console.error(e);
      return fail(500, { error: 'Failed to create case.' });
    }
  }
};
