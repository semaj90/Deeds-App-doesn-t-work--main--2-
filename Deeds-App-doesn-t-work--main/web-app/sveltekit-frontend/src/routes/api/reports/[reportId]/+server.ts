import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// Mock database - in real app would use Drizzle ORM
const reports = new Map();

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { reportId } = params;
		
		if (!reportId) {
			return json({ error: 'Report ID is required' }, { status: 400 });
		}
		
		const report = reports.get(reportId);
		
		if (!report) {
			return json({ error: 'Report not found' }, { status: 404 });
		}
		
		return json(report);
		
	} catch (error) {
		console.error('Error fetching report:', error);
		return json({ error: 'Failed to fetch report' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { reportId } = params;
		const updates = await request.json();
		
		if (!reportId) {
			return json({ error: 'Report ID is required' }, { status: 400 });
		}
		
		let report = reports.get(reportId);
		
		if (!report) {
			// Create new report if it doesn't exist
			report = {
				id: reportId,
				caseId: updates.caseId || 'default-case',
				title: updates.title || 'Untitled Report',
				content: updates.content || '',
				citations: updates.citations || [],
				metadata: updates.metadata || {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
		} else {
			// Update existing report
			report = {
				...report,
				...updates,
				updatedAt: new Date().toISOString()
			};
		}
		
		reports.set(reportId, report);
		
		return json({
			success: true,
			report,
			message: 'Report saved successfully'
		});
		
	} catch (error) {
		console.error('Error saving report:', error);
		return json({ error: 'Failed to save report' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { reportId } = params;
		
		if (!reportId) {
			return json({ error: 'Report ID is required' }, { status: 400 });
		}
		
		if (!reports.has(reportId)) {
			return json({ error: 'Report not found' }, { status: 404 });
		}
		
		reports.delete(reportId);
		
		return json({
			success: true,
			message: 'Report deleted successfully'
		});
		
	} catch (error) {
		console.error('Error deleting report:', error);
		return json({ error: 'Failed to delete report' }, { status: 500 });
	}
};
