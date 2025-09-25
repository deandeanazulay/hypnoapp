// Hardened Voice Synthesis with Graceful TTS Fallbacks
import { get as cacheGet, set as cacheSet } from './cache';
import { track } from './analytics';
import { AI } from '../config/ai';

/**
 * Voice synthesis result with provider information
 */
export interface VoiceResult {
  audioUrl: string;
  provider: 'elevenlabs' | 'browser-tts' | 'none';
  error?: string;
}

/**
 * Represents an audio blob
 */
export type AudioBlob = Blob;

/**
 * Options for synthesizing a segment of speech
 */
export interface SynthesizeSegmentOptions {
  voiceId: string;
  model: 'flash-v2.5' | 'v3';
  stability?: number;
  similarity?: number;
  style?: number;
  cacheKey: string;
  mode?: 'live' | 'pre-gen';
}

/**
 * Circuit breaker for voice synthesis
 */
class VoiceCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 3,
    private timeoutMs = 30000,
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
 * Synthesizes a segment of text into audio with graceful fallbacks
 */
export async function synthesizeSegment(text: string, opts: SynthesizeSegmentOptions): Promise<VoiceResult> {
  const startTime = Date.now();
  if (import.meta.env.DEV) {
    console.log('Voice: Synthesizing segment:', text.substring(0, 50) + '...');
  }
  
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
        console.log('Voice: Cache hit for key:', opts.cacheKey);
      }
      track('tts_cache_hit', { cacheKey: opts.cacheKey });
      return {
        audioUrl: URL.createObjectURL(cached.data),
        provider: 'elevenlabs'
      };
    }

    // Try ElevenLabs API
    const result = await voiceCircuitBreaker.execute(async () => {
      return await callElevenLabsAPI(text, opts);
    });

    // Cache successful result
    if (result.provider === 'elevenlabs' && result.audioUrl) {
      try {
        const response = await fetch(result.audioUrl);
        const audioBlob = await response.blob();
        
        const cacheMetadata = {
          timestamp: Date.now(),
          size: audioBlob.size,
          lastAccessed: Date.now()
        };
        
        await cacheSet(opts.cacheKey, audioBlob, cacheMetadata);
        if (import.meta.env.DEV) {
          console.log('Voice: Cached audio blob, size:', audioBlob.size, 'bytes');
        }
      } catch (cacheError) {
        console.warn('Voice: Failed to cache audio:', cacheError);
      }
    }

    track('tts_synthesis_success', {
      textLength: text.length,
      provider: result.provider,
      duration: Date.now() - startTime,
      cached: false
    });

    return result;
    
  } catch (error: any) {
    console.error('Voice: Synthesis failed:', error);
    
    track('tts_synthesis_error', {
      error: error.message,
      textLength: text.length,
      duration: Date.now() - startTime
    });
    
    // Graceful fallback to browser TTS
    if (error.message.includes('401') || error.message.includes('402') || error.message.includes('429')) {
      console.warn('Voice: ElevenLabs auth/rate issue, falling back to browser TTS');
      return {
        audioUrl: '',
        provider: 'browser-tts',
        error: 'ElevenLabs unavailable - using device voice'
      };
    }
    
    // For other errors, return none provider
    return {
      audioUrl: '',
      provider: 'none',
      error: error.message
    };
  }
}

/**
 * Call ElevenLabs API with robust error handling
 */
async function callElevenLabsAPI(text: string, opts: SynthesizeSegmentOptions): Promise<VoiceResult> {
  // Validate text length
  if (text.length > 5000) {
    throw new Error('Text too long (max 5000 characters)');
  }

  // Always use serverless proxy
  return await callViaServerlessProxy(text, opts);
}

/**
 * Call ElevenLabs via serverless proxy with auth error handling
 */
async function callViaServerlessProxy(text: string, opts: SynthesizeSegmentOptions): Promise<VoiceResult> {
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
    
    // Parse ElevenLabs specific errors
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error && errorData.error.includes('Free Tier usage disabled')) {
        throw Object.assign(new Error('TTS_AUTH_OR_RATE'), { code: 401 });
      }
    } catch {
      // Not JSON error response
    }
    
    throw new Error(`Proxy error: ${response.status} - ${errorText}`);
  }

  const audioBlob = await response.blob();
  if (audioBlob.size === 0) {
    throw new Error('Received empty audio response');
  }

  return {
    audioUrl: URL.createObjectURL(audioBlob),
    provider: 'elevenlabs'
  };
}

/**
 * Browser TTS fallback using Web Speech API
 */
export function synthesizeWithBrowserTTS(text: string, voiceConfig?: { rate?: number; pitch?: number; volume?: number }): Promise<VoiceResult> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Browser TTS not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceConfig?.rate ?? 0.7;
    utterance.pitch = voiceConfig?.pitch ?? 0.8;
    utterance.volume = voiceConfig?.volume ?? 0.9;

    // Find a suitable voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Karen') ||
      voice.name.includes('Samantha') ||
      voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      if (import.meta.env.DEV) {
        console.log('Browser TTS: Started speaking');
      }
    };

    utterance.onend = () => {
      if (import.meta.env.DEV) {
        console.log('Browser TTS: Finished speaking');
      }
      resolve({
        audioUrl: '',
        provider: 'browser-tts'
      });
    };

    utterance.onerror = (event) => {
      console.error('Browser TTS error:', event.error);
      reject(new Error(`Browser TTS failed: ${event.error}`));
    };

    speechSynthesis.speak(utterance);
  });
}

/**
 * Gets available voices from ElevenLabs (for configuration)
 */
export async function getAvailableVoices(): Promise<Array<{id: string, name: string, category: string}>> {
  // Return empty array to avoid API calls during development
  if (import.meta.env.DEV) {
    console.log('Voice: Skipping voice fetch in development');
  }
  return [];
}

/**
 * Checks ElevenLabs API quota/usage
 */
export async function getUsageInfo(): Promise<{charactersUsed: number, charactersLimit: number} | null> {
  // Return null to avoid API calls during development
  if (import.meta.env.DEV) {
    console.log('Voice: Skipping usage check in development');
  }
  return null;
}