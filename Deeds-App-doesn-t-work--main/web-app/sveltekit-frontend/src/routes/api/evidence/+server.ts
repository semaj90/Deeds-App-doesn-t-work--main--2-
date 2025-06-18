import { db } from '$lib/server/db';
import { evidence } from '$lib/server/db/schema';
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

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const caseId = formData.get('caseId');
  const poiId = formData.get('poiId');

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
  }

  const uploadDir = path.resolve('static/uploads/evidence');
  await fs.mkdir(uploadDir, { recursive: true });
  const uniqueFilename = `${uuidv4()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const extractedText = await extractTextFromFile(filePath);
  const summary = await summarizeText(extractedText);
  const tags = await generateTags(extractedText);

  await db.insert(evidence).values({
    title: file.name,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    fileUrl: `/uploads/evidence/${uniqueFilename}`,
    description: extractedText,
    aiSummary: summary,
    tags: tags,
    caseId: caseId || null,
    criminalId: poiId || null,
  } as any).returning();

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};