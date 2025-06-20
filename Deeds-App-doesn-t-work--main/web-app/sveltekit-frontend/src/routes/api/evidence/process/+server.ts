// SvelteKit API Endpoint for Evidence Processing
// Handles multimodal evidence uploads and analysis coordination

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { evidenceFiles, evidenceAnchorPoints, caseEvidenceSummaries } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Evidence processing endpoint
export async function POST({ request, locals }: RequestEvent) {
  try {
    const { file_path, case_id, evidence_type, enhancement_level = 1, analysis_options = [] } = await request.json();
    
    // Validate user session
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Validate input
    if (!file_path || !case_id || !evidence_type) {
      return json({ error: 'Missing required fields: file_path, case_id, evidence_type' }, { status: 400 });
    }
    
    const evidence_id = nanoid();
    
    // First, call Rust evidence processor for file enhancement
    const rustProcessingResult = await callRustEvidenceProcessor({
      file_path,
      case_id,
      evidence_type,
      enhancement_level,
      extract_frames: evidence_type === 'video',
      frame_interval: 5.0 // Extract frame every 5 seconds
    });
    
    if (!rustProcessingResult.success) {
      return json({ 
        error: 'File processing failed', 
        details: rustProcessingResult.error_message 
      }, { status: 500 });
    }
    
    // Store evidence file record
    const evidenceRecord = await db.insert(evidenceFiles).values({
      id: evidence_id,
      caseId: case_id,
      fileName: extractFileName(file_path),
      filePath: file_path,
      fileType: evidence_type,
      fileSize: rustProcessingResult.metadata.file_size,
      mimeType: getMimeType(evidence_type),
      duration: rustProcessingResult.metadata.duration,
      dimensions: rustProcessingResult.metadata.dimensions ? 
        `${rustProcessingResult.metadata.dimensions[0]},${rustProcessingResult.metadata.dimensions[1]}` : null,
      uploadedBy: locals.user.id,
      processingStatus: 'processing',
      metadata: {
        rust_processing: rustProcessingResult,
        enhancement_level,
        analysis_options
      }
    }).returning();
    
    // Call Python NLP service for AI analysis
    const pythonAnalysisResult = await callPythonNLPService('/evidence/process', {
      file_path: rustProcessingResult.processed_files[0] || file_path,
      case_id,
      evidence_type,
      enhancement_level,
      analysis_options,
      frame_sample_rate: evidence_type === 'video' ? 30 : undefined
    });
    
    if (!pythonAnalysisResult) {
      return json({ error: 'AI analysis failed' }, { status: 500 });
    }
    
    // Store anchor points
    const anchorPoints = [];
    for (const anchor of pythonAnalysisResult.anchor_points || []) {
      const anchorId = nanoid();
      
      await db.insert(evidenceAnchorPoints).values({
        id: anchorId,
        evidenceFileId: evidence_id,
        anchorType: anchor.type,
        positionX: anchor.x,
        positionY: anchor.y,
        timestamp: anchor.timestamp,
        duration: anchor.duration,
        label: anchor.label,
        description: anchor.description || '',
        confidence: anchor.confidence,
        detectedObject: anchor.type === 'object' ? anchor.label : null,
        detectedText: anchor.type === 'text' ? anchor.label : null,
        boundingBox: anchor.bbox ? anchor.bbox.join(',') : null,
        createdBy: locals.user.id
      });
      
      anchorPoints.push({ id: anchorId, ...anchor });
    }
    
    // Generate scene summary if markdown content is available
    let summaryId = null;
    if (pythonAnalysisResult.markdown_summary) {
      summaryId = nanoid();
      
      await db.insert(caseEvidenceSummaries).values({
        id: summaryId,
        caseId: case_id,
        evidenceFileId: evidence_id,
        summaryType: 'scene_analysis',
        title: `${evidence_type.charAt(0).toUpperCase() + evidence_type.slice(1)} Evidence Analysis`,
        markdownContent: pythonAnalysisResult.markdown_summary,
        plainTextContent: pythonAnalysisResult.text_content || '',
        keyFindings: extractKeyFindings(pythonAnalysisResult.analysis_results),
        embedding: pythonAnalysisResult.embeddings,
        confidence: calculateOverallConfidence(pythonAnalysisResult.anchor_points),
        generatedBy: 'ai',
        modelVersion: 'multimodal-v1'
      });
    }
    
    // Update evidence file with processing results
    await db.update(evidenceFiles)
      .set({
        processedAt: new Date(),
        processingStatus: 'completed',
        aiSummary: pythonAnalysisResult.markdown_summary,
        aiAnalysis: pythonAnalysisResult.analysis_results,
        embedding: pythonAnalysisResult.embeddings,
        enhancedVersions: rustProcessingResult.processed_files,
        updatedAt: new Date()
      })
      .where(eq(evidenceFiles.id, evidence_id));
    
    // Return complete results
    return json({
      success: true,
      evidence_id,
      evidence_file: evidenceRecord[0],
      anchor_points: anchorPoints,
      scene_summary_id: summaryId,
      processing_results: {
        rust: rustProcessingResult,
        python: pythonAnalysisResult
      },
      analysis_summary: {
        total_anchors: anchorPoints.length,
        evidence_type,
        processing_time: rustProcessingResult.metadata.processing_time || 0,
        ai_confidence: calculateOverallConfidence(pythonAnalysisResult.anchor_points)
      }
    });
    
  } catch (error) {
    console.error('Evidence processing error:', error);
    return json({ 
      error: 'Internal server error during evidence processing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// Get evidence files for a case
export async function GET({ url, locals }: RequestEvent) {
  try {
    if (!locals.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const case_id = url.searchParams.get('case_id');
    
    if (!case_id) {
      return json({ error: 'case_id parameter required' }, { status: 400 });
    }
      // Get evidence files with anchor points and summaries
    const evidenceWithDetails = await db
      .select({
        evidence: evidenceFiles,
        anchorCount: count(evidenceAnchorPoints.id)
      })
      .from(evidenceFiles)
      .leftJoin(evidenceAnchorPoints, eq(evidenceFiles.id, evidenceAnchorPoints.evidenceFileId))
      .where(eq(evidenceFiles.caseId, case_id))
      .groupBy(evidenceFiles.id);
    
    return json({
      success: true,
      evidence_files: evidenceWithDetails,
      total_count: evidenceWithDetails.length
    });
    
  } catch (error) {
    console.error('Get evidence files error:', error);
    return json({ error: 'Failed to retrieve evidence files' }, { status: 500 });
  }
};

// Helper Functions

async function callRustEvidenceProcessor(request: any) {
  try {
    // This would invoke the Tauri command in a real desktop app
    // For web version, we simulate or use a different approach
    const response = await fetch('http://localhost:3000/tauri/evidence/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Rust processor failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Rust processor not available, using fallback:', error);
    
    // Fallback processing
    return {
      success: true,
      processed_files: [request.file_path],
      frame_extracts: [],
      metadata: {
        file_type: request.evidence_type,
        file_size: 0,
        duration: null,
        dimensions: null,
        processing_time: 0
      },
      error_message: null
    };
  }
}

async function callPythonNLPService(endpoint: string, payload: any) {
  try {
    const response = await fetch(`http://localhost:8001${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Python NLP service failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Python NLP service error:', error);
    return null;
  }
}

function extractFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || 'unknown';
}

function getMimeType(evidenceType: string): string {
  const mimeTypes: Record<string, string> = {
    'image': 'image/jpeg',
    'video': 'video/mp4',
    'audio': 'audio/wav',
    'document': 'application/pdf'
  };
  return mimeTypes[evidenceType] || 'application/octet-stream';
}

function extractKeyFindings(analysisResults: any): string[] {
  const findings: string[] = [];
  
  if (analysisResults.objects) {
    findings.push(`${analysisResults.objects.length} objects detected`);
  }
  
  if (analysisResults.text) {
    findings.push('Text content extracted');
  }
  
  if (analysisResults.audio) {
    findings.push('Audio transcription available');
  }
  
  if (analysisResults.timeline) {
    findings.push(`${analysisResults.timeline.length} timeline events identified`);
  }
  
  return findings;
}

function calculateOverallConfidence(anchorPoints: any[]): number {
  if (!anchorPoints || anchorPoints.length === 0) return 0;
  
  const avgConfidence = anchorPoints.reduce((sum, anchor) => 
    sum + (anchor.confidence || 0), 0) / anchorPoints.length;
  
  return Math.round(avgConfidence * 100) / 100;
}
