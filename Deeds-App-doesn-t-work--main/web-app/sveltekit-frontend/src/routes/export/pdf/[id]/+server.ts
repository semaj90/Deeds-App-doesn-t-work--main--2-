// Copilot Instructions:
// SSR route to export case as PDF using PDFKit
// Fetch case by ID, generate layout with metadata and evidence
// Respond with application/pdf content type
// Do not use Puppeteer

import PDFDocument from 'pdfkit';
import { db } from '$lib/server/db';
import { cases } from '$lib/server/db/unified-schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const caseId = params.id;
  const caseData = await db.query.cases.findFirst({
    where: eq(cases.id, caseId)
  });

  if (!caseData) {
    return new Response('Case not found', { status: 404 });
  }

  const doc = new PDFDocument();
  
  const stream = new ReadableStream({
    start(controller) {
      doc.on('data', (chunk) => controller.enqueue(chunk));
      doc.on('end', () => controller.close());

      doc.fontSize(25).text(`Case Summary: ${caseData.title}`, {
        align: 'center'
      });
      doc.moveDown();
      doc.fontSize(12).text(JSON.stringify(caseData.evidence, null, 2));
      doc.end();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="case-${caseData.id}.pdf"`
    }
  });
};
