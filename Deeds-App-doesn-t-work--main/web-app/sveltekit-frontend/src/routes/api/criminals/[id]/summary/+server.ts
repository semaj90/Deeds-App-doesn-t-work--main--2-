import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ params }) => {
  const criminalId = params.id;

  if (!criminalId) {
    return new Response(JSON.stringify({ error: 'Invalid criminal ID' }), { status: 400 });
  }

  const criminalResults = await db.select().from(criminals).where(eq(criminals.id, criminalId)).limit(1);
  const criminal = criminalResults[0];

  if (!criminal) {
    return new Response(JSON.stringify({ error: 'Criminal not found' }), { status: 404 });
  }

  const summary = generateSummaryFromCriminal(criminal); // could use priors + convictions

  return new Response(JSON.stringify({ summary }), { status: 200 });
};

function generateSummaryFromCriminal(c: typeof criminals.$inferSelect | undefined) {
  if (!c) return '';
  
  // Handle priors as string array (as defined in schema)
  const priorsArray = (c.priors as string[] | null | undefined) || [];
  const priorsText = priorsArray.length > 0
    ? ` including ${priorsArray.join(', ')}`
    : '';
  return `Criminal with ${priorsArray.length} prior offenses${priorsText}.`;
}