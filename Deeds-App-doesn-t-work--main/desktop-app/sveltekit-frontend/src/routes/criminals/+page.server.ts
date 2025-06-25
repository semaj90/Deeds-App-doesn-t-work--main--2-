import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';
import type { Criminal } from '$lib/data/types';

export const load: ServerLoad = async ({ locals, fetch, url }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }
    const user = locals.user;

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';

    const response = await fetch(`/api/criminals?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`);
    let criminals: Criminal[] = [];
    let totalCriminals: number = 0;

    if (response.ok) {
        const data = await response.json();
        criminals = data.criminals;
        totalCriminals = data.totalCriminals;
    } else {
        console.error('Failed to fetch criminals:', response.status, response.statusText);
    }

    return {
        userId: user.id,
        username: user.name || user.email, // Use name or email as username
        criminals: criminals,
        currentPage: page,
        limit: limit,
        totalCriminals: totalCriminals,
        searchTerm: searchTerm
    };
};