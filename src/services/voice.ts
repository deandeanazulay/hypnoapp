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
    console.log('[VOICE] 🎤 FORCING OpenAI TTS with ash voice for text length:', text.length);
  }
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Since chatgpt-chat works, we know Supabase is configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[VOICE] ❌ Missing Supabase config - this should not happen since chat works');
    throw new Error('Supabase configuration missing');
  }

  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    // Use EXACT same pattern as working chatgpt-chat function
    const ttsEndpoint = `${baseUrl}/functions/v1/tts`;
    
    if (import.meta.env.DEV) {
      console.log('[VOICE] 🎤 CALLING OpenAI TTS API at:', ttsEndpoint);
      console.log('[VOICE] 🎤 FORCING ash voice with tts-1-hd model');
      console.log('[VOICE] 🎤 Text preview:', text.substring(0, 50) + '...');
    }
    
    // FORCE OpenAI TTS call - same pattern as working chatgpt-chat
    const response = await safeFetch(
      ttsEndpoint,
      {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text.trim(),
          voice: 'ash',
          model: 'tts-1-hd',
          speed: 0.9,
          response_format: "mp3"
        })
      },
      {
        operation: 'Text-to-Speech',
        additionalContext: {
          textLength: text.length,
          voiceId: 'ash',
          model: 'tts-1-hd'
        }
      }
    );

    if (import.meta.env.DEV) {
      console.log('[VOICE] 🎤 OpenAI TTS API response status:', response.status);
      console.log('[VOICE] 🎤 OpenAI TTS content-type:', response.headers.get('content-type'));
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Check if response is JSON (error signal)
    if (contentType.includes('application/json')) {
      const fallbackData = await response.json();
      if (import.meta.env.DEV) {
        console.error('[VOICE] ❌ OpenAI TTS API returned error:', fallbackData);
        console.error('[VOICE] ❌ Error details:', fallbackData.details || fallbackData.error);
      }
      throw new Error(fallbackData.error || 'OpenAI TTS API error');
    }

    // Check if response is audio
    if (contentType.includes('audio/')) {
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        if (import.meta.env.DEV) {
          console.error('[VOICE] ❌ Empty audio blob from OpenAI TTS');
        }
        throw new Error('Empty audio response from OpenAI TTS');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      if (import.meta.env.DEV) {
        console.log('[VOICE] 🎤 ✅ SUCCESS! OpenAI ash voice audio received!');
        console.log('[VOICE] 🎤 Audio blob size:', audioBlob.size, 'bytes');
        console.log('[VOICE] 🎤 Audio URL created for ash voice');
      }
      return { provider: 'openai-tts', audioUrl };
    }

    // Unexpected content type
    if (import.meta.env.DEV) {
      console.error('[VOICE] ❌ Unexpected content type from TTS API:', contentType);
    }
    throw new Error(`Unexpected content type: ${contentType}`);

  } catch (error: any) {
    console.error('[VOICE] ❌ OpenAI TTS failed:', error.message);
    console.warn('[VOICE] ⚠️ Falling back to robotic browser TTS');
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
    utterance.pitch = voiceConfig.pitch ?? 0.8; // Lower for calming
    utterance.volume = voiceConfig.volume ?? 1.0;

    const setVoiceAndSpeak = () => {
      // Set voice immediately
      const voices = speechSynthesis.getVoices();
      
      // Try to find a voice similar to "ash" characteristics (calm, soothing)
      const preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('fiona') ||
        voice.name.toLowerCase().includes('moira') ||
        (voice.lang.includes('en') && voice.name.toLowerCase().includes('female'))
      ) || voices.find(voice => voice.lang.includes('en') && !voice.name.toLowerCase().includes('google')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        if (import.meta.env.DEV) {
          console.log('[VOICE] Selected browser voice for ash-like experience:', selectedVoice.name);
        }
      }

      utterance.onstart = () => {
        if (import.meta.env.DEV) {
          console.log('[VOICE] ✅ Browser TTS started speaking with ash-like voice');
        }
      };

      utterance.onend = () => {
        if (import.meta.env.DEV) {
          console.log('[VOICE] Browser TTS finished speaking');
        }
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('[VOICE] Browser TTS error:', event.error);
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          reject(new Error(`Browser TTS failed: ${event.error}`));
        } else {
          resolve();
        }
      };

      // Start speech immediately
      try {
        if (import.meta.env.DEV) {
          console.log('[VOICE] Starting browser speech synthesis with ash-like voice...');
        }
        speechSynthesis.speak(utterance);
        
        // Force start on mobile devices
        setTimeout(() => {
          if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            if (import.meta.env.DEV) {
              console.log('[VOICE] Forcing speech start for mobile compatibility...');
            }
            speechSynthesis.speak(utterance);
          }
        }, 100);
        
      } catch (error) {
        console.error('[VOICE] Failed to start browser speech synthesis:', error);
        reject(error);
      }
    };

    setTimeout(() => {
      // Handle voice loading with timeout
      if (speechSynthesis.getVoices().length === 0) {
        let voicesLoaded = false;
        const handleVoicesChanged = () => {
          if (!voicesLoaded) {
            voicesLoaded = true;
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            setVoiceAndSpeak();
          }
        };
        
        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        
        // Try to trigger voice loading
        window.speechSynthesis.getVoices();
        
        // Fallback timeout
        setTimeout(() => {
          if (!voicesLoaded) {
            voicesLoaded = true;
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            setVoiceAndSpeak();
          }
        }, 1000);
      } else {
        setVoiceAndSpeak();
      }
    }, 50);
  });
}