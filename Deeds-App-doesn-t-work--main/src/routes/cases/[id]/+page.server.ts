import { db } from '$lib/server/db';
import { cases, evidence } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = await locals.auth();
  
  if (!session?.user?.id) {
    throw redirect(302, '/login');
  }

  const caseId = params.id; // Keep as string since schema uses varchar
  const userId = session.user.id;

  try {
    const [caseDetails] = await db.select()
      .from(cases)
      .where(eq(cases.id, caseId));
    
    if (!caseDetails) {
      throw redirect(302, '/cases');
    }

    const evidenceList = await db.select()
      .from(evidence)
      .where(eq(evidence.caseId, caseId));
    
    return { 
      session,
      caseDetails, 
      evidenceList 
    };
  } catch (error) {
    console.error('Error loading case:', error);
    throw redirect(302, '/cases');
  }
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const session = await locals.auth();
    
    if (!session?.user?.id) {
      throw redirect(302, '/login');
    }

    const caseId = params.id;
    
    try {
      const data = await request.formData();
      
      await db.update(cases)
        .set({
          title: data.get('title') as string,
          description: data.get('description') as string,
          dangerScore: parseInt(data.get('dangerScore') as string) || null,
          status: data.get('status') as string,
          aiSummary: data.get('notes') as string || null
        })
        .where(eq(cases.id, caseId));
      
      return { success: true, message: 'Case updated successfully' };
    } catch (error) {
      console.error('Error updating case:', error);
      return { success: false, error: 'Failed to update case' };
    }
  }
};
