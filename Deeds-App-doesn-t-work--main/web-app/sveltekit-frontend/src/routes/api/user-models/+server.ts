import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const LLM_SERVICE_URL = env.LLM_SERVICE_URL || 'http://localhost:8001';

export async function GET() {
    try {
        // Get available models from Python NLP service
        const response = await fetch(`${LLM_SERVICE_URL}/models`);
        
        if (!response.ok) {
            throw new Error(`NLP service error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return json({
            models: data.models || [],
            activeModel: data.active_model,
            modelsDirectory: data.models_directory,
            totalModels: data.total_models || 0,
            serviceStatus: 'connected'
        });
        
    } catch (error) {
        console.error('Error fetching user models:', error);
        return json({
            models: [],
            activeModel: null,
            modelsDirectory: null,
            totalModels: 0,
            serviceStatus: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json();
        const { action, modelPath } = body;
        
        if (action === 'load') {
            if (!modelPath) {
                return json({ error: 'Model path is required' }, { status: 400 });
            }
            
            const response = await fetch(`${LLM_SERVICE_URL}/models/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_path: modelPath })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return json({ error: data.detail || 'Failed to load model' }, { status: response.status });
            }
            
            return json({
                success: true,
                message: data.message,
                modelPath: data.model_path
            });
            
        } else if (action === 'unload') {
            const response = await fetch(`${LLM_SERVICE_URL}/models/unload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            return json({
                success: true,
                message: data.message,
                previousModel: data.previous_model
            });
            
        } else {
            return json({ error: 'Invalid action. Use "load" or "unload"' }, { status: 400 });
        }
        
    } catch (error) {
        console.error('Error managing user model:', error);
        return json({
            error: 'Failed to manage model',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
