import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { chromium } from 'playwright';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { htmlContent, title, metadata } = await request.json();

		if (!htmlContent) {
			return json({ error: 'No HTML content provided' }, { status: 400 });
		}

		// Launch browser with Playwright
		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();

		// Set up the HTML content with proper styling for PDF
		const styledHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<title>${title || 'Legal Report'}</title>
				<style>
					@page {
						size: A4;
						margin: 1in;
					}
					body {
						font-family: 'Times New Roman', serif;
						font-size: 12pt;
						line-height: 1.6;
						color: #000;
					}
					h1, h2, h3 {
						color: #000;
						page-break-after: avoid;
					}
					h1 {
						font-size: 18pt;
						border-bottom: 2px solid #000;
						padding-bottom: 10px;
					}
					h2 {
						font-size: 16pt;
						margin-top: 20px;
					}
					h3 {
						font-size: 14pt;
						margin-top: 15px;
					}
					.citation {
						background-color: #f5f5f5;
						border-left: 4px solid #2563eb;
						padding: 10px;
						margin: 10px 0;
						font-size: 11pt;
					}
					.citation-hover {
						display: inline;
						background-color: #e6f3ff;
						padding: 2px 4px;
						border-radius: 3px;
						text-decoration: underline;
					}
					.evidence-image {
						max-width: 100%;
						height: auto;
						border: 1px solid #ccc;
						margin: 10px 0;
					}
					.metadata {
						font-size: 10pt;
						color: #666;
						border-top: 1px solid #ccc;
						padding-top: 10px;
						margin-top: 20px;
					}
					.page-break {
						page-break-before: always;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						margin: 10px 0;
					}
					th, td {
						border: 1px solid #ccc;
						padding: 8px;
						text-align: left;
					}
					th {
						background-color: #f5f5f5;
						font-weight: bold;
					}
				</style>
			</head>
			<body>
				<header>
					<h1>${title || 'Legal Report'}</h1>
					${metadata?.caseNumber ? `<p><strong>Case Number:</strong> ${metadata.caseNumber}</p>` : ''}
					${metadata?.date ? `<p><strong>Date:</strong> ${metadata.date}</p>` : ''}
					${metadata?.author ? `<p><strong>Author:</strong> ${metadata.author}</p>` : ''}
				</header>
				
				<main>
					${htmlContent}
				</main>
				
				<footer class="metadata">
					<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
					${metadata?.version ? `<p><strong>Version:</strong> ${metadata.version}</p>` : ''}
				</footer>
			</body>
			</html>
		`;

		// Set content and wait for it to load
		await page.setContent(styledHtml, { waitUntil: 'networkidle' });

		// Generate PDF
		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			displayHeaderFooter: true,
			headerTemplate: `
				<div style="font-size: 10px; width: 100%; text-align: center; padding: 10px;">
					<span class="title">${title || 'Legal Report'}</span>
				</div>
			`,
			footerTemplate: `
				<div style="font-size: 10px; width: 100%; text-align: center; padding: 10px;">
					<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
				</div>
			`,
			margin: {
				top: '0.5in',
				bottom: '0.5in',
				left: '1in',
				right: '1in'
			}
		});

		await browser.close();

		// Return PDF as base64 for frontend handling
		const pdfBase64 = pdfBuffer.toString('base64');

		return json({
			success: true,
			pdf: pdfBase64,
			filename: `${title?.replace(/[^a-zA-Z0-9]/g, '_') || 'legal_report'}_${Date.now()}.pdf`,
			size: pdfBuffer.length
		});

	} catch (error) {
		console.error('PDF generation error:', error);
		return json({
			error: 'Failed to generate PDF',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

// Alternative endpoint for direct PDF download
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { htmlContent, title, metadata } = await request.json();

		if (!htmlContent) {
			return new Response('No HTML content provided', { status: 400 });
		}

		// Use the same PDF generation logic
		const browser = await chromium.launch({ headless: true });
		const page = await browser.newPage();

		const styledHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<title>${title || 'Legal Report'}</title>
				<style>
					@page { size: A4; margin: 1in; }
					body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
					h1 { font-size: 18pt; border-bottom: 2px solid #000; padding-bottom: 10px; }
					.citation { background-color: #f5f5f5; border-left: 4px solid #2563eb; padding: 10px; margin: 10px 0; }
				</style>
			</head>
			<body>
				<h1>${title || 'Legal Report'}</h1>
				${htmlContent}
				<div style="margin-top: 30px; font-size: 10pt; color: #666;">
					Generated: ${new Date().toLocaleString()}
				</div>
			</body>
			</html>
		`;

		await page.setContent(styledHtml, { waitUntil: 'networkidle' });
		const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
		await browser.close();

		// Return PDF directly for download
		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${title?.replace(/[^a-zA-Z0-9]/g, '_') || 'legal_report'}.pdf"`
			}
		});

	} catch (error) {
		console.error('PDF download error:', error);
		return new Response('Failed to generate PDF', { status: 500 });
	}
};
