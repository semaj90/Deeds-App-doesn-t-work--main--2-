// SvelteKit API route for image parsing with OCR
// Extracts text with bounding boxes for highlighting
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index.js';
import { evidence, contentEmbeddings, nlpAnalysisCache } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import * as fs from 'fs';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const caseId = formData.get('caseId') as string;
        
        if (!file || !caseId) {
            return json({ error: 'File and case ID required' }, { status: 400 });
        }

        // Save uploaded file temporarily
        const buffer = await file.arrayBuffer();
        const tempPath = `/tmp/${Date.now()}_${file.name}`;
        fs.writeFileSync(tempPath, Buffer.from(buffer));

        // Call Python NLP service for image processing
        const response = await fetch('http://localhost:8001/evidence/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_path: tempPath,
                case_id: caseId,
                evidence_type: 'image',
                enhancement_level: 1,
                analysis_options: ['objects', 'text']
            })
        });

        if (!response.ok) {
            return json({ error: 'Image processing failed' }, { status: 500 });
        }

        const processingResult = await response.json();
        
        // Transform results for highlighting
        const textElements = extractTextElements(processingResult);
        const objectElements = extractObjectElements(processingResult);
        
        // Store in evidence table
        const evidenceId = processingResult.evidence_id || `evidence_${Date.now()}`;
        await db.insert(evidence).values({
            id: evidenceId,
            caseId,
            filename: file.name,
            aiSummary: processingResult.markdown_summary || '',
            embedding: JSON.stringify(processingResult.embeddings || []),
            tags: JSON.stringify(['image', 'ocr', 'objects']),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        return json({
            success: true,
            evidenceId,
            textElements,
            objectElements,
            anchorPoints: processingResult.anchor_points || [],
            analysis: processingResult.analysis_results || {},
            markdownSummary: processingResult.markdown_summary || '',
            metadata: {
                filename: file.name,
                fileSize: buffer.byteLength,
                processingTime: Date.now()
            }
        });
        
    } catch (error) {
        console.error('Image parsing error:', error);
        return json({ error: 'Failed to parse image' }, { status: 500 });
    }
};

// Extract text elements with bounding boxes for highlighting
function extractTextElements(processingResult: any) {
    const textElements = [];
    
    if (processingResult.analysis_results?.text) {
        const textAnalysis = processingResult.analysis_results.text;
        
        // Extract from anchor points that are text type
        processingResult.anchor_points?.forEach((anchor: any) => {
            if (anchor.type === 'text') {
                textElements.push({
                    text: anchor.label,
                    x: anchor.x, // Normalized coordinates (0-1)
                    y: anchor.y,
                    confidence: anchor.confidence,
                    type: 'text',
                    isHighlightable: true,
                    entity: null, // Will be filled by NLP processing
                    boundingBox: {
                        x: anchor.x,
                        y: anchor.y,
                        width: 0.1, // Estimated width
                        height: 0.02 // Estimated height
                    }
                });
            }
        });
    }
    
    return textElements;
}

// Extract object elements for highlighting
function extractObjectElements(processingResult: any) {
    const objectElements = [];
    
    if (processingResult.analysis_results?.objects) {
        processingResult.analysis_results.objects.forEach((obj: any) => {
            objectElements.push({
                text: obj.class,
                confidence: obj.confidence,
                type: 'object',
                isHighlightable: true,
                entity: {
                    type: 'OBJECT',
                    text: obj.class,
                    confidence: obj.confidence
                },
                boundingBox: obj.bbox ? {
                    x: obj.bbox[0],
                    y: obj.bbox[1], 
                    width: obj.bbox[2] - obj.bbox[0],
                    height: obj.bbox[3] - obj.bbox[1]
                } : null
            });
        });
    }
    
    // Also add anchor points that are objects
    processingResult.anchor_points?.forEach((anchor: any) => {
        if (anchor.type === 'object') {
            objectElements.push({
                text: anchor.label,
                x: anchor.x,
                y: anchor.y,
                confidence: anchor.confidence,
                type: 'object',
                isHighlightable: true,
                entity: {
                    type: 'OBJECT',
                    text: anchor.label,
                    confidence: anchor.confidence
                },
                boundingBox: {
                    x: anchor.x - 0.05,
                    y: anchor.y - 0.05,
                    width: 0.1,
                    height: 0.1
                }
            });
        }
    });
    
    return objectElements;
}
