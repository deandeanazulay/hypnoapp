import { track } from './analytics';
import { SessionScript, getSessionScript } from './gemini';
import { synthesizeSegment } from './voice';
import { AI } from '../config/ai';

// Debug flag for TTS logging - OFF by default
const DEBUG_TTS = false;

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

  constructor() {
    console.log('Session: Initializing session manager...');
    this._ensureVoicesLoaded();
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
      
      // Generate dynamic script
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
      console.log('📝 Session: Calling getSessionScript...');
      this.scriptPlan = await getSessionScript(userContext);
      console.log('📝 Session: getSessionScript returned:', this.scriptPlan ? 'success' : 'null');
      
      // Only use fallback if Gemini completely failed
      if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
        console.log('Session: Gemini failed, using local fallback script');
        this.scriptPlan = this._createProtocolBasedScript(userContext);
      } else {
        console.log(`Session: Using Gemini-generated script with ${this.scriptPlan.segments.length} segments`);
      }
    } catch (error: any) {
      console.log('Session: Script generation error, using fallback:', error.message);
      this.scriptPlan = this._createProtocolBasedScript(userContext);
    }

    // Final validation - ensure segments exist
    if (!this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
      console.warn('Session: No segments after all attempts, creating emergency fallback');
      this.scriptPlan = this._createEmergencyFallback(userContext);
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

    console.log(`Session: Ready with ${this.segments.length} segments`);
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
        console.log(`🔄 Buffer: ⚠️ Browser TTS will be used for segment ${segmentIndex + 1}`);
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

  private _ensureVoicesLoaded(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.voicesLoaded = true;
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      console.log(`TTS: Already loaded ${voices.length} browser voices`);
      return;
    }

    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        console.log(`TTS: Loaded ${voices.length} browser voices`);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Fallback timeout
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      this.voicesLoaded = true;
      console.log('TTS: Voice loading timeout, proceeding anyway');
    }, 2000);
  }

  private _emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener(data));
    }
  }

  play() {
    console.log('🎮 Session: play() called');
    
    if (this._isDisposed) {
      console.log('Session: Cannot play - session disposed');
      return;
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
    console.log(`Session: Segment text: "${segment.text.substring(0, 100)}..."`);
    
    // Update state to show current segment
    this._updateState({ 
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });
    this._emit('play');
    
    // Start playing audio
    this._playCurrentSegment();
  }

  private _playCurrentSegment() {
    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      console.error('No segment to play');
      return;
    }
    
    // Stop any current audio first
    this._stopCurrentAudio();
    
    console.log(`🎵 TTS: Playing segment ${this.currentSegmentIndex + 1}`);
    
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

      console.log(`🎵 TTS: ElevenLabs not available, using browser TTS for segment ${this.currentSegmentIndex + 1}`);
      this._playWithBrowserTTS(text);
    } catch (error) {
      console.error(`🎵 TTS: ElevenLabs error for segment ${this.currentSegmentIndex + 1}:`, error);
      this._playWithBrowserTTS(text);
    }
  }

  private _playPreBufferedAudio(audioElement: HTMLAudioElement) {
    // Clone to avoid conflicts
    const clonedAudio = audioElement.cloneNode() as HTMLAudioElement;
    this.currentAudioElement = clonedAudio;
    
    clonedAudio.onended = () => {
      console.log(`🎵 TTS: ✅ Pre-buffered segment ${this.currentSegmentIndex + 1} completed`);
      this._handleSegmentEnd();
    };
    
    clonedAudio.onerror = (event) => {
      console.error(`🎵 TTS: Pre-buffered audio error for segment ${this.currentSegmentIndex + 1}:`, event);
      this._playWithBrowserTTS(this.segments[this.currentSegmentIndex]?.text || '');
    };
    
    clonedAudio.play().catch(error => {
      console.error(`🎵 TTS: Failed to play pre-buffered audio for segment ${this.currentSegmentIndex + 1}:`, error);
      this._playWithBrowserTTS(this.segments[this.currentSegmentIndex]?.text || '');
    });
  }

  private _playElevenLabsAudio(audioUrl: string) {
    this.currentAudioElement = new Audio(audioUrl);
    this.currentAudioElement.volume = 1.0;
    
    this.currentAudioElement.onended = () => {
      console.log(`🎵 TTS: ✅ Live ElevenLabs segment ${this.currentSegmentIndex + 1} completed`);
      this._handleSegmentEnd();
    };
    
    this.currentAudioElement.onerror = (event) => {
      console.error(`🎵 TTS: Live ElevenLabs audio error for segment ${this.currentSegmentIndex + 1}:`, event);
      this._playWithBrowserTTS(this.segments[this.currentSegmentIndex]?.text || '');
    };
    
    this.currentAudioElement.play().catch(error => {
      console.error(`🎵 TTS: Failed to play live ElevenLabs audio for segment ${this.currentSegmentIndex + 1}:`, error);
      this._playWithBrowserTTS(this.segments[this.currentSegmentIndex]?.text || '');
    });
  }

  private _playWithBrowserTTS(text: string) {
    console.log(`🗣️ TTS: Using browser TTS for segment ${this.currentSegmentIndex + 1}`);
    
    if (!window.speechSynthesis) {
      console.error('Browser TTS not available');
      this._handleSegmentEnd();
      return;
    }

    // Stop any existing speech
    window.speechSynthesis.cancel();
    
    // Wait a moment for clean state
    setTimeout(() => {
      if (this._isDisposed) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7;  // Slower for hypnotic effect
      utterance.pitch = 0.8; // Lower pitch for calming effect
      utterance.volume = 1.0;
      
      // Select best male voice
      this._selectBestVoice(utterance);
      
      utterance.onstart = () => {
        console.log(`🗣️ TTS: ✅ Browser TTS segment ${this.currentSegmentIndex + 1} started`);
      };
      
      utterance.onend = () => {
        console.log(`🗣️ TTS: ✅ Browser TTS segment ${this.currentSegmentIndex + 1} completed`);
        this.currentUtterance = null;
        this._handleSegmentEnd();
      };
      
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          console.error(`🗣️ TTS: Browser TTS error for segment ${this.currentSegmentIndex + 1}:`, event.error);
        }
        this.currentUtterance = null;
        
        // Advance anyway to prevent hanging
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          this._handleSegmentEnd();
        }
      };
      
      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      console.log(`🗣️ TTS: Browser TTS started for segment ${this.currentSegmentIndex + 1}`);
    }, 200);
  }

  private _selectBestVoice(utterance: SpeechSynthesisUtterance) {
    const voices = window.speechSynthesis.getVoices();
    
    // Prefer male voices for hypnotic effect
    const preferredVoices = [
      'Microsoft David',
      'Microsoft Mark', 
      'Daniel (Enhanced)',
      'Daniel',
      'Google US English Male',
      'Alex',
      'Tom',
      'Microsoft Zira',
      'Google US English',
      'Microsoft Aria',
      'Samantha'
    ];
    
    let selectedVoice = null;
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(voice => voice.name.includes(voiceName));
      if (selectedVoice) break;
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🗣️ TTS: Selected voice: ${selectedVoice.name} for segment ${this.currentSegmentIndex + 1}`);
    } else {
      console.log(`🗣️ TTS: Using default voice for segment ${this.currentSegmentIndex + 1}`);
    }
  }

  private _handleSegmentEnd() {
    console.log(`🎵 Segment ${this.currentSegmentIndex + 1} completed`);
    
    if (this._isDisposed) {
      console.log('Session disposed during segment end');
      return;
    }
    
    if (this.currentSegmentIndex < this.segments.length - 1) {
      console.log(`🎵 Advancing to segment ${this.currentSegmentIndex + 2}`);
      this.currentSegmentIndex++;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.segments[this.currentSegmentIndex]?.id || null
      });
      
      // Continue to next segment if still playing
      if (this._state.playState === 'playing') {
        console.log(`🎵 Auto-continuing to segment ${this.currentSegmentIndex + 1} in 800ms`);
        setTimeout(() => {
          if (this._state.playState === 'playing' && !this._isDisposed) {
            this._playCurrentSegment();
          }
        }, 800);
      }
    } else {
      console.log('🎵 Session complete - all segments finished');
      this._updateState({ playState: 'stopped' });
      this._emit('end');
    }
  }

  pause() {
    if (this._state.playState === 'paused') return;
    
    console.log('⏸️ Session: Pausing');
    this._stopCurrentAudio();
    this._updateState({ playState: 'paused' });
    this._emit('pause');
  }

  next() {
    console.log('⏭️ Session: Next segment');
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
    console.log('⏮️ Session: Previous segment');
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
    console.log('🛑 TTS: Stopping current audio');
    
    // Stop ElevenLabs audio
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.onended = null;
      this.currentAudioElement.onerror = null;
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }
    
    // Stop browser TTS
    if (this.currentUtterance) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }
  
  dispose() {
    console.log('Session: Disposing session manager');
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

  // Script generation methods remain the same...
  private _createProtocolBasedScript(userContext: any): any {
    const { egoState = 'guardian', goalId = 'transformation', lengthSec = 900 } = userContext;
    const { customProtocol, protocol } = userContext;
    
    let scriptContent;
    if (customProtocol && customProtocol.name) {
      scriptContent = this._generateCustomProtocolScript(customProtocol, egoState, lengthSec);
    } else if (protocol && protocol.script) {
      scriptContent = this._generateFromProtocol(protocol, egoState, lengthSec);
    } else {
      scriptContent = this._generateGenericScript(egoState, goalId, lengthSec);
    }
    
    return {
      title: customProtocol?.name || protocol?.name || `${egoState} Transformation Protocol: ${goalId}`,
      segments: scriptContent,
      metadata: {
        egoStateActivation: egoState,
        transformationGoal: goalId,
        durationSec: lengthSec
      }
    };
  }

  private _generateCustomProtocolScript(customProtocol: any, egoState: string, lengthSec: number) {
    const segments = [
      {
        id: "welcome",
        text: `Welcome to your ${customProtocol.name}. Today we're focusing on ${customProtocol.goals?.join(' and ') || 'transformation'}. Find a comfortable position and let's begin this journey together.`,
        approxSec: Math.floor(lengthSec * 0.08)
      },
      {
        id: "induction", 
        text: this._adaptInductionMethod(customProtocol.induction || 'progressive', customProtocol.goals?.[0] || 'transformation'),
        approxSec: Math.floor(lengthSec * 0.25)
      },
      {
        id: "deepening",
        text: customProtocol.deepener || this._generateDeepening(egoState, customProtocol.goals?.[0] || 'transformation'),
        approxSec: Math.floor(lengthSec * 0.20)
      },
      {
        id: "goal_work",
        text: this._generateGoalSpecificWork(customProtocol.goals || ['transformation'], egoState),
        approxSec: Math.floor(lengthSec * 0.30)
      },
      {
        id: "integration", 
        text: this._generateIntegration(egoState, customProtocol.goals?.join(' and ') || 'transformation'),
        approxSec: Math.floor(lengthSec * 0.12)
      },
      {
        id: "emergence",
        text: this._generateEmergence(egoState, customProtocol.goals?.join(' and ') || 'transformation'),
        approxSec: Math.floor(lengthSec * 0.05)
      }
    ];
    return segments;
  }

  private _generateFromProtocol(protocol: any, egoState: string, lengthSec: number) {
    const segments = [
      {
        id: "welcome",
        text: `Welcome to ${protocol.name}. ${protocol.description} Let's begin this ${lengthSec / 60}-minute journey together.`,
        approxSec: Math.floor(lengthSec * 0.08)
      },
      {
        id: "induction",
        text: this._adaptScriptToEgoState(protocol.script.induction, egoState),
        approxSec: Math.floor(lengthSec * 0.25)
      },
      {
        id: "deepening",
        text: this._adaptScriptToEgoState(protocol.script.deepening, egoState),
        approxSec: Math.floor(lengthSec * 0.20)
      },
      {
        id: "suggestions",
        text: this._adaptScriptToEgoState(protocol.script.suggestions, egoState),
        approxSec: Math.floor(lengthSec * 0.30)
      },
      {
        id: "integration",
        text: this._generateIntegration(egoState, protocol.category || 'transformation'),
        approxSec: Math.floor(lengthSec * 0.12)
      },
      {
        id: "emergence",
        text: protocol.script.emergence || this._generateEmergence(egoState, protocol.category || 'transformation'),
        approxSec: Math.floor(lengthSec * 0.05)
      }
    ];
    return segments;
  }

  private _generateGenericScript(egoState: string, goalId: string, lengthSec: number) {
    const segments = [
      {
        id: "intro",
        text: `Welcome to your ${egoState} transformation session. We're focusing on ${goalId} today. Find a comfortable position and close your eyes when you're ready.`,
        approxSec: Math.floor(lengthSec * 0.08)
      },
      {
        id: "induction", 
        text: `Take a deep breath in through your nose... hold it for a moment... and slowly exhale through your mouth. Feel your body beginning to relax as your ${egoState} energy awakens to guide this transformation.`,
        approxSec: Math.floor(lengthSec * 0.20)
      },
      {
        id: "deepening",
        text: `Going deeper now into this peaceful state. Your ${egoState} wisdom is creating the perfect inner environment for change. Count backwards from 10 to 1, feeling twice as relaxed with each number.`,
        approxSec: Math.floor(lengthSec * 0.25)
      },
      {
        id: "work",
        text: `Feel your ${egoState} energy working on ${goalId} now. These positive changes are happening at the deepest levels of your being, creating lasting transformation that serves your highest good.`,
        approxSec: Math.floor(lengthSec * 0.30)
      },
      {
        id: "integration", 
        text: `These changes are integrating into every cell of your being. Your ${egoState} energy ensures these transformations become a permanent part of who you are.`,
        approxSec: Math.floor(lengthSec * 0.12)
      },
      {
        id: "emergence",
        text: `Time to return now. Count from 1 to 5, and on 5, open your eyes feeling refreshed and transformed. 1... 2... 3... 4... 5... Eyes open, fully alert and renewed.`,
        approxSec: Math.floor(lengthSec * 0.05)
      }
    ];
    return segments;
  }

  private _createEmergencyFallback(userContext: any) {
    return {
      title: `${userContext.egoState || 'Guardian'} Emergency Session`,
      segments: [
        { id: "start", text: `Welcome to your ${userContext.egoState || 'Guardian'} session. Take a deep breath and close your eyes.`, approxSec: 15 },
        { id: "relax", text: "Feel your body relaxing completely from your toes to the top of your head.", approxSec: 25 },
        { id: "transform", text: `Your ${userContext.egoState || 'Guardian'} energy is creating positive change throughout your being.`, approxSec: 30 },
        { id: "return", text: "Count from 1 to 5 and open your eyes feeling refreshed. 1... 2... 3... 4... 5... Eyes open!", approxSec: 20 }
      ]
    };
  }

  // Helper methods for script generation
  private _adaptInductionMethod(method: string, goal: string): string {
    const methods = {
      progressive: `Let's begin with progressive relaxation. Starting with your toes, feel them relaxing completely. Now your feet, your ankles, your calves... Let this wave of relaxation flow up through your entire body as we work on ${goal}.`,
      rapid: `Close your eyes now and take a deep breath. Hold it... and as you exhale, let your body drop into complete relaxation. With each word I speak, you go deeper, preparing your mind for transformation around ${goal}.`,
      breath: `Focus on your breathing now. Breathe in slowly for 4 counts... hold for 4... exhale for 6... Feel your breath naturally guiding you into a receptive state for working on ${goal}.`,
      visualization: `Imagine yourself in a place of perfect peace and safety. See it clearly in your mind... feel yourself there completely... This is your sanctuary for transformation around ${goal}.`
    };
    return methods[method as keyof typeof methods] || methods.progressive;
  }

  private _generateGoalSpecificWork(goals: string[], egoState: string): string {
    const goalText = goals.join(' and ');
    return `Your ${egoState} energy is now fully focused on ${goalText}. Feel these positive changes beginning at the deepest levels of your being. With each breath, your transformation around ${goalText} becomes stronger and more permanent.`;
  }

  private _adaptScriptToEgoState(originalText: string, egoState: string): string {
    const egoAdaptations = {
      guardian: 'Feel completely safe and protected as ',
      rebel: 'Feel your power to break free as ',
      healer: 'Feel healing energy flowing as ',
      explorer: 'Feel excitement for discovery as ',
      mystic: 'Connect with infinite wisdom as '
    };
    const prefix = egoAdaptations[egoState as keyof typeof egoAdaptations] || '';
    return prefix + originalText.toLowerCase();
  }

  private _generateDeepening(egoState: string, goalId: string): string {
    return `Going even deeper now into this peaceful state. Your ${egoState} energy is guiding you safely into the perfect depth for transformation work on ${goalId}. Feel yourself sinking deeper with each breath.`;
  }

  private _generateIntegration(egoState: string, goalId: string): string {
    return `These powerful changes are now integrating into every aspect of your being. Your ${egoState} energy ensures that these transformations around ${goalId} become a permanent part of who you are.`;
  }

  private _generateEmergence(egoState: string, goalId: string): string {
    return `Time to return now, bringing all these positive changes with you. Your ${egoState} energy will continue working on your ${goalId}. Count from 1 to 5, and on 5, open your eyes feeling completely refreshed and transformed.`;
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