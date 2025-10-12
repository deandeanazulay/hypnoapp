import { SessionScript, getSessionScript } from './chatgpt';
import { synthesizeSegment } from './voice';
import { AI } from '../config/ai';
import { supabase } from '../lib/supabase';
import {
  SessionPlan,
  PlanStep,
  PlanStepStatus,
  StepFeedback,
  createSessionPlan,
  materializePlanWithSegments,
  updatePlanStepStatus,
  findPlanStep,
  allSegmentStepsComplete
} from './planning';

export type { SessionPlan, StepFeedback } from './planning';

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
  ttsProvider: 'openai-tts' | 'browser-tts' | 'none';
  isBuffered: boolean;
  bufferPromise?: Promise<void>;
}

export interface SessionState {
  playState: 'stopped' | 'playing' | 'paused';
  currentSegmentIndex: number;
  currentSegmentId: string | null;
  totalSegments: number;
  plan: SessionPlan | null;
  script: SessionScript | null;
  bufferedAhead: number;
  error: string | null;
  isInitialized: boolean;
  awaitingPlanConfirmation: boolean;
  awaitingFeedbackForStepId: string | null;
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
  userId?: string;
}

export interface SessionHandle {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  dispose: () => void;
  on: (event: string, listener: Function) => void;
  getCurrentState: () => SessionState;
  confirmPlan: (planPatch?: Partial<SessionPlan>) => void;
  submitStepFeedback: (feedback: StepFeedback) => Promise<void>;
}

export class SessionManager {
  private _state: SessionState = {
    playState: 'stopped',
    currentSegmentIndex: 0,
    currentSegmentId: null,
    totalSegments: 0,
    plan: null,
    script: null,
    bufferedAhead: 0,
    error: null,
    isInitialized: false,
    awaitingPlanConfirmation: false,
    awaitingFeedbackForStepId: null
  };

