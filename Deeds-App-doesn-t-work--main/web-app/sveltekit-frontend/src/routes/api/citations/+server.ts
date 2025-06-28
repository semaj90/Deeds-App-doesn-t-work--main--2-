import { json } from '@sveltejs/kit';

// For now, create a simple in-memory store for citations
// In production, this would use the database with citationPoints table
let citationStore: any[] = [];

export const GET = async ({ url }: any) => {
	try {
		const reportId = url.searchParams.get('reportId');
		
		if (reportId) {
			const citations = citationStore.filter(c => c.reportId === reportId);
			return json({ citations });
		}

		return json({ citations: citationStore });
	} catch (error) {
		console.error('Citation GET error:', error);
		return json({ error: 'Failed to fetch citations' }, { status: 500 });
	}
};

export const POST = async ({ request }: any) => {
	try {
		const data = await request.json();
		
		const citation = {
			id: crypto.randomUUID(),
			...data,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		citationStore.push(citation);

		return json({ 
			success: true, 
			citation 
		});

	} catch (error) {
		console.error('Citation POST error:', error);
		return json({ error: 'Failed to create citation' }, { status: 500 });
	}
};

export const PUT = async ({ request }: any) => {
	try {
		const data = await request.json();
		const { id, ...updateData } = data;

		const index = citationStore.findIndex(c => c.id === id);
		if (index === -1) {
			return json({ error: 'Citation not found' }, { status: 404 });
		}

		citationStore[index] = {
			...citationStore[index],
			...updateData,
			updatedAt: new Date().toISOString()
		};

		return json({ 
			success: true, 
			citation: citationStore[index] 
		});

	} catch (error) {
		console.error('Citation PUT error:', error);
		return json({ error: 'Failed to update citation' }, { status: 500 });
	}
};

export const DELETE = async ({ request }: any) => {
	try {
		const { id } = await request.json();

		const index = citationStore.findIndex(c => c.id === id);
		if (index === -1) {
			return json({ error: 'Citation not found' }, { status: 404 });
		}

		citationStore.splice(index, 1);

		return json({ success: true });

	} catch (error) {
		console.error('Citation DELETE error:', error);
		return json({ error: 'Failed to delete citation' }, { status: 500 });
	}
};
