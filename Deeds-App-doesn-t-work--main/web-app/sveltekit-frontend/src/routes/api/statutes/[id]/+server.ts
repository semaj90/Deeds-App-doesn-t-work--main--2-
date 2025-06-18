import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/statutes/[id] - Get a single statute by ID
export async function GET({ params }) {
    try {
        const statuteId = params.id;
        if (!statuteId) {
            return json({ error: 'Invalid statute ID' }, { status: 400 });
        }
        const singleStatute = await db.select().from(statutes).where(eq(statutes.id, statuteId)).limit(1);
        if (singleStatute.length === 0) {
            return json({ error: 'Statute not found' }, { status: 404 });
        }
        return json(singleStatute[0]);
    } catch (error) {
        console.error(`Error fetching statute with ID ${params.id}:`, error);
        return json({ error: 'Failed to fetch statute', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// PUT /api/statutes/[id] - Update a statute by ID
export async function PUT({ params, request }) {
    const statuteId = params.id;
    if (!statuteId) {
        return json({ error: 'Invalid statute ID' }, { status: 400 });
    }

    try {
        const { name, description, sectionNumber } = await request.json();

        if (!name || !sectionNumber) {
            return json({ error: 'Name and section number are required' }, { status: 400 });
        }

        const updatedStatute = await db.update(statutes)
            .set({
                name,
                description,
                sectionNumber
            })
            .where(eq(statutes.id, statuteId))
            .returning();

        if (updatedStatute.length === 0) {
            return json({ error: 'Statute not found or no changes made' }, { status: 404 });
        }
        return json(updatedStatute[0]);
    } catch (error) {
        console.error(`Error updating statute with ID ${params.id}:`, error);
        return json({ error: 'Failed to update statute', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// DELETE /api/statutes/[id] - Delete a statute by ID
export async function DELETE({ params }) {
    try {
        const statuteId = params.id;
        if (!statuteId) {
            return json({ error: 'Invalid statute ID' }, { status: 400 });
        }
        const deletedStatute = await db.delete(statutes)
            .where(eq(statutes.id, statuteId))
            .returning();
        if (deletedStatute.length === 0) {
            return json({ error: 'Statute not found' }, { status: 404 });
        }
        return json({ message: 'Statute deleted successfully' });
    } catch (error) {
        console.error(`Error deleting statute with ID ${params.id}:`, error);
        return json({ error: 'Failed to delete statute', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}