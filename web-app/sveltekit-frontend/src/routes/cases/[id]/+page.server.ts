import { db } from '$lib/server/db';
import { cases, evidence } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
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
    const caseDetails = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
      with: { evidence: true, criminals: { with: { criminal: true } } } // Eager load evidence and criminals
    });
    
    if (!caseDetails) {
      throw redirect(302, '/cases'); // Redirect if case not found
    }

    return { 
      session,
      caseDetails,
    };
  } catch (error) {
    console.error('Error loading case:', error);
    throw redirect(302, '/cases');
  }
};

export const actions: Actions = {
  updateCase: async ({ request, params, locals }) => {
    const user = locals.user;
    const session = locals.session;
    
    if (!session || !user) {
      throw redirect(302, '/login');
    }

    const caseId = params.id;
    
    try {
      const data = await request.formData();
      const status = data.get('status') as string;
        await db.update(cases)
        .set({
          title: data.get('title') as string,
          description: data.get('description') as string,
          dangerScore: parseInt(data.get('dangerScore') as string) || 0,
          status: status,
          aiSummary: data.get('aiSummary') as string || null,
          updatedAt: new Date().toISOString(),
          closedAt: status === 'closed' ? new Date().toISOString() : null
        })
        .where(eq(cases.id, caseId));
      
      return { success: true, message: 'Case updated successfully' };
    } catch (error) {
      console.error('Error updating case:', error);
      return { success: false, error: 'Failed to update case' };
    }
  }
};
