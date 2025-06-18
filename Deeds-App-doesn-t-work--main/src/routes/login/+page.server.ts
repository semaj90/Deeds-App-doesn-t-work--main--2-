import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (locals.session?.user) {
        throw redirect(302, '/dashboard');
    }
    const registered = url.searchParams.get('registered');
    return {
        message: registered ? 'Registration successful. Please log in.' : undefined
    };
};

export const actions: Actions = {
    default: async ({ request, url, fetch }) => {
        const form = await request.formData();
        const email = form.get('email')?.toString();
        const password = form.get('password')?.toString();

        if (!email || !password) {
            return fail(400, { error: 'Missing email or password', message: undefined });
        }

        const callbackUrl = url.searchParams.get('from') || '/';
        const response = await fetch(`/api/auth/callback/credentials?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
            method: 'POST',
            body: form,
        });

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
            if (contentType.includes('application/json')) {
                const data = await response.json();
                return fail(response.status, { error: data.error || 'Invalid credentials', message: undefined });
            } else {
                // Not JSON, just show a generic error
                return fail(response.status, { error: 'Login failed. Please try again.', message: undefined });
            }
        }

        // On success, redirect to homepage or intended page
        throw redirect(303, callbackUrl);
    }
};
