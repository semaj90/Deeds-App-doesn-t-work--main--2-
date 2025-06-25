import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/unified-schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params }) => {
    const { userId, evidence } = await request.json();
    const caseId = params.id;

    // In a real app, you would have more robust validation and error handling
    await db.update(cases).set({ evidence }).where(eq(cases.id, caseId));

    return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
