import { db } from '$lib/server/db';
import { cases, statutes, lawParagraphs, criminals, evidence } from '$lib/server/db/schema';
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
    doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        return new Response(pdfData, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${type}-report-${id}.pdf"`,
            },
        });
    });

    try {
        if (type === 'case') {
            const caseId = id;
            const caseItem = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);

            if (!caseItem.length) {
                return new Response('Case not found', { status: 404 });
            }

            const currentCase = caseItem[0];

            doc.fontSize(25).text(`Case Report: ${currentCase.title}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Case Name: ${currentCase.name}`);
            doc.text(`Status: ${currentCase.status}`);
            doc.text(`Date Opened: ${currentCase.dateOpened?.toDateString()}`);
            doc.text(`Summary: ${currentCase.summary || 'N/A'}`);
            doc.text(`Description: ${currentCase.description || 'N/A'}`);
            doc.text(`Verdict: ${currentCase.verdict || 'N/A'}`);
            doc.text(`Court Dates: ${currentCase.courtDates || 'N/A'}`);
            doc.text(`Danger Score: ${currentCase.dangerScore || 0}`);
            doc.text(`AI Summary: ${currentCase.aiSummary || 'N/A'}`);
            doc.text(`Tags: ${(currentCase.tags as string[]).join(', ') || 'N/A'}`);
            doc.moveDown();

            // Linked Criminals
            if (currentCase.linkedCriminals) {
                const criminalIds = JSON.parse(currentCase.linkedCriminals as string);
                if (criminalIds.length > 0) {
                    doc.fontSize(16).text('Linked People of Interest:', { underline: true });
                    doc.moveDown();
                    for (const criminalId of criminalIds) {
                        const criminalItem = await db.select().from(criminals).where(eq(criminals.id, criminalId)).limit(1);
                        if (criminalItem.length > 0) {
                            const criminal = criminalItem[0];
                            doc.fontSize(12).text(`- ${criminal.firstName} ${criminal.lastName} (Threat Level: ${criminal.threatLevel || 'N/A'})`);
                            doc.text(`  Aliases: ${(criminal.aliases as string[]).join(', ') || 'N/A'}`);
                            doc.text(`  Conviction Status: ${criminal.convictionStatus || 'N/A'}`);
                            doc.moveDown();
                        }
                    }
                }
            }

            // Linked Evidence
            const caseEvidence = await db.select().from(evidence).where(eq(evidence.caseId, caseId));
            if (caseEvidence.length > 0) {
                doc.fontSize(16).text('Linked Evidence:', { underline: true });
                doc.moveDown();
                caseEvidence.forEach(item => {
                    doc.fontSize(12).text(`- ${item.fileName} (${item.fileType}, ${item.fileSize} bytes)`);
                    doc.text(`  Summary: ${item.summary || 'N/A'}`);
                    doc.text(`  Tags: ${(item.tags as string[]).join(', ') || 'N/A'}`);
                    doc.moveDown();
                });
            }

        } else if (type === 'statute') {
            const statuteId = id;
            const statuteItem = await db.select().from(statutes).where(eq(statutes.id, statuteId)).limit(1);

            if (!statuteItem.length) {
                return new Response('Statute not found', { status: 404 });
            }

            const currentStatute = statuteItem[0];
            doc.fontSize(25).text(`Statute Report: ${currentStatute.name}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(14).text(`Section Number: ${currentStatute.sectionNumber}`);
            doc.text(`Description: ${currentStatute.description || 'N/A'}`);
            doc.moveDown();

            const paragraphs = await db.select().from(lawParagraphs).where(eq(lawParagraphs.statuteId, statuteId));
            if (paragraphs.length > 0) {
                doc.fontSize(16).text('Law Paragraphs:', { underline: true });
                doc.moveDown();
                paragraphs.forEach(paragraph => {
                    doc.fontSize(12).text(`Anchor ID: ${paragraph.anchorId || 'N/A'}`);
                    doc.text(paragraph.paragraphText || 'No content available');
                    doc.text(`Linked Cases: ${(paragraph.linkedCaseIds as number[]).join(', ') || 'N/A'}`);
                    doc.text(`Crime Suggestions: ${(paragraph.crimeSuggestions as string[]).join(', ') || 'N/A'}`);
                    doc.moveDown();
                });
            }

        } else {
            return new Response('Invalid report type', { status: 400 });
        }

        doc.end();
        // Return the response after the 'end' event has fired
        return new Promise(resolve => doc.on('end', () => resolve(new Response(Buffer.concat(buffers), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${type}-report-${id}.pdf"`,
            },
        }))));

    } catch (error) {
        console.error('Error generating PDF report:', error);
        return new Response('Failed to generate PDF report', { status: 500 });
    }
}