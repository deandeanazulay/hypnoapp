import { get as cacheGet, set as cacheSet } from './cache';
import { track } from './analytics';
import { AI } from '../config/ai';

/**
 * Represents an audio blob, typically an MP3 or similar format.
 */
export type AudioBlob = Blob;

/**
 * Options for synthesizing a segment of speech.
 */
export interface SynthesizeSegmentOptions {
  voiceId: string;
  model: 'flash-v2.5' | 'v3';
  stability?: number;
  similarity?: number;
  style?: number;
  cacheKey: string; // Key for caching the audio result
  mode?: 'live' | 'pre-gen'; // 'live' for streaming, 'pre-gen' for full fetch
}

/**
 * ElevenLabs API request format
 */
interface ElevenLabsRequest {
  text: string;
  model_id: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  output_format?: 'mp3_44100_128' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000';
}

/**
 * Circuit breaker for ElevenLabs API calls
 */
class VoiceCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 3,
    private timeoutMs = 30000, // 30 seconds
    private monitoringPeriodMs = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeoutMs) {
        throw new Error('Voice service temporarily unavailable');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

const voiceCircuitBreaker = new VoiceCircuitBreaker();

/**
 * Maps internal model names to ElevenLabs model IDs
 */
const MODEL_MAP = {
  'flash-v2.5': 'eleven_flash_v2_5',
  'v3': 'eleven_multilingual_v2'
} as const;

/**
 * Synthesizes a segment of text into audio using ElevenLabs TTS.
 *
 * @param text - The text to synthesize.
 * @param opts - Options for synthesis, including voice, model, and caching.
 * @returns A promise that resolves to an AudioBlob.
 */
export async function synthesizeSegment(text: string, opts: SynthesizeSegmentOptions): Promise<AudioBlob> {
  const startTime = Date.now();
  if (import.meta.env.DEV) {
    console.log('ElevenLabs: Synthesizing segment:', text.substring(0, 50) + '...', 'with opts:', opts);
  }
  
  // Track synthesis attempt
  track('tts_synthesis_start', {
    textLength: text.length,
    voiceId: opts.voiceId,
    model: opts.model,
    mode: opts.mode
  });

  try {
    // Check cache first
    const cached = await cacheGet(opts.cacheKey);
    if (cached && cached.data instanceof Blob) {
      if (import.meta.env.DEV) {
        console.log('ElevenLabs: Cache hit for key:', opts.cacheKey);
      }
      track('tts_cache_hit', { cacheKey: opts.cacheKey });
      return cached.data;
    }

    // Not in cache - synthesize via API
    if (import.meta.env.DEV) {
      console.log('ElevenLabs: Cache miss, calling API for key:', opts.cacheKey);
    }
    track('tts_cache_miss', { cacheKey: opts.cacheKey });

    const audioBlob = await voiceCircuitBreaker.execute(async () => {
      return await callElevenLabsAPI(text, opts);
    });

    // Cache the result
    const cacheMetadata = {
      timestamp: Date.now(),
      size: audioBlob.size,
      lastAccessed: Date.now()
    };
    
    try {
      await cacheSet(opts.cacheKey, audioBlob, cacheMetadata);
      if (import.meta.env.DEV) {
        console.log('ElevenLabs: Cached audio blob, size:', audioBlob.size, 'bytes');
      }
    } catch (cacheError) {
      console.warn('ElevenLabs: Failed to cache audio:', cacheError);
      // Continue without caching - don't fail the synthesis
    }

    // Track successful synthesis
    track('tts_synthesis_success', {
      textLength: text.length,
      audioSize: audioBlob.size,
      duration: Date.now() - startTime,
      cached: false
    });

    return audioBlob;
    
  } catch (error: any) {
    console.error('ElevenLabs: Synthesis failed:', error);
    
    track('tts_synthesis_error', {
      error: error.message,
      textLength: text.length,
      duration: Date.now() - startTime
    });
    
    throw new Error(`Voice synthesis failed: ${error.message}`);
  }
}

/**
 * Makes the actual API call to ElevenLabs
 */
async function callElevenLabsAPI(text: string, opts: SynthesizeSegmentOptions): Promise<AudioBlob> {
  // Always use serverless proxy to avoid CORS issues
  return await callViaServerlessProxy(text, opts);
}

/**
 * Call ElevenLabs via serverless proxy (recommended for production)
 */
async function callViaServerlessProxy(text: string, opts: SynthesizeSegmentOptions): Promise<AudioBlob> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing for voice proxy');
  }

  const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
  
  const response = await fetch(`${baseUrl}/functions/v1/elevenlabs-tts-proxy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId: opts.voiceId,
      model: opts.model,
      stability: opts.stability ?? 0.7,
      similarity: opts.similarity ?? 0.8,
      style: opts.style ?? 0.3,
      mode: opts.mode ?? 'pre-gen'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Proxy error: ${response.status} - ${errorText}`);
  }

  return await response.blob();
}

