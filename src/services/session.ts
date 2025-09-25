```typescript
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
        const cacheKey = \`${this.scriptPlan!.hash}-${segment.id}-${AI.voice.defaultVoiceId}-${AI.voice.model}`;
        const audioBlob = await synthesizeSegment(segment.text, {
          voiceId: AI.voice.defaultVoiceId,
          model: AI.voice.model,
          cacheKey: cacheKey,
          mode: 'pre-gen'
        });
        
        const audioElement = new Audio(URL.createObjectURL(audioBlob));
        this.segments[index] = { ...segment, audio: audioElement };
        console.log('Session: Prefetched segment ' + index + ': ' + segment.id);
        this._emit('segment-ready', segment.id);
        track('segment_buffered', { segmentId: segment.id, index: index });
        this._updateBufferedAhead();
      } catch (error: any) {
        console.error(\`Session: Failed to prefetch segment ${index}:`, error);
        this._emit('error', new Error(\`Failed to load audio for segment ${segment.id}: ${error.message}`));
        track('segment_buffer_error', { segmentId: segment.id, index: index, error: error.message });
        // Fallback to text captions if audio fails
        this.segments[index] = { ...segment, audio: new Audio(), text: `[Audio unavailable] ${segment.text}` }; // Placeholder audio
      }
    }));
  }

  private _updateBufferedAhead() {
    const buffered = this.segments.filter((s, i) => s !== null && i > this.currentSegmentIndex).length;
    this._updateState({ bufferedAhead: buffered });
  }

  private _playSegment(index: number) {
    if (!this.scriptPlan || index < 0 || index >= this.scriptPlan.segments.length) {
      this.dispose();
      return;
    }

    this.currentSegmentIndex = index;
    this._updateState({ currentSegmentIndex: index, currentSegmentId: this.scriptPlan.segments[index].id });

    const playableSegment = this.segments[index];

    if (!playableSegment || !playableSegment.audio) {
      console.warn(\`Session: Segment ${index} not ready, attempting to re-prefetch and wait.`);
      this._updateState({ playState: 'loading' });
      this._prefetchSegments(index, 1).then(() => {
        if (this._state.playState === 'loading') { // Only proceed if still in loading state from this call
          this._playSegment(index);
        }
      }).catch(error => {
        console.error(\`Session: Failed to load segment ${index} for playback:`, error);
        this._updateState({ playState: 'stopped', error: error });
        this._emit('error', error);
      });
      return;
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement.onended = null;
    }

    this.currentAudioElement = playableSegment.audio;
    this.currentAudioElement.onended = () => {
      track('segment_play_end', { segmentId: playableSegment.id, index: index });
      this._playNextSegment();
    };

    this.currentAudioElement.play().then(() => {
      this._updateState({ playState: 'playing' });
      this._emit('play');
      track('segment_play_start', { segmentId: playableSegment.id, index: index });
      console.log(\`Session: Playing segment ${index}: ${playableSegment.id}`);
      
      // Prefetch next segments in background
      this._prefetchSegments(index + 1, AI.voice.preBufferSegments);
    }).catch(error => {
      console.error(\`Session: Failed to play audio for segment ${index}: ${error.message}`);
      this._updateState({ playState: 'stopped', error: error });
      this._emit('error', new Error(\`Audio playback failed for segment ${playableSegment.id}: ${error.message}`));
      track('segment_play_error', { segmentId: playableSegment.id, index: index, error: error.message });
    });
  }

  private _playNextSegment() {
    if (!this.scriptPlan) return;

    if (this.currentSegmentIndex + 1 < this.scriptPlan.segments.length) {
      this._playSegment(this.currentSegmentIndex + 1);
    } else {
      this.dispose();
      this._updateState({ playState: 'stopped' });
      this._emit('end');
      track('session_complete', { scriptHash: this.scriptPlan.hash });
      console.log('Session: Playback ended.');
    }
  }

  // Public methods conforming to SessionHandle
  play() {
    if (this._state.playState === 'paused' || this._state.playState === 'stopped') {
      if (this.currentSegmentIndex === -1 && this.scriptPlan) {
        this.currentSegmentIndex = 0; // Start from beginning if not started
      }
      if (this.currentSegmentIndex !== -1) {
        this._playSegment(this.currentSegmentIndex);
      } else {
        console.warn('Session: Cannot play, no script or segment loaded.');
        this._updateState({ playState: 'stopped', error: new Error('No script to play.') });
      }
    } else if (this._state.playState === 'loading') {
      console.log('Session: Still loading, will play once ready.');
      // The _initializeSession or _playSegment will transition to playing/paused
    }
  }

  pause() {
    if (this._state.playState === 'playing' && this.currentAudioElement) {
      this.currentAudioElement.pause();
      this._updateState({ playState: 'paused' });
      this._emit('pause');
      track('session_pause', { segmentId: this._state.currentSegmentId });
      console.log('Session: Paused.');
    }
  }

  next() {
    if (!this.scriptPlan) return;
    track('session_skip_next', { segmentId: this._state.currentSegmentId });
    if (this.currentSegmentIndex + 1 < this.scriptPlan.segments.length) {
      this._playSegment(this.currentSegmentIndex + 1);
    } else {
      this.dispose();
      this._updateState({ playState: 'stopped' });
      this._emit('end');
      track('session_complete', { scriptHash: this.scriptPlan.hash });
      console.log('Session: Skipped to end.');
    }
  }

  prev() {
    if (!this.scriptPlan) return;
    track('session_skip_prev', { segmentId: this._state.currentSegmentId });
    if (this.currentSegmentIndex > 0) {
      this._playSegment(this.currentSegmentIndex - 1);
    } else {
      console.warn('Session: Already at the first segment.');
    }
  }

  dispose() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement.onended = null;
      this.currentAudioElement = null;
    }
    this.segments.forEach(s => {
      if (s?.audio) {
        s.audio.src = ''; // Release object URL
      }
    });
    this.segments = [];
    this.scriptPlan = null;
    this.eventListeners = {}; // Clear all listeners
    this._updateState({ playState: 'stopped', currentSegmentId: null, currentSegmentIndex: -1, scriptPlan: null, totalSegments: 0 });
    track('session_dispose', { scriptHash: this._state.scriptPlan?.hash });
    console.log('Session: Disposed.');
  }

  on(event: string, listener: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  getCurrentState(): SessionState {
    return this._state;
  }
}

/**
 * Orchestrates the creation and playback of a hypnotherapy session.
 *
 * @param options - Options for the session.
 * @returns A promise that resolves to a SessionHandle.
 */
export function startSession(options: StartSessionOptions): SessionHandle {
  console.log('Session: Starting new session with options:', options);
  return new SessionManager(options);
}
```