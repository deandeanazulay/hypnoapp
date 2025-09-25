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
      this.scriptPlan = await getSessionScript(userContext);
      console.log('Session: Generated script with', this.scriptPlan.segments?.length || 0, 'segments');
    } catch (error: any) {
      console.error('Session: Script generation failed, using fallback:', error.message);
      this.scriptPlan = this._createFallbackScript(userContext);
    }

    // Initialize segments array
    this.segments = new Array(this.scriptPlan.segments.length).fill(null);
    this._updateState({ 
      scriptPlan: this.scriptPlan,
      currentSegmentId: this.scriptPlan.segments[0].id,
      totalSegments: this.scriptPlan.segments.length
    });

    // Convert all segments to playable segments immediately
    console.log('Session: Converting segments to playable format...');
    for (let i = 0; i < this.scriptPlan.segments.length; i++) {
      const segment = this.scriptPlan.segments[i];
      this.segments[i] = {
        id: segment.id,
        text: segment.text,
        approxSec: segment.approxSec || 20,
        audio: null,
        ttsProvider: 'browser-tts' as const
      };
    }
    
    console.log(`Session: All ${this.segments.length} segments ready for playback`);
  }

  private _createFallbackScript(userContext: any) {
    return {
      title: `${userContext.egoState || 'Mindful'} Session`,
      segments: [
        { id: "intro", text: `Welcome to your ${userContext.egoState || 'mindful'} session. Take a deep breath and allow yourself to settle in comfortably.`, approxSec: 15 },
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
    
    const segmentNumber = this.currentSegmentIndex + 1;
    console.log(`Session: Attempting to play segment ${segmentNumber} of ${this.segments.length}`);
    
    // Check if we have a valid segment
    if (this.currentSegmentIndex < 0 || this.currentSegmentIndex >= this.segments.length) {
      console.error(`Session: Invalid segment index ${this.currentSegmentIndex}. Total segments: ${this.segments.length}`);
      return;
    }
    
    const segment = this.segments[this.currentSegmentIndex];
    if (!segment) {
      console.error(`Session: No segment available at index ${this.currentSegmentIndex}`);
      return;
    }
    
    console.log(`Session: Playing segment ${segmentNumber} (${segment.id}) with text: "${segment.text.substring(0, 50)}..."`);
    
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
    console.log(`Session: Using browser TTS for segment ${segmentNumber}`);
    this._playWithBrowserTTS(segment.text);
  }

  private _playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.warn(`Session: Browser TTS not available for segment ${this.currentSegmentIndex + 1}`);
      const estimatedDuration = Math.max(4000, text.length * 100);
      console.log(`Session: Auto-advancing after ${estimatedDuration}ms`);
      setTimeout(() => {
        this._handleSegmentEnd();
      }, estimatedDuration);
      return;
    }

    const segmentNumber = this.currentSegmentIndex + 1;
    console.log(`Session: Starting browser TTS for segment ${segmentNumber}: "${text.substring(0, 50)}..."`);

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    // Wait a moment after canceling before starting new speech
    setTimeout(() => {
      this._startSpeechSynthesis(text, segmentNumber);
    }, 100);
  }

  private _startSpeechSynthesis(text: string, segmentNumber: number) {
    console.log(`Session: === TTS DEBUG START ===`);
    console.log(`Session: Segment ${segmentNumber} text length:`, text.length);
    console.log(`Session: Text preview:`, text.substring(0, 100));
    console.log(`Session: Speech synthesis available:`, !!window.speechSynthesis);
    console.log(`Session: Speech synthesis speaking:`, window.speechSynthesis?.speaking);
    console.log(`Session: Speech synthesis pending:`, window.speechSynthesis?.pending);
    
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error('Session: Speech synthesis not available');
      setTimeout(() => this._handleSegmentEnd(), 3000);
      return;
    }

    // Check if text is valid
    if (!text || text.trim().length === 0) {
      console.error('Session: No valid text to speak');
      setTimeout(() => this._handleSegmentEnd(), 1000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    console.log(`Session: Created utterance for segment ${segmentNumber}:`, {
      text: text.substring(0, 50) + '...',
      rate: utterance.rate,
      pitch: utterance.pitch,
      volume: utterance.volume
    });

    // Set up event handlers first
    utterance.onstart = () => {
      console.log(`Session: ✅ TTS STARTED for segment ${segmentNumber}`);
    };

    utterance.onend = () => {
      console.log(`Session: ✅ TTS FINISHED for segment ${segmentNumber}, advancing...`);
      this._handleSegmentEnd();
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted') {
        console.log(`Session: ℹ️ TTS interrupted for segment ${segmentNumber} (normal)`);
      } else {
        console.error(`Session: ❌ TTS error for segment ${segmentNumber}:`, event.error);
      }
      // Always advance on any error
      setTimeout(() => this._handleSegmentEnd(), 500);
    };

    // Simple voice selection - use default voice to avoid complexity
    const voices = speechSynthesis.getVoices();
    console.log(`Session: Available voices count:`, voices.length);
    console.log(`Session: Voice names:`, voices.slice(0, 5).map(v => v.name));
    
    if (voices.length > 0) {
      // Use first English voice or just the first voice
      const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (voice) {
        utterance.voice = voice;
        console.log(`Session: ✅ Selected voice: ${voice.name} (${voice.lang})`);
      } else {
        console.warn(`Session: ⚠️ No voice selected, using default`);
      }
    } else {
      console.warn(`Session: ⚠️ No voices available, using default`);
    }

    // Test if speech synthesis is currently speaking
    if (window.speechSynthesis.speaking) {
      console.warn(`Session: ⚠️ Speech synthesis already speaking, canceling first`);
      window.speechSynthesis.cancel();
      // Wait a bit before starting new speech
      setTimeout(() => this._startSpeechSynthesis(text, segmentNumber), 200);
      return;
    }

    console.log(`Session: 🎵 SPEAKING NOW for segment ${segmentNumber}...`);
    console.log(`Session: Utterance object:`, {
      text: utterance.text.substring(0, 50) + '...',
      voice: utterance.voice?.name || 'default',
      rate: utterance.rate,
      pitch: utterance.pitch,
      volume: utterance.volume
    });

    try {
      window.speechSynthesis.speak(utterance);
      console.log(`Session: ✅ Speech synthesis .speak() called successfully for segment ${segmentNumber}`);
      
      // Add a timeout as backup in case onstart/onend never fire
      const backupTimeout = setTimeout(() => {
        console.warn(`Session: ⚠️ TTS timeout for segment ${segmentNumber}, forcing advance`);
        this._handleSegmentEnd();
      }, Math.max(10000, text.length * 100)); // At least 10 seconds or based on text length
      
      // Clear timeout if utterance ends normally
      const originalOnEnd = utterance.onend;
      utterance.onend = () => {
        clearTimeout(backupTimeout);
        if (originalOnEnd) originalOnEnd();
      };
      
      const originalOnError = utterance.onerror;
      utterance.onerror = (event) => {
        clearTimeout(backupTimeout);
        if (originalOnError) originalOnError(event);
      };
      
    } catch (error) {
      console.error(`Session: ❌ FAILED to start speech for segment ${segmentNumber}:`, error);
      // Fallback - advance after a delay
      setTimeout(() => this._handleSegmentEnd(), 3000);
    }
    
    console.log(`Session: === TTS DEBUG END ===`);
  }

  private _handleSegmentEnd() {
    const completedSegment = this.currentSegmentIndex + 1;
    console.log(`Session: Segment ${completedSegment} ended, checking for next segment...`);
    
    if (this.currentSegmentIndex < this.segments.length - 1) {
      this.currentSegmentIndex++;
      const nextSegment = this.currentSegmentIndex + 1;
      console.log(`Session: Advancing to segment ${nextSegment} of ${this.segments.length}`);
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      // Small delay between segments for natural flow
      setTimeout(() => {
        console.log(`Session: Auto-playing segment ${nextSegment}`);
        this.play();
      }, 1000);
    } else {
      console.log('Session: All segments completed successfully');
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
    console.log(`Session: Manual next requested, current segment: ${this.currentSegmentIndex + 1}`);
    
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
      console.log(`Session: Manually advanced to segment ${this.currentSegmentIndex + 1}`);
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      if (this._state.playState === 'playing') {
        setTimeout(() => {
          this.play();
        }, 200);
      }
      
      // Prefetch next segments
      this._prefetchSegments(this.currentSegmentIndex + 1, AI.voice.preBufferSegments).catch(() => {
        console.log('Session: Prefetch failed, continuing without');
      });
    } else {
      console.log('Session: Manual next reached end of segments');
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
      console.log(`Session: Moved back to segment ${this.currentSegmentIndex}`);
      
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
}