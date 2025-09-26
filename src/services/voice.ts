import { safeFetch, ApiError, getUserFriendlyErrorMessage } from '../utils/apiErrorHandler';
import { track } from './analytics';

export interface VoiceResult {
  audioUrl?: string;
  provider: 'openai-tts' | 'browser-tts' | 'none';
  error?: string;
}

export interface SynthesizeSegmentOptions {
  voiceId?: string;
  model?: 'gpt-4o-mini-tts' | 'tts-1' | 'tts-1-hd';
  cacheKey?: string;
  mode?: 'live' | 'pre-gen';
}

export async function synthesizeSegment(text: string, opts: SynthesizeSegmentOptions = {}): Promise<VoiceResult> {
  // Check character limit for OpenAI TTS (4096 chars)
  if (text.length > 4096) {
    text = text.substring(0, 4000) + '...'; // Leave some buffer
  }
  
  if (import.meta.env.DEV) {
    console.log('Voice: Attempting TTS for text length:', text.length);
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.DEV) {
      console.log('Voice: Supabase not configured, using browser TTS');
    }
    return { provider: 'browser-tts' };
  }

  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    if (import.meta.env.DEV) {
      console.log('Voice: Calling TTS function at:', `${baseUrl}/functions/v1/tts`);
    }
    
    const response = await safeFetch(
      `${baseUrl}/functions/v1/tts`,
      {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "x-client-info": "libero-app"
        },
        body: JSON.stringify({ 
          text: text.trim(), 
          voice: opts.voiceId || "ash",
          model: opts.model || "gpt-4o-mini-tts",
          speed: 1.0,
          response_format: "wav"
        }),
      },
      {
        operation: 'Text-to-Speech',
        additionalContext: {
          textLength: text.length,
          voiceId: opts.voiceId,
          model: opts.model
        }
      }
    );

    if (import.meta.env.DEV) {
      console.log('Voice: TTS response status:', response.status);
      console.log('Voice: TTS response content-type:', response.headers.get("content-type"));
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Check if response is JSON (fallback signal)
    if (contentType.includes("application/json")) {
      const fallbackData = await response.json();
      if (import.meta.env.DEV) {
        console.log('Voice: OpenAI TTS returned fallback data:', fallbackData);
      }
      return { provider: "browser-tts", error: fallbackData.details || fallbackData.error };
    }

    // Check if response is audio
    if (contentType.includes("audio/")) {
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        if (import.meta.env.DEV) {
          console.log('Voice: Received empty audio blob from OpenAI TTS');
        }
        return { provider: 'browser-tts' };
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      if (import.meta.env.DEV) {
        console.log('Voice: Successfully received OpenAI TTS audio, size:', audioBlob.size);
      }
      return { provider: "openai-tts", audioUrl };
    }

    // Unexpected content type
    throw new ApiError(
      'Unexpected response format from TTS service',
      500,
      'UNEXPECTED_CONTENT_TYPE',
      `Received content type: ${contentType}`,
      'Try again or check TTS service configuration'
    );

  } catch (error: any) {
    if (error instanceof ApiError) {
      console.error('Voice: TTS error:', getUserFriendlyErrorMessage(error));
    } else {
      console.error('Voice: Unexpected TTS error:', error.message);
    }
    // Always fall back to browser TTS on error
    return { provider: 'browser-tts', error: error.message || 'TTS service unavailable' };
  }
}

export function synthesizeWithBrowserTTS(
  text: string, 
  voiceConfig: { rate?: number; pitch?: number; volume?: number } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Browser TTS not supported'));
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceConfig.rate ?? 0.7; // Slower for hypnotherapy
    utterance.pitch = voiceConfig.pitch ?? 0.8; // Lower, more soothing
    utterance.volume = voiceConfig.volume ?? 0.9;

    // Wait for voices to load if needed
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices();
      
      // Find the most suitable voice for hypnotherapy
      const preferredVoice = voices.find(voice => 
        voice.name.includes('David') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('Mark') ||
        voice.name.includes('Alex') ||
        voice.name.includes('Tom') ||
        (voice.lang.includes('en') && voice.name.includes('Google'))
      ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {};

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Browser TTS error:', event.error);
        reject(new Error(`Browser TTS failed: ${event.error}`));
      };

      speechSynthesis.speak(utterance);
    };

    // Handle voice loading
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
    } else {
      setVoiceAndSpeak();
    }
  });
}