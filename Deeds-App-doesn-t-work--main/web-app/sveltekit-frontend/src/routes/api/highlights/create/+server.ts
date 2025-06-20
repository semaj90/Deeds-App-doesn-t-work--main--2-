// API route for creating and managing highlights
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { contentEmbeddings, caseTextFragments, nlpAnalysisCache } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';

interface HighlightData {
    text: string;
    entity: any;
    confidence: number;
    caseId: string;
    timestamp: string;
    context: any;
    position?: { x: number; y: number };
    sourceType?: 'pdf' | 'image' | 'video' | 'text';
    sourceId?: string;
}

export const POST = async ({ request }: { request: Request }) => {
    try {
        const highlightData: HighlightData = await request.json();
        
        const { text, entity, confidence, caseId, context, position, sourceType, sourceId } = highlightData;
        
        if (!text || !caseId) {
            return json({ error: 'Text and case ID are required' }, { status: 400 });
        }
        
        // Generate unique ID for highlight
        const highlightId = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create text fragment entry
        await db.insert(caseTextFragments).values({
            id: highlightId,
            caseId,
            fragmentType: 'highlight',
            content: text,
            position: 0, // Will be updated based on context
            isActive: true,
            source: sourceId || null,
            tags: JSON.stringify([
                entity?.type?.toLowerCase() || 'unknown',
                'highlight',
                sourceType || 'manual'
            ]),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Generate embedding for the highlighted text
        try {
            const embeddingResponse = await fetch('http://localhost:8001/embed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            if (embeddingResponse.ok) {
                const embeddingData = await embeddingResponse.json();
                
                // Store embedding
                await db.insert(contentEmbeddings).values({
                    id: `embed_${highlightId}`,
                    entityId: highlightId,
                    entityType: 'highlight',
                    contentType: 'text_fragment',
                    embedding: JSON.stringify(embeddingData.embedding),
                    text,
                    createdAt: new Date()
                });
                
                // Update text fragment with embedding
                await db.update(caseTextFragments)
                    .set({ 
                        embedding: JSON.stringify(embeddingData.embedding),
                        updatedAt: new Date()
                    })
                    .where(eq(caseTextFragments.id, highlightId));
            }
        } catch (embeddingError) {
            console.error('Failed to generate embedding:', embeddingError);
        }
        
        // Cache analysis if entity data is provided
        if (entity) {
            const contentHash = createHash('sha256').update(text).digest('hex');
            
            await db.insert(nlpAnalysisCache).values({
                id: `cache_${highlightId}`,
                contentHash,
                contentType: 'highlight',
                originalText: text,
                analysis: JSON.stringify({
                    entity,
                    confidence,
                    context,
                    position,
                    timestamp: new Date().toISOString()
                }),
                entities: JSON.stringify([entity]),
                confidence,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        }
        
        return json({
            success: true,
            highlightId,
            message: 'Highlight saved successfully'
        });
        
    } catch (error) {
        console.error('Error creating highlight:', error);
        return json({ error: 'Failed to create highlight' }, { status: 500 });
    }
};

export const GET = async ({ url }: { url: URL }) => {
    try {
        const caseId = url.searchParams.get('caseId');
        const entityType = url.searchParams.get('entityType');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        
        if (!caseId) {
            return json({ error: 'Case ID required' }, { status: 400 });
        }
        
        // Build query
        let query = db.select({
            id: caseTextFragments.id,
            content: caseTextFragments.content,
            tags: caseTextFragments.tags,
            embedding: caseTextFragments.embedding,
            createdAt: caseTextFragments.createdAt,
            source: caseTextFragments.source
        })
        .from(caseTextFragments)
        .where(
            and(
                eq(caseTextFragments.caseId, caseId),
                eq(caseTextFragments.fragmentType, 'highlight'),
                eq(caseTextFragments.isActive, true)
            )
        )
        .limit(limit);
        
        const highlights = await query;
        
        // Filter by entity type if specified
        const filteredHighlights = entityType 
            ? highlights.filter(h => {
                const tags = JSON.parse(h.tags || '[]');
                return tags.includes(entityType.toLowerCase());
            })
            : highlights;
        
        return json({
            highlights: filteredHighlights,
            total: filteredHighlights.length
        });
        
    } catch (error) {
        console.error('Error fetching highlights:', error);
        return json({ error: 'Failed to fetch highlights' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ request }) => {
    try {
        const { highlightId } = await request.json();
        
        if (!highlightId) {
            return json({ error: 'Highlight ID required' }, { status: 400 });
        }
        
        // Soft delete - mark as inactive
        await db.update(caseTextFragments)
            .set({ 
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(caseTextFragments.id, highlightId));
        
        return json({
            success: true,
            message: 'Highlight deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting highlight:', error);
        return json({ error: 'Failed to delete highlight' }, { status: 500 });
    }
};
