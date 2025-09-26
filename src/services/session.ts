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
    this.voicesLoadedPromise = this._ensureVoicesLoaded();
  }

  async initialize(userContext: any) {
    if (this._initializationPromise) {
      return this._initializationPromise;
    }
    
    this._initializationPromise = this._doInitialization(userContext);
    return this._initializationPromise;
  }
  
  private async _doInitialization(userContext: any) {
    if (this._isDisposed) {
      return;
    }

    try {
      // Generate script through API only - NO HARDCODED FALLBACKS
      await this._initializeSession(userContext);
      
      if (this._isDisposed) return;
      
      // Pre-buffer first segment only for faster start
      await this._prebufferFirstSegment();
      
      if (this._isDisposed) return;
      
      this._isInitialized = true;
      this._updateState({ isInitialized: true });
      
    } catch (error) {
      console.error('Session: Failed to initialize:', error);
      this._updateState({ error: `Initialization failed: ${error.message}` });
      throw error;
    }
  }

  private async _initializeSession(userContext: any) {
    try {
      this.scriptPlan = await getSessionScript(userContext);
      
      if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
        throw new Error('Script generation failed - no segments returned from API');
      }

    } catch (error: any) {
      console.error('Session: Script generation FAILED - NO FALLBACK:', error.message);
      throw new Error(`Script generation failed: ${error.message}. Please check API configuration.`);
    }

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
    
    // Update state with total segments
    this._updateState({
      totalSegments: this.segments.length,
      scriptPlan: this.scriptPlan,
      currentSegmentId: this.segments[0]?.id || null
    });

  }

  private async _prebufferFirstSegment() {
    if (!this.segments || this.segments.length === 0) {
      return;
    }
    
    const firstSegment = this.segments[0];
    if (firstSegment) {
      try {
        await this._bufferSegmentAudio(0);
      } catch (error) {
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
      } else {
        // For browser TTS, we can't pre-buffer, so mark as ready
        segment.ttsProvider = 'browser-tts';
        segment.isBuffered = true;
      }
    } catch (error) {
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
        resolve();
        return;
      }

      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve();
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        this.voicesLoaded = true;
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
    if (this._isDisposed) {
      return;
    }

    // Wait for initialization if needed
    if (!this._isInitialized && this._initializationPromise) {
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
      console.error('No segment available');
      return;
    }
    
    // Update state to show current segment
    this._updateState({ 
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });
    this._emit('play');
    
    // Clear any previous TTS before starting new segment
    this._stopCurrentAudio();
    
    // Start playing audio immediately
    this._playCurrentSegment();
  }

  private _playCurrentSegment() {
    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      return;
    }
    
    // Try pre-buffered ElevenLabs first
    if (segment.ttsProvider === 'elevenlabs' && segment.audio) {
      this._playPreBufferedAudio(segment.audio);
      return;
    }
    
    // Try live ElevenLabs
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
        this._playElevenLabsAudio(result.audioUrl);
        return;
      }

      this._playWithBrowserTTS(text);
    } catch (error) {
      this._playWithBrowserTTS(text);
    }
  }

  private _playPreBufferedAudio(audioElement: HTMLAudioElement) {
    // Clone to avoid conflicts
    const clonedAudio = audioElement.cloneNode() as HTMLAudioElement;
    this.currentAudioElement = clonedAudio;
    
    clonedAudio.onended = () => {
      this.currentAudioElement = null;
      this._handleSegmentEnd();
    };
    
    clonedAudio.onerror = (event) => {
      this.currentAudioElement = null;
      
      // Fall back to browser TTS on audio error  
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._playWithBrowserTTS(segment.text);
      }
    };
    
    clonedAudio.play().catch(error => {
      this.currentAudioElement = null;
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._playWithBrowserTTS(segment.text);
      }
    });
  }

  private _playElevenLabsAudio(audioUrl: string) {
    // Create audio element for ElevenLabs
    this.currentAudioElement = new Audio(audioUrl);
    this.currentAudioElement.volume = 1.0;
    
    this.currentAudioElement.onended = () => {
      this.currentAudioElement = null;
      this._handleSegmentEnd();
    };
    
    this.currentAudioElement.onerror = (event) => {
      this.currentAudioElement = null;
      
      // Fall back to browser TTS on audio error  
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._playWithBrowserTTS(segment.text);
      }
    };
    
    // Start playback with error handling
    this.currentAudioElement.play().catch(error => {
      this.currentAudioElement = null;
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._playWithBrowserTTS(segment.text);
      }
    });
  }

  private async _playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.error('Session: speechSynthesis not available');
      setTimeout(() => {
        this._handleSegmentEnd();
      }, 3000);
      return;
    }

    // Stop any existing speech before starting new utterance
    window.speechSynthesis.cancel();
    
    // Wait for voices to load
    await this.voicesLoadedPromise;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;  // Slower for hypnotic effect
    utterance.pitch = 0.8; // Lower pitch for male-like calming effect
    utterance.volume = 1.0;
    
    // Voice selection (handle async loading properly)
    await this._selectBestVoice(utterance);
    
    // Event handlers
    utterance.onstart = () => {};
    
    utterance.onend = () => {
      this.currentUtterance = null;
      this._handleSegmentEnd();
    };
    
    utterance.onerror = (event) => {
      // Only log non-interruption errors
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('Browser TTS error:', event.error);
      } else {
      }
      
      this.currentUtterance = null;
      
      if (event.error === 'interrupted' || event.error === 'canceled') {
        // Expected - don't advance
      } else {
        // Fallback advance to prevent stalling
        this._handleSegmentEnd();
      }
    };
    
    // Store current utterance
    this.currentUtterance = utterance;
    
    // Small delay to ensure clean state before speaking
    setTimeout(() => {
      if (this.currentUtterance === utterance && !this._isDisposed) {
        window.speechSynthesis.speak(utterance);
      }
    }, 100);
  }

  private async _selectBestVoice(utterance: SpeechSynthesisUtterance) {
    // Ensure voices are loaded
    await this.voicesLoadedPromise;
    
    const voices = window.speechSynthesis.getVoices();
    
    let selectedVoice = null;
    
    // Prefer male voices for hypnotic effect
    const preferredVoices = [
      'Microsoft David',
      'Microsoft Mark', 
      'Daniel (Enhanced)',
      'Daniel',
      'Google US English Male',
      'Alex',
      'Tom',
      'Microsoft Zira', // Male-sounding female voice
      'Google US English',
      'Microsoft Aria', // Female fallback
      'Samantha'
    ];
    
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(voice => voice.name.includes(voiceName));
      if (selectedVoice) break;
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  private _handleSegmentEnd() {
    if (this._isDisposed) {
      return;
    }
    
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.currentSegmentIndex++;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.segments[this.currentSegmentIndex]?.id || null
      });
      
      // Continue to next segment if still playing
      if (this._state.playState === 'playing') {
        setTimeout(() => {
          if (this._state.playState === 'playing' && !this._isDisposed) {
            this._playCurrentSegment();
          }
        }, 500);
      }
    } else {
      this._updateState({ playState: 'stopped' });
      this._emit('end');
    }
  }

  pause() {
    if (this._state.playState === 'paused') return;
    
    this._stopCurrentAudio();
    this._updateState({ playState: 'paused' });
    this._emit('pause');
  }

  next() {
    this._stopCurrentAudio();
    
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.currentSegmentIndex++;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.segments[this.currentSegmentIndex]?.id || null
      });
      
      if (this._state.playState === 'playing') {
        setTimeout(() => {
          this._playCurrentSegment();
        }, 300);
      }
    } else {
      this._updateState({ playState: 'stopped' });
      this._emit('end');
    }
  }

  prev() {
    this._stopCurrentAudio();
    
    if (this.currentSegmentIndex > 0) {
      this.currentSegmentIndex--;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.segments[this.currentSegmentIndex]?.id || null
      });
      
      if (this._state.playState === 'playing') {
        setTimeout(() => {
          this._playCurrentSegment();
        }, 300);
      }
    }
  }

  private _stopCurrentAudio() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.onended = null;
      this.currentAudioElement.onerror = null;
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }
    
    if (this.currentUtterance) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }
  
  dispose() {
    this._isDisposed = true;
    this._stopCurrentAudio();
    
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

// Export the startSession function
export function startSession(options: StartSessionOptions): SessionHandle {
  const manager = new SessionManager();
  
  // Map options to user context for script generation
  const userContext = {
    egoState: options.egoState,
    goalId: options.goalId || options.goal?.id || 'transformation',
    lengthSec: options.lengthSec || 600,
    customProtocol: options.customProtocol,
    protocol: options.protocol,
    userPrefs: options.userPrefs,
    action: options.action,
    goal: options.goal,
    method: options.method,
    currentTime: new Date().toISOString(),
    sessionUniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    promptVariation: Math.floor(Math.random() * 5) + 1
  };
  
  // Initialize asynchronously
  manager.initialize(userContext).catch(error => {
    console.error('Session initialization failed:', error);
  });

  return {
    play: () => manager.play(),
    pause: () => manager.pause(),
    next: () => manager.next(),
    prev: () => manager.prev(),
    dispose: () => manager.dispose(),
    on: (event: string, listener: Function) => manager.on(event, listener),
    getCurrentState: () => manager.getCurrentState()
  };
}