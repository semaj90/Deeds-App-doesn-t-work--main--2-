import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidence, criminals } from '$lib/server/db/schema';
import { eq, and, ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Helper to call NLP service for PDF metadata extraction (assuming it exists)
async function extractPdfMetadata(file: File): Promise<{ verdictDate?: string; criminalNames?: string[] }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const response = await fetch('http://localhost:8001/extract-pdf-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: buffer
  });
  if (!response.ok) return {};
  return await response.json();
}

// Helper to call NLP service for embedding generation
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${env.LLM_SERVICE_URL || 'http://localhost:8000'}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return (await response.json()).embedding || [];
}

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

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'static', 'uploads', 'evidence');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uploaded = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;

    const fileId = crypto.randomUUID();
    const uniqueFileName = `${fileId}-${file.name}`;
    const fileUrl = `/uploads/evidence/${uniqueFileName}`; // Public URL
    const filePath = path.join(uploadDir, uniqueFileName); // Server-side path

    fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

    // --- Extract metadata from PDF ---
    let verdictDate: string | undefined = undefined;
    let criminalNames: string[] = [];
    let matchedCriminals: any[] = [];
    if (file.type === 'application/pdf') {
      try {
        const meta = await extractPdfMetadata(file);
        verdictDate = meta.verdictDate;
        criminalNames = meta.criminalNames || [];
        // Try to find criminals by name (first + last) using ilike for case-insensitivity
        for (const name of criminalNames) {
          // This assumes criminalNames are "FirstName LastName"
          const [firstName, ...rest] = name.split(' ');
          const lastName = rest.join(' ');
          if (!firstName || !lastName) continue;
          const found = await db.select().from(criminals)
            .where(and(eq(criminals.firstName, firstName), eq(criminals.lastName, lastName)));
          if (found.length > 0) matchedCriminals.push(...found);
        }
      } catch (e) {
        console.warn('Failed to extract PDF metadata:', e);
      }
    }

    // Generate embedding for the file content (if text-based)
    let embedding: number[] = [];
    let aiSummary = '';
    let aiTags: string[] = [];
    if (file.type.startsWith('text/') || file.type === 'application/pdf') {
      // For PDF, you'd typically extract text first before embedding
      const fileContent = fs.readFileSync(filePath, 'utf-8'); // Read the saved file
      embedding = await generateEmbedding(fileContent);
      // You might also call an NLP service for summary/tags here
      aiSummary = `Summary of ${file.name}`; // Placeholder
      aiTags = ['document', 'uploaded']; // Placeholder
    }

    const newEvidenceArr = await db.insert(evidence).values({
      caseId,
      title: file.name,
      description: `Uploaded file: ${file.name}`,
      evidenceType: file.type.split('/')[0], // e.g., 'application' -> 'document'
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: userId,
      aiAnalysis: { summary: aiSummary, tags: aiTags },
      aiTags: Array.isArray(aiTags) ? aiTags : [],
    }).returning();
    const newEvidence = newEvidenceArr[0];
    uploaded.push({ ...newEvidence, matchedCriminals, extracted: { verdictDate, criminalNames } });
  }
  // Return uploaded evidence, extracted metadata, and possible criminal matches for UI confirmation
  return json({ success: true, uploaded });
};
