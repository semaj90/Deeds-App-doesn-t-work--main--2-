import { db } from '$lib/server/db';
import { reports, cases, statutes, criminals, evidence, caseCriminals } from '$lib/server/db/schema-new';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

function safeDate(val: any): string {
    if (!val) return 'N/A';
    const d = new Date(val);
    return isNaN(d.getTime()) ? 'N/A' : d.toDateString();
}

export async function GET({ url }) {
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id');

    if (!type || !id) {
        return new Response('Missing type or ID', { status: 400 });
    }

    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    const stream = doc as NodeJS.ReadableStream;
    const pdfPromise = new Promise<Buffer>((resolve) => {
        stream.on('end', () => resolve(Buffer.concat(buffers)));
    });

    try {
        if (type === 'case') {
            const caseId = id;
            const caseItem = await db.query.cases.findFirst({
                where: eq(cases.id, caseId),
            });
            if (!caseItem) {
                return new Response('Case not found', { status: 404 });
            }
            const currentCase = caseItem;
            doc.fontSize(25).text(`Case Report: ${currentCase.title || 'N/A'}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Case Title: ${currentCase.title || 'N/A'}`);
            doc.text(`Status: ${currentCase.status || 'N/A'}`);
            doc.text(`Date Opened: ${safeDate(currentCase.createdAt)}`);
            doc.text(`Description: ${currentCase.description || 'N/A'}`);
            doc.text(`Verdict: ${(currentCase as any).verdict || 'N/A'}`); // fallback for type
            doc.text(`Danger Score: ${currentCase.dangerScore ?? 0}`);
            doc.text(`AI Summary: ${currentCase.aiSummary || 'N/A'}`);
            const tags = Array.isArray(currentCase.aiTags) ? currentCase.aiTags : [];
            doc.text(`Tags: ${tags.length > 0 ? tags.join(', ') : 'N/A'}`);
            doc.moveDown();
            // Linked Criminals
            const linkedCriminals = await db.query.caseCriminals.findMany({
                where: eq(caseCriminals.caseId, caseId),
                with: { criminal: true }
            });
            if (Array.isArray(linkedCriminals) && linkedCriminals.length > 0) {
                doc.fontSize(16).text('Linked People of Interest:', { underline: true });
                doc.moveDown();
                for (const link of linkedCriminals) {
                    const criminal = link.criminal;
                    if (criminal) {
                        doc.fontSize(12).text(`- ${criminal.firstName || ''} ${criminal.lastName || ''} (Role: ${link.role || 'N/A'}, Threat Level: ${criminal.threatLevel || 'N/A'})`);
                        const aliases = Array.isArray(criminal.aliases) ? criminal.aliases : [];
                        doc.text(`  Aliases: ${aliases.length > 0 ? aliases.join(', ') : 'N/A'}`);
                        const charges = Array.isArray(link.charges) ? link.charges.map((c: any) => (typeof c === 'string' ? c : c.name)).join(', ') : 'N/A';
                        doc.text(`  Charges: ${charges}`);
                        doc.text(`  Conviction: ${link.conviction ? 'Yes' : 'No'}`);
                        doc.moveDown();
                    }
                }
            }
            // Linked Evidence
            const caseEvidence = await db.query.evidence.findMany({
                where: eq(evidence.caseId, caseId)
            });
            if (Array.isArray(caseEvidence) && caseEvidence.length > 0) {
                doc.fontSize(16).text('Linked Evidence:', { underline: true });
                doc.moveDown();
                caseEvidence.forEach(item => {
                    // Use fallback for fileName/filename, fileType/mimeType, summary, tags
                    const fileName = (item as any).fileName || (item as any).filename || 'N/A';
                    const fileType = (item as any).fileType || (item as any).mimeType || 'N/A';
                    const fileSize = (item as any).fileSize ?? 0;
                    const summary = (item as any).summary || (item as any).aiSummary || 'N/A';
                    const evidenceTags = Array.isArray((item as any).tags) ? (item as any).tags : (Array.isArray((item as any).aiTags) ? (item as any).aiTags : []);
                    doc.fontSize(12).text(`- ${fileName} (${fileType}, ${fileSize} bytes)`);
                    doc.text(`  Summary: ${summary}`);
                    doc.text(`  Tags: ${evidenceTags.length > 0 ? evidenceTags.join(', ') : 'N/A'}`);
                    doc.moveDown();
                });
            }
        } else if (type === 'statute') {
            const statuteId = id;
            const statuteItem = await db.query.statutes.findFirst({
                where: eq(statutes.id, statuteId),
            });
            if (!statuteItem) {
                return new Response('Statute not found', { status: 404 });
            }
            const currentStatute = statuteItem;
            doc.fontSize(25).text(`Statute Report: ${currentStatute.title || 'N/A'}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Code: ${currentStatute.code || 'N/A'}`);
            doc.text(`Description: ${currentStatute.aiSummary || currentStatute.description || 'N/A'}`);
            doc.moveDown();
            doc.fontSize(12).text(currentStatute.fullText || 'Full text not available.');
        } else {
            return new Response('Invalid report type', { status: 400 });
        }
        doc.end();
        const pdfData = await pdfPromise;
        // Convert Node.js Buffer to Uint8Array for Response
        return new Response(new Uint8Array(pdfData), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${type}-report-${id}.pdf"`,
            },
        });
    } catch (error) {
        console.error('Report generation failed:', error);
        return new Response('Failed to generate report', { status: 500 });
    }
}