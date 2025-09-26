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
  // Single-flight guards
  private ttsLock = false;
  private wasCanceledByUs = false;
  private currentUtteranceId: string | null = null;
  private voicesLoaded = false;
  private voicesLoadedPromise: Promise<void>;

  async initialize(userContext: any) {
    if (this._initializationPromise) {
      return this._initializationPromise;
    }
    
    this._initializationPromise = this._doInitialization(userContext);
    return this._initializationPromise;
  }
  
  private async _doInitialization(userContext: any) {
    try {
      console.log('Session: Starting initialization with dynamic script generation...');
      
      // Initialize voices loading promise
      this.voicesLoadedPromise = this._ensureVoicesLoaded();
      
      // Generate dynamic script
      await this._initializeSession(userContext);
      
      // Pre-buffer first few segments
      await this._prebufferInitialSegments();
      
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

  private _createProtocolBasedScript(userContext: any): any {
    // Advanced hypnosis script based on psychological principles
    const { egoState = 'guardian', goalId = 'transformation', lengthSec = 900 } = userContext;
    const { customProtocol, protocol, userPrefs } = userContext;
    
    // Calculate timing based on speaking rate (150-200 words per minute for hypnosis)
    const wordsPerMinute = 160;
    const totalMinutes = lengthSec / 60;
    const totalWords = Math.floor(totalMinutes * wordsPerMinute);
    
    // Use actual protocol content if available
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
        totalWords: totalWords,
        avgWordsPerMinute: wordsPerMinute,
        egoStateActivation: egoState,
        transformationGoal: goalId,
        durationSec: lengthSec,
        techniqueUsed: customProtocol ? 'custom_protocol' : protocol ? 'predefined_protocol' : 'ego_state_integration'
      }
    };
  }

  private _generateCustomProtocolScript(customProtocol: any, egoState: string, lengthSec: number) {
    // Use custom protocol content with proper timing
    const segments = [
      {
        id: "welcome",
        text: `Welcome to your ${customProtocol.name}. Today we're focusing on ${customProtocol.goals?.join(' and ') || 'transformation'}. Find a comfortable position and let's begin.`,
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
    // Use predefined protocol script with ego state adaptation
    const segments = [
      {
        id: "welcome",
        text: `Welcome to ${protocol.name}. ${protocol.description} Let's begin this ${lengthSec / 60}-minute journey.`,
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
    return segments;
  }

  private _getDynamicElements(variation: any, randomSeed: number) {
    const timeOfDay = new Date().getHours();
    const isEvening = timeOfDay >= 18 || timeOfDay <= 6;
    
    const openingPhrases = [
      "Your transformation awaits in this sacred moment.",
      "Feel the power of change flowing through this space.",
      "This is your time for profound inner evolution.",
      "Allow yourself to embrace the transformation ahead."
    ];
    
    const transitionPhrases = [
      "And now, going even deeper...",
      "Feel yourself moving into the next phase...",
      "As we continue this journey together...",
      "Allow this transformation to deepen..."
    ];
    
    const metaphors = [
      isEvening ? "like the gentle descent of evening" : "like the rising of dawn",
      "like roots growing deep into fertile earth",
      "like light flowing through crystal",
      "like waves washing over smooth stones"
    ];
    
    const seedIndex = Math.floor(randomSeed * openingPhrases.length);
    
    return {
      openingPhrase: openingPhrases[seedIndex],
      transitionPhrase: transitionPhrases[seedIndex],
      metaphor: metaphors[seedIndex],
      timeContext: isEvening ? "evening" : "day"
    };
  }
  
  private _adaptInductionMethod(method: string, goal: string, dynamicElements?: any): string {
    const methods = {
      progressive: `Let's begin with progressive relaxation. ${dynamicElements?.transitionPhrase || 'Moving gently forward...'} Starting with your toes, feel them relaxing completely. Now your feet, your ankles, your calves... Let this wave of relaxation flow up through your entire body ${dynamicElements?.metaphor || 'like gentle waves'} as we work on ${goal}.`,
      rapid: `Close your eyes now and take a deep breath. ${dynamicElements?.transitionPhrase || 'Going deeper now...'} Hold it... and as you exhale, let your body drop into complete relaxation. With each word I speak, you go deeper, preparing your mind for transformation around ${goal}.`,
      breath: `Focus on your breathing now. ${dynamicElements?.transitionPhrase || 'Allow your breath to guide you...'} Breathe in slowly for 4 counts... hold for 4... exhale for 6... Feel your breath naturally guiding you into a receptive state for working on ${goal}.`,
      visualization: `Imagine yourself in a place of perfect peace and safety. ${dynamicElements?.transitionPhrase || 'Feel yourself settling in...'} See it clearly in your mind... feel yourself there completely... This is your sanctuary for transformation around ${goal}.`
    };
    return methods[method as keyof typeof methods] || methods.progressive;
  }

  private _generateGoalSpecificWork(goals: string[], egoState: string): string {
    const goalText = goals.join(' and ');
    return `Your ${egoState} energy is now fully focused on ${goalText}. Feel these positive changes beginning at the deepest levels of your being. With each breath, your transformation around ${goalText} becomes stronger, more permanent, more natural. Your ${egoState} wisdom guides this process perfectly.`;
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

  private async _prebufferInitialSegments() {
    console.log('🚀 Session: Pre-buffering initial segments for faster playback...');
    
    if (!this.segments || this.segments.length === 0) {
      console.log('🚀 Session: No segments to pre-buffer');
      return;
    }
    
    // Pre-buffer first segment for immediate playback
    const firstSegment = this.segments[0];
    if (firstSegment) {
      console.log('🚀 Session: Pre-buffering first segment...');
      try {
        await this._bufferSegmentAudio(0);
        console.log('🚀 Session: First segment ready!');
      } catch (error) {
        console.warn('🚀 Session: First segment pre-buffer failed:', error);
      }
    }
    
    // Start background buffering for next segments
    this._prebufferNextSegments();
  }
  
  private async _prebufferNextSegments() {
    console.log('🔄 Session: Background pre-buffering next segments...');
    
    const maxBuffer = AI.voice.preBufferSegments || 2;
    const bufferPromises = [];
    
    for (let i = this.currentSegmentIndex + 1; i < Math.min(this.segments.length, this.currentSegmentIndex + maxBuffer + 1); i++) {
      const segment = this.segments[i];
      if (segment && !segment.isBuffered && !segment.bufferPromise) {
        console.log(`🔄 Session: Queuing buffer for segment ${i + 1}`);
        const promise = this._bufferSegmentAudio(i);
        segment.bufferPromise = promise;
        bufferPromises.push(promise);
      }
    }
    
    if (bufferPromises.length > 0) {
      try {
        await Promise.all(bufferPromises);
        console.log(`🔄 Session: Pre-buffered ${bufferPromises.length} segments`);
      } catch (error) {
        console.warn('🔄 Session: Some segments failed to pre-buffer:', error);
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

  private _ensureVoicesLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

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
          console.log(`TTS: Loaded ${voices.length} browser voices`);
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve();
        }
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Fallback timeout in case voiceschanged never fires
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        this.voicesLoaded = true;
        resolve();
      }, 3000);
    });
  }

  private _emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => listener(data));
    }
  }


  play() {
    console.log('🎮 Session: play() called');
    
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
    
    console.log(`Session: Starting segment ${this.currentSegmentIndex + 1}/${this.segments.length} with text: "${segment.text.substring(0, 50)}..."`);
    
    // Update state to show current segment
    this._updateState({ 
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });
    this._emit('play');
    
    // Clear any previous TTS before starting new segment
    this._cancelCurrentTTS();
    
    console.log('🎵 Session: About to call _speakSegmentWithFallback');
    this._speakSegmentWithFallback(segment.text);
  }

  private async _speakSegmentWithFallback(text: string) {
    console.log(`🎵 TTS: _speakSegmentWithFallback called for segment ${this.currentSegmentIndex + 1}`);
    console.log(`🎵 TTS: Text length: ${text.length}, text: "${text.substring(0, 100)}..."`);
    
    // Check if TTS is already locked
    if (this.ttsLock) {
      console.log('⚠️ TTS: Already locked, skipping this attempt');
      return;
    }
    
    this.ttsLock = true;
    console.log('🔒 TTS: Lock acquired for segment', this.currentSegmentIndex + 1);
    
    try {
      console.log('🌐 TTS: Attempting ElevenLabs synthesis...');
      // Try ElevenLabs first
      const result = await synthesizeSegment(text, {
        voiceId: AI.voice.defaultVoiceId, // Use Adam voice from config
        cacheKey: `segment-${this.currentSegmentIndex}`,
        mode: 'live'
      });

      console.log(`🌐 TTS: ElevenLabs result:`, result);
      
      if (result.provider === 'elevenlabs' && result.audioUrl) {
        console.log(`TTS: ✅ Using ElevenLabs audio for segment ${this.currentSegmentIndex + 1}`);
        this._playAudioUrl(result.audioUrl);
        return;
      }

      console.log(`TTS: ⚠️ ElevenLabs not available for segment ${this.currentSegmentIndex + 1}, using browser TTS`);
      if (result.error) {
        console.log(`TTS: ElevenLabs error: ${result.error}`);
      }
      console.log('🗣️ TTS: Falling back to browser TTS...');
      await this._speakSegmentNow(text);
    } catch (error) {
      console.error(`TTS: ❌ Error with ElevenLabs for segment ${this.currentSegmentIndex + 1}, falling back to browser:`, error);
      console.log('🗣️ TTS: Exception caught, using browser TTS...');
      await this._speakSegmentNow(text);
    }
  }

  private _playAudioUrl(audioUrl: string) {
    console.log(`TTS: Creating audio element for ElevenLabs segment ${this.currentSegmentIndex + 1}`);
    
    // TTS lock should remain true during ElevenLabs playback
    // this.ttsLock = true; // Already set in _speakSegmentWithFallback
    
    // Create audio element for ElevenLabs
    this.currentAudioElement = new Audio(audioUrl);
    this.currentAudioElement.volume = 1.0;
    
    this.currentAudioElement.onloadeddata = () => {
      console.log(`TTS: ElevenLabs audio loaded for segment ${this.currentSegmentIndex + 1}, starting playback`);
    };
    
    this.currentAudioElement.onended = () => {
      console.log(`TTS: ✅ ElevenLabs segment ${this.currentSegmentIndex + 1} completed successfully`);
      this.ttsLock = false;
      this.currentAudioElement = null;
      
      if (!this.wasCanceledByUs) {
        this._handleSegmentEnd();
      }
    };
    
    this.currentAudioElement.onerror = (event) => {
      console.error(`TTS: ❌ ElevenLabs audio error for segment ${this.currentSegmentIndex + 1}:`, event);
      this.ttsLock = false;
      this.currentAudioElement = null;
      
      // Fall back to browser TTS on audio error  
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._speakSegmentNow(segment.text);
      }
    };
    
    // Start playback with error handling
    this.currentAudioElement.play().then(() => {
      console.log(`TTS: ElevenLabs playback started successfully for segment ${this.currentSegmentIndex + 1}`);
    }).catch(error => {
      console.error(`TTS: ❌ Failed to play ElevenLabs audio for segment ${this.currentSegmentIndex + 1}:`, error);
      this.ttsLock = false;
      this.currentAudioElement = null;
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._speakSegmentNow(segment.text);
      }
    });
  }
  
  private _playAudioElement(audioElement: HTMLAudioElement) {
    console.log(`🎵 TTS: Playing pre-buffered audio element for segment ${this.currentSegmentIndex + 1}`);
    
    this.currentAudioElement = audioElement;
    
    // Clone the audio element to avoid conflicts
    const clonedAudio = audioElement.cloneNode() as HTMLAudioElement;
    this.currentAudioElement = clonedAudio;
    
    clonedAudio.onended = () => {
      console.log(`TTS: ✅ Pre-buffered ElevenLabs segment ${this.currentSegmentIndex + 1} completed`);
      this.ttsLock = false;
      this.currentAudioElement = null;
      
      if (!this.wasCanceledByUs) {
        this._handleSegmentEnd();
      }
    };
    
    clonedAudio.onerror = (event) => {
      console.error(`TTS: ❌ Pre-buffered audio error for segment ${this.currentSegmentIndex + 1}:`, event);
      this.ttsLock = false;
      this.currentAudioElement = null;
      
      // Fall back to browser TTS
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._speakSegmentNow(segment.text);
      }
    };
    
    clonedAudio.play().then(() => {
      console.log(`TTS: ✅ Pre-buffered audio playing for segment ${this.currentSegmentIndex + 1}`);
    }).catch(error => {
      console.error(`TTS: ❌ Failed to play pre-buffered audio for segment ${this.currentSegmentIndex + 1}:`, error);
      this.ttsLock = false;
      this.currentAudioElement = null;
      
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._speakSegmentNow(segment.text);
      }
    });
  }

  private async _speakSegmentNow(text: string) {
    console.log(`🗣️ TTS: _speakSegmentNow called for segment ${this.currentSegmentIndex + 1}`);
    console.log(`🗣️ TTS: speechSynthesis available:`, !!window.speechSynthesis);
    
    if (!window.speechSynthesis) {
      console.error('Session: speechSynthesis not available');
      this.ttsLock = false;
      setTimeout(() => {
        this._handleSegmentEnd();
      }, 3000);
      return;
    }

    // Stop any existing speech before starting new utterance
    console.log('🗣️ TTS: Canceling any existing speech');
    window.speechSynthesis.cancel();
    
    // Wait for voices to load
    console.log('🗣️ TTS: Waiting for voices to load...');
    await this.voicesLoadedPromise;
    console.log('🗣️ TTS: Voices loaded, creating utterance');
    
    // Double-check if we were cancelled while waiting
    if (this.wasCanceledByUs) {
      console.log('TTS: Cancelled while waiting for voices');
      this.ttsLock = false;
      return;
    }
    
    // Generate unique ID for this utterance
    const utteranceId = `utterance-${Date.now()}-${Math.random()}`;
    this.currentUtteranceId = utteranceId;
    this.wasCanceledByUs = false;
    console.log(`🗣️ TTS: Created utterance ID: ${utteranceId}`);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;  // Slower for hypnotic effect
    utterance.pitch = 0.8; // Lower pitch for male-like calming effect
    utterance.volume = 1.0;
    console.log('🗣️ TTS: Utterance configured');
    
    // Voice selection (handle async loading properly)
    await this._selectBestVoice(utterance);
    console.log('🗣️ TTS: Voice selected');
    
    // Event handlers
    utterance.onstart = () => {
      console.log(`TTS: ✅ Browser TTS segment ${this.currentSegmentIndex + 1} started`);
    };
    
    utterance.onend = () => {
      console.log(`TTS: ✅ Browser TTS segment ${this.currentSegmentIndex + 1} ended`);
      this.ttsLock = false;
      
      // Only advance if we didn't cancel this utterance
      if (this.currentUtteranceId === utteranceId && !this.wasCanceledByUs) {
        console.log(`🗣️ TTS: Segment ${this.currentSegmentIndex + 1} completed, advancing...`);
        this._handleSegmentEnd();
      } else {
        console.log(`🗣️ TTS: Segment ${this.currentSegmentIndex + 1} ended but was cancelled or mismatched ID`);
      }
      
      if (this.wasCanceledByUs) {
        this.wasCanceledByUs = false;
      }
    };
    
    utterance.onerror = (event) => {
      // Only log non-interruption errors
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error(`TTS: ❌ Browser TTS error for segment ${this.currentSegmentIndex + 1}:`, event.error);
      } else {
        console.log(`TTS: Browser TTS ${event.error} for segment ${this.currentSegmentIndex + 1} (expected)`);
      }
      
      this.ttsLock = false;
      
      if (event.error === 'interrupted' || event.error === 'canceled') {
        // Expected - don't advance
        console.log(`TTS: Interrupted/canceled segment ${this.currentSegmentIndex + 1}`);
      } else {
        console.warn('TTS: Error -', event.error);
        // Fallback advance to prevent stalling
        if (this.currentUtteranceId === utteranceId && !this.wasCanceledByUs) {
          console.log(`🗣️ TTS: Error fallback - advancing from segment ${this.currentSegmentIndex + 1}`);
          this._handleSegmentEnd();
        }
      }
    };
    
    // Small delay to ensure clean state before speaking
    console.log(`🗣️ TTS: Queuing speech for segment ${this.currentSegmentIndex + 1} with 100ms delay`);
    setTimeout(() => {
      if (this.currentUtteranceId === utteranceId && !this.wasCanceledByUs) {
        console.log(`TTS: Speaking segment ${this.currentSegmentIndex + 1} with browser TTS`);
        console.log(`🗣️ TTS: Actually calling speechSynthesis.speak() now`);
        window.speechSynthesis.speak(utterance);
      } else {
        console.log(`🗣️ TTS: Cancelled before speaking - ID mismatch or cancelled`);
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
      console.log(`TTS: Selected browser voice: ${selectedVoice.name} (${selectedVoice.lang}) for segment ${this.currentSegmentIndex + 1}`);
    } else {
      console.log(`TTS: Using default browser voice from ${voices.length} available voices for segment ${this.currentSegmentIndex + 1}`);
    }
  }

  private _handleSegmentEnd() {
    console.log(`🎵 _handleSegmentEnd called. Current segment: ${this.currentSegmentIndex + 1}/${this.segments.length}`);
    
    if (this.currentSegmentIndex < this.segments.length - 1) {
      console.log(`🎵 Advancing to segment ${this.currentSegmentIndex + 2}`);
      this.currentSegmentIndex++;
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      // Continue to next segment immediately if still playing
      if (this._state.playState === 'playing') {
        // Small pause for natural flow
        console.log(`🎵 Session still playing, starting segment ${this.currentSegmentIndex + 1} in 500ms`);
        setTimeout(() => {
          console.log(`🎵 Timeout completed, calling play() for segment ${this.currentSegmentIndex + 1}`);
          this.play();
        }, 500);
      } else {
        console.log('🎵 Session not playing, segment advancement paused');
      }
    } else {
      console.log('🎵 Session complete - all segments finished');
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
        }, 100);
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
        }, 100);
      }
    }
  }

  private _cancelCurrentTTS() {
    console.log('🛑 TTS: Canceling current speech');
    this.wasCanceledByUs = true;
    this.currentUtteranceId = null;
    
    if (this.currentAudioElement) {
      console.log('🛑 TTS: Stopping ElevenLabs audio element');
      this.currentAudioElement.pause();
      this.currentAudioElement.onended = null;
      this.currentAudioElement.onerror = null;
      this.currentAudioElement.src = '';
      this.currentAudioElement = null;
    }
    
    if (window.speechSynthesis) {
      console.log('🛑 TTS: Canceling browser speechSynthesis');
      window.speechSynthesis.cancel();
    }
    
    // Reset TTS lock after a brief delay to allow cleanup
    setTimeout(() => {
      console.log('🔓 TTS: Lock released after cleanup delay');
      this.ttsLock = false;
    }, 50);
  }
  
  dispose() {
    console.log('Session: Disposing session manager');
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
    this.voicesLoaded = false;
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