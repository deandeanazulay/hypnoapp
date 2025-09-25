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
  totalSegments: number;
  scriptPlan: any;
  bufferedAhead: number;
  error: string | null;
}

export class SessionManager {
  private _state: SessionState = {
    playState: 'stopped',
    currentSegmentIndex: 0,
    currentSegmentId: null,
    totalSegments: 0,
    scriptPlan: null,
    bufferedAhead: 0,
    error: null
  };

  private segments: (PlayableSegment | null)[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private eventListeners: Record<string, Function[]> = {};
  private currentSegmentIndex = 0;
  private scriptPlan: any = null;

  async initialize(userContext: any) {
    console.log('Session: Initializing...');
    
    try {
      await this._initializeSession(userContext);
      console.log('Session: Initialized successfully');
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

    console.log('Session: Generating script...');
    
    try {
      this.scriptPlan = await getSessionScript(userContext);
      console.log('Session: Got script with', this.scriptPlan.segments?.length || 0, 'segments');
      
      // Ensure we have valid segments
      if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
        console.log('Session: No segments, creating fallback');
        this.scriptPlan = this._createFallbackScript(userContext);
      }
    } catch (error: any) {
      console.log('Session: Script failed, using fallback');
      this.scriptPlan = this._createFallbackScript(userContext);
    }

    // Double-check we have segments
    if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
      console.log('Session: Creating emergency fallback');
      this.scriptPlan = this._createEmergencyFallback();
    }

    // Validate final script
    if (!this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
      throw new Error('Failed to create any segments');
    }

    // Initialize segments array
    this.segments = this.scriptPlan.segments.map((segment: any) => ({
      id: segment.id,
      text: segment.text,
      approxSec: segment.approxSec || 30,
      audio: null,
      ttsProvider: 'browser-tts' as const
    }));
    
    console.log('Session: Ready with', this.segments.length, 'segments');
  }

  private _createFallbackScript(userContext: any) {
    console.log('Session: Creating fallback script');
    
    return {
      title: `${userContext.egoState || 'Guardian'} Session`,
      segments: [
        { id: "intro", text: `Welcome to your ${userContext.egoState || 'guardian'} session. Take a deep breath and allow yourself to settle in comfortably.`, approxSec: 15 },
        { id: "relaxation", text: "Close your eyes gently and feel your body beginning to relax. With each breath, let go of any tension you've been holding.", approxSec: 20 },
        { id: "deepening", text: "Going deeper now, feeling more and more relaxed with each breath you take. Each exhale releases stress and brings you deeper into peace.", approxSec: 25 },
        { id: "safe-space", text: "Imagine yourself in a beautiful, safe space where you feel completely protected and at peace. This is your sanctuary.", approxSec: 30 },
        { id: "transformation", text: "In this peaceful state, positive changes are happening within you. You are releasing old patterns and embracing new possibilities.", approxSec: 30 },
        { id: "strengthening", text: "These positive changes are becoming stronger now, integrating into every cell of your being. You are transforming naturally.", approxSec: 25 },
        { id: "integration", text: "Feel these wonderful changes becoming a permanent part of who you are. They will stay with you long after this session ends.", approxSec: 25 },
        { id: "emergence", text: "Now it's time to return, bringing all these positive changes with you. Count with me: One, energy returning. Two, becoming aware. Three, feeling refreshed. Four, almost ready. Five, eyes open, fully alert and wonderfully refreshed.", approxSec: 30 }
      ]
    };
  }