  private segments: (PlayableSegment | null)[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private eventListeners: Record<string, Function[]> = {};
  private currentSegmentIndex = 0;
  private plan: SessionPlan | null = null;
  private sessionScript: SessionScript | null = null;
  private _initializationPromise: Promise<void> | null = null;
  private _isInitialized = false;
  private _isDisposed = false;
  private userId: string | null = null;
  private userContext: any = null;
  private segmentStepMap: Map<string, string> = new Map();
  private planConfirmed = false;
  private autoResumeAfterFeedback = false;
  private pendingSessionCompletion = false;
  private allowAutoPlanConfirmation = true;
  
  // Simplified TTS management
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded = false;
  private voicesLoadedPromise: Promise<void>;

  constructor() {
    this.voicesLoadedPromise = this._ensureVoicesLoaded();
  }

  async initialize(userContext: any, userId?: string) {
    if (this._initializationPromise) {
      return this._initializationPromise;
    }
    
    this.userId = userId || null;
    this._initializationPromise = this._doInitialization(userContext);
    return this._initializationPromise;
  }
  
  private async _doInitialization(userContext: any) {
    if (this._isDisposed) {
      return;
    }

    try {
      this._preparePlan(userContext);

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

  private _preparePlan(userContext: any) {
    this.userContext = userContext;
    this.plan = createSessionPlan(userContext);

    const gatherStep = this.plan.steps.find(step => step.type === 'gather_context');
    if (gatherStep) {
      this.plan = updatePlanStepStatus(this.plan, gatherStep.id, 'complete');
    }

    this.planConfirmed = false;
    this.segmentStepMap.clear();
    this.sessionScript = null;
    this.pendingSessionCompletion = false;
    this.autoResumeAfterFeedback = false;

    this._setPlan(this.plan);
    this._updateState({
      script: null,
      awaitingPlanConfirmation: this.plan?.needsConfirmation ?? false,
      awaitingFeedbackForStepId: null
    });

    this._emit('plan-created', this.plan);
  }

  private _setPlan(plan: SessionPlan | null) {
    this.plan = plan;
    this._updateState({ plan });
    if (plan) {
      this._emit('plan-updated', plan);
    }
  }

  private _updatePlanStep(stepId: string | undefined, status: PlanStepStatus, patch: Partial<PlanStep> = {}) {
    if (!this.plan || !stepId) {
      return;
    }
    const nextPlan = updatePlanStepStatus(this.plan, stepId, status, patch);
    this._setPlan(nextPlan);
  }

  private _bindSegmentsToPlan(segments: ScriptSegment[]) {
    if (!this.plan) {
      return;
    }

    const nextPlan = materializePlanWithSegments(this.plan, segments);
    this.segmentStepMap.clear();

    nextPlan.steps.forEach(step => {
      if (step.type === 'play_segment' && step.data?.segmentId) {
        this.segmentStepMap.set(step.data.segmentId, step.id);
      }
    });

    this._setPlan(nextPlan);
  }

  private _markCurrentSegmentInProgress() {
    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      return;
    }

    const stepId = this.segmentStepMap.get(segment.id);
    if (!stepId) {
      return;
    }

    const step = findPlanStep(this.plan, stepId);
    if (step && step.status !== 'in-progress') {
      this._updatePlanStep(stepId, 'in-progress');
    }
  }

  confirmPlan(planPatch: Partial<SessionPlan> = {}) {
    if (!this.plan) {
      return;
    }

    const updatedPlan = { ...this.plan, ...planPatch, needsConfirmation: false };
    this.planConfirmed = true;
    this._setPlan(updatedPlan);
    this._updateState({ awaitingPlanConfirmation: false });
    this._emit('plan-confirmed', updatedPlan);
  }

  get awaitingFeedbackStep(): PlanStep | null {
    return findPlanStep(this.plan, this._state.awaitingFeedbackForStepId || undefined);
  }

  async submitStepFeedback(feedback: StepFeedback) {
    if (!feedback) {
      return;
    }

    const stepId = feedback.stepId || this._state.awaitingFeedbackForStepId;
    if (!stepId) {
      return;
    }

    const step = findPlanStep(this.plan, stepId);
    if (!step) {
      return;
    }

    if (feedback.approved) {
      this._updatePlanStep(stepId, 'complete', {
        data: {
          ...(step.data || {}),
          feedback: feedback.notes || null
        }
      });

      this._updateState({ awaitingFeedbackForStepId: null });

      if (this.pendingSessionCompletion && allSegmentStepsComplete(this.plan)) {
        this._completeSessionWrapUp();
        return;
      }

      if (this.autoResumeAfterFeedback) {
        this.autoResumeAfterFeedback = false;
        this._resumeFromFeedback();
      }

      return;
    }

    this._updatePlanStep(stepId, 'needs-revision', {
      data: {
        ...(step.data || {}),
        feedback: feedback.notes || null,
        revisionReason: feedback.reason || 'unspecified'
      }
    });

    const revisedPlan = createSessionPlan(this.userContext, {
      revisionOf: this.plan?.id || null,
      feedback
    });

    this.planConfirmed = false;
    this.pendingSessionCompletion = false;
    this.autoResumeAfterFeedback = false;

    const revisedWithSegments = materializePlanWithSegments(revisedPlan, this.sessionScript?.segments || []);
    this.segmentStepMap.clear();
    revisedWithSegments.steps.forEach(step => {
      if (step.type === 'play_segment' && step.data?.segmentId) {
        this.segmentStepMap.set(step.data.segmentId, step.id);
      }
    });
    this._setPlan(revisedWithSegments);
    this._updateState({ awaitingPlanConfirmation: true, awaitingFeedbackForStepId: null });
    this._emit('plan-revision', this.plan);
  }

  private _resumeFromFeedback() {
    if (this._isDisposed) {
      return;
    }

    if (this.pendingSessionCompletion) {
      this._completeSessionWrapUp();
      return;
    }

    if (this.currentSegmentIndex >= this.segments.length) {
      this._completeSessionWrapUp();
      return;
    }

    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      this._completeSessionWrapUp();
      return;
    }

    this._updateState({
      playState: 'playing',
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegmentId: segment.id
    });

    this._stopCurrentAudio();
    this._playCurrentSegment();
  }

  private _completeSessionWrapUp() {
    const wrapStepId = this.plan?.steps.find(step => step.type === 'wrap_up')?.id;
    this._updatePlanStep(wrapStepId, 'complete');
    this.pendingSessionCompletion = false;
    this.autoResumeAfterFeedback = false;
    this.currentSegmentIndex = Math.max(0, this.segments.length - 1);
    this._updateState({
      playState: 'stopped',
      currentSegmentId: null,
      currentSegmentIndex: Math.max(0, this.segments.length - 1)
    });
    this._emit('end');
  }
        
  private async _initializeSession(userContext: any) {
    try {
      const generateStepId = this.plan?.steps.find(step => step.type === 'generate_script')?.id;
      this._updatePlanStep(generateStepId, 'in-progress');

      // Check if this is a saved protocol first
      let savedScript = null;
      if (this.userId && userContext.customProtocol?.id && userContext.sessionType === 'custom_protocol') {
        savedScript = await this._loadSavedScript(userContext.customProtocol.id);
      }

      if (savedScript) {
        console.log('[SESSION] Using saved script from personal library');
        this.sessionScript = savedScript;
      } else {
        console.log('[SESSION] Generating new script with AI');
        this.sessionScript = await getSessionScript(userContext);

        // Save the generated script to personal library if user is authenticated and it's a custom protocol
        if (this.userId && this.sessionScript && userContext.customProtocol?.id) {
          await this._saveScriptToLibrary(userContext, this.sessionScript);
        }
      }

      if (!this.sessionScript || !this.sessionScript.segments || this.sessionScript.segments.length === 0) {
        throw new Error('Script generation failed - no segments returned from API');
      }

      this._updatePlanStep(generateStepId, 'complete', {
        data: {
          ...(findPlanStep(this.plan, generateStepId)?.data || {}),
          segmentCount: this.sessionScript.segments.length
        }
      });

    } catch (error: any) {
      console.error('Session: Script generation FAILED - NO FALLBACK:', error.message);
      this._updateState({
        error: `Script generation failed: ${error.message}. Check GEMINI_API_KEY in Supabase settings.`
      });
      throw error;
    }

    // Initialize segments array
    this.segments = this.sessionScript.segments.map((segment: any) => ({
      ...segment,
      id: segment.id,
      text: segment.text,
      approxSec: segment.approxSec || 30,
      audio: null,
      ttsProvider: 'none' as const,
      isBuffered: false
    }));

    this._bindSegmentsToPlan(this.sessionScript.segments);

    // Update state with total segments
    this._updateState({
      totalSegments: this.segments.length,
      script: this.sessionScript,
      currentSegmentId: this.segments[0]?.id || null
    });

  }

  private async _loadSavedScript(protocolId: string) {
    try {
      const { data, error } = await supabase
        .from('custom_protocols')
        .select('*')
        .eq('id', protocolId)
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        console.log('[SESSION] No saved script found for protocol:', protocolId);
        return null;
      }

      // Check if protocol has a saved script
      if (data.script && data.script.segments) {
        console.log('[SESSION] Found saved script with', data.script.segments.length, 'segments');
        return data.script;
      }

      console.log('[SESSION] Protocol exists but no script saved yet');
      return null;
    } catch (error) {
      console.error('[SESSION] Error loading saved script:', error);
      return null;
    }
  }

