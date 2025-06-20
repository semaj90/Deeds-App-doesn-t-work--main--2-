import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { withCache, cacheKeys, cacheTags, invalidateCacheByTags } from '$lib/server/cache/cache';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from '@sveltejs/kit';

// Placeholder extract and summarize functions
async function extractTextFromFile(filePath: string): Promise<string> {
  // TODO: Implement using pdf-parse, docx-parser, etc.
  return 'Extracted text content';
}

async function summarizeText(text: string): Promise<string> {
  // TODO: Call local AI summarizer (Python server, Ollama, etc.)
  return `Summary of: ${text.slice(0, 200)}...`;
}

async function generateTags(text: string): Promise<string[]> {
  // TODO: Local LLM or keywords extraction
  return ['tag1', 'tag2'];
}

// GET /api/evidence - List evidence with optional filters
export const GET: RequestHandler = async ({ url, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const caseId = url.searchParams.get('caseId');
  const search = url.searchParams.get('search');
  
  // Generate cache key based on parameters
  const cacheKey = caseId 
    ? cacheKeys.evidence.byCase(caseId)
    : search
    ? cacheKeys.evidence.search(`${userId}:${search}`)
    : cacheKeys.evidence.byUser(userId);

  try {
    return json(await withCache(
      cacheKey,
      async () => {
        let query = db.select().from(evidence);
        
        // Filter by case if specified
        if (caseId) {
          query = query.where(eq(evidence.caseId, caseId)) as any;
        }
        
        // Add search filter
        if (search) {
          const searchQuery = query.where(
            or(
              ilike(evidence.filename, `%${search}%`),
              ilike(evidence.aiSummary, `%${search}%`)
            )
          ) as any;
          return await searchQuery;
        }
        
        return await query;
      },
      5 * 60 * 1000, // 5 minutes cache
      [cacheTags.evidence, `user:${userId}`]
    ));
  } catch (error) {
    console.error('Failed to fetch evidence:', error);
    return json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const caseId = formData.get('caseId');
  const poiId = formData.get('poiId');

  if (!file) {
    return json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const uploadDir = path.resolve('static/uploads/evidence');
    await fs.mkdir(uploadDir, { recursive: true });
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const extractedText = await extractTextFromFile(filePath);
    const summary = await summarizeText(extractedText);
    const tags = await generateTags(extractedText);
    // Placeholder for embedding generation
    const embedding = null; // TODO: Call embedding service

    const newEvidence = {
      id: uuidv4(),
      filename: file.name,
      filePath,
      fileType: file.type,
      fileSize: file.size,
      tags: JSON.stringify(tags),
      uploadedBy: userId,
      caseId: caseId as string, // Must not be null based on schema
      poiId: poiId as string || null,
      aiSummary: summary,
      originalContent: extractedText,
      embedding: embedding ? JSON.stringify(embedding) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Only insert if we have a valid caseId
    if (!caseId) {
      return json({ error: 'Case ID is required' }, { status: 400 });
    }

    const result = await db.insert(evidence).values(newEvidence).returning();

    // Invalidate relevant caches
    invalidateCacheByTags([cacheTags.evidence, `user:${userId}`]);
    if (caseId) {
      invalidateCacheByTags([`case:${caseId}`]);
    }

    return json({ success: true, evidence: result[0] });
  } catch (error) {
    console.error('Failed to upload evidence:', error);
    return json({ error: 'Failed to upload evidence' }, { status: 500 });
  }
};