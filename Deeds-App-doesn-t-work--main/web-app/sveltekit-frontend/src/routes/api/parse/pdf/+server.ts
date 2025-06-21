// SvelteKit API route for PDF parsing
// Extracts text with position data for highlighting
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/index.js';
import { evidenceFiles, nlpAnalysisCache } from '$lib/server/db/schema-new.js'; // Use unified schema
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// PDF processing with position data
import pdfParse from 'pdf-parse';
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

        // Extract text with positions using pdf-parse
        const pdfData = await pdfParse(fs.readFileSync(tempPath));
        
        // Parse PDF text into positioned elements
        const textElements = await extractPositionedText(tempPath);
        
        // Generate content hash for caching
        const contentHash = createHash('sha256').update(pdfData.text).digest('hex'); // Use MD5 for shorter hash if needed
        
        // Check cache first
        const cached = await db.select()
            .from(nlpAnalysisCache)
            .where(eq(nlpAnalysisCache.contentHash, contentHash))
            .limit(1);
        
        let analysis;
        if (cached.length > 0) {
            analysis = cached[0].analysis;
        } else {
            // Call Python NLP service for entity extraction and analysis
            analysis = await processWithNLP(pdfData.text, textElements);
              // Cache the results
            await db.insert(nlpAnalysisCache).values({ // ID is auto-generated UUID
                contentHash,
                contentType: 'pdf_document',
                originalText: pdfData.text,
                analysis: analysis,
                entities: analysis.entities || [],                confidence: analysis.confidence ? analysis.confidence.toString() : null,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
        }
          // Store in evidence table
        await db.insert(evidenceFiles).values({
            caseId,
            fileName: file.name,
            filePath: tempPath,
            fileType: 'document',
            fileSize: 0, // TODO: Calculate actual file size
            mimeType: file.type,
            aiSummary: (analysis as any)?.summary || '',
            embedding: (analysis as any)?.embedding || [],
            tags: (analysis as any)?.tags || [],
        });
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
          return json({
            success: true,
            textElements,
            analysis,
            metadata: {
                pages: pdfData.numpages,
                totalText: pdfData.text.length,
                filename: file.name
            }
        });
        
    } catch (error) {
        console.error('PDF parsing error:', error);
        return json({ error: 'Failed to parse PDF' }, { status: 500 });
    }
};

// Extract positioned text elements from PDF
async function extractPositionedText(pdfPath: string): Promise<any[]> {
    // This would use a more advanced PDF parser like pdf2json or pdf-lib
    // For now, returning structured text with mock positions
    const textElements: any[] = [];
    
    try {
        // Mock implementation - replace with actual PDF coordinate extraction
        const pdfData = await pdfParse(fs.readFileSync(pdfPath));
        const lines = pdfData.text.split('\n');
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                const words = line.split(' ');
                let x = 50; // Starting x position
                
                words.forEach((word, wordIndex) => {
                    if (word.trim()) {
                        textElements.push({
                            text: word,
                            page: 1, // Would be calculated from actual PDF
                            x: x,
                            y: 50 + (index * 20), // Mock y position
                            width: word.length * 8, // Approximate width
                            height: 16,
                            confidence: 1.0,
                            type: 'text',
                            lineIndex: index,
                            wordIndex: wordIndex
                        });
                        x += word.length * 8 + 5; // Move x position
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('Error extracting positioned text:', error);
    }
    
    return textElements;
}

// Process text with Python NLP service
async function processWithNLP(text: string, textElements: any[]) {
    try {
        // Call our Python NLP service
        const response = await fetch(`${env.LLM_SERVICE_URL || 'http://localhost:8000'}/extract-entities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                entity_types: ['PERSON', 'ORG', 'LOC', 'DATE', 'MONEY', 'CRIME']
            })
        });
        
        if (!response.ok) {
            throw new Error(`NLP service error: ${response.status}`);
        }
        
        const nlpResult = await response.json();
        
        // Generate embeddings
        const embeddingResponse = await fetch(`${env.LLM_SERVICE_URL || 'http://localhost:8000'}/embed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        
        const embeddingResult = embeddingResponse.ok ? await embeddingResponse.json() : null;
        
        // Enhance text elements with NLP data
        const enhancedElements = textElements.map(element => {
            const entityMatch = nlpResult.entities?.find((entity: any) => 
                text.substring(entity.start, entity.end).includes(element.text)
            );
            
            return {
                ...element,
                entity: entityMatch || null,
                isHighlightable: !!entityMatch,
                confidence: entityMatch?.confidence || element.confidence
            };
        });
        
        return {
            entities: nlpResult.entities || [],
            textElements: enhancedElements,
            embedding: embeddingResult?.embedding || [],
            summary: generateSummary(nlpResult.entities || []),
            tags: extractTags(nlpResult.entities || []),
            confidence: 0.8
        };
        
    } catch (error) {
        console.error('NLP processing error:', error);
        return {
            entities: [],
            textElements,
            embedding: [],
            summary: 'Failed to process with NLP service',
            tags: [],
            confidence: 0.0
        };
    }
}

// Generate summary from entities
function generateSummary(entities: any[]): string {
    const people = entities.filter(e => e.type === 'PERSON').map(e => e.text);
    const orgs = entities.filter(e => e.type === 'ORG').map(e => e.text);
    const locations = entities.filter(e => e.type === 'LOC').map(e => e.text);
    const dates = entities.filter(e => e.type === 'DATE').map(e => e.text);
    
    let summary = 'Document contains: ';
    if (people.length) summary += `${people.length} person(s): ${people.slice(0, 3).join(', ')}. `;
    if (orgs.length) summary += `${orgs.length} organization(s): ${orgs.slice(0, 3).join(', ')}. `;
    if (locations.length) summary += `${locations.length} location(s): ${locations.slice(0, 3).join(', ')}. `;
    if (dates.length) summary += `${dates.length} date(s): ${dates.slice(0, 3).join(', ')}. `;
    
    return summary || 'No significant entities detected';
}

// Extract tags from entities
function extractTags(entities: any[]): string[] {
    const tags = new Set<string>();
    entities.forEach(entity => {
        tags.add(entity.type.toLowerCase());
        if (entity.confidence > 0.8) {
            tags.add('high_confidence');
        }
    });
    return Array.from(tags);
}