  private async _saveScriptToLibrary(userContext: any, script: any) {
    if (!this.userId) {
      console.log('[SESSION] No user ID, skipping script save');
      return;
    }

    try {
      // Check if this is a custom protocol that already exists
      if (userContext.customProtocol?.id) {
        // Update existing protocol with generated script
        const { error } = await supabase
          .from('custom_protocols')
          .update({ script: script })
          .eq('id', userContext.customProtocol.id)
          .eq('user_id', this.userId);

        if (error) {
          console.error('[SESSION] Error updating protocol with script:', error);
        } else {
          console.log('[SESSION] Script saved to existing protocol:', userContext.customProtocol.id);
        }
      } else {
        // Create new protocol entry with the generated script
        const protocolData = {
          user_id: this.userId,
          name: script.title || `${userContext.egoState} Session`,
          induction: userContext.customProtocol?.induction || 'progressive',
          deepener: userContext.customProtocol?.deepener || 'Generated by AI',
          goals: userContext.customProtocol?.goals || [userContext.goalName || 'transformation'],
          metaphors: [],
          duration: Math.floor((userContext.lengthSec || 600) / 60),
          script: script
        };

        const { error } = await supabase
          .from('custom_protocols')
          .insert(protocolData);

        if (error) {
          console.error('[SESSION] Error saving new protocol with script:', error);
        } else {
          console.log('[SESSION] New protocol created with script');
        }
      }
    } catch (error) {
      console.error('[SESSION] Error saving script:', error);
    }
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
        mode: 'pre-gen',
        model: AI.voice.model
      });
      
      if (result.provider === 'openai-tts' && result.audioUrl) {
        // Create audio element for pre-buffered content
        segment.audio = new Audio(result.audioUrl);
        segment.audio.preload = 'auto';
        segment.ttsProvider = 'openai-tts';
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

    if (this._state.awaitingPlanConfirmation && !this.planConfirmed) {
      this._emit('plan-confirmation-needed', this.plan);
      if (this.allowAutoPlanConfirmation) {
        this.confirmPlan();
      } else {
        return;
      }
    }

    if (this._state.awaitingFeedbackForStepId) {
      const step = findPlanStep(this.plan, this._state.awaitingFeedbackForStepId);
      this._emit('feedback-required', step);
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

    this._markCurrentSegmentInProgress();

    // Try pre-buffered OpenAI TTS first
    if (segment.ttsProvider === 'openai-tts' && segment.audio) {
      this._playPreBufferedAudio(segment.audio);
      return;
    }
    
    // Try live OpenAI TTS
    this._tryOpenAITTSLive(segment.text);
  }

  private async _tryOpenAITTSLive(text: string) {
    try {
      if (import.meta.env.DEV) {
        console.log('[SESSION] 🎤 Calling OpenAI TTS with ash voice for:', text.substring(0, 50) + '...');
      }
      
      const result = await synthesizeSegment(text, {
        voiceId: 'ash',
        cacheKey: `live-segment-${this.currentSegmentIndex}`,
        mode: 'live',
        model: 'tts-1' // Use standard model that works with chatgpt-chat
      });

      if (import.meta.env.DEV) {
        console.log('[SESSION] 🎤 TTS Result - Provider:', result.provider);
        if (result.audioUrl) {
          console.log('[SESSION] ✅ SUCCESS! Got OpenAI ash voice audio URL');
        } else {
          console.log('[SESSION] ❌ No OpenAI audio URL, using robotic browser TTS');
        }
      }

      if (result.provider === 'openai-tts' && result.audioUrl) {
        console.log('[SESSION] 🔊 Playing OpenAI ash voice audio');
        this._playOpenAITTSAudio(result.audioUrl);
        return;
      }

      // Fall back to browser TTS
      if (import.meta.env.DEV) {
        console.warn('[SESSION] ⚠️ OpenAI TTS failed, falling back to robotic browser TTS');
      }
      await this._playWithBrowserTTS(text);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[SESSION] ❌ OpenAI TTS error, using robotic fallback:', error);
      }
      await this._playWithBrowserTTS(text);
    }
  }

  private _playPreBufferedAudio(audioElement: HTMLAudioElement) {
    // Clone to avoid conflicts
    const clonedAudio = audioElement.cloneNode() as HTMLAudioElement;
    this.currentAudioElement = clonedAudio;
    clonedAudio.volume = 0.8; // Set appropriate volume
    
    // Emit audio element for analysis
    this._emit('audio-element', clonedAudio);
    
    clonedAudio.onended = () => {
      this.currentAudioElement = null;
      this._emit('audio-ended');
      this._handleSegmentEnd();
    };
    
    clonedAudio.onerror = (event) => {
      console.log('[SESSION] Pre-buffered audio error, falling back to browser TTS');
      this.currentAudioElement = null;
      this._emit('audio-error');
      
      // Fall back to browser TTS on audio error  
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._playWithBrowserTTS(segment.text).catch(console.error);
      }
    };
    
    clonedAudio.onplay = () => {
      this._emit('audio-started');
    };
    
    clonedAudio.play().catch(error => {
      console.log('[SESSION] Pre-buffered audio play failed, falling back to browser TTS:', error);
      this.currentAudioElement = null;
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        this._playWithBrowserTTS(segment.text).catch(console.error);
      }
    });
  }

  private _playOpenAITTSAudio(audioUrl: string) {
    if (import.meta.env.DEV) {
      console.log('[SESSION] 🔊 Playing OpenAI ash voice audio from URL:', audioUrl);
    }
    
    // Create audio element for OpenAI TTS
    this.currentAudioElement = new Audio(audioUrl);
    this.currentAudioElement.volume = 1.0; // Full volume for ash voice
    this.currentAudioElement.preload = 'auto';
    this.currentAudioElement.crossOrigin = 'anonymous';
    
    // Immediately load and prepare audio
    this.currentAudioElement.load();
    
    // Emit audio element for analysis
    this._emit('audio-element', this.currentAudioElement);
    
    this.currentAudioElement.onended = () => {
      if (import.meta.env.DEV) {
        console.log('[SESSION] ✅ OpenAI ash voice segment finished');
      }
      this.currentAudioElement = null;
      this._emit('audio-ended');
      this._handleSegmentEnd();
    };
    
    this.currentAudioElement.onerror = (event) => {
      console.error('[SESSION] ❌ OpenAI ash voice audio error:', event);
      this.currentAudioElement = null;
      this._emit('audio-error');
      
      // Fall back to browser TTS on audio error  
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        console.log('[SESSION] Falling back to robotic browser TTS');
        this._playWithBrowserTTS(segment.text).catch(console.error);
      }
    };
    
    this.currentAudioElement.onplay = () => {
      if (import.meta.env.DEV) {
        console.log('[SESSION] ✅ OpenAI ash voice is now speaking!');
      }
      this._emit('audio-started');
    };
    
    this.currentAudioElement.oncanplaythrough = () => {
      if (import.meta.env.DEV) {
        console.log('[SESSION] OpenAI ash voice audio fully loaded and ready');
      }
      
      // Immediately play when fully loaded
      if (this._state.playState === 'playing') {
        this.currentAudioElement?.play().then(() => {
          if (import.meta.env.DEV) {
            console.log('[SESSION] ✅ OpenAI ash voice auto-play successful');
          }
        }).catch(error => {
          console.error('[SESSION] ❌ OpenAI ash voice auto-play failed:', error);
          // Fall back to browser TTS
          const segment = this.segments[this.currentSegmentIndex];
          if (segment) {
            console.log('[SESSION] Using robotic browser TTS as fallback');
            this._playWithBrowserTTS(segment.text).catch(console.error);
          }
        });
      }
    };
    
    // Try immediate play first, then rely on canplaythrough for backup
    this.currentAudioElement.play().then(() => {
      if (import.meta.env.DEV) {
        console.log('[SESSION] ✅ OpenAI ash voice immediate play successful');
      }
    }).catch(error => {
      if (import.meta.env.DEV) {
        console.log('[SESSION] Immediate play failed, waiting for audio to load:', error.message);
      }
      // The canplaythrough event will handle playback when ready
    });
    
    // Additional fallback timer to ensure playback starts
    setTimeout(() => {
      if (this.currentAudioElement && this._state.playState === 'playing') {
        this.currentAudioElement.play().catch(error => {
          if (import.meta.env.DEV) {
            console.log('[SESSION] Immediate play failed, waiting for canplay event:', error.message);
          }
          // The canplay event handler will try again
        });
      }
    }, 100);
  }

  private async _playWithBrowserTTS(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Session: speechSynthesis not available');
      this._handleSegmentEnd();
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('[SESSION] 🎤 ❌ USING ROBOTIC BROWSER TTS (OpenAI failed)');
      }
      
      // Stop any existing speech and ensure clean state
      window.speechSynthesis.cancel();
      
      // Ensure voices are loaded
      await this.voicesLoadedPromise;
      
      // Check if we're still supposed to be playing
      if (this._isDisposed || this._state.playState !== 'playing') {
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.65; // Even slower for hypnotherapy to match ash voice
      utterance.pitch = 0.75; // Lower pitch for calming, ash-like effect
      utterance.volume = 1.0;
      
      // Select best voice
      await this._selectBestVoice(utterance);
      
      // Event handlers
      utterance.onstart = () => {
        if (import.meta.env.DEV) {
          console.log('[SESSION] 🎤 ❌ ROBOTIC browser TTS started (not ash voice)');
        }
        this._emit('audio-started');
      };
      
      utterance.onend = () => {
        if (import.meta.env.DEV) {
          console.log('[SESSION] 🎤 Robotic browser TTS segment completed');
        }
        this.currentUtterance = null;
        this._emit('audio-ended');
        this._handleSegmentEnd();
      };
      
      utterance.onerror = (event) => {
        console.error('[SESSION] 🎤 ❌ Browser TTS error:', event.error);
        this.currentUtterance = null;
        this._emit('audio-error');
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          this._handleSegmentEnd();
        }
      };
      
      // Store current utterance
      this.currentUtterance = utterance;
      
      // Start speech synthesis
      if (import.meta.env.DEV) {
        console.log('[SESSION] 🎤 ❌ Starting ROBOTIC browser TTS (OpenAI ash voice failed)');
      }
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('[SESSION] 🎤 ❌ Browser TTS setup failed:', error);
      this.currentUtterance = null;
      this._handleSegmentEnd();
    }
  }

  private async _selectBestVoice(utterance: SpeechSynthesisUtterance) {
    // Ensure voices are loaded
    await this.voicesLoadedPromise;
    
    const voices = window.speechSynthesis.getVoices();
    if (import.meta.env.DEV) {
      console.log('[SESSION] Available browser voices:', voices.map(v => `${v.name} (${v.lang})`));
    }
    
    // Find the best available voice for ash-like hypnotherapy experience
    const selectedVoice = voices.find(voice => 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.name.includes('Daniel') ||
      voice.name.includes('Alex') ||
      voice.name.includes('Fiona') ||
      voice.name.includes('Moira') ||
      (voice.lang.includes('en') && voice.name.includes('Female'))
    ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      if (import.meta.env.DEV) {
        console.log('[SESSION] ✅ Selected ash-like voice:', selectedVoice.name, '(' + selectedVoice.lang + ')');
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('[SESSION] No suitable ash-like voice found, using default');
      }
    }
  }

  private _handleSegmentEnd() {
    if (this._isDisposed) {
      return;
    }

    const finishedIndex = this.currentSegmentIndex;
    const finishedSegment = this.segments[finishedIndex];
    const finishedStepId = finishedSegment ? this.segmentStepMap.get(finishedSegment.id) : undefined;

    // Move to next segment
    this.currentSegmentIndex++;

    const hasMore = this.currentSegmentIndex < this.segments.length;
    const nextSegmentId = hasMore ? this.segments[this.currentSegmentIndex]?.id || null : null;

    if (finishedStepId) {
      const finishedStep = findPlanStep(this.plan, finishedStepId);
      this.autoResumeAfterFeedback = this._state.playState === 'playing';
      this.pendingSessionCompletion = !hasMore;

      this._updatePlanStep(finishedStepId, 'awaiting-feedback', {
        data: {
          ...(finishedStep?.data || {}),
          completedAt: new Date().toISOString(),
          awaitingFeedback: true
        }
      });

      this._updateState({
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: nextSegmentId,
        playState: 'paused',
        awaitingFeedbackForStepId: finishedStepId
      });

      const updatedStep = findPlanStep(this.plan, finishedStepId);
      this._emit('feedback-required', updatedStep);
      return;
    }

    if (hasMore) {
      this._updateState({
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: nextSegmentId
      });

      if (this._state.playState === 'playing') {
        setTimeout(() => {
          if (this._state.playState === 'playing' && !this._isDisposed) {
            this._playCurrentSegment();
          }
        }, 500);
      }
    } else {
      this.pendingSessionCompletion = true;
      this._completeSessionWrapUp();
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

    if (this._state.awaitingFeedbackForStepId) {
      this.submitStepFeedback({
        stepId: this._state.awaitingFeedbackForStepId,
        approved: true,
        notes: 'Auto-approved via next()'
      }).catch(console.error);
      return;
    }

    const currentSegment = this.segments[this.currentSegmentIndex];
    const currentStepId = currentSegment ? this.segmentStepMap.get(currentSegment.id) : undefined;

    if (currentStepId) {
      const currentStep = findPlanStep(this.plan, currentStepId);
      this._updatePlanStep(currentStepId, 'complete', {
        data: {
          ...(currentStep?.data || {}),
          skipped: true,
          completedAt: new Date().toISOString()
        }
      });
    }

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
      this.pendingSessionCompletion = true;
      this._completeSessionWrapUp();
    }
  }

  prev() {
    this._stopCurrentAudio();

    if (this._state.awaitingFeedbackForStepId) {
      const stepId = this._state.awaitingFeedbackForStepId;
      const step = findPlanStep(this.plan, stepId);
      this._updatePlanStep(stepId, 'pending', {
        data: {
          ...(step?.data || {}),
          revisitedAt: new Date().toISOString(),
          awaitingFeedback: false
        }
      });
      this._updateState({ awaitingFeedbackForStepId: null });
      this.autoResumeAfterFeedback = false;
      this.pendingSessionCompletion = false;
    }

    if (this.currentSegmentIndex > 0) {
      this.currentSegmentIndex--;

      const segment = this.segments[this.currentSegmentIndex];
      const stepId = segment ? this.segmentStepMap.get(segment.id) : undefined;
      if (stepId) {
        const step = findPlanStep(this.plan, stepId);
        if (step && step.status === 'complete') {
          this._updatePlanStep(stepId, 'pending', {
            data: {
              ...(step.data || {}),
              revisitedAt: new Date().toISOString()
            }
          });
        }
      }

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

    this.segmentStepMap.clear();
    this.plan = null;
    this.sessionScript = null;
    this.eventListeners = {};
    this._updateState({
      playState: 'stopped',
      plan: null,
      script: null,
      awaitingFeedbackForStepId: null,
      awaitingPlanConfirmation: false
    });
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
  
  // Extract user ID for script saving
  const userId = options.userPrefs?.userId || options.userId;
  
  // Map options to user context for script generation
  const userContext = {
    egoState: options.egoState,
    goalId: options.goalId || options.goal?.id || 'transformation',
    goalName: options.goal?.name || options.goalId || 'personal transformation',
    actionName: options.action?.name || options.action?.id || 'transformation',
    methodName: options.method?.name || options.method?.id || 'guided relaxation',
    protocolName: options.protocol?.name || options.customProtocol?.name || 'custom session',
    lengthSec: options.lengthSec || 600,
    // Convert complex objects to clean strings
    customProtocolGoals: options.customProtocol?.goals?.join(', ') || '',
    customProtocolInduction: options.customProtocol?.induction || '',
    customProtocolDuration: options.customProtocol?.duration || options.lengthSec || 600,
    protocolDescription: options.protocol?.description || '',
    protocolDuration: options.protocol?.duration || options.lengthSec || 600,
    // Keep only essential user preferences as strings
    userLevel: options.userPrefs?.level || 1,
    userExperience: options.userPrefs?.experience || 'beginner',
    currentTime: new Date().toISOString(),
    sessionUniqueId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    promptVariation: Math.floor(Math.random() * 5) + 1,
    // Session type for AI context
    sessionType: options.customProtocol ? 'custom_protocol' : options.protocol ? 'predefined_protocol' : 'guided_session',
    customProtocol: options.customProtocol
  };
  
  // Initialize asynchronously
  manager.initialize(userContext, userId).catch(error => {
    console.error('Session initialization failed:', error);
  });

  return {
    play: () => manager.play(),
    pause: () => manager.pause(),
    next: () => manager.next(),
    prev: () => manager.prev(),
    dispose: () => manager.dispose(),
    on: (event: string, listener: Function) => manager.on(event, listener),
    getCurrentState: () => manager.getCurrentState(),
    confirmPlan: (planPatch?: Partial<SessionPlan>) => manager.confirmPlan(planPatch || {}),
    submitStepFeedback: (feedback: StepFeedback) => manager.submitStepFeedback(feedback)
  };
}

// Debug function to test session creation
export function debugSession(options: StartSessionOptions) {
  console.log('[SESSION-DEBUG] Creating session with options:', options);
  const handle = startSession(options);
  console.log('[SESSION-DEBUG] Session handle created:', handle);
  
  handle.on('state-change', (state) => {
    console.log('[SESSION-DEBUG] State change:', state);
  });
  
  handle.on('play', () => {
    console.log('[SESSION-DEBUG] Session started playing');
  });
  
  handle.on('end', () => {
    console.log('[SESSION-DEBUG] Session ended');
  });
  
  return handle;
}