import { track } from './analytics';
import { getSessionScript } from './gemini';
import { synthesizeSegment } from './voice';
import { AI } from '../config/ai';

export interface ScriptSegment {
  id: string;
  text: string;
  approxSec?: number;
  mood?: string;
  voice?: string;
  sfx?: string;
}

export interface PlayableSegment extends ScriptSegment {
  audio: HTMLAudioElement | null;
  ttsProvider: 'elevenlabs' | 'browser-tts' | 'none';
}

export interface SessionState {
  playState: 'stopped' | 'playing' | 'paused';
  currentSegmentIndex: number;
  currentSegmentId: string | null;
  scriptPlan: any;
  bufferedAhead: number;
}

export class SessionManager {
  private _state: SessionState = {
    playState: 'stopped',
    currentSegmentIndex: 0,
    currentSegmentId: null,
    scriptPlan: null,
    bufferedAhead: 0
  };

  private segments: (PlayableSegment | null)[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private eventListeners: Record<string, Function[]> = {};
  private currentSegmentIndex = 0;
  private scriptPlan: any = null;

  async initialize(userContext: any) {
    console.log('Session: Initializing with context:', userContext);
    
    try {
      await this._initializeSession(userContext);
      console.log('Session: Successfully initialized');
    } catch (error) {
      console.error('Session: Failed to initialize:', error);
      throw error;
    }
  }

  private async _initializeSession(userContext: any) {
    const templates = {
      induction: "Close your eyes and breathe deeply...",
      deepener: "With each breath, you go deeper...",
      emerge: "On the count of three, you'll emerge feeling refreshed..."
    };

    try {
      this.scriptPlan = await getSessionScript(userContext, templates);
      console.log('Session: Generated script with', this.scriptPlan.segments?.length || 0, 'segments');
      
      this.segments = new Array(this.scriptPlan.segments?.length || 0).fill(null);
      this._updateState({ 
        scriptPlan: this.scriptPlan,
        currentSegmentId: this.scriptPlan.segments?.[0]?.id || null
      });

      // Start prefetching segments
      if (this.scriptPlan.segments?.length > 0) {
        await this._prefetchSegments(0, AI.voice.preBufferSegments);
      }
    } catch (error: any) {
      console.error('Session: Script generation failed, using fallback:', error.message);
      
      // Fallback script
      this.scriptPlan = {
        title: "Mindful Session",
        segments: [
          { id: "intro", text: "Welcome to your mindful session. Take a deep breath and relax." },
          { id: "body", text: "Feel the tension leaving your body with each exhale." },
          { id: "outro", text: "When you're ready, slowly open your eyes feeling refreshed." }
        ]
      };
      
      this.segments = new Array(this.scriptPlan.segments.length).fill(null);
      this._updateState({ 
        scriptPlan: this.scriptPlan,
        currentSegmentId: this.scriptPlan.segments[0].id
      });

      await this._prefetchSegments(0, AI.voice.preBufferSegments);
    }
  }

  private _updateState(updates: Partial<SessionState>) {
    this._state = { ...this._state, ...updates };
    this._emit('state-change', this._state);
  }

  private _emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener(data));
    }
  }

  private async _prefetchSegments(startIndex: number, count: number) {
    const segmentsToPrefetch = [];
    for (let i = startIndex; i < Math.min(startIndex + count, this.scriptPlan!.segments.length); i++) {
      if (!this.segments[i]) {
        segmentsToPrefetch.push({ index: i, segment: this.scriptPlan!.segments[i] });
      }
    }

    if (segmentsToPrefetch.length === 0) return;

    console.log(`Session: Prefetching ${segmentsToPrefetch.length} segments starting from ${startIndex}`);

    await Promise.all(segmentsToPrefetch.map(async ({ index, segment }) => {
      try {
        const voiceResult = await synthesizeSegment(segment.text, {
          voiceId: AI.voice.defaultVoiceId,
          model: AI.voice.model,
          cacheKey: `${this.scriptPlan!.title || 'script'}-${segment.id}`,
          mode: 'pre-gen'
        });

        console.log(`Session: Segment ${index} (${segment.id}) synthesized with provider: ${voiceResult.provider}`);

        // Handle different TTS providers
        let playableSegment: PlayableSegment;
        
        if (voiceResult.provider === 'elevenlabs' && voiceResult.audioUrl) {
          const audioElement = new Audio(voiceResult.audioUrl);
          
          // Preload the audio
          audioElement.preload = 'auto';
          
          // Handle audio events
          audioElement.onended = () => {
            console.log(`Session: Audio ended for segment ${index}`);
            this._handleSegmentEnd();
          };
          
          audioElement.onerror = (e) => {
            console.error(`Session: Audio error for segment ${index}:`, e);
          };
          
          playableSegment = {
            id: segment.id,
            text: segment.text,
            approxSec: segment.approxSec || 30,
            audio: audioElement,
            ttsProvider: 'elevenlabs'
          };
        } else {
          // Browser TTS or no audio
          playableSegment = {
            id: segment.id,
            text: segment.text,
            approxSec: segment.approxSec || 30,
            audio: null,
            ttsProvider: voiceResult.provider
          };
        }
        
        this.segments[index] = playableSegment;
        
        this._emit('segment-ready', segment.id);
        track('segment_buffered', { 
          segmentId: segment.id, 
          index: index, 
          provider: voiceResult.provider 
        });

      } catch (error: any) {
        console.error(`Session: Failed to prefetch segment ${index}:`, error.message);
        
        // Don't fail the entire session - create a text-only segment
        this.segments[index] = {
          id: segment.id,
          text: segment.text,
          approxSec: segment.approxSec || 30,
          audio: null,
          ttsProvider: 'browser-tts'
        };
        
        track('segment_buffer_error', { segmentId: segment.id, error: error.message });
      }
    }));

    this._updateState({ bufferedAhead: this.segments.filter(s => s !== null).length - this.currentSegmentIndex - 1 });
    console.log(`Session: Prefetch complete. ${this.segments.filter(s => s !== null).length} segments ready`);
  }

  play() {
    if (this._state.playState === 'playing') return;
    
    if (this.currentSegmentIndex >= 0 && this.segments[this.currentSegmentIndex]) {
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        console.log(`Session: Playing segment ${this.currentSegmentIndex} with provider: ${segment.ttsProvider}`);
        
        // Handle different TTS providers
        if (segment.ttsProvider === 'elevenlabs' && segment.audio) {
          this.currentAudioElement = segment.audio;
          this.currentAudioElement.play().catch(error => {
            console.error('Session: Audio play error:', error);
            this._playWithBrowserTTS(segment.text);
          });
        } else {
          // Use browser TTS
          this._playWithBrowserTTS(segment.text);
        }
        
        this._updateState({ playState: 'playing' });
        this._emit('play');
      }
    }
  }

  pause() {
    if (this._state.playState === 'paused') return;
    
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }
    
    // Stop browser TTS if active
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    
    this._updateState({ playState: 'paused' });
    this._emit('pause');
  }

  next() {
    if (this.currentSegmentIndex < this.segments.length - 1) {
      // Stop current audio
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      this.currentSegmentIndex++;
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id 
      });
      
      if (this._state.playState === 'playing') {
        this.play();
      }
      
      // Prefetch next segments
      this._prefetchSegments(this.currentSegmentIndex + 1, AI.voice.preBufferSegments).catch(() => {
        // Continue without prefetch
      });
    }
  }

  prev() {
    if (this.currentSegmentIndex > 0) {
      // Stop current audio
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      this.currentSegmentIndex--;
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id 
      });
      
      if (this._state.playState === 'playing') {
        this.play();
      }
    }
  }

  dispose() {
    console.log('Session: Disposing session manager');
    
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }
    
    // Stop any browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Clean up audio URLs to prevent memory leaks
    this.segments.forEach(segment => {
      if (segment?.audio?.src) {
        URL.revokeObjectURL(segment.audio.src);
      }
    });
    
    this.eventListeners = {};
    this._updateState({ playState: 'stopped' });
  }

  on(event: string, listener: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  getCurrentState(): SessionState {
    return { ...this._state };
  }
  
  private _handleSegmentEnd() {
    // Auto-advance to next segment when current segment finishes
    setTimeout(() => {
      if (this.currentSegmentIndex < this.segments.length - 1) {
        this.next();
      } else {
        this._updateState({ playState: 'stopped' });
        this._emit('end');
      }
    }, 500);
  }
  
  private _playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.warn('Browser TTS not available');
      return;
    }

    console.log(`Session: Playing with browser TTS: ${text.substring(0, 50)}...`);

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.6; // Even slower for hypnotherapy
    utterance.pitch = 0.7; // Lower, more soothing
    utterance.volume = 0.9;

    // Find a suitable voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Karen') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Victoria') ||
      voice.name.includes('Moira') ||
      voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`Session: Using browser voice: ${preferredVoice.name}`);
    }

    utterance.onend = () => {
      console.log('Session: Browser TTS finished');
      this._handleSegmentEnd();
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted') {
        console.debug('Browser TTS interrupted (normal when skipping/pausing):', event.error);
      } else {
        console.error('Browser TTS error:', event.error);
      }
      // Continue to next segment even on error
      this._handleSegmentEnd();
    };

    window.speechSynthesis.speak(utterance);
  }
}