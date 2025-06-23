import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { savedItems } from '$lib/server/db/schema-new';
import { eq, desc } from 'drizzle-orm';

export const GET = async ({ url }: RequestEvent) => {
  try {
    // TODO: Get user from session/auth - for now using placeholder
    const userId = 'placeholder-user-id'; // Replace with actual user authentication
    
    if (!db) {
      return json({ error: 'Database not available' }, { status: 503 });
    }

    // Get query parameters for filtering/sorting
    const sortBy = url.searchParams.get('sort') || 'newest';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build order clause
    let orderBy;
    switch (sortBy) {
      case 'oldest':
        orderBy = savedItems.createdAt;
        break;
      case 'most_used':
        orderBy = desc(savedItems.usage_count);
        break;
      case 'rating':
        orderBy = desc(savedItems.userRating);
        break;
      case 'newest':
      default:
        orderBy = desc(savedItems.createdAt);
        break;
    }

    // Execute query
    const items = await db
      .select()
      .from(savedItems)
      .where(eq(savedItems.userId, userId))
      .orderBy(orderBy)
      .limit(limit);

    return json(items);

  } catch (error) {
    console.error('Error fetching saved items:', error);
    return json({ 
      error: 'Failed to fetch saved items', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};

export const DELETE = async ({ params }: RequestEvent) => {
  try {
    // TODO: Get user from session/auth - for now using placeholder
    const userId = 'placeholder-user-id'; // Replace with actual user authentication
    
    const itemId = params?.id;
    if (!itemId) {
      return json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Delete the item (ensure it belongs to the user)
    const result = await db.delete(savedItems)
      .where(eq(savedItems.id, itemId))
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
