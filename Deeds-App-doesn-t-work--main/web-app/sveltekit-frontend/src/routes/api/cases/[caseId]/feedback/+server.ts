import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { caseRelationshipFeedback } from '$lib/server/db/schema';
import { cache, invalidateCacheByTags } from '$lib/server/cache/cache';
import { eq, and } from 'drizzle-orm';

export async function POST({ params, request }: { params: { caseId: string }, request: Request }) {
    try {
        const { caseId } = params;
        const body = await request.json();
        const { relatedCaseId, userId, feedback, confidence, context } = body;

        if (!caseId || !relatedCaseId || !userId || !feedback) {
            return json({ 
                error: 'caseId, relatedCaseId, userId, and feedback are required' 
            }, { status: 400 });
        }

        if (!['positive', 'negative', 'neutral'].includes(feedback)) {
            return json({ 
                error: 'feedback must be one of: positive, negative, neutral' 
            }, { status: 400 });
        }

        // Convert feedback to score
        const userScore = feedback === 'positive' ? 1 : feedback === 'negative' ? -1 : 0;

        // Check if feedback already exists for this user and case pair
        const existingFeedback = await db.select()
            .from(caseRelationshipFeedback)
            .where(
                and(
                    eq(caseRelationshipFeedback.parentCaseId, caseId),
                    eq(caseRelationshipFeedback.relatedCaseId, relatedCaseId),
                    eq(caseRelationshipFeedback.userId, userId)
                )
            )
            .limit(1);

        let result;

        if (existingFeedback.length > 0) {
            // Update existing feedback
            result = await db.update(caseRelationshipFeedback)
                .set({
                    feedback,
                    userScore,
                    confidence: confidence || existingFeedback[0].confidence,
                    context: context ? JSON.stringify(context) : existingFeedback[0].context,
                    updatedAt: new Date()
                })
                .where(eq(caseRelationshipFeedback.id, existingFeedback[0].id))
                .returning();
        } else {
            // Create new feedback
            result = await db.insert(caseRelationshipFeedback).values({
                id: crypto.randomUUID(),
                parentCaseId: caseId,
                relatedCaseId,
                userId,
                feedback,
                userScore,
                confidence: confidence || 0.5,
                feedbackType: 'explicit',
                context: context ? JSON.stringify(context) : '{}',
                sessionId: null, // Could be passed from frontend
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
        }

        // Invalidate related caches
        invalidateCacheByTags(['cases', 'relationships']);
        cache.delete(`cases:${caseId}:related`);
        cache.delete(`cases:${relatedCaseId}:related`);

        return json({
            success: true,
            feedback: result[0],
            action: existingFeedback.length > 0 ? 'updated' : 'created'
        });

    } catch (error) {
        console.error('Error submitting case relationship feedback:', error);
        return json({
            error: 'Failed to submit feedback',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET({ params, url }: { params: { caseId: string }, url: URL }) {
    try {
        const { caseId } = params;
        const relatedCaseId = url.searchParams.get('relatedCaseId');
        const userId = url.searchParams.get('userId');

        if (!caseId) {
            return json({ error: 'Case ID is required' }, { status: 400 });
        }

        let query = db.select().from(caseRelationshipFeedback);
        
        if (relatedCaseId && userId) {
            // Get specific feedback
            const feedback = await query
                .where(
                    and(
                        eq(caseRelationshipFeedback.parentCaseId, caseId),
                        eq(caseRelationshipFeedback.relatedCaseId, relatedCaseId),
                        eq(caseRelationshipFeedback.userId, userId)
                    )
                )
                .limit(1);

            return json({
                feedback: feedback[0] || null,
                hasFeedback: feedback.length > 0
            });
        } else {
            // Get all feedback for this case
            const allFeedback = await query
                .where(eq(caseRelationshipFeedback.parentCaseId, caseId));

            // Aggregate statistics
            const stats = {
                totalFeedback: allFeedback.length,
                positive: allFeedback.filter(f => f.userScore > 0).length,
                negative: allFeedback.filter(f => f.userScore < 0).length,
                neutral: allFeedback.filter(f => f.userScore === 0).length,
                averageScore: allFeedback.length > 0 
                    ? allFeedback.reduce((sum, f) => sum + f.userScore, 0) / allFeedback.length 
                    : 0
            };

            return json({
                feedback: allFeedback,
                statistics: stats
            });
        }

    } catch (error) {
        console.error('Error fetching case relationship feedback:', error);
        return json({
            error: 'Failed to fetch feedback',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function DELETE({ params, request }: { params: { caseId: string }, request: Request }) {
    try {
        const { caseId } = params;
        const body = await request.json();
        const { relatedCaseId, userId } = body;

        if (!caseId || !relatedCaseId || !userId) {
            return json({ 
                error: 'caseId, relatedCaseId, and userId are required' 
            }, { status: 400 });
        }

        const deleted = await db.delete(caseRelationshipFeedback)
            .where(
                and(
                    eq(caseRelationshipFeedback.parentCaseId, caseId),
                    eq(caseRelationshipFeedback.relatedCaseId, relatedCaseId),
                    eq(caseRelationshipFeedback.userId, userId)
                )
            )
            .returning();

        if (deleted.length === 0) {
            return json({ error: 'Feedback not found' }, { status: 404 });
        }

        // Invalidate related caches
        invalidateCacheByTags(['cases', 'relationships']);
        cache.delete(`cases:${caseId}:related`);
        cache.delete(`cases:${relatedCaseId}:related`);

        return json({
            success: true,
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting case relationship feedback:', error);
        return json({
            error: 'Failed to delete feedback',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
