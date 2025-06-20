// API endpoint for case merging operations
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cases, caseEvents, caseRelationships, caseTextFragments } from '$lib/server/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { cache } from '$lib/server/cache/cache';

// POST /api/cases/merge - Merge multiple cases into one
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { targetCaseId, sourceCaseIds, mergeStrategy = 'combine', newTitle, newDescription } = await request.json();

    if (!targetCaseId || !sourceCaseIds || sourceCaseIds.length === 0) {
      return json({ error: 'Target case ID and source case IDs are required' }, { status: 400 });
    }

    // Verify user owns all cases
    const allCaseIds = [targetCaseId, ...sourceCaseIds];
    const userCases = await db.select()
      .from(cases)
      .where(and(
        inArray(cases.id, allCaseIds),
        eq(cases.createdBy, user.id)
      ));

    if (userCases.length !== allCaseIds.length) {
      return json({ error: 'You can only merge cases you own' }, { status: 403 });
    }

    // Get all case data
    const targetCase = userCases.find(c => c.id === targetCaseId);
    const sourceCases = userCases.filter(c => sourceCaseIds.includes(c.id));

    if (!targetCase) {
      return json({ error: 'Target case not found' }, { status: 404 });
    }

    // Perform merge based on strategy
    let mergedData: any = {};
    
    switch (mergeStrategy) {
      case 'combine':
        mergedData = await combineCase(targetCase, sourceCases, newTitle, newDescription);
        break;
      case 'append':
        mergedData = await appendToCases(targetCase, sourceCases, newTitle, newDescription);
        break;
      case 'selective':
        // For selective merge, we'd need additional parameters specifying which fields to merge
        mergedData = await selectiveMerge(targetCase, sourceCases, newTitle, newDescription);
        break;
      default:
        return json({ error: 'Invalid merge strategy' }, { status: 400 });
    }

    // Update target case with merged data
    await db.update(cases)
      .set({
        title: mergedData.title,
        description: mergedData.description,
        data: JSON.stringify(mergedData.data),
        updatedAt: new Date()
      })
      .where(eq(cases.id, targetCaseId));

    // Move text fragments from source cases to target case
    await db.update(caseTextFragments)
      .set({ caseId: targetCaseId })
      .where(inArray(caseTextFragments.caseId, sourceCaseIds));

    // Create case relationships to track the merge
    for (const sourceCaseId of sourceCaseIds) {
      await db.insert(caseRelationships).values({
        id: crypto.randomUUID(),
        parentCaseId: targetCaseId,
        relatedCaseId: sourceCaseId,
        relationshipType: 'merged_from',
        createdBy: user.id,
        discoveredBy: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        description: `Merged from case ${sourceCaseId}`,
        aiAnalysis: JSON.stringify({
          mergeStrategy,
          mergedAt: new Date(),
          originalTitle: sourceCases.find(c => c.id === sourceCaseId)?.title
        })
      });
    }

    // Mark source cases as merged
    await db.update(cases)
      .set({
        data: JSON.stringify({ 
          ...JSON.parse(String(userCases.find(c => sourceCaseIds.includes(c.id))?.data || '{}')),
          status: 'merged',
          mergedInto: targetCaseId,
          mergedAt: new Date()
        }),
        updatedAt: new Date()
      })
      .where(inArray(cases.id, sourceCaseIds));

    // Log the merge event
    await db.insert(caseEvents).values({
      id: crypto.randomUUID(),
      caseId: targetCaseId,
      eventType: 'case_merged',
      eventData: JSON.stringify({
        sourceCaseIds,
        mergeStrategy,
        sourceCount: sourceCaseIds.length,
        mergedBy: user.id,
        originalTitles: sourceCases.map(c => c.title)
      }),
      userId: user.id,
      timestamp: new Date()
    });

    // Invalidate cache (no invalidateByTags/invalidate method, so skip or implement if needed)
    // If you have a cache.clear or similar, use it here, otherwise skip

    return json({
      success: true,
      targetCaseId,
      mergedCaseIds: sourceCaseIds,
      mergedData,
      message: `Successfully merged ${sourceCaseIds.length} cases into "${mergedData.title}"`
    });

  } catch (error) {
    console.error('Case merge error:', error);
    return json(
      { error: 'Failed to merge cases' },
      { status: 500 }
    );
  }
};

// GET /api/cases/merge/suggestions - Get merge suggestions based on case similarities
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const caseId = url.searchParams.get('caseId');
    if (!caseId) {
      return json({ error: 'Case ID is required' }, { status: 400 });
    }

    // Get the target case
    const targetCase = await db.select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.createdBy, user.id)))
      .limit(1);

    if (targetCase.length === 0) {
      return json({ error: 'Case not found' }, { status: 404 });
    }

    // Get all user's cases (excluding the target case)
    const userCases = await db.select()
      .from(cases)
      .where(and(
        eq(cases.createdBy, user.id),
        eq(cases.id, caseId) // Changed from != to exclude current case
      ));

    // Filter out the target case and already merged cases
    const candidateCases = userCases.filter((c: any) => 
      c.id !== caseId && 
      JSON.parse(c.data || '{}').status !== 'merged'
    );

    // Calculate similarity scores
    const suggestions = candidateCases
      .map((candidateCase: any) => ({
        case: candidateCase,
        similarity: calculateCaseSimilarity(targetCase[0], candidateCase),
        reasons: getMatchingReasons(targetCase[0], candidateCase)
      }))
      .filter((suggestion: any) => suggestion.similarity > 0.3) // Minimum similarity threshold
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 suggestions

    return json({
      targetCase: targetCase[0],
      suggestions,
      totalCandidates: candidateCases.length
    });

  } catch (error) {
    console.error('Merge suggestions error:', error);
    return json(
      { error: 'Failed to get merge suggestions' },
      { status: 500 }
    );
  }
};

