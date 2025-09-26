import { track } from './analytics';
import { SessionScript, getSessionScript } from './gemini';
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
  isBuffered: boolean;
  bufferPromise?: Promise<void>;
}

export interface SessionState {
  playState: 'stopped' | 'playing' | 'paused';
  currentSegmentIndex: number;
  currentSegmentId: string | null;
  totalSegments: number;
  scriptPlan: any;
  bufferedAhead: number;
  error: string | null;
  isInitialized: boolean;
}

export interface StartSessionOptions {
  egoState: string;
  goalId?: string;
  lengthSec?: number;
  customProtocol?: any;
  protocol?: any;
  userPrefs?: any;
  action?: any;
  goal?: any;
  method?: any;
}

export interface SessionHandle {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  dispose: () => void;
  on: (event: string, listener: Function) => void;
  getCurrentState: () => SessionState;
}

export class SessionManager {
  private _state: SessionState = {
    playState: 'stopped',
    currentSegmentIndex: 0,
    currentSegmentId: null,
    totalSegments: 0,
    scriptPlan: null,
    bufferedAhead: 0,
    error: null,
    isInitialized: false
  };

  private segments: (PlayableSegment | null)[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private eventListeners: Record<string, Function[]> = {};
  private currentSegmentIndex = 0;
  private scriptPlan: any = null;
  private _initializationPromise: Promise<void> | null = null;
  private _isInitialized = false;
  private _isDisposed = false;
  
  // Simplified TTS management
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded = false;
  private voicesLoadedPromise: Promise<void>;

  constructor() {
    console.log('Session: Initializing session manager...');
    this.voicesLoadedPromise = this._ensureVoicesLoaded();
  }

  async initialize(userContext: any) {
    if (this._initializationPromise) {
      console.log('Session: Already initializing, waiting...');
      return this._initializationPromise;
    }
    
    console.log('Session: Starting new initialization...');
    this._initializationPromise = this._doInitialization(userContext);
    return this._initializationPromise;
  }
  
  private async _doInitialization(userContext: any) {
    if (this._isDisposed) {
      console.log('Session: Disposed during initialization');
      return;
    }

    try {
      console.log('Session: Starting initialization with dynamic script generation...');
      
      // Generate script through API only - NO HARDCODED FALLBACKS
      await this._initializeSession(userContext);
      
      if (this._isDisposed) return;
      
      // Pre-buffer first segment only for faster start
      await this._prebufferFirstSegment();
      
      if (this._isDisposed) return;
      
      this._isInitialized = true;
      this._updateState({ isInitialized: true });
      
      console.log('Session: Initialization complete, ready to play');
    } catch (error) {
      console.error('Session: Failed to initialize:', error);
      this._updateState({ error: `Initialization failed: ${error.message}` });
      throw error;
    }
  }

  private async _initializeSession(userContext: any) {
    console.log('📝 Session: _initializeSession called with context:', userContext);
    
    try {
      console.log('📝 Session: Calling getSessionScript (API ONLY)...');
      this.scriptPlan = await getSessionScript(userContext);
      console.log('📝 Session: getSessionScript returned:', this.scriptPlan ? 'success' : 'null');
      
      if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
        throw new Error('Script generation failed - no segments returned from API');
      }

      console.log(`Session: Using AI-generated script with ${this.scriptPlan.segments.length} segments`);
    } catch (error: any) {
      console.error('Session: Script generation FAILED - NO FALLBACK:', error.message);
      throw new Error(`Script generation failed: ${error.message}. Please check API configuration.`);
    }

    console.log(`📝 Session: Final script has ${this.scriptPlan.segments.length} segments`);
    
    // Initialize segments array
    this.segments = this.scriptPlan.segments.map((segment: any) => ({
      ...segment,
      id: segment.id,
      text: segment.text,
      approxSec: segment.approxSec || 30,
      audio: null,
      ttsProvider: 'none' as const,
      isBuffered: false
    }));
    
    console.log(`📝 Session: Segments array created with ${this.segments.length} items`);
    
    // Update state with total segments
    this._updateState({
      totalSegments: this.segments.length,
      scriptPlan: this.scriptPlan,
      currentSegmentId: this.segments[0]?.id || null
    });

    console.log(`Session: Ready with ${this.segments.length} segments (NO HARDCODED CONTENT)`);
  }

  private async _prebufferFirstSegment() {
    console.log('🚀 Session: Pre-buffering first segment for instant start...');
    
    if (!this.segments || this.segments.length === 0) {
      console.log('🚀 Session: No segments to pre-buffer');
      return;
    }
    
    const firstSegment = this.segments[0];
    if (firstSegment) {
      console.log('🚀 Session: Pre-buffering first segment...');
      try {
        await this._bufferSegmentAudio(0);
        console.log('🚀 Session: First segment ready!');
      } catch (error) {
        console.warn('🚀 Session: First segment pre-buffer failed:', error);
        // Mark as browser TTS so it can still play
        firstSegment.ttsProvider = 'browser-tts';
        firstSegment.isBuffered = true;
      }
    }
  }
  
