// @ts-nocheck
import { db } from '$lib/server/db';
import { cases, evidence } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load = async ({ params, locals }: Parameters<PageServerLoad>[0]) => {
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

export const actions = {
  updateCase: async ({ request, params, locals }: import('./$types').RequestEvent) => {
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
          updatedAt: new Date(),
          closedAt: status === 'closed' ? new Date() : null
        })
        .where(eq(cases.id, caseId));
      
      return { success: true, message: 'Case updated successfully' };
    } catch (error) {
      console.error('Error updating case:', error);
      return { success: false, error: 'Failed to update case' };
    }
  }
};
;null as any as Actions;