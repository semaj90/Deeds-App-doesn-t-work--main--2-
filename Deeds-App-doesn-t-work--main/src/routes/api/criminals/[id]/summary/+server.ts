import { db } from '$lib/server/db';
import { criminals } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async ({ params }) => {
  const criminalId = parseInt(params.id);

  if (isNaN(criminalId)) {
    return new Response(JSON.stringify({ error: 'Invalid criminal ID' }), { status: 400 });
  }

  const criminal = await db.query.criminals.findFirst({
    where: (c) => eq(c.id, criminalId),
  });

  const summary = generateSummaryFromCriminal(criminal); // could use priors + convictions

  return new Response(JSON.stringify({ summary }), { status: 200 });
};

function generateSummaryFromCriminal(c: typeof criminals.$inferSelect | undefined) {
  if (!c) return '';
  const priorsArray = (c.priors as { date: string, crime: string, outcome: string }[] | null | undefined) || [];
  const priorsText = priorsArray.length > 0
    ? ` including ${priorsArray.map(p => p.crime).join(', ')}`
    : '';
  return `Criminal with ${priorsArray.length} prior offenses${priorsText}.`;
}