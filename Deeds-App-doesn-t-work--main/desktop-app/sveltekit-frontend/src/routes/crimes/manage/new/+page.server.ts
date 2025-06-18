import { redirect, fail } from '@sveltejs/kit';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { crimes, criminals, statutes } from '$lib/server/db/schema';

export const load: ServerLoad = async ({ locals }: { locals: App.Locals }) => { // Added type for locals for clarity
    if (!locals.session?.user) { // Access user directly from locals.session
        throw redirect(302, '/login');
    }

    const allCriminals = await db.select().from(criminals);
    const allStatutes = await db.select().from(statutes);

    return {
        criminals: allCriminals,
        statutes: allStatutes
    };
};

export const actions: Actions = {
    default: async ({ request, fetch }) => {
        const data = await request.formData();
        const name = data.get('name')?.toString();
        const description = data.get('description')?.toString();
        const statuteId = data.get('statuteId')?.toString();
        const criminalId = data.get('criminalId')?.toString();

        if (!name || !statuteId || !criminalId) {
            // Use fail for returning action errors
            return fail(400, { message: 'Name, statute ID, and criminal ID are required' });
        }

        const response = await fetch('/api/crimes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, statuteId, criminalId })
        });

        if (response.ok) {
            throw redirect(303, '/crimes/manage');
        } else {
            const errorData = await response.json();
            return fail(response.status, { message: errorData.message || 'Failed to add crime' });
        }
    }
};