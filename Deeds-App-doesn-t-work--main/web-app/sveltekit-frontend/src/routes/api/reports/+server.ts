import { db } from '$lib/server/db';
import { cases, statutes, criminals, evidence, caseCriminals } from '$lib/server/db/schema-new'; // Use unified schema
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';

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
    
    // Use a promise to handle the stream completion
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

            doc.fontSize(25).text(`Case Report: ${currentCase.title}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Case Title: ${currentCase.title}`);
            doc.text(`Status: ${currentCase.status}`);
            doc.text(`Date Opened: ${currentCase.createdAt?.toDateString()}`);
            doc.text(`Description: ${currentCase.description || 'N/A'}`);
            doc.text(`Verdict: ${currentCase.verdict || 'N/A'}`);
            doc.text(`Danger Score: ${currentCase.dangerScore || 0}`);
            doc.text(`AI Summary: ${currentCase.aiSummary || 'N/A'}`);
            const tags = Array.isArray(currentCase.aiTags) ? currentCase.aiTags : [];
            doc.text(`Tags: ${tags.join(', ') || 'N/A'}`);
            doc.moveDown();

            // Linked Criminals
            const linkedCriminals = await db.query.caseCriminals.findMany({
                where: eq(caseCriminals.caseId, caseId),
                with: { criminal: true }
            });

            if (linkedCriminals.length > 0) {
                doc.fontSize(16).text('Linked People of Interest:', { underline: true });
                doc.moveDown();
                for (const link of linkedCriminals) {
                    const criminal = link.criminal;
                    if (criminal) {
                        doc.fontSize(12).text(`- ${criminal.firstName} ${criminal.lastName} (Role: ${link.role}, Threat Level: ${criminal.threatLevel || 'N/A'})`);
                        const aliases = Array.isArray(criminal.aliases) ? criminal.aliases : [];
                        doc.text(`  Aliases: ${aliases.join(', ') || 'N/A'}`);
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

            if (caseEvidence.length > 0) {
                doc.fontSize(16).text('Linked Evidence:', { underline: true });
                doc.moveDown();
                caseEvidence.forEach(item => {
                    doc.fontSize(12).text(`- ${item.fileName} (${item.fileType}, ${item.fileSize} bytes)`);
                    doc.text(`  Summary: ${item.summary || 'N/A'}`);
                    const evidenceTags = Array.isArray(item.tags) ? item.tags : [];
                    doc.text(`  Tags: ${evidenceTags.join(', ') || 'N/A'}`);
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
            doc.fontSize(25).text(`Statute Report: ${currentStatute.title}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Code: ${currentStatute.code}`);
            doc.text(`Description: ${currentStatute.summary || 'N/A'}`);
            doc.moveDown();
            doc.fontSize(12).text(currentStatute.fullText || 'Full text not available.');
        } else {
            return new Response('Invalid report type', { status: 400 });
        }

        doc.end();
        const pdfData = await pdfPromise;

        return new Response(pdfData, {
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