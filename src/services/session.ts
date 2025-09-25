// src/services/session.ts

import { getSessionScript, ScriptPlan, ScriptSegment } from './gemini';
import { synthesizeSegment, AudioBlob } from './voice';
import { track } from './analytics';
import { AI } from '../config/ai';

/**
 * Represents a single segment ready for playback, including its audio.
 */
export interface PlayableSegment {
  id: string;
  text: string;
  approxSec: number;
  audio: HTMLAudioElement; // Using HTMLAudioElement for simplicity in this stub
  markers?: { type: 'breath' | 'pause' | 'affirm'; t?: number }[];
}

/**
 * Interface for managing an active session.
 */
export interface SessionHandle {
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  dispose(): void;
  on(event: 'segment-ready', listener: (segmentId: string) => void): void;
  on(event: 'play' | 'pause' | 'end', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
  on(event: 'state-change', listener: (state: SessionState) => void): void;
  getCurrentState(): SessionState;
}

/**
 * Current state of the session for UI consumption.
 */
export interface SessionState {
  playState: 'playing' | 'paused' | 'stopped' | 'loading';
  currentSegmentId: string | null;
  currentSegmentIndex: number;
  totalSegments: number;
  bufferedAhead: number; // Number of segments buffered ahead
  error: Error | null;
  scriptPlan: ScriptPlan | null;
}

/**
 * Options for starting a new session.
 */
export interface StartSessionOptions {
  goalId: string;
  egoState: string;
  lengthSec: number;
  locale: string;
  level: number;
  streak: number;
  userPrefs: Record<string, any>;
}

class SessionManager implements SessionHandle {
  private scriptPlan: ScriptPlan | null = null;
  private segments: (PlayableSegment | null)[] = [];
  private currentSegmentIndex = -1;
  private currentAudioElement: HTMLAudioElement | null = null;
  private eventListeners: { [key: string]: Function[] } = {};
  private options: StartSessionOptions;

  private _state: SessionState = {
    playState: 'loading',
    currentSegmentId: null,
    currentSegmentIndex: -1,
    totalSegments: 0,
    bufferedAhead: 0,
    error: null,
    scriptPlan: null,
  };

  constructor(options: StartSessionOptions) {
    this.options = options;
    this._initializeSession();
  }

  private _emit(event: string, ...args: any[]) {
    this.eventListeners[event]?.forEach(listener => listener(...args));
  }

  private _updateState(newState: Partial<SessionState>) {
    this._state = { ...this._state, ...newState };
    this._emit('state-change', this._state);
  }

  private async _initializeSession() {
    track('session_start', { ...this.options });
    try {
      this._updateState({ playState: 'loading' });
      this.scriptPlan = await getSessionScript(this.options);
      this.segments = new Array(this.scriptPlan.segments.length).fill(null);
      this._updateState({ scriptPlan: this.scriptPlan, totalSegments: this.scriptPlan.segments.length });
      console.log('Session: Script plan received:', this.scriptPlan);

      // Start initial prefetch
      await this._prefetchSegments(0, AI.voice.preBufferSegments);
      this.currentSegmentIndex = 0; // Ready to play the first segment
      this._updateState({ currentSegmentIndex: 0, currentSegmentId: this.scriptPlan.segments[0]?.id });
      this._updateState({ playState: 'paused' }); // Ready to play, but paused initially
      track('session_script_ready', { scriptHash: this.scriptPlan.hash });

    } catch (error: any) {
      console.error('Session: Failed to initialize session:', error);
      this._updateState({ playState: 'stopped', error: error });
      this._emit('error', error);
      track('session_init_error', { error: error.message });
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

    await Promise.all(segmentsToPrefetch.map(async ({ index, segment }) => {
      try {
        const voiceId = AI.voice.defaultVoiceId;
        const voiceModel = AI.voice.model;
        const cacheKey = `${this.scriptPlan!.title || 'script'}-${segment.id}-${voiceId}-${voiceModel}`;
        const voiceResult = await synthesizeSegment(segment.text, {
          voiceId: voiceId,
          model: voiceModel,
          cacheKey: cacheKey,
          mode: 'pre-gen'
        });

        // Handle different TTS providers
        let audioElement: HTMLAudioElement | null = null;
        
        if (voiceResult.provider === 'elevenlabs' && voiceResult.audioUrl) {
          audioElement = new Audio(voiceResult.audioUrl);
        }
        
        this.segments[index] = { 
          ...segment, 
          audio: audioElement,
          ttsProvider: voiceResult.provider,
          ttsError: voiceResult.error
        };
        
        if (import.meta.env.DEV) {
          console.log('Session: Prefetched segment', index, ':', segment.id, 'provider:', voiceResult.provider);
        }
        this._emit('segment-ready', segment.id);
        track('segment_buffered', { 
          segmentId: segment.id, 
          index: index, 
          provider: voiceResult.provider 
        });

      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error('Session: Failed to prefetch segment', index, ':', error);
        }
        
        // Don't fail the entire session - create a text-only segment
        this.segments[index] = { 
          ...segment, 
          audio: null,
          ttsProvider: 'browser-tts', // Default to browser TTS fallback
          ttsError: error.message
        };
        
        track('segment_buffer_error', { segmentId: segment.id, error: error.message });
      }
    }));

    this._updateState({ bufferedAhead: this.segments.filter(s => s !== null).length - this.currentSegmentIndex - 1 });
  }

  play() {
    if (this._state.playState === 'playing') return;
    
    if (this.currentSegmentIndex >= 0 && this.segments[this.currentSegmentIndex]) {
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        // Handle different TTS providers
        if (segment.audio && segment.ttsProvider === 'elevenlabs') {
          this.currentAudioElement = segment.audio;
          this.currentAudioElement.play();
        } else if (segment.ttsProvider === 'browser-tts' || segment.ttsProvider === 'none') {
          // Use browser TTS
          this.playWithBrowserTTS(segment.text);
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
    this._updateState({ playState: 'paused' });
    this._emit('pause');
  }

  next() {
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.currentSegmentIndex++;
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id 
      });
      
      if (this._state.playState === 'playing') {
        this.play();
      }
    }
  }

  prev() {
    if (this.currentSegmentIndex > 0) {
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
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    
    // Stop any browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
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
  
  private playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.warn('Browser TTS not available');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;
    utterance.pitch = 0.8;
    utterance.volume = 0.9;

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

    utterance.onend = () => {
      // Auto-advance to next segment when browser TTS finishes
      setTimeout(() => {
        if (this.currentSegmentIndex < this.segments.length - 1) {
          this.next();
        } else {
          this._updateState({ playState: 'stopped' });
          this._emit('end');
        }
      }, 500);
    };

    utterance.onerror = (event) => {
      console.error('Browser TTS error:', event.error);
    };

    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Creates and returns a new session handle.
 */
export function startSession(options: StartSessionOptions): SessionHandle {
  return new SessionManager(options);
}