import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/criminals/[id] - Get a single criminal by ID
export async function GET({ params }) {
    try {
        const criminalId = params.id;
        if (!criminalId) {
            return json({ error: 'Invalid criminal ID' }, { status: 400 });
        }
        const singleCriminal = await db.select().from(criminals).where(eq(criminals.id, criminalId)).limit(1);
        if (singleCriminal.length === 0) {
            return json({ error: 'Criminal not found' }, { status: 404 });
        }
        return json(singleCriminal[0]);
    } catch (error) {
        console.error(`Error fetching criminal with ID ${params.id}:`, error);
        return json({ error: 'Failed to fetch criminal', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}

// PUT /api/criminals/[id] - Update a criminal by ID
export async function PUT({ params, request }) {
    const criminalId = params.id;
    if (!criminalId) {
        return json({ error: 'Invalid criminal ID' }, { status: 400 });
    }

    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            address,
            phone,
            email,
            photoUrl,
            convictionStatus,
            threatLevel,
            sentenceLength,
            convictionDate,
            escapeAttempts,
            gangAffiliations,
            notes,
            aliases,
            priors,
            convictions
        } = await request.json();

        if (!firstName || !lastName) {
            return json({ error: 'First name and last name are required' }, { status: 400 });
        }

        const updatedCriminal = await db.update(criminals)
            .set({
                firstName,
                lastName,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                address,
                phone,
                email,
                photoUrl,
                convictionStatus,
                threatLevel,
                sentenceLength,
                convictionDate: convictionDate ? new Date(convictionDate) : undefined,
                escapeAttempts,
                gangAffiliations,
                notes,
                aliases,
                priors,
                convictions
            })
            .where(eq(criminals.id, criminalId))
            .returning();

        if (updatedCriminal.length === 0) {
            return json({ error: 'Criminal not found or no changes made' }, { status: 404 });
        }
        return json(updatedCriminal[0]);
    } catch (error) {
        console.error(`Error updating criminal with ID ${params.id}:`, error);
        return json({ error: 'Failed to update criminal', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}
// DELETE /api/criminals/[id] - Delete a criminal by ID
export async function DELETE({ params }) {
    try {
        const criminalId = params.id;
        if (!criminalId) {
            return json({ error: 'Invalid criminal ID' }, { status: 400 });
        }
        const deletedCriminal = await db.delete(criminals)
            .where(eq(criminals.id, criminalId))
            .returning();
        if (deletedCriminal.length === 0) {
            return json({ error: 'Criminal not found' }, { status: 404 });
        }
        return json({ message: 'Criminal deleted successfully' });
    } catch (error) {
        console.error(`Error deleting criminal with ID ${params.id}:`, error);
        return json({ error: 'Failed to delete criminal', details: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
    }
}