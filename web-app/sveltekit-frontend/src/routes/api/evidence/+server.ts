import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    // Fetch all evidence from the database, newest first
    const allEvidence = await db.select().from(evidence).orderBy(desc(evidence.uploadedAt));
    return json(allEvidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const user = locals.user;
    if (!user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }
    const id = randomUUID();
    const now = new Date();
    const newEvidence = {
      id,
      title: data.title,
      description: data.description,
      caseId: data.caseId,
      criminalId: data.criminalId || null,
      evidenceType: data.evidenceType || data.fileType || 'document',
      fileUrl: data.fileUrl || null,
      fileType: data.fileType || null,
      fileSize: data.fileSize || null,
      tags: data.tags || [],
      uploadedBy: user.id,
      uploadedAt: now,
      updatedAt: now,
      fileName: data.fileName || null,
      summary: data.summary || null,
      aiSummary: data.aiSummary || null
    };
    await db.insert(evidence).values(newEvidence);
    return json(newEvidence, { status: 201 });
  } catch (error) {
    console.error('Error creating evidence:', error);
    return json({ error: 'Failed to create evidence' }, { status: 500 });
  }
};