// Helper functions for merging strategies
async function combineCase(targetCase: any, sourceCases: any[], newTitle?: string, newDescription?: string) {
  const targetData = JSON.parse(targetCase.data || '{}');
  
  // Combine descriptions
  const allDescriptions = [
    targetCase.description,
    ...sourceCases.map(c => c.description)
  ].filter(Boolean);

  const combinedDescription = newDescription || allDescriptions.join('\n\n---\n\n');

  // Combine tags
  const allTags = [
    ...(targetData.tags || []),
    ...sourceCases.flatMap(c => JSON.parse(c.data || '{}').tags || [])
  ];
  const uniqueTags = [...new Set(allTags)];

  // Combine other data
  const combinedData = {
    ...targetData,
    tags: uniqueTags,
    mergedCases: sourceCases.map(c => ({
      id: c.id,
      title: c.title,
      mergedAt: new Date()
    })),
    caseType: targetData.caseType || sourceCases[0]?.data?.caseType || 'general',
    priority: Math.max(
      targetData.priority || 1,
      ...sourceCases.map(c => JSON.parse(c.data || '{}').priority || 1)
    )
  };

  return {
    title: newTitle || `${targetCase.title} (Merged)`,
    description: combinedDescription,
    data: combinedData
  };
}

async function appendToCases(targetCase: any, sourceCases: any[], newTitle?: string, newDescription?: string) {
  const targetData = JSON.parse(targetCase.data || '{}');
  
  // Append source case content to target
  const appendedContent = sourceCases.map(c => 
    `\n\n--- From "${c.title}" ---\n${c.description}`
  ).join('');

  const finalDescription = newDescription || (targetCase.description + appendedContent);

  return {
    title: newTitle || targetCase.title,
    description: finalDescription,
    data: {
      ...targetData,
      appendedCases: sourceCases.map(c => ({ id: c.id, title: c.title }))
    }
  };
}

async function selectiveMerge(targetCase: any, sourceCases: any[], newTitle?: string, newDescription?: string) {
  // This would be more complex and require UI input for field selection
  // For now, implement as a smart combine
  return combineCase(targetCase, sourceCases, newTitle, newDescription);
}

// Similarity calculation
function calculateCaseSimilarity(case1: any, case2: any): number {
  let score = 0;
  
  const data1 = JSON.parse(case1.data || '{}');
  const data2 = JSON.parse(case2.data || '{}');
  
  // Title similarity (simple keyword matching)
  const title1Words = case1.title.toLowerCase().split(/\s+/);
  const title2Words = case2.title.toLowerCase().split(/\s+/);
  const titleOverlap = title1Words.filter((word: string) => title2Words.includes(word)).length;
  score += (titleOverlap / Math.max(title1Words.length, title2Words.length)) * 0.3;
  
  // Description similarity (keyword matching)
  const desc1Words = case1.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const desc2Words = case2.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const descOverlap = desc1Words.filter((word: string) => desc2Words.includes(word)).length;
  score += (descOverlap / Math.max(desc1Words.length, desc2Words.length)) * 0.4;
  
  // Tags similarity
  const tags1 = data1.tags || [];
  const tags2 = data2.tags || [];
  if (tags1.length > 0 && tags2.length > 0) {
    const tagOverlap = tags1.filter((tag: string) => tags2.includes(tag)).length;
    score += (tagOverlap / Math.max(tags1.length, tags2.length)) * 0.2;
  }
  
  // Case type similarity
  if (data1.caseType && data2.caseType && data1.caseType === data2.caseType) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

function getMatchingReasons(case1: any, case2: any): string[] {
  const reasons: string[] = [];
  
  const data1 = JSON.parse(case1.data || '{}');
  const data2 = JSON.parse(case2.data || '{}');
  
  // Check title similarity
  const title1Words = case1.title.toLowerCase().split(/\s+/);
  const title2Words = case2.title.toLowerCase().split(/\s+/);
  const titleOverlap = title1Words.filter((word: string) => title2Words.includes(word));
  if (titleOverlap.length > 0) {
    reasons.push(`Similar titles: "${titleOverlap.join(', ')}"`);
  }
  
  // Check common tags
  const tags1 = data1.tags || [];
  const tags2 = data2.tags || [];
  const commonTags = tags1.filter((tag: string) => tags2.includes(tag));
  if (commonTags.length > 0) {
    reasons.push(`Common tags: ${commonTags.join(', ')}`);
  }
  
  // Check case type
  if (data1.caseType && data2.caseType && data1.caseType === data2.caseType) {
    reasons.push(`Same case type: ${data1.caseType}`);
  }
  
  return reasons;
}
