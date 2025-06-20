import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private'; // for environment variables

const LLM_SERVICE_URL = env.LLM_SERVICE_URL;
const OLLAMA_MODEL_FOR_TITLES = env.OLLAMA_MODEL_FOR_TITLES || 'mistral';

export const POST: RequestHandler = async ({ request }) => {
    if (!LLM_SERVICE_URL) {
        console.error('LLM_SERVICE_URL environment variable is not set.');
        return json({ error: 'LLM service not configured.' }, { status: 503 });
    }

    const { description } = await request.json();

    try {
        const response = await fetch(`${LLM_SERVICE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL_FOR_TITLES,
                prompt: `Suggest a concise and relevant title for the following case description:\n\n${description}\n\nTitle:`,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`LLM service error: ${response.status} - ${errorText}`);
            return json({ error: `Failed to get title from LLM service: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        const suggestedTitle = data.response.trim();

        return json({ title: suggestedTitle });
    } catch (error) {
        console.error('Error communicating with LLM service:', error);
        return json({ error: 'Internal server error when communicating with LLM service.' }, { status: 500 });
    }
};