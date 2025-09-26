import { track } from './analytics';

export interface VoiceResult {
  audioUrl?: string;
  provider: 'elevenlabs' | 'browser-tts' | 'none';
  error?: string;
}

export interface SynthesizeSegmentOptions {
  voiceId?: string;
  model?: 'flash-v2.5' | 'v3';
  cacheKey?: string;
  mode?: 'live' | 'pre-gen';
}

export async function synthesizeSegment(text: string, opts: SynthesizeSegmentOptions = {}): Promise<VoiceResult> {
  const startTime = Date.now();
  console.log(`Voice: Synthesizing ${text.length} chars with voice ${opts.voiceId || 'default'} for ${opts.cacheKey || 'unknown segment'}`);
  
  track('tts_synthesis_start', {
    textLength: text.length,
    voiceId: opts.voiceId,
    model: opts.model,
    mode: opts.mode
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(`Voice: Supabase configuration missing for ${opts.cacheKey || 'segment'}, falling back to browser TTS`);
    track('tts_synthesis_success', {
      textLength: text.length,
      provider: 'browser-tts',
      duration: Date.now() - startTime,
      reason: 'no-config'
    });
    return { provider: 'browser-tts' };
  }

  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    console.log(`Voice: Calling TTS function at ${baseUrl}/functions/v1/tts for ${opts.cacheKey || 'segment'}`);
    
    const response = await fetch(`${baseUrl}/functions/v1/tts`, {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ 
        text: text.trim(), 
        voiceId: opts.voiceId || "pNInz6obpgDQGcFmaJgB" // Adam voice - calm male
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Voice: TTS function error ${response.status} for ${opts.cacheKey || 'segment'}:`, errorText);
      throw new Error(`TTS function returned ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Check if response is JSON (fallback signal)
    if (contentType.includes("application/json")) {
      const fallbackData = await response.json();
      console.log(`Voice: ElevenLabs fallback triggered for ${opts.cacheKey || 'segment'}:`, fallbackData.reason || 'API returned JSON instead of audio');
      console.log(`Voice: Fallback details:`, fallbackData);
      
      track('tts_synthesis_success', {
        textLength: text.length,
        provider: 'browser-tts',
        duration: Date.now() - startTime,
        reason: fallbackData.reason || 'api-fallback'
      });
      
      return { provider: "browser-tts", error: fallbackData.reason };
    }

    // Check if response is audio
    if (contentType.includes("audio/")) {
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        console.warn(`Voice: Received empty audio response for ${opts.cacheKey || 'segment'}, falling back to browser TTS`);
        return { provider: 'browser-tts' };
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(`Voice: Successfully generated ${audioBlob.size} bytes of audio for ${opts.cacheKey || 'segment'}`);
      
      track('tts_synthesis_success', {
        textLength: text.length,
        provider: 'elevenlabs',
        duration: Date.now() - startTime,
        audioSize: audioBlob.size
      });
      
      return { provider: "elevenlabs", audioUrl };
    }

    // Unexpected content type
    throw new Error(`Unexpected content type: ${contentType}`);

  } catch (error: any) {
    console.error(`Voice: Synthesis failed for ${opts.cacheKey || 'segment'}:`, error.message);
    
    track('tts_synthesis_error', {
      error: error.message,
      textLength: text.length,
      cacheKey: opts.cacheKey,
      duration: Date.now() - startTime
    });
    
    // Always fall back to browser TTS on error
    return { provider: 'browser-tts', error: error.message };
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

    console.log(`🗣️ Voice: Using browser TTS for: ${text.substring(0, 50)}...`);

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceConfig.rate ?? 0.7; // Slower for hypnotherapy
    utterance.pitch = voiceConfig.pitch ?? 0.8; // Lower, more soothing
    utterance.volume = voiceConfig.volume ?? 0.9;

    // Wait for voices to load if needed
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices();
      console.log(`🗣️ Voice: Found ${voices.length} browser voices`);
      
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
        console.log(`🗣️ Voice: Using browser voice: ${preferredVoice.name}`);
      }

      utterance.onstart = () => {
        console.log('🗣️ Voice: Browser TTS started');
      };

      utterance.onend = () => {
        console.log('🗣️ Voice: Browser TTS finished');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('🗣️ Voice: Browser TTS error:', event.error);
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

export async function getAvailableVoices(): Promise<Array<{id: string, name: string, category: string}>> {
  console.log('Voice: Getting available voices');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Voice: Supabase not configured for voice listing');
    return [];
  }

  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    const response = await fetch(`${baseUrl}/functions/v1/elevenlabs-voices`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      console.warn('Voice: Could not fetch ElevenLabs voices');
      return [];
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Voice: Error fetching voices:', error);
    return [];
  }
}

export async function getUsageInfo(): Promise<{charactersUsed: number, charactersLimit: number} | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    const response = await fetch(`${baseUrl}/functions/v1/elevenlabs-usage`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      charactersUsed: data.character_count || 0,
      charactersLimit: data.character_limit || 10000
    };
  } catch (error) {
    console.error('Voice: Error fetching usage info:', error);
    return null;
  }
}