import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { savedItems } from '$lib/server/db/schema-new';
import { eq, and } from 'drizzle-orm';

export const DELETE = async ({ params }: RequestEvent) => {
  try {
    // TODO: Get user from session/auth - for now using placeholder
    const userId = 'placeholder-user-id'; // Replace with actual user authentication
    
    if (!db) {
      return json({ error: 'Database not available' }, { status: 503 });
    }

    const itemId = params?.id;
    if (!itemId) {
      return json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Delete the item (ensure it belongs to the user)
    const result = await db
      .delete(savedItems)
      .where(and(
        eq(savedItems.id, itemId),
        eq(savedItems.userId, userId)
      ))
      .returning();

    if (result.length === 0) {
      return json({ error: 'Item not found or not authorized' }, { status: 404 });
    }

    return json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('Error deleting saved item:', error);
    return json({ 
      error: 'Failed to delete item', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
