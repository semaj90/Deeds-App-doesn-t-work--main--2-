// SvelteKit API route for video parsing with timeline analysis
// Extracts frames, audio, and timeline events for highlighting
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
        const frameRate = parseInt(formData.get('frameRate') as string) || 30;
        
        if (!file || !caseId) {
            return json({ error: 'File and case ID required' }, { status: 400 });
        }

        // Save uploaded file temporarily
        const buffer = await file.arrayBuffer();
        const tempPath = `/tmp/${Date.now()}_${file.name}`;
        fs.writeFileSync(tempPath, Buffer.from(buffer));

        // First, preprocess with Rust/Tauri service if available
        let preprocessedPath = tempPath;
        try {
            const rustResponse = await fetch('http://localhost:1420/evidence/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_path: tempPath,
                    case_id: caseId,
                    evidence_type: 'video',
                    extract_frames: true,
                    frame_interval: 1.0 / frameRate
                })
            });
            
            if (rustResponse.ok) {
                const rustResult = await rustResponse.json();
                preprocessedPath = rustResult.processed_files?.[0] || tempPath;
            }
        } catch (rustError) {
            console.log('Rust preprocessing not available, using original file');
        }

        // Call Python NLP service for video processing
        const response = await fetch('http://localhost:8001/evidence/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_path: preprocessedPath,
                case_id: caseId,
                evidence_type: 'video',
                enhancement_level: 1,
                analysis_options: ['objects', 'audio', 'timeline'],
                frame_sample_rate: frameRate
            })
        });

        if (!response.ok) {
            return json({ error: 'Video processing failed' }, { status: 500 });
        }

        const processingResult = await response.json();
        
        // Transform results for timeline highlighting
        const timelineElements = extractTimelineElements(processingResult);
        const audioSegments = extractAudioSegments(processingResult);
        const objectEvents = extractObjectEvents(processingResult);
        
        // Store in evidence table
        const evidenceId = processingResult.evidence_id || `evidence_${Date.now()}`;
        await db.insert(evidence).values({
            id: evidenceId,
            caseId,
            filename: file.name,
            aiSummary: processingResult.markdown_summary || '',
            embedding: JSON.stringify(processingResult.embeddings || []),
            tags: JSON.stringify(['video', 'timeline', 'audio', 'objects']),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Clean up temp files
        fs.unlinkSync(tempPath);
        if (preprocessedPath !== tempPath && fs.existsSync(preprocessedPath)) {
            fs.unlinkSync(preprocessedPath);
        }
        
        return json({
            success: true,
            evidenceId,
            timelineElements,
            audioSegments,
            objectEvents,
            anchorPoints: processingResult.anchor_points || [],
            analysis: processingResult.analysis_results || {},
            markdownSummary: processingResult.markdown_summary || '',
            metadata: {
                filename: file.name,
                fileSize: buffer.byteLength,
                duration: processingResult.analysis_results?.video_metadata?.duration || 0,
                fps: processingResult.analysis_results?.video_metadata?.fps || 30,
                resolution: processingResult.analysis_results?.video_metadata?.resolution || 'unknown'
            }
        });
        
    } catch (error) {
        console.error('Video parsing error:', error);
        return json({ error: 'Failed to parse video' }, { status: 500 });
    }
};

// Extract timeline elements for scrubbing and highlighting
function extractTimelineElements(processingResult: any) {
    const timelineElements: any[] = [];
    
    // Extract from timeline analysis
    if (processingResult.analysis_results?.timeline) {
        processingResult.analysis_results.timeline.forEach((event: any) => {
            timelineElements.push({
                timestamp: event.timestamp,
                type: event.type,
                data: event.data,
                isHighlightable: true,
                confidence: 0.8,
                description: `${event.type} at ${event.timestamp.toFixed(1)}s`
            });
        });
    }
    
    // Extract from anchor points that are timeline events
    processingResult.anchor_points?.forEach((anchor: any) => {
        if (anchor.type === 'timeline_event') {
            timelineElements.push({
                timestamp: anchor.timestamp,
                type: 'event',
                text: anchor.label,
                confidence: anchor.confidence,
                isHighlightable: true,
                x: anchor.x, // Position on timeline (0-1)
                description: anchor.description
            });
        }
    });
    
    return timelineElements.sort((a, b) => a.timestamp - b.timestamp);
}

// Extract audio segments for highlighting
function extractAudioSegments(processingResult: any) {
    const audioSegments: any[] = [];
    
    if (processingResult.analysis_results?.audio) {
        const audioData = processingResult.analysis_results.audio;
        
        // Extract from transcription segments
        if (audioData.segments) {
            audioData.segments.forEach((segment: any) => {
                audioSegments.push({
                    start: segment.start,
                    end: segment.end,
                    text: segment.text,
                    confidence: segment.confidence || 0.9,
                    isHighlightable: true,
                    type: 'speech',
                    entity: {
                        type: 'SPEECH',
                        text: segment.text,
                        confidence: segment.confidence || 0.9
                    }
                });
            });
        }
    }
    
    // Extract from anchor points that are audio segments
    processingResult.anchor_points?.forEach((anchor: any) => {
        if (anchor.type === 'audio_segment') {
            audioSegments.push({
                start: anchor.timestamp,
                end: anchor.timestamp + (anchor.duration || 1),
                text: anchor.label,
                confidence: anchor.confidence,
                isHighlightable: true,
                type: 'speech',
                entity: {
                    type: 'SPEECH',
                    text: anchor.label,
                    confidence: anchor.confidence
                }
            });
        }
    });
    
    return audioSegments.sort((a, b) => a.start - b.start);
}

// Extract object detection events
function extractObjectEvents(processingResult: any) {
    const objectEvents: any[] = [];
    
    if (processingResult.analysis_results?.timeline) {
        processingResult.analysis_results.timeline.forEach((event: any) => {
            if (event.type === 'object_detection' && event.data) {
                event.data.forEach((obj: any) => {
                    objectEvents.push({
                        timestamp: event.timestamp,
                        object: obj.class,
                        confidence: obj.confidence,
                        isHighlightable: true,
                        type: 'object_detection',
                        entity: {
                            type: 'OBJECT',
                            text: obj.class,
                            confidence: obj.confidence
                        }
                    });
                });
            }
        });
    }
    
    return objectEvents;
}
