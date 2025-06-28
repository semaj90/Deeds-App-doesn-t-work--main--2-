import { json } from '@sveltejs/kit';

// Simple in-memory store for canvas states
// In production this would use the database
let canvasStateStore: any[] = [];

export const GET = async ({ url }: any) => {
	try {
		const reportId = url.searchParams.get('reportId');
		
		if (reportId) {
			const canvasState = canvasStateStore.find(c => c.reportId === reportId);
			return json({ canvasState });
		}

		return json({ canvasStates: canvasStateStore });
	} catch (error) {
		console.error('Canvas state GET error:', error);
		return json({ error: 'Failed to fetch canvas state' }, { status: 500 });
	}
};

export const POST = async ({ request }: any) => {
	try {
		const data = await request.json();
		
		const canvasState = {
			id: crypto.randomUUID(),
			...data,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		canvasStateStore.push(canvasState);

		return json({ 
			success: true, 
			canvasState 
		});

	} catch (error) {
		console.error('Canvas state POST error:', error);
		return json({ error: 'Failed to save canvas state' }, { status: 500 });
	}
};

export const PUT = async ({ request }: any) => {
	try {
		const data = await request.json();
		const { id, ...updateData } = data;

		const index = canvasStateStore.findIndex(c => c.id === id);
		if (index === -1) {
			return json({ error: 'Canvas state not found' }, { status: 404 });
		}

		canvasStateStore[index] = {
			...canvasStateStore[index],
			...updateData,
			updatedAt: new Date().toISOString()
		};

		return json({ 
			success: true, 
			canvasState: canvasStateStore[index] 
		});

	} catch (error) {
		console.error('Canvas state PUT error:', error);
		return json({ error: 'Failed to update canvas state' }, { status: 500 });
	}
};