  private async _bufferSegmentAudio(segmentIndex: number): Promise<void> {
    const segment = this.segments[segmentIndex];
    if (!segment || segment.isBuffered) {
      return;
    }
    
    console.log(`🔄 Buffer: Starting buffer for segment ${segmentIndex + 1}`);
    
    try {
      const result = await synthesizeSegment(segment.text, {
        voiceId: AI.voice.defaultVoiceId,
        cacheKey: `buffer-segment-${segmentIndex}`,
        mode: 'pre-gen'
      });
      
      if (result.provider === 'elevenlabs' && result.audioUrl) {
        // Create audio element for pre-buffered content
        segment.audio = new Audio(result.audioUrl);
        segment.audio.preload = 'auto';
        segment.ttsProvider = 'elevenlabs';
        segment.isBuffered = true;
        console.log(`🔄 Buffer: ✅ ElevenLabs segment ${segmentIndex + 1} buffered`);
      } else {
        // For browser TTS, we can't pre-buffer, so mark as ready
        segment.ttsProvider = 'browser-tts';
        segment.isBuffered = true;
        console.log(`🔄 Buffer: ⚠️ Browser TTS will be used for segment ${segmentIndex + 1} - Reason: ${result.error || 'API not available'}`);
      }
    } catch (error) {
      console.warn(`🔄 Buffer: Failed to buffer segment ${segmentIndex + 1}:`, error);
      segment.ttsProvider = 'browser-tts';
      segment.isBuffered = true;
    }
  }

  private _updateState(updates: Partial<SessionState>) {
    this._state = { ...this._state, ...updates };
    this._emit('state-change', this._state);
  }

  private async _ensureVoicesLoaded(): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.voicesLoaded = true;
      return;
    }

    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        console.log(`TTS: Already loaded ${voices.length} browser voices`);
        resolve();
        return;
      }

      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          console.log(`TTS: Loaded ${voices.length} browser voices`);
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve();
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        this.voicesLoaded = true;
        console.log('TTS: Voice loading timeout, proceeding anyway');
        resolve();
      }, 2000);
    });
  }

  private _emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener(data));
    }
  }

  async play() {
    console.log('🎮 Session: play() called');
    
    if (this._isDisposed) {
      console.log('Session: Cannot play - session disposed');
      return;
    }

    // Wait for initialization if needed
    if (!this._isInitialized && this._initializationPromise) {
      console.log('Session: Waiting for initialization to complete...');
      try {
        await this._initializationPromise;
      } catch (error) {
        console.error('Session: Initialization failed during play:', error);
        this._updateState({ error: 'Failed to initialize session' });
        return;
      }
    }
    
    // Check if we have segments
    if (!this.segments || this.segments.length === 0) {
      console.error('Session: No segments to play');
      this._updateState({ error: 'No segments available to play' });
      return;
    }
    
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
    
    console.log(`Session: Starting segment ${this.currentSegmentIndex + 1}/${this.segments.length}`);
    console.log(`Session: Segment text preview: "${segment.text.substring(0, 100)}..."`);
    
    // Update state to show current segment
    this._updateState({ 
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });
    this._emit('play');
    
    // Clear any previous TTS before starting new segment
    this._cancelCurrentTTS();
    
    // Start playing audio immediately
    this._playCurrentSegment();
  }

  private _playCurrentSegment() {
    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      console.error('No segment to play');
      return;
    }
    
    console.log(`🎵 Session: About to play segment ${this.currentSegmentIndex + 1}`);
    console.log(`🎵 TTS: Segment text: "${segment.text.substring(0, 100)}..."`);
    
    // Try pre-buffered ElevenLabs first
    if (segment.ttsProvider === 'elevenlabs' && segment.audio) {
      console.log(`🎵 TTS: ✅ Using pre-buffered ElevenLabs for segment ${this.currentSegmentIndex + 1}`);
      this._playPreBufferedAudio(segment.audio);
      return;
    }
    
    // Try live ElevenLabs
    console.log(`🎵 TTS: Attempting live ElevenLabs for segment ${this.currentSegmentIndex + 1}`);
    this._tryElevenLabsLive(segment.text);
  }

  private async _tryElevenLabsLive(text: string) {
    try {
      const result = await synthesizeSegment(text, {
        voiceId: AI.voice.defaultVoiceId,
        cacheKey: `live-segment-${this.currentSegmentIndex}`,
        mode: 'live'
      });

      if (result.provider === 'elevenlabs' && result.audioUrl) {
        console.log(`🎵 TTS: ✅ Using live ElevenLabs for segment ${this.currentSegmentIndex + 1}`);
        this._playElevenLabsAudio(result.audioUrl);
        return;
      }

      console.log(`🎵 TTS: ⚠️ ElevenLabs not available for segment ${this.currentSegmentIndex + 1}, using browser TTS`);
      if (result.error) {
        console.log(`🎵 TTS: ElevenLabs error reason: ${result.error}`);
      }
      this._playWithBrowserTTS(text);
    } catch (error) {
      console.error(`🎵 TTS: ❌ Error with ElevenLabs for segment ${this.currentSegmentIndex
      )
    }
    }
  }
}
  }
}