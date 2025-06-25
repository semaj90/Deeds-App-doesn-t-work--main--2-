// Copilot Instructions:
// SSR loader + form actions for case editor
// Load `caseId` and user metadata, and render `CaseEditor.svelte`
// Form actions: handle updates to case JSON via `saveCaseDraft()`
// Uses Drizzle with Postgres to persist data
// Imports shared UI from `packages/ui/`

import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/unified-schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { saveCaseDraft } from '../../../../../../packages/lib/src/api';

export const load: PageServerLoad = async ({ params, locals }) => {
  const caseId = params.id;
  const user = locals.user;

  if (!user) {
    return { status: 401, error: 'Unauthorized' };
  }

  const caseData = await db.query.cases.findFirst({
    where: eq(cases.id, caseId)
  });

  return { caseData, userId: user.id };
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    const user = locals.user;
    if (!user) {
        return { status: 401, error: 'Unauthorized' };
    }
    const data = await request.formData();
    const evidence = JSON.parse(data.get('evidence') as string);
    const caseId = params.id;
    
    await saveCaseDraft(caseId, user.id, evidence);

    return { success: true };
  }
};
