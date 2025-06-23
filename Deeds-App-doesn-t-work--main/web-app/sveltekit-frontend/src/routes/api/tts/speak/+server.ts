// Text-to-Speech API endpoint
// Integrates with OpenTTS or other TTS services

import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  format?: string;
}

interface TTSResponse {
  success: boolean;
  audioData?: string; // Base64 encoded audio
  format?: string;
  duration?: number;
  error?: string;
}

// Configuration for TTS services
const TTS_CONFIG = {
  openTTS: {
    url: 'http://localhost:5500',
    enabled: true,
    defaultVoice: 'en-us_ljspeech-glow-tts'
  },
  fallback: {
    enabled: true
  }
};

export const POST = async ({ request }: RequestEvent) => {
  try {
    const body: TTSRequest = await request.json();
    const { text, voice, speed, format } = body;

    if (!text || text.trim().length === 0) {
      return json({
        success: false,
        error: 'Text is required'
      } as TTSResponse, { status: 400 });
    }

    if (text.length > 1000) {
      return json({
        success: false,
        error: 'Text too long (max 1000 characters)'
      } as TTSResponse, { status: 400 });
    }

    console.log('TTS Request:', { textLength: text.length, voice, speed, format });

    // Try OpenTTS first
    if (TTS_CONFIG.openTTS.enabled) {
      try {
        const audioData = await generateWithOpenTTS(text, voice, speed, format);
        return new Response(audioData, {
          headers: {
            'Content-Type': 'audio/wav',
            'Content-Disposition': 'attachment; filename="speech.wav"'
          }
        });
      } catch (error) {
        console.error('OpenTTS failed:', error);
        // Fall through to fallback
      }
    }

    // Fallback response
    return json({
      success: false,
      error: 'TTS service unavailable. Please check if OpenTTS is running on localhost:5500'
    } as TTSResponse, { status: 503 });

  } catch (error) {
    console.error('TTS API error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as TTSResponse, { status: 500 });
  }
};

// Generate speech using OpenTTS
async function generateWithOpenTTS(
  text: string,
  voice?: string,
  speed?: number,
  format?: string
): Promise<ArrayBuffer> {
  
  const selectedVoice = voice || TTS_CONFIG.openTTS.defaultVoice;
  const selectedSpeed = speed || 1.0;
  const selectedFormat = format || 'wav';
  
  // Clean and prepare text
  const cleanText = text
    .replace(/[<>]/g, '') // Remove HTML-like brackets
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim();

  // Build OpenTTS URL
  const params = new URLSearchParams({
    voice: selectedVoice,
    text: cleanText,
    vocoder: 'hifigan',
    denoiserStrength: '0.005',
    lengthScale: (1 / selectedSpeed).toString()
  });

  const url = `${TTS_CONFIG.openTTS.url}/api/tts?${params.toString()}`;
  
  console.log('Calling OpenTTS:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'audio/wav'
    }
  });

  if (!response.ok) {
    throw new Error(`OpenTTS API error: ${response.status} ${response.statusText}`);
  }

  const audioData = await response.arrayBuffer();
  console.log('OpenTTS response:', audioData.byteLength, 'bytes');
  
  return audioData;
}

// Alternative: Get available voices
export const GET = async ({ url }: RequestEvent) => {
  const endpoint = url.searchParams.get('endpoint');
  
  if (endpoint === 'voices') {
    try {
      const response = await fetch(`${TTS_CONFIG.openTTS.url}/api/voices`);
      if (response.ok) {
        const voices = await response.json();
        return json({
          success: true,
          voices: voices
        });
      }
    } catch (error) {
      console.error('Failed to get voices:', error);
    }
    
    // Fallback voice list
    return json({
      success: true,
      voices: [
        { id: 'en-us_ljspeech-glow-tts', name: 'LJSpeech (English US)', language: 'en-US' },
        { id: 'en-us_mary-glow-tts', name: 'Mary (English US)', language: 'en-US' },
        { id: 'en-gb_southern_english_female-glow-tts', name: 'Southern English Female', language: 'en-GB' }
      ]
    });
  }
  
  return json({
    success: false,
    error: 'Unknown endpoint'
  }, { status: 404 });
};
