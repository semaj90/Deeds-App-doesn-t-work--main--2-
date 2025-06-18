import { json } from '@sveltejs/kit';
import { seedDefaultUsers } from '$lib/server/utils/seed-users';

export const POST = async ({ locals }) => {
    if (!locals.session?.user || locals.session.user.role !== 'admin') {
        return json({ message: 'Unauthorized' }, { status: 401 });
    }
    const result = await seedDefaultUsers();
    return json(result);
};