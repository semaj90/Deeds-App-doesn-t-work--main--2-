import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { crimes, criminals, statutes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/crimes/[id] - Get a single crime by ID
export async function GET({ params }) {
    try {
        const crimeId = parseInt(params.id);
        if (isNaN(crimeId)) {
            return json({ error: 'Invalid crime ID' }, { status: 400 });
        }
        const singleCrime = await db.select({
            crime: crimes,
            criminal: criminals,
            statute: statutes
        })
        .from(crimes)
        .innerJoin(criminals, eq(crimes.criminalId, criminals.id))
        .innerJoin(statutes, eq(crimes.statuteId, statutes.id))
        .where(eq(crimes.id, crimeId))
        .limit(1);

        if (singleCrime.length === 0) {
            return json({ error: 'Crime not found' }, { status: 404 });
        }
        return json({
            ...singleCrime[0].crime,
            criminal: singleCrime[0].criminal,
            statute: singleCrime[0].statute
        });
    } catch (error) {
        console.error(`Error fetching crime with ID ${params.id}:`, error);
        return json({ error: 'Failed to fetch crime', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// PUT /api/crimes/[id] - Update a crime by ID
export async function PUT({ params, request }) {
    const crimeId = parseInt(params.id);
    if (isNaN(crimeId)) {
        return json({ error: 'Invalid crime ID' }, { status: 400 });
    }

    try {
        const { name, description, statuteId, criminalId } = await request.json();

        if (!name || !statuteId || !criminalId) {
            return json({ error: 'Name, statute ID, and criminal ID are required' }, { status: 400 });
        }

        const updatedCrime = await db.update(crimes)
            .set({
                name,
                description,
                statuteId: parseInt(statuteId),
                criminalId: parseInt(criminalId)
            })
            .where(eq(crimes.id, crimeId))
            .returning();

        if (updatedCrime.length === 0) {
            return json({ error: 'Crime not found or no changes made' }, { status: 404 });
        }
        return json(updatedCrime[0]);
    } catch (error) {
        console.error(`Error updating crime with ID ${params.id}:`, error);
        return json({ error: 'Failed to update crime', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// DELETE /api/crimes/[id] - Delete a crime by ID
export async function DELETE({ params }) {
    try {
        const crimeId = parseInt(params.id);
        if (isNaN(crimeId)) {
            return json({ error: 'Invalid crime ID' }, { status: 400 });
        }
        const deletedCrime = await db.delete(crimes)
            .where(eq(crimes.id, crimeId))
            .returning();
        if (deletedCrime.length === 0) {
            return json({ error: 'Crime not found' }, { status: 404 });
        }
        return json({ message: 'Crime deleted successfully' });
    } catch (error) {
        console.error(`Error deleting crime with ID ${params.id}:`, error);
        return json({ error: 'Failed to delete crime', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}