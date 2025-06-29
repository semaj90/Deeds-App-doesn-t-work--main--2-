import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { citationPoints } from '$lib/server/db/schema';
import { eq, and, like, desc } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url }: RequestEvent) {
	try {
		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const caseId = url.searchParams.get('caseId');
		const reportId = url.searchParams.get('reportId');
		const type = url.searchParams.get('type');
		const search = url.searchParams.get('search');
		const bookmarked = url.searchParams.get('bookmarked');
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let query = db.select().from(citationPoints);
		const conditions: any[] = [];

		if (caseId) {
			conditions.push(eq(citationPoints.caseId, caseId));
		}

		if (reportId) {
			conditions.push(eq(citationPoints.reportId, reportId));
		}

		if (type) {
			conditions.push(eq(citationPoints.type, type));
		}

		if (search) {
			conditions.push(like(citationPoints.text, `%${search}%`));
		}

		if (bookmarked === 'true') {
			conditions.push(eq(citationPoints.isBookmarked, true));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions)) as any;
		}

		const results = await query
			.orderBy(desc(citationPoints.relevanceScore), desc(citationPoints.createdAt))
			.limit(limit)
			.offset(offset);

		return json(results);
	} catch (error) {
		console.error('Error fetching citation points:', error);
		return json({ error: 'Failed to fetch citation points' }, { status: 500 });
	}
}

export async function POST({ request }: RequestEvent) {
	try {
		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const data = await request.json();
		
		// Validate required fields
		if (!data.text || !data.source) {
			return json({ error: 'Text and source are required' }, { status: 400 });
		}

		const citationData = {
			text: data.text,
			source: data.source,
			page: data.page || null,
			context: data.context || '',
			type: data.type || 'statute',
			jurisdiction: data.jurisdiction || '',
			tags: data.tags || [],
			caseId: data.caseId || null,
			reportId: data.reportId || null,
			evidenceId: data.evidenceId || null,
			statuteId: data.statuteId || null,
			aiSummary: data.aiSummary || null,
			relevanceScore: data.relevanceScore || '0.0',
			metadata: data.metadata || {},
			isBookmarked: data.isBookmarked || false,
			usageCount: 0,
			createdBy: '1' // Default user ID for now
		};

		const [newCitation] = await db.insert(citationPoints).values(citationData).returning();

		return json(newCitation, { status: 201 });
	} catch (error) {
		console.error('Error creating citation point:', error);
		return json({ error: 'Failed to create citation point' }, { status: 500 });
	}
}

export async function PUT({ request }: RequestEvent) {
	try {
		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const data = await request.json();
		
		if (!data.id) {
			return json({ error: 'Citation ID is required' }, { status: 400 });
		}

		// Check if citation exists
		const existingCitation = await db.select()
			.from(citationPoints)
			.where(eq(citationPoints.id, data.id))
			.limit(1);

		if (!existingCitation.length) {
			return json({ error: 'Citation not found' }, { status: 404 });
		}

		const updateData: Record<string, any> = {
			text: data.text,
			source: data.source,
			page: data.page,
			context: data.context,
			type: data.type,
			jurisdiction: data.jurisdiction,
			tags: data.tags,
			caseId: data.caseId,
			reportId: data.reportId,
			evidenceId: data.evidenceId,
			statuteId: data.statuteId,
			aiSummary: data.aiSummary,
			relevanceScore: data.relevanceScore,
			metadata: data.metadata,
			isBookmarked: data.isBookmarked,
			usageCount: data.usageCount,
			updatedAt: new Date().toISOString()
		};

		// Remove undefined values
		Object.keys(updateData).forEach(key => {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		});

		const [updatedCitation] = await db
			.update(citationPoints)
			.set(updateData)
			.where(eq(citationPoints.id, data.id))
			.returning();

		return json(updatedCitation);
	} catch (error) {
		console.error('Error updating citation point:', error);
		return json({ error: 'Failed to update citation point' }, { status: 500 });
	}
}

export async function DELETE({ url }: RequestEvent) {
	try {
		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const citationId = url.searchParams.get('id');
		if (!citationId) {
			return json({ error: 'Citation ID is required' }, { status: 400 });
		}

		// Check if citation exists
		const existingCitation = await db.select()
			.from(citationPoints)
			.where(eq(citationPoints.id, citationId))
			.limit(1);

		if (!existingCitation.length) {
			return json({ error: 'Citation not found' }, { status: 404 });
		}

		// Delete the citation
		await db.delete(citationPoints).where(eq(citationPoints.id, citationId));

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting citation point:', error);
		return json({ error: 'Failed to delete citation point' }, { status: 500 });
	}
}