  private _createEmergencyFallback() {
    console.log('Session: Emergency fallback');
    
    return {
      title: 'Relaxation Session',
      segments: [
        { id: "welcome", text: "Welcome. Take a deep breath and relax.", approxSec: 10 },
        { id: "breathe", text: "Close your eyes and breathe naturally.", approxSec: 15 },
        { id: "release", text: "Feel all tension leaving your body.", approxSec: 15 },
        { id: "peace", text: "You are at peace. You are calm.", approxSec: 10 },
        { id: "return", text: "Now return refreshed and alert.", approxSec: 10 }
      ]
    };
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

    console.log(`Session: Prefetching ${segmentsToPrefetch.length} segments starting from segment ${startIndex + 1}`);

    await Promise.all(segmentsToPrefetch.map(async ({ index, segment }) => {
      try {
        const voiceResult = await synthesizeSegment(segment.text, {
          voiceId: AI.voice.defaultVoiceId,
          model: AI.voice.model,
          cacheKey: `${this.scriptPlan!.title || 'script'}-${segment.id}`,
          mode: 'pre-gen'
        });

        console.log(`Session: Segment ${index + 1} (${segment.id}) synthesized with provider: ${voiceResult.provider}`);

        // Handle different TTS providers
        let playableSegment: PlayableSegment;
        
        if (voiceResult.provider === 'elevenlabs' && voiceResult.audioUrl) {
          const audioElement = new Audio(voiceResult.audioUrl);
          
          // Preload the audio
          audioElement.preload = 'auto';
          audioElement.load(); // Force loading
          
          // Don't set global handlers here - they'll be set when playing
          
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
          index: index + 1, 
          provider: voiceResult.provider 
        });

      } catch (error: any) {
        console.error(`Session: Failed to prefetch segment ${index + 1}:`, error.message);
        
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
    console.log(`Session: Prefetch complete. ${this.segments.filter(s => s !== null).length} total segments ready`);
  }

  play() {
    if (this._state.playState === 'playing') return;
    
    // Check if we have segments
    if (!this.segments || this.segments.length === 0) {
      console.error('Session: No segments to play');
      this._updateState({ error: 'No segments available to play' });
      return;
    }
    
    console.log('Session: Playing segment', this.currentSegmentIndex + 1);
    
    // Check if we have a valid segment
    if (this.currentSegmentIndex < 0 || this.currentSegmentIndex >= this.segments.length) {
      console.error('Session: Invalid segment index');
      return;
    }
    
    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      console.error('Session: No segment available');
      return;
    }
    
    // Update state to show current segment
    this._updateState({ 
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });
    this._emit('play');
    
    // Clean up any previous audio
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.onended = null;
      this.currentAudioElement.onerror = null;
      this.currentAudioElement = null;
    }
    
    // Stop any browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Always use browser TTS for reliability (for now)
    this._playWithBrowserTTS(segment.text);
  }

  private _playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.log('Session: No TTS, auto-advancing');
      const estimatedDuration = Math.max(4000, text.length * 100);
      setTimeout(() => {
        this._handleSegmentEnd();
      }, estimatedDuration);
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      this._handleSegmentEnd();
    };
    
    utterance.onerror = () => {
      this._handleSegmentEnd();
    };
    
    // Use default voice for reliability
    window.speechSynthesis.speak(utterance);
  }
  private _handleSegmentEnd() {
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.currentSegmentIndex++;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      // Small delay between segments for natural flow
      setTimeout(() => {
        this.play();
      }, 1000);
    } else {
      this._updateState({ playState: 'stopped' });
      this._emit('end');
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
    // Stop current audio
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.onended = null;
      this.currentAudioElement.onerror = null;
      this.currentAudioElement = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.currentSegmentIndex++;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      if (this._state.playState === 'playing') {
        setTimeout(() => {
          this.play();
        }, 200);
      }
    } else {
      this._updateState({ playState: 'stopped' });
      this._emit('end');
    }
  }

  prev() {
    if (this.currentSegmentIndex > 0) {
      // Stop current audio
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement.onended = null;
        this.currentAudioElement.onerror = null;
        this.currentAudioElement = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      this.currentSegmentIndex--;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      if (this._state.playState === 'playing') {
        setTimeout(() => {
          this.play();
        }, 500);
      }
    }
  }

  dispose() {
    
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
}