import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { canvasStates } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url, locals }: RequestEvent) {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const reportId = url.searchParams.get('reportId');
		const canvasId = url.searchParams.get('id');

		if (canvasId) {
			// Get specific canvas state
			const canvasIdNumber = parseInt(canvasId, 10);
			if (isNaN(canvasIdNumber)) {
				return json({ error: 'Invalid canvas ID' }, { status: 400 });
			}
			
			const [canvasState] = await db.select()
				.from(canvasStates)
				.where(eq(canvasStates.id, canvasIdNumber))
				.limit(1);

			if (!canvasState) {
				return json({ error: 'Canvas state not found' }, { status: 404 });
			}

			return json(canvasState);
		} else if (reportId) {
			// Get all canvas states for a report
			const canvasStateList = await db.select()
				.from(canvasStates)
				.where(eq(canvasStates.reportId, reportId))
				.orderBy(desc(canvasStates.updatedAt));

			return json(canvasStateList);
		} else {
			return json({ error: 'Report ID or Canvas ID is required' }, { status: 400 });
		}
	} catch (error) {
		console.error('Error fetching canvas states:', error);
		return json({ error: 'Failed to fetch canvas states' }, { status: 500 });
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
		if (!data.reportId || !data.canvasData || !data.caseId) {
			return json({ error: 'Report ID, case ID and canvas data are required' }, { status: 400 });
		}

		const canvasStateData = {
			title: data.title || 'Untitled Canvas',
			reportId: data.reportId,
			caseId: data.caseId,
			canvasData: data.canvasData,
			thumbnailUrl: data.thumbnailUrl || null,
			dimensions: data.dimensions || { width: 800, height: 600 },
			backgroundColor: data.backgroundColor || '#ffffff',
			metadata: data.metadata || {},
			version: data.version || 1,
			isTemplate: data.isTemplate || false,
			createdBy: locals.user.id
		};

		const [newCanvasState] = await db.insert(canvasStates).values(canvasStateData).returning();

		return json(newCanvasState, { status: 201 });
	} catch (error) {
		console.error('Error creating canvas state:', error);
		return json({ error: 'Failed to create canvas state' }, { status: 500 });
	}
}

export async function PUT({ request }: RequestEvent) {
	try {
		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const data = await request.json();
		
		if (!data.id) {
			return json({ error: 'Canvas state ID is required' }, { status: 400 });
		}

		// Check if canvas state exists
		const existingCanvasState = await db.select()
			.from(canvasStates)
			.where(eq(canvasStates.id, data.id))
			.limit(1);

		if (!existingCanvasState.length) {
			return json({ error: 'Canvas state not found' }, { status: 404 });
		}

		const updateData: Record<string, any> = {
			title: data.title,
			canvasData: data.canvasData,
			thumbnailUrl: data.thumbnailUrl,
			dimensions: data.dimensions,
			backgroundColor: data.backgroundColor,
			metadata: data.metadata,
			version: data.version,
			isTemplate: data.isTemplate,
			updatedAt: new Date().toISOString()
		};

		// Remove undefined values
		Object.keys(updateData).forEach(key => {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		});

		const [updatedCanvasState] = await db
			.update(canvasStates)
			.set(updateData)
			.where(eq(canvasStates.id, data.id))
			.returning();

		return json(updatedCanvasState);
	} catch (error) {
		console.error('Error updating canvas state:', error);
		return json({ error: 'Failed to update canvas state' }, { status: 500 });
	}
}

export async function DELETE({ url }: RequestEvent) {
	try {
		if (!db) {
			return json({ error: 'Database not available' }, { status: 500 });
		}

		const canvasId = url.searchParams.get('id');
		if (!canvasId) {
			return json({ error: 'Canvas state ID is required' }, { status: 400 });
		}

		const canvasIdNumber = parseInt(canvasId, 10);
		if (isNaN(canvasIdNumber)) {
			return json({ error: 'Invalid canvas ID' }, { status: 400 });
		}

		// Check if canvas state exists
		const existingCanvasState = await db.select()
			.from(canvasStates)
			.where(eq(canvasStates.id, canvasIdNumber))
			.limit(1);

		if (!existingCanvasState.length) {
			return json({ error: 'Canvas state not found' }, { status: 404 });
		}

		// Delete the canvas state
		await db.delete(canvasStates).where(eq(canvasStates.id, canvasIdNumber));

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting canvas state:', error);
		return json({ error: 'Failed to delete canvas state' }, { status: 500 });
	}
}
