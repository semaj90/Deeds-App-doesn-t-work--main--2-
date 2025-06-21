import { db } from '$lib/server/db';
import { cases, evidenceFiles } from '$lib/server/db/schema-new'; // Use unified schema
import { redirect } from '@sveltejs/kit'; // Removed error import as redirect is used
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = locals.user;
  const session = locals.session;
  
  if (!session || !user) {
    throw redirect(302, '/login');
  }

  const caseId = params.id; // Keep as string since schema uses varchar
  const userId = user.id;

  try {
    const caseDetails = await db.query.cases.findFirst({ // Use findFirst for single record
      where: eq(cases.id, caseId),
      with: { evidenceFiles: true } // Eager load evidenceFiles
    });
    
    if (!caseDetails) {
      throw redirect(302, '/cases'); // Redirect if case not found
    }

    // evidenceList is now part of caseDetails.evidenceFiles
    
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
    const user = locals.user;
    const session = locals.session;
    
    if (!session || !user) {
      throw redirect(302, '/login');
    }

    const caseId = params.id;
    
    try {
      const data = await request.formData();
      
      await db.update(cases)
        .set({
          title: data.get('title') as string,
          description: data.get('description') as string,
          dangerScore: parseInt(data.get('dangerScore') as string) || 0,
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
