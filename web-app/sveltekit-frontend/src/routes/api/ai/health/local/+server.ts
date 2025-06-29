// Local AI health check endpoint for Gemma3 Ollama integration
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ollamaService } from '$lib/services/ollama-service';

export const GET: RequestHandler = async () => {
  try {
    // Check if Ollama is available and responsive
    const isAvailable = ollamaService.isAvailable();
    
    if (!isAvailable) {
      return json({
        success: false,
        available: false,
        error: 'Ollama service not available'
      });
    }

    // Check if models are loaded
    try {
      const models = await ollamaService.listModels();
      const gemmaModels = models.filter(m => 
        m.name.includes('gemma') || 
        m.name.includes('gemma2') ||
        m.name.includes('gemma3')
      );

      if (gemmaModels.length === 0) {
        return json({
          success: false,
          available: false,
          error: 'No Gemma models found in Ollama',
          models: models.map(m => m.name)
        });
      }

      // Try a simple test inference
      const testModel = gemmaModels[0].name;
      const testResponse = await ollamaService.generateResponse('Hello', {
        model: testModel,
        temperature: 0.1,
        maxTokens: 10,
        stream: false
      });

      return json({
        success: true,
        available: true,
        model: testModel,
        models: gemmaModels.map(m => ({
          name: m.name,
          size: m.size,
          modified: m.modified_at
        })),
        testResponse: testResponse.response.substring(0, 50),
        lastCheck: new Date().toISOString()
      });

    } catch (modelError) {
      console.error('Model check failed:', modelError);
      return json({
        success: false,
        available: false,
        error: 'Model check failed: ' + (modelError instanceof Error ? modelError.message : 'Unknown error')
      });
    }

  } catch (error) {
    console.error('Local AI health check failed:', error);
    return json({
      success: false,
      available: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 500 });
  }
};