/**
 * Call ElevenLabs API directly (for development or when proxy unavailable)
 */
async function callDirectAPI(text: string, opts: SynthesizeSegmentOptions): Promise<AudioBlob> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ELEVENLABS_API_KEY environment variable not set');
  }

  const modelId = MODEL_MAP[opts.model];
  if (!modelId) {
    throw new Error(`Unsupported model: ${opts.model}`);
  }

  // Choose endpoint based on mode
  const endpoint = opts.mode === 'live' 
    ? `${AI.elevenLabsBaseUrl}/text-to-speech/${opts.voiceId}/stream`
    : `${AI.elevenLabsBaseUrl}/text-to-speech/${opts.voiceId}`;

  const requestBody: ElevenLabsRequest = {
    text: text.trim(),
    model_id: modelId,
    voice_settings: {
      stability: opts.stability ?? 0.7,
      similarity_boost: opts.similarity ?? 0.8,
      style: opts.style ?? 0.3,
      use_speaker_boost: true
    },
    output_format: 'mp3_44100_128'
  };

  if (import.meta.env.DEV) {
    console.log('ElevenLabs: Making API call to:', endpoint);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.detail && errorData.detail.message) {
        errorMessage = errorData.detail.message;
      }
    } catch {
      // Error response wasn't JSON, use status text
    }
    
    throw new Error(errorMessage);
  }

  const audioBlob = await response.blob();
  
  if (audioBlob.size === 0) {
    throw new Error('Received empty audio response');
  }

  if (import.meta.env.DEV) {
    console.log('ElevenLabs: Received audio blob, size:', audioBlob.size, 'bytes');
  }
  return audioBlob;
}

/**
 * Validates text input for TTS synthesis
 */
function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  
  if (text.length > 5000) {
    throw new Error('Text too long (max 5000 characters)');
  }
  
  // Check for potentially problematic characters
  const problematicChars = /[<>{}[\]]/g;
  if (problematicChars.test(text)) {
    console.warn('Text contains potentially problematic characters for TTS');
  }
}

/**
 * Gets available voices from ElevenLabs (for configuration)
 */
export async function getAvailableVoices(): Promise<Array<{id: string, name: string, category: string}>> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('ElevenLabs API key not configured');
    return [];
  }

  try {
    const response = await fetch(`${AI.elevenLabsBaseUrl}/voices`, {
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category
    }));
  } catch (error) {
    console.error('Failed to fetch available voices:', error);
    return [];
  }
}

/**
 * Checks ElevenLabs API quota/usage
 */
export async function getUsageInfo(): Promise<{charactersUsed: number, charactersLimit: number} | null> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${AI.elevenLabsBaseUrl}/user`, {
      headers: {
        'xi-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch usage: ${response.status}`);
    }

    const data = await response.json();
    return {
      charactersUsed: data.subscription?.character_count || 0,
      charactersLimit: data.subscription?.character_limit || 10000
    };
  } catch (error) {
    console.error('Failed to fetch usage info:', error);
    return null;
  }
}