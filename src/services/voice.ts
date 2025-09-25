import { track } from './analytics';

export interface VoiceResult {
  audioUrl?: string;
  provider: 'elevenlabs' | 'browser-tts' | 'none';
  error?: string;
}

export interface SynthesizeSegmentOptions {
  voiceId?: string;
  model?: 'flash-v2.5' | 'v3';
  cacheKey: string;
  mode?: 'live' | 'pre-gen';
}

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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.DEV) {
      console.warn('Supabase configuration missing for voice synthesis');
    }
    return { provider: 'browser-tts' };
  }

  try {
    const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
    
    const r = await fetch(`${baseUrl}/functions/v1/tts`, {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({ text, voiceId: opts.voiceId }),
    });

    // JSON response means fallback to browser TTS
    if (r.headers.get("content-type")?.includes("application/json")) {
      const j = await r.json();
      if (j.fallback === "browser-tts") {
        track('tts_synthesis_success', {
          textLength: text.length,
          provider: 'browser-tts',
          duration: Date.now() - startTime,
          cached: false
        });
        return { provider: "browser-tts" };
      }
      throw new Error("TTS unexpected JSON response");
    }

    // Audio response means success
    const blob = await r.blob();
    if (blob.size === 0) {
      throw new Error('Received empty audio response');
    }
    
    const url = URL.createObjectURL(blob);
    
    track('tts_synthesis_success', {
      textLength: text.length,
      provider: 'elevenlabs',
      duration: Date.now() - startTime,
      cached: false
    });
    
    return { provider: "elevenlabs", audioUrl: url };

  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error('Voice: Synthesis failed:', error);
    }
    
    track('tts_synthesis_error', {
      error: error.message,
      textLength: text.length,
      duration: Date.now() - startTime
    });
    
    return { provider: 'browser-tts', error: error.message };
  }
}

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

export async function getAvailableVoices(): Promise<Array<{id: string, name: string, category: string}>> {
  if (import.meta.env.DEV) {
    console.log('Voice: Skipping voice fetch in development');
  }
  return [];
}

export async function getUsageInfo(): Promise<{charactersUsed: number, charactersLimit: number} | null> {
  if (import.meta.env.DEV) {
    console.log('Voice: Skipping usage check in development');
  }
  return null;
}