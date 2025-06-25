import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { caseId, userId, evidence } = await request.json();

    // In a real app, you would call your Python NLP microservice here
    console.log(`Summarizing case ${caseId} for user ${userId}`, evidence);

    return new Response(JSON.stringify({ summary: "This is a summary from the web API." }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
