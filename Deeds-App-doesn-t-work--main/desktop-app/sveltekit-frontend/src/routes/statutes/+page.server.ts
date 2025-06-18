import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';

export async function load() {
    const allStatutes = await db.select().from(statutes);
    return {
        statutes: allStatutes
    };
}