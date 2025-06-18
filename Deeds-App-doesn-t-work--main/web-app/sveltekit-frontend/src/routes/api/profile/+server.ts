import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request, locals }) {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { bio } = await request.json();
  
  // Update the bio field directly (not in a nested profile object)
  await db.update(users)
    .set({ bio })
    .where(eq(users.id, user.id));
    
  return json({ success: true });
}
