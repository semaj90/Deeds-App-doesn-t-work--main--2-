import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { cases, evidenceFiles } from '$lib/server/db/schema-new.js'; // Use unified schema
import { desc, eq, count, sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Get recent cases (last 10) with evidence counts
		const recentCasesWithCounts = await db
			.select({
				id: cases.id,
				title: cases.title,
				description: cases.description,
				status: cases.status,
				createdAt: cases.createdAt,
				updatedAt: cases.updatedAt,
				evidenceCount: sql<number>`count(${evidenceFiles.id})`.mapWith(Number) // Count from evidenceFiles
			})
			.from(cases)
			.leftJoin(evidenceFiles, eq(cases.id, evidenceFiles.caseId)) // Join with evidenceFiles
			.groupBy(cases.id) // Group by case to count evidence
			.orderBy(desc(cases.updatedAt))
			.limit(10);

		if (recentCasesWithCounts.length === 0) {
			// Fallback demo data
			return json([
				{
					id: 'demo1',
					title: 'Demo Case: Missing Evidence',
					description: 'A sample case for demonstration purposes.',
					status: 'active',
					createdAt: new Date(),
					updatedAt: new Date(),
					evidenceCount: 2,
					formattedDate: new Date().toLocaleDateString(),
					timeAgo: 'just now'
				}
			]);
		} else {
			const casesWithCounts = recentCasesWithCounts.map(c => ({
				...c,
				formattedDate: new Date(c.updatedAt).toLocaleDateString(),
				timeAgo: getTimeAgo(new Date(c.updatedAt))
			}));
			return json(casesWithCounts);
		}
	} catch (error) {
		// Fallback demo data on error
		return json([
			{
				id: 'demo1',
				title: 'Demo Case: Missing Evidence',
				description: 'A sample case for demonstration purposes.',
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
				evidenceCount: 2,
				formattedDate: new Date().toLocaleDateString(),
				timeAgo: 'just now'
			}
		]);
	}
};

function getTimeAgo(date: Date): string {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (diffInDays === 0) {
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		if (diffInHours === 0) {
			const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
			return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
		}
		return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
	} else if (diffInDays === 1) {
		return 'Yesterday';
	} else if (diffInDays < 7) {
		return `${diffInDays} days ago`;
	} else {
		return date.toLocaleDateString();
	}
}
