import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { reports, citationPoints, canvasStates } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url, locals }: RequestEvent) {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const caseId = url.searchParams.get('caseId');
		const reportType = url.searchParams.get('reportType');
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		let query = db.select().from(reports);
		const conditions: any[] = [];

		if (caseId) {
			conditions.push(eq(reports.caseId, caseId));
		}

		if (reportType) {
			conditions.push(eq(reports.reportType, reportType));
		}

		if (status) {
			conditions.push(eq(reports.status, status));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as any;
		}

		const reportResults = await query
			.orderBy(desc(reports.updatedAt))
			.limit(limit)
			.offset(offset);

		// Get associated citation points and canvas states for each report
		const enrichedReports = await Promise.all(
			reportResults.map(async (report: any) => {
				const [citations, canvasState] = await Promise.all([
					db.select()
						.from(citationPoints)
						.where(eq(citationPoints.reportId, report.id)),
					db.select()
						.from(canvasStates)
						.where(eq(canvasStates.reportId, report.id))
						.limit(1)
				]);

				return {
					...report,
					citationPoints: citations,
					canvasState: canvasState[0] || null
				};
			})
		);

		return json(enrichedReports);
	} catch (error) {
		console.error('Error fetching reports:', error);
		return json({ error: 'Failed to fetch reports' }, { status: 500 });
	}
}

export async function POST({ request, locals }: RequestEvent) {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const data = await request.json();
		
		// Validate required fields
		if (!data.title || !data.caseId) {
			return json({ error: 'Title and case ID are required' }, { status: 400 });
		}

		// Calculate word count and estimated read time
		const textContent = data.content ? 
			data.content.replace(/<[^>]*>/g, '').trim() : '';
		const wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length;
		const estimatedReadTime = Math.ceil(wordCount / 200);

		const reportData = {
			title: data.title,
			content: data.content || '',
			summary: data.summary || '',
			caseId: data.caseId,
			reportType: data.reportType || 'prosecution_memo',
			status: data.status || 'draft',
			confidentialityLevel: data.confidentialityLevel || 'restricted',
			jurisdiction: data.jurisdiction || '',
			tags: data.tags || [],
			metadata: data.metadata || {},
			sections: data.sections || [],
			aiSummary: data.aiSummary || null,
			aiTags: data.aiTags || [],
			wordCount,
			estimatedReadTime,
			templateId: data.templateId || null,
			createdBy: locals.user.id,
			lastEditedBy: locals.user.id
		};

		const [newReport] = await db.insert(reports).values(reportData).returning();

		return json(newReport, { status: 201 });
	} catch (error) {
		console.error('Error creating report:', error);
		return json({ error: 'Failed to create report' }, { status: 500 });
	}
}

export async function PUT({ request, locals }: RequestEvent) {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const data = await request.json();
		
		if (!data.id) {
			return json({ error: 'Report ID is required' }, { status: 400 });
		}

		// Check if report exists
		const existingReport = await db.select()
			.from(reports)
			.where(eq(reports.id, data.id))
			.limit(1);

		if (!existingReport.length) {
			return json({ error: 'Report not found' }, { status: 404 });
		}

		// Calculate word count and estimated read time
		const textContent = data.content ? 
			data.content.replace(/<[^>]*>/g, '').trim() : '';
		const wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length;
		const estimatedReadTime = Math.ceil(wordCount / 200);

		const updateData: Record<string, any> = {
			title: data.title,
			content: data.content,
			summary: data.summary,
			reportType: data.reportType,
			status: data.status,
			confidentialityLevel: data.confidentialityLevel,
			jurisdiction: data.jurisdiction,
			tags: data.tags,
			metadata: data.metadata,
			sections: data.sections,
			aiSummary: data.aiSummary,
			aiTags: data.aiTags,
			wordCount,
			estimatedReadTime,
			lastEditedBy: locals.user.id,
			updatedAt: new Date().toISOString()
		};

		// Remove undefined values
		Object.keys(updateData).forEach(key => {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		});

		const [updatedReport] = await db
			.update(reports)
			.set(updateData)
			.where(eq(reports.id, data.id))
			.returning();

		return json(updatedReport);
	} catch (error) {
		console.error('Error updating report:', error);
		return json({ error: 'Failed to update report' }, { status: 500 });
	}
}

export async function DELETE({ url, locals }: RequestEvent) {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const reportId = url.searchParams.get('id');
		if (!reportId) {
			return json({ error: 'Report ID is required' }, { status: 400 });
		}

		// Check if report exists
		const existingReport = await db.select()
			.from(reports)
			.where(eq(reports.id, reportId))
			.limit(1);

		if (!existingReport.length) {
			return json({ error: 'Report not found' }, { status: 404 });
		}

		// Delete the report (cascade will handle related records)
		await db.delete(reports).where(eq(reports.id, reportId));

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting report:', error);
		return json({ error: 'Failed to delete report' }, { status: 500 });
	}
}
