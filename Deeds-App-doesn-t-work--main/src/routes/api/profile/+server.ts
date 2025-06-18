import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request, locals }) {
  const session = locals.session;
  if (!session?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { bio } = await request.json();
  await db.update(users)
    .set({ profile: { bio } })
    .where(eq(users.id, session.user.id));
  return json({ success: true });
}
