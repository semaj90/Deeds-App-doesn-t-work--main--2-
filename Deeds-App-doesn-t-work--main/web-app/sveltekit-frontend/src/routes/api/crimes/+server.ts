import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/seed-db';
import { crimes } from '$lib/server/db/schema';
import { eq, like, sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { InferInsertModel } from 'drizzle-orm';

// Polyfill for UUID (if crypto.randomUUID is not available)
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

type NewCrime = InferInsertModel<typeof crimes>;

// GET /api/crimes - List crimes with pagination and search
export const GET: RequestHandler = async ({ url }) => {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = db.select().from(crimes).$dynamic();
    if (searchTerm) {
      query = query.where(like(crimes.name, `%${searchTerm}%`));
    }
    const data = await query.limit(limit).offset(offset).all();
    // Count total
    let countQuery = db.select({ count: sql`count(*)` }).from(crimes).$dynamic();
    if (searchTerm) {
      countQuery = countQuery.where(like(crimes.name, `%${searchTerm}%`));
    }
    const total = (await countQuery.all())[0]?.count || 0;
    return json({ data, page, limit, total });
  } catch (error) {
    console.error('Error fetching crimes:', error);
    return json({ error: 'Failed to fetch crimes' }, { status: 500 });
  }
};

// POST /api/crimes - Create a new crime
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, description, statuteId, caseId, criminalId, chargeLevel, status, incidentDate, arrestDate, filingDate, notes, aiSummary, metadata, createdBy } = body;
    if (!name) {
      return json({ error: 'Name is required' }, { status: 400 });
    }
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : uuidv4();
    const now = new Date();
    const newCrime: NewCrime = {
      id,
      name,
      description,
      statuteId,
      caseId,
      criminalId,
      chargeLevel,
      status: status || 'pending',
      incidentDate,
      arrestDate,
      filingDate,
      notes,
      aiSummary,
      metadata: metadata || '{}',
      createdBy,
      createdAt: now,
      updatedAt: now
    };
    const [crime] = await db.insert(crimes).values(newCrime).returning();
    return json({ crime });
  } catch (error) {
    console.error('Error creating crime:', error);
    return json({ error: 'Failed to create crime' }, { status: 500 });
  }
};