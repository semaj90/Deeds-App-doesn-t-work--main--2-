import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }
  const formData = await request.formData();
  const caseId = formData.get('caseId')?.toString();
  if (!caseId) {
    return json({ error: 'Missing caseId' }, { status: 400 });
  }
  const files = formData.getAll('files');
  if (!files.length) {
    return json({ error: 'No files uploaded' }, { status: 400 });
  }
  const uploaded = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    // In a real app, save file to disk or cloud storage here
    // For demo, just use a fake URL
    const fileUrl = `/uploads/${randomUUID()}-${file.name}`;
    // Optionally, save file buffer to disk here
    // const buffer = await file.arrayBuffer();
    const newEvidence = await db.insert(evidence).values({
      title: file.name,
      description: '',
      fileUrl,
      fileType: file.type,
      fileSize: file.size,
      caseId,
      uploadedBy: userId,
    }).returning();
    uploaded.push(newEvidence[0]);
  }
  return json({ success: true, uploaded });
};
