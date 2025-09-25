import { track } from './analytics';
import { getSessionScript } from './gemini';
import { synthesizeSegment } from './voice';
import { AI } from '../config/ai';

// Debug flag for TTS logging
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
  private ttsLock = false;
  private wasCanceledByUs = false;
  private currentUtteranceId: string | null = null;

  async initialize(userContext: any) {
    try {
      await this._initializeSession(userContext);
    } catch (error) {
      console.error('Session: Failed to initialize:', error);
      throw error;
    }
  }

  private async _initializeSession(userContext: any) {
    try {
      this.scriptPlan = await getSessionScript(userContext);
      
      // Ensure we have valid segments
      if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
        this.scriptPlan = this._createFallbackScript(userContext);
      }
    } catch (error: any) {
      this.scriptPlan = this._createFallbackScript(userContext);
    }

    // Validate and ensure minimum segments
    if (!this.scriptPlan || !this.scriptPlan.segments || this.scriptPlan.segments.length === 0) {
      this.scriptPlan = this._createEmergencyFallback(userContext);
    }

    // Final validation - must have at least 5 segments
    if (!this.scriptPlan.segments || this.scriptPlan.segments.length < 5) {
      this.scriptPlan = this._createDeterministicFallback(userContext);
    }

    // Initialize segments array
    this.segments = this.scriptPlan.segments.map((segment: any) => ({
      id: segment.id,
      text: segment.text,
      approxSec: segment.approxSec || 30,
      audio: null,
      ttsProvider: 'browser-tts' as const
    }));
    
    // Update state with total segments
    this._updateState({
      totalSegments: this.segments.length,
      scriptPlan: this.scriptPlan,
      currentSegmentId: this.segments[0]?.id || null
    });

    if (DEBUG_TTS) {
      console.log(`Session: Initialized with ${this.segments.length} segments`);
    }
  }

  private _createFallbackScript(userContext: any): any {
    // Advanced hypnosis script based on psychological principles
    const { egoState = 'guardian', goalId = 'transformation', lengthSec = 900 } = userContext;
    
    // Calculate timing based on speaking rate (150-200 words per minute for hypnosis)
    const wordsPerMinute = 160;
    const totalMinutes = lengthSec / 60;
    const totalWords = Math.floor(totalMinutes * wordsPerMinute);
    
    // Sophisticated script structure (7-stage hypnosis protocol)
    const segments = [
      {
        id: "pre_induction",
        text: this._generatePreInduction(egoState, goalId),
        approxSec: Math.floor(lengthSec * 0.08) // 8% - setup rapport
      },
      {
        id: "induction", 
        text: this._generateInduction(egoState, goalId),
        approxSec: Math.floor(lengthSec * 0.20) // 20% - enter hypnosis
      },
      {
        id: "deepening",
        text: this._generateDeepening(egoState, goalId), 
        approxSec: Math.floor(lengthSec * 0.15) // 15% - deepen trance
      },
      {
        id: "ego_state_activation",
        text: this._generateEgoStateActivation(egoState, goalId),
        approxSec: Math.floor(lengthSec * 0.12) // 12% - activate archetype
      },
      {
        id: "transformation_work",
        text: this._generateTransformationWork(egoState, goalId),
        approxSec: Math.floor(lengthSec * 0.25) // 25% - core change work
      },
      {
        id: "integration", 
        text: this._generateIntegration(egoState, goalId),
        approxSec: Math.floor(lengthSec * 0.12) // 12% - embed changes
      },
      {
        id: "emergence",
        text: this._generateEmergence(egoState, goalId),
        approxSec: Math.floor(lengthSec * 0.08) // 8% - return to consciousness
      }
    ];
    
    return {
      title: `${egoState} Transformation Protocol: ${goalId}`,
      segments,
      metadata: {
        totalWords: totalWords,
        avgWordsPerMinute: wordsPerMinute,
        egoStateActivation: egoState,
        transformationGoal: goalId,
        techniqueUsed: 'progressive_with_ego_state_integration'
      }
    };
  }

  // Advanced hypnosis script generation methods
  private _generatePreInduction(egoState: string, goalId: string): string {
    const egoIntros = {
      guardian: "I want you to feel completely safe and protected here with me. Your guardian energy is awakening, ready to shield you from anything that doesn't serve your highest good.",
      rebel: "There's a revolutionary force within you that's ready to break free. Feel that rebel energy stirring, ready to shatter the limitations that have held you back for far too long.",
      healer: "Feel the gentle, nurturing energy of your inner healer beginning to awaken. This wise part of you knows exactly how to restore balance and wholeness to your entire being.",
      mystic: "Connect now with the infinite wisdom that flows through you. Your mystic nature is awakening, ready to access realms of consciousness beyond the ordinary mind.",
      explorer: "There's an adventurous spirit within you that's eager to discover new territories of possibility. Feel that explorer energy awakening, ready to venture into uncharted aspects of yourself."
    };
    
    const intro = egoIntros[egoState as keyof typeof egoIntros] || egoIntros.guardian;
    return `${intro} Today we're focusing specifically on ${goalId}, and your ${egoState} archetype will guide this powerful transformation. Are you ready to begin this journey?`;
  }

  private _generateInduction(egoState: string, goalId: string): string {
    // Stage hypnosis-style rapid induction with archetypal activation
    return `Take a deep breath and close your eyes now. That's right... And as you exhale, feel your body beginning to relax. Now, with each breath you take, you're going deeper and deeper into a state of profound relaxation and receptivity. Your ${egoState} energy is guiding you safely into this transformative state. Feel yourself sinking... deeper and deeper... with each word I speak, each breath you take. Your conscious mind can rest now while your ${egoState} wisdom takes over, leading you exactly where you need to go for your ${goalId}.`;
  }

  private _generateDeepening(egoState: string, goalId: string): string {
    // Compound deepening technique
    return `Now I want you to imagine yourself going even deeper... deeper than you've ever gone before. Feel yourself descending through layers of consciousness, each level bringing you closer to your ${egoState} core. Count backwards with me from 10 to 1, and with each number, let yourself drop twice as deep into this receptive state. 10... sinking deeper... 9... even deeper now... 8... feeling your ${egoState} energy strengthening... 7... going so deep... 6... deeper still... 5... profound relaxation... 4... your ${egoState} wisdom fully activated... 3... so deep now... 2... almost there... 1... perfect. You are now in the ideal state for transformation work on ${goalId}.`;
  }

  private _generateEgoStateActivation(egoState: string, goalId: string): string {
    const activations = {
      guardian: "Feel your inner guardian rising now, strong and protective. This wise protector knows exactly how to shield you from patterns that no longer serve you. Your guardian energy is creating a sacred space for transformation.",
      rebel: "Feel the rebel force surging through you now. This revolutionary energy is breaking down the walls of limitation, shattering old beliefs that have kept you small. Your rebel spirit is fierce and unstoppable.",
      healer: "Feel the healing light flowing through every cell of your being now. Your inner healer is activating, bringing restoration and renewal to every aspect of your life. This healing force knows no limits.",
      mystic: "Feel your connection to infinite consciousness expanding now. Your mystic nature is awakening, accessing wisdom from beyond the ordinary mind. You are tapping into universal intelligence.",
      explorer: "Feel your adventurous spirit awakening now. Your inner explorer is ready to venture into new territories of possibility, discovering hidden treasures within your own consciousness."
    };
    
    const activation = activations[egoState as keyof typeof activations] || activations.guardian;
    return `${activation} This ${egoState} energy is now fully activated and focused on your ${goalId}. Feel it growing stronger with each breath, more powerful with each heartbeat.`;
  }

  private _generateTransformationWork(egoState: string, goalId: string): string {
    // Core change work using direct suggestion and metaphor
    const transformationScripts = {
      'stress-relief': "Your nervous system is learning a new way of being. Each breath teaches your body that safety is your natural state. Stress dissolves like mist in the morning sun, leaving only calm clarity.",
      'confidence': "Feel confidence flowing through you like liquid gold. Every cell of your being remembers what it feels like to be completely confident. This confidence is your birthright, your natural state.",
      'sleep': "Your body's natural sleep rhythm is being restored now. Your mind knows exactly how to quiet itself. Sleep comes naturally and easily, like a gentle river flowing to the sea.",
      'healing': "Your body's innate healing intelligence is activated now. Every cell is working in perfect harmony to restore balance and vitality. Healing happens at the deepest levels.",
      'transformation': "You are becoming the person you were always meant to be. Old limitations fall away like leaves from a tree. Your true self emerges, powerful and free."
    };
    
    const coreWork = transformationScripts[goalId as keyof typeof transformationScripts] || transformationScripts.transformation;
    return `${coreWork} Your ${egoState} energy is the catalyst for this change, amplifying every positive suggestion, making every transformation more powerful and permanent. These changes are happening now, at the deepest levels of your being.`;
  }

  private _generateIntegration(egoState: string, goalId: string): string {
    return `These powerful changes are now integrating into every aspect of your being. Your ${egoState} energy ensures that these transformations become a permanent part of who you are. Feel these changes locking in at the cellular level, at the neurological level, at the quantum level of your existence. When you return to full awareness, these changes will be with you always, growing stronger every day. Your work on ${goalId} is complete and successful.`;
  }

  private _generateEmergence(egoState: string, goalId: string): string {
    return `And now it's time to return, bringing all these powerful changes with you. Your ${egoState} energy will continue working on your ${goalId} long after this session ends. I'll count from 1 to 5, and on 5, you'll emerge feeling fantastic. 1... energy returning to your body... 2... becoming more aware of your surroundings... 3... feeling wonderful, feeling powerful... 4... almost ready to open your eyes... and 5... eyes open! Fully alert, completely refreshed, and permanently transformed.`;
  }

  private _createEmergencyFallback(userContext: any) {
    return {
      title: `${userContext.egoState || 'Guardian'} Emergency Session`,
      segments: [
        { id: "welcome", text: `Welcome to your ${userContext.egoState || 'Guardian'} session. Find a comfortable position and close your eyes.`, approxSec: 12 },
        { id: "breathe", text: "Take a deep breath in through your nose... hold it for a moment... and slowly exhale through your mouth.", approxSec: 20 },
        { id: "relax", text: "Feel your body relaxing completely. Starting with your feet, let relaxation flow up through your legs, your torso, your arms.", approxSec: 25 },
        { id: "deepen", text: "Going deeper now into this peaceful state. Count backwards from 5 to 1, feeling twice as relaxed with each number.", approxSec: 30 },
        { id: "transform", text: `Your ${userContext.egoState || 'Guardian'} energy is awakening. Feel this positive change integrating throughout your entire being.`, approxSec: 25 },
        { id: "integrate", text: "These changes are becoming part of you now. Feel them taking root at the deepest levels of your consciousness.", approxSec: 20 },
        { id: "return", text: "Now count from 1 to 5, and on 5, open your eyes feeling refreshed and transformed. 1... 2... 3... 4... 5... eyes open!", approxSec: 18 }
      ]
    };
  }

  private _createDeterministicFallback(userContext: any) {
    const { egoState = 'Guardian', goalId = 'transformation', lengthSec = 900 } = userContext;
    
    return {
      title: `${egoState} Transformation Session`,
      segments: [
        { id: "intro", text: `Welcome to your ${egoState} transformation session. We're focusing on ${goalId} today. Find a comfortable position.`, approxSec: Math.floor(lengthSec * 0.08) },
        { id: "induction", text: "Close your eyes and take three deep breaths. With each exhale, feel yourself becoming more relaxed and receptive.", approxSec: Math.floor(lengthSec * 0.20) },
        { id: "deepening", text: `Going deeper now into this peaceful state. Your ${egoState} energy is guiding you safely into transformation.`, approxSec: Math.floor(lengthSec * 0.25) },
        { id: "work", text: `Feel your ${egoState} wisdom working on ${goalId}. These positive changes are happening naturally and easily.`, approxSec: Math.floor(lengthSec * 0.30) },
        { id: "integration", text: "These changes are integrating at the deepest levels. Feel them becoming a permanent part of who you are.", approxSec: Math.floor(lengthSec * 0.12) },
        { id: "emergence", text: "Time to return now. Count from 1 to 5. On 5, open your eyes feeling completely refreshed and transformed.", approxSec: Math.floor(lengthSec * 0.05) }
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


  play() {
    // Single-flight guard - prevent duplicate starts
    if (this.ttsLock && this._state.playState === 'playing') {
      if (DEBUG_TTS) console.log('Session: Play already in progress, ignoring');
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
    
    if (DEBUG_TTS) {
      console.log(`TTS start seg ${this.currentSegmentIndex + 1}`);
    }
    
    // Update state to show current segment
    this._updateState({ 
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });
    this._emit('play');
    
    // Use browser TTS for reliability
    this._playWithBrowserTTS(segment.text);
  }

  private _playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.warn('Session: speechSynthesis not available');
      const estimatedDuration = Math.max(4000, text.length * 100);
      setTimeout(() => {
        this._handleSegmentEnd();
      }, estimatedDuration);
      return;
    }

    // Generate unique utterance ID
    const utteranceId = `utterance-${Date.now()}-${Math.random()}`;
    this.currentUtteranceId = utteranceId;
    this.wasCanceledByUs = false;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Clear dictation
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 1.0;
    
    // Voice selection
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = ['Google US English', 'Microsoft Aria', 'Microsoft Mark', 'Microsoft David', 'Samantha', 'Victoria', 'Moira'];
    
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
      if (DEBUG_TTS) {
        console.log('Session: Selected voice:', selectedVoice.name);
      }
    }
    
    // Event handlers with single-flight protection
    utterance.onstart = () => {
      this.ttsLock = true;
    };
    
    utterance.onend = () => {
      this.ttsLock = false;
      
      // Only advance if this utterance wasn't canceled by us
      if (this.currentUtteranceId === utteranceId && !this.wasCanceledByUs) {
        if (DEBUG_TTS) {
          console.log(`TTS end seg ${this.currentSegmentIndex + 1}`);
        }
        this._handleSegmentEnd();
      } else if (this.wasCanceledByUs) {
        this.wasCanceledByUs = false;
      }
    };
    
    utterance.onerror = (event) => {
      this.ttsLock = false;
      
      if (event.error === 'interrupted' || event.error === 'canceled') {
        // Neutral - don't advance
        if (DEBUG_TTS) {
          console.log('Session: TTS interrupted/canceled');
        }
      } else {
        console.warn('Session: TTS error:', event.error);
        // Fall back to advance to avoid stalls
        if (this.currentUtteranceId === utteranceId && !this.wasCanceledByUs) {
          this._handleSegmentEnd();
        }
      }
    };
    
    // Speak immediately (must be in same task as user gesture)
    window.speechSynthesis.speak(utterance);
    
    // Handle voice loading asynchronously if needed
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        // Voice loading completed - voice selection will apply to future utterances
        if (DEBUG_TTS) {
          console.log('Session: Voices loaded for future segments');
        }
      }, { once: true });
    }
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
        if (this._state.playState === 'playing') {
          this.play();
        }
      }, 1000);
    } else {
      this._updateState({ playState: 'stopped' });
      this._emit('end');
    }
  }

  pause() {
    if (this._state.playState === 'paused') return;
    
    this._cancelCurrentTTS();
    
    this._updateState({ playState: 'paused' });
    this._emit('pause');
  }

  next() {
    this._cancelCurrentTTS();
    
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
      this._cancelCurrentTTS();
      
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

  private _cancelCurrentTTS() {
    this.wasCanceledByUs = true;
    this.currentUtteranceId = null;
    
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.onended = null;
      this.currentAudioElement.onerror = null;
      this.currentAudioElement = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
  dispose() {
    this._cancelCurrentTTS();
    
    // Clean up audio URLs to prevent memory leaks
    this.segments.forEach(segment => {
      if (segment?.audio?.src) {
        URL.revokeObjectURL(segment.audio.src);
      }
    });
    
    this.ttsLock = false;
    this.wasCanceledByUs = false;
    this.currentUtteranceId = null;
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