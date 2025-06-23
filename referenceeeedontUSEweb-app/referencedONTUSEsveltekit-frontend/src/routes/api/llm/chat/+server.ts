import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invoke } from '@tauri-apps/api/tauri';

interface ChatRequest {
  message: string;
  context?: Array<{id: string, role: 'user' | 'assistant', content: string}>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface ChatResponse {
  response: string;
  model_used: string;
  processing_time_ms: number;
  tokens_generated: number;
  masked: boolean;
  entities_found?: Array<{entity: string, confidence: number}>;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, context = [], model, temperature = 0.7, max_tokens = 512 }: ChatRequest = await request.json();
    
    if (!message?.trim()) {
      return json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Build context from previous messages
    const contextText = context
      .slice(-5) // Last 5 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const fullPrompt = contextText 
      ? `${contextText}\nuser: ${message}\nassistant:`
      : `user: ${message}\nassistant:`;
    
    // Check if Tauri is available (desktop app vs web)
    let response: string;
    let processingTime: number;
    let tokensGenerated: number;
    let modelUsed: string;
    
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      // Desktop app - use Tauri commands
      try {
        const inferenceResult = await invoke('plugin:llm|run_llama_inference', {
          request: {
            prompt: fullPrompt,
            max_tokens,
            temperature,
            system_prompt: "You are a knowledgeable legal AI assistant. Provide accurate, helpful information about legal matters while being clear that you cannot provide legal advice and users should consult qualified attorneys for specific legal issues."
          },
          modelName: model || 'gemma-qat-legal'
        }) as any;
        
        response = inferenceResult.text;
        processingTime = inferenceResult.processing_time_ms;
        tokensGenerated = inferenceResult.tokens_generated;
        modelUsed = inferenceResult.model_used;
        
      } catch (error) {
        console.error('Tauri inference failed:', error);
        
        // Fallback to external service
        const llmResponse = await fetch('http://localhost:8080/completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: fullPrompt,
            n_predict: max_tokens,
            temperature,
            stream: false
          })
        });
        
        if (!llmResponse.ok) {
          throw new Error(`LLM service error: ${llmResponse.status}`);
        }
        
        const llmData = await llmResponse.json();
        response = llmData.content || 'No response generated';
        processingTime = llmData.timings?.total_time || 0;
        tokensGenerated = llmData.tokens_evaluated || 0;
        modelUsed = 'external-service';
      }
    } else {
      // Web app - use external service only
      const llmResponse = await fetch('http://localhost:8080/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          n_predict: max_tokens,
          temperature,
          stream: false
        })
      });
      
      if (!llmResponse.ok) {
        return json({ 
          error: 'LLM service unavailable. Please ensure your model server is running on port 8080.' 
        }, { status: 503 });
      }
      
      const llmData = await llmResponse.json();
      response = llmData.content || 'No response generated';
      processingTime = llmData.timings?.total_time || 0;
      tokensGenerated = llmData.tokens_evaluated || 0;
      modelUsed = 'external-service';
    }
      // PII masking commented out - focusing on core functionality
    let finalResponse = response;
    let masked = false;
    let entitiesFound: Array<{entity: string, confidence: number}> = [];
    
    // TODO: Optional - add PII detection and masking later if needed
    // const piiPatterns = [
    //   /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    //   /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
    //   /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    // ];
    // const hasPII = piiPatterns.some(pattern => pattern.test(response));
    // if (hasPII) {
    //   // Call masking service logic here
    // }
    
    // Enhanced response with legal context
    const enhancedResponse = await enhanceWithLegalContext(finalResponse, message);
    
    const chatResponse: ChatResponse = {
      response: enhancedResponse,
      model_used: modelUsed,
      processing_time_ms: processingTime,
      tokens_generated: tokensGenerated,
      masked,
      entities_found: entitiesFound
    };
    
    return json(chatResponse);
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: 'Failed to process chat message',
      details: errorMessage,
      troubleshooting: {
        checks: [
          'Verify your GGUF model is uploaded and accessible',
          'Ensure Tauri backend is running (for desktop app)',
          'Check that llama.cpp server is running on port 8080',
          'Confirm masking service is available on port 8002'
        ]
      }
    }, { status: 500 });
  }
};

async function enhanceWithLegalContext(response: string, originalQuery: string): Promise<string> {
  // Add legal disclaimers and context-aware enhancements
  const hasLegalAdviceRequest = /\b(should I|what should|recommend|advise|suggest)\b/i.test(originalQuery);
  
  if (hasLegalAdviceRequest) {
    response += '\n\n⚖️ **Legal Disclaimer:** This information is for educational purposes only and does not constitute legal advice. Please consult with a qualified attorney for advice specific to your situation.';
  }
  
  // Add relevant case law or statute suggestions
  const hasStatuteQuery = /\b(statute|law|code|regulation)\b/i.test(originalQuery);
  if (hasStatuteQuery) {
    response += '\n\n📚 **Suggestion:** Consider reviewing related statutes and recent case law for the most current interpretation of these legal principles.';
  }
  
  // Add procedural guidance
  const hasProceduralQuery = /\b(procedure|process|how to|steps)\b/i.test(originalQuery);
  if (hasProceduralQuery) {
    response += '\n\n📋 **Note:** Legal procedures can vary by jurisdiction. Verify local court rules and procedures that may apply to your specific case.';
  }
  
  return response;
}

// Health check endpoint
export const GET: RequestHandler = async () => {
  try {    const checks = {
      tauri_available: typeof window !== 'undefined' && '__TAURI__' in window,
      llm_service: false,
      // masking_service: false  // Commented out - focusing on core functionality
    };
    
    // Check LLM service
    try {
      const llmResponse = await fetch('http://localhost:8080/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      checks.llm_service = llmResponse.ok;
    } catch (error) {
      console.warn('LLM service check failed:', error);
    }
      // Check masking service (commented out - focusing on core functionality)
    // try {
    //   const maskResponse = await fetch('http://127.0.0.1:8002/health', {
    //     method: 'GET',
    //     signal: AbortSignal.timeout(2000)
    //   });
    //   checks.masking_service = maskResponse.ok;
    // } catch (error) {
    //   console.warn('Masking service check skipped:', error);
    // }
    
    const allHealthy = Object.values(checks).every(status => status);
    
    return json({
      status: allHealthy ? 'healthy' : 'partial',
      services: checks,
      timestamp: new Date().toISOString(),      recommendations: {
        llm_service: checks.llm_service ? null : 'Start llama.cpp server on port 8080',
        // masking_service: checks.masking_service ? null : 'Start Python masking service on port 8002',  // Commented out
        tauri: checks.tauri_available ? null : 'Running in web mode - some features may be limited'
      }
    });
    
  } catch (error) {
    return json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
};
