import { db } from '$lib/server/db';
import { statutes, lawParagraphs, caseLawLinks, cases } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
    const statuteId = parseInt(params.id);

    if (isNaN(statuteId)) {
        throw error(400, 'Invalid statute ID');
    }

    const statute = await db.query.statutes.findFirst({
        where: eq(statutes.id, statuteId),
    });

    if (!statute) {
        throw error(404, 'Statute not found');
    }

    const paragraphs = await db.query.lawParagraphs.findMany({
        where: eq(lawParagraphs.statuteId, statuteId),
        orderBy: lawParagraphs.id, // Order by ID to maintain consistent paragraph order
    });

    // Fetch linked cases for each paragraph
    const paragraphsWithLinkedCases = await Promise.all(
        paragraphs.map(async (paragraph) => {
            const links = await db.query.caseLawLinks.findMany({
                where: eq(caseLawLinks.lawId, paragraph.id),
                with: {
                    case: true, // Eager load the case details
                },
            });
            return {
                ...paragraph,
                linkedCases: links.map(link => link.case).filter(Boolean), // Extract case objects
            };
        })
    );

    return {
        statute,
        paragraphs: paragraphsWithLinkedCases,
    };
};