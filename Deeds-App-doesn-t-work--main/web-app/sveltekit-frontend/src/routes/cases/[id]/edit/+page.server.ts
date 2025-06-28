import { fail, redirect } from '@sveltejs/kit';
import { db } from '../../../../lib/server/db/index.js';
import { cases } from '../../../../lib/server/db/unified-schema.js';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = locals.user;
  const session = locals.session;
  
  if (!session || !user) {
    throw redirect(302, '/login');
  }

  const caseId = params.id;

  try {
    const caseDetails = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
    
    if (!caseDetails || caseDetails.length === 0) {
      throw redirect(302, '/cases');
    }

    return { 
      session,
      caseDetails: caseDetails[0],
    };
  } catch (error) {
    console.error('Error loading case for edit:', error);
    throw redirect(302, '/cases');
  }
};

export const actions: Actions = {
  update: async ({ request, params, locals }) => {
    const user = locals.user;
    const session = locals.session;
    
    if (!session || !user) {
      return fail(401, { error: 'Not authenticated.' });
    }

    const caseId = params.id;
    const form = await request.formData();
    
    const title = form.get('title')?.toString();
    const description = form.get('description')?.toString();
    const dangerScore = Number(form.get('dangerScore')) || 0;
    const status = form.get('status')?.toString() || 'open';
    const aiSummary = form.get('aiSummary')?.toString() || null;

    if (!title || !description) {
      return fail(400, { error: 'Title and description are required.' });
    }

    try {
      await db.update(cases)
        .set({
          title,
          description,
          dangerScore,
          status,
          aiSummary,
          updatedAt: new Date().toISOString()
        })
        .where(eq(cases.id, caseId));

      throw redirect(303, `/cases/${caseId}`);
    } catch (e) {
      console.error('Error updating case:', e);
      return fail(500, { error: 'Failed to update case.' });
    }
  }
};
