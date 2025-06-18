import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    // This endpoint is not directly used for authentication,
    // but rather to provide a server-side route for the client-side
    // signIn function to post credentials to.
    // The actual authentication is handled by Auth.js in src/routes/api/auth/[...auth]/+server.ts
    // and the client-side signIn in src/routes/login/+page.svelte.

    // For now, we'll just return a success response.
    // The client-side will handle the redirect based on Auth.js's response.
    return json({ success: true });
}