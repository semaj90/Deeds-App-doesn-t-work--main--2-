import { error, redirect } from '@sveltejs/kit';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import type { Case } from '$lib/data/types';

export const load: ServerLoad = async ({ params, fetch }) => {
    if (!params.id) {
        throw error(400, 'Case ID is required');
    }
    const caseId = parseInt(params.id);
    if (isNaN(caseId)) {
        throw error(400, 'Invalid case ID');
    }
    const response = await fetch(`/api/cases/${caseId}`);

  if (!response.ok) {
    throw error(response.status, 'Case not found');
  }

  const caseItem = await response.json();
  return {
    case: caseItem
  };
};

export const actions: Actions = {
  default: async ({ request, params }) => {
    const caseId = params.id;
    const data = await request.formData();
    const title = data.get('title')?.toString();
    const summary = data.get('summary')?.toString();
    const status = data.get('status')?.toString();
    const dateOpened = data.get('dateOpened')?.toString();
    const name = data.get('name')?.toString();
    const description = data.get('description')?.toString();
    const verdict = data.get('verdict')?.toString();
    const courtDates = data.get('courtDates')?.toString();
    const linkedCriminals = data.get('linkedCriminals')?.toString();
    const linkedCrimes = data.get('linkedCrimes')?.toString();
    const notes = data.get('notes')?.toString();

    if (!name || !title || !status || !dateOpened) {
      return {
        status: 400,
        body: {
          message: 'Name, title, status, and date opened are required'
        }
      };
    }

    const response = await fetch(`http://localhost:5173/api/cases/${caseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        title,
        summary,
        status,
        dateOpened: dateOpened ? new Date(dateOpened) : undefined,
        description,
        verdict,
        courtDates,
        linkedCriminals,
        linkedCrimes,
        notes
      })
    });

    if (response.ok) {
      throw redirect(303, `/case/${caseId}`);
    } else {
      const errorData = await response.json();
      return {
        status: response.status,
        body: {
          message: errorData.error || 'Failed to update case'
        }
      };
    }
  },
  delete: async ({ params }) => {
    const caseId = params.id;
    const response = await fetch(`http://localhost:5173/api/cases/${caseId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      throw redirect(303, '/');
    } else {
      const errorData = await response.json();
      return {
        status: response.status,
        body: {
          message: errorData.error || 'Failed to delete case'
        }
      };
    }
  }
};