import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { cases, evidenceFiles, nlpAnalysisCache, criminals, crimes } from '$lib/server/db/schema-new.js'; // Use unified schema
import { eq, count, gte } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Get system statistics
		const [caseStats, evidenceStats, criminalsStats, crimesStats, evidenceFilesStats, cacheStats] = await Promise.all([
			// Total cases by status
			db.select({ 
				status: cases.status, 
				count: count() 
			}).from(cases).groupBy(cases.status),

			// Total evidence count
			db.select({ count: count() }).from(evidence),
			
			// Total criminals count
			db.select({ count: count() }).from(criminals),
			
			// Total crimes count
			db.select({ count: count() }).from(crimes),
			
			// Total evidence files by type (from evidenceFiles table)
			db.select({ 
				type: evidenceFiles.fileType, 
				count: count() 
			}).from(evidenceFiles).groupBy(evidenceFiles.fileType),
			
			// Cache statistics
			db.select({ count: count() }).from(nlpAnalysisCache)
		]);

		// Calculate totals
		const totalCases = caseStats.reduce((sum, stat) => sum + stat.count, 0);
		const totalEvidence = evidenceStats[0]?.count || 0;
		const totalCriminals = criminalsStats[0]?.count || 0; // Corrected to use criminalsStats
		const totalCrimes = crimesStats[0]?.count || 0;
		const totalEvidenceFiles = evidenceFilesStats.reduce((sum, stat) => sum + stat.count, 0);
		const totalCacheEntries = cacheStats[0]?.count || 0;
		// Processing jobs (simulated for now - in real implementation, check queue)
		const processingJobs = Math.floor(Math.random() * 5); // Mock data

		// Models status (check if Python NLP service is running)
		let modelsLoaded = 0; // Check if NLP service is running
		try {
			const response = await fetch('http://localhost:8001/models/status', {
				method: 'GET',
				signal: AbortSignal.timeout(2000) // 2 second timeout
			});
			if (response.ok) {
				const modelStatus = await response.json();
				modelsLoaded = modelStatus.loaded_models?.length || 0;
			}
		} catch (error) {
			console.warn('NLP service not available:', (error as Error).message || 'Unknown error');
		}

		// Recent activity (last 24 hours)
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		
		const recentActivity = await db
			.select({ 
				count: count(),
				status: cases.status 
			})
			.from(cases)
			.where(gte(cases.createdAt, oneDayAgo))
			.groupBy(cases.status);

		const stats = {
			totalCases,
			totalEvidence,
			totalCriminals,
			totalCrimes,
			totalEvidenceFiles,
			modelsLoaded,
			processingJobs,
			cacheSize: totalCacheEntries,
			breakdown: {
				casesByStatus: caseStats.reduce((acc, stat) => {
					const status = stat.status || 'unknown';
					acc[status] = stat.count;
					return acc;
				}, {} as Record<string, number>),
				evidenceFilesByType: evidenceFilesStats.reduce((acc, stat) => {
					const type = stat.type || 'unknown';
					acc[type] = stat.count;
					return acc;
				}, {} as Record<string, number>),
				recentActivity: recentActivity.reduce((acc, activity) => {
					const status = activity.status || 'unknown';
					acc[status] = activity.count;
					return acc;
				}, {} as Record<string, number>)
			},
			health: {
				database: 'online',
				nlpService: modelsLoaded > 0 ? 'online' : 'offline',
				cache: totalCacheEntries > 0 ? 'active' : 'empty'
			},
			performance: {
				avgProcessingTime: '2.3s', // Mock data
				successRate: '94.2%', // Mock data
				uptime: '99.9%' // Mock data
			}
		};

		return json(stats);	} catch (error) {
		console.error('Error fetching system stats:', error);
		return json({ 
			error: 'Failed to fetch system statistics',
			totalCases: 0,
			totalEvidence: 0,
			totalCriminals: 0,
			totalCrimes: 0,
			totalEvidenceFiles: 0,
			modelsLoaded: 0,
			processingJobs: 0,
			health: {
				database: 'error',
				nlpService: 'offline',
				cache: 'error'
			}
		}, { status: 500 });
	}
};
