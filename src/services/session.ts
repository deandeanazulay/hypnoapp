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
  
  if (options.autoPlay !== undefined) {
    manager.setAutoPlay(options.autoPlay);
  }
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
    getCurrentState: () => manager.getCurrentState(),
    setAutoPlay: (enabled: boolean) => manager.setAutoPlay(enabled)
  };

  private segments: (PlayableSegment | null)[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  private eventListeners: Record<string, Function[]> = {};
  private currentSegmentIndex = 0;
  private scriptPlan: any = null;
  private autoPlayEnabled = true;

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
      this.scriptPlan = await getSessionScript(userContext, templates);
      console.log('Session: Generated script with', this.scriptPlan.segments?.length || 0, 'segments');
      
      this.segments = new Array(this.scriptPlan.segments?.length || 0).fill(null);
      this._updateState({ 
        scriptPlan: this.scriptPlan,
        currentSegmentId: this.scriptPlan.segments?.[0]?.id || null,
        totalSegments: this.scriptPlan.segments?.length || 0
      });

      // Start prefetching segments
      if (this.scriptPlan.segments?.length > 0) {
        await this._prefetchSegments(0, AI.voice.preBufferSegments);
      }
    } catch (error: any) {
      console.error('Session: Script generation failed, using fallback:', error.message);
      
      // Fallback script
      this.scriptPlan = {
        title: "Mindful Session",
        segments: [
          { id: "intro", text: "Welcome to your mindful session. Take a deep breath and relax.", approxSec: 15 },
          { id: "induction", text: "Close your eyes gently and feel your body beginning to relax with each breath.", approxSec: 30 },
          { id: "deepening", text: "Going deeper now, feeling more and more relaxed with each breath you take.", approxSec: 45 },
          { id: "body", text: "Feel the tension leaving your body with each exhale. You are completely relaxed and peaceful.", approxSec: 60 },
          { id: "integration", text: "These feelings of peace and calm are becoming part of you now.", approxSec: 30 },
          { id: "outro", text: "In a moment, I'll count from 1 to 5. On 5, you'll open your eyes feeling refreshed and renewed. 1... 2... 3... 4... 5... eyes open, fully alert.", approxSec: 25 }
        ]
      };
      
      this.segments = new Array(this.scriptPlan.segments.length).fill(null);
      this._updateState({ 
        scriptPlan: this.scriptPlan,
        currentSegmentId: this.scriptPlan.segments[0].id,
        totalSegments: this.scriptPlan.segments.length
      });

      await this._prefetchSegments(0, AI.voice.preBufferSegments);
    }
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

    console.log(`Session: Prefetching ${segmentsToPrefetch.length} segments starting from ${startIndex}`);

    await Promise.all(segmentsToPrefetch.map(async ({ index, segment }) => {
      try {
        const voiceResult = await synthesizeSegment(segment.text, {
          voiceId: AI.voice.defaultVoiceId,
          model: AI.voice.model,
          cacheKey: `${this.scriptPlan!.title || 'script'}-${segment.id}`,
          mode: 'pre-gen'
        });

        console.log(`Session: Segment ${index} (${segment.id}) synthesized with provider: ${voiceResult.provider}`);

        // Handle different TTS providers
        let playableSegment: PlayableSegment;
        
        if (voiceResult.provider === 'elevenlabs' && voiceResult.audioUrl) {
          const audioElement = new Audio(voiceResult.audioUrl);
          
          // Preload the audio
          audioElement.preload = 'auto';
          
          // Handle audio events
          audioElement.onended = () => {
            console.log(`Session: Audio ended for segment ${index}`);
            this._handleSegmentEnd();
          };
          
          audioElement.onerror = (e) => {
            console.error(`Session: Audio error for segment ${index}:`, e);
          };
          
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
          index: index, 
          provider: voiceResult.provider 
        });

      } catch (error: any) {
        console.error(`Session: Failed to prefetch segment ${index}:`, error.message);
        
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
    console.log(`Session: Prefetch complete. ${this.segments.filter(s => s !== null).length} segments ready`);
  }

  play() {
    if (this._state.playState === 'playing') return;
    
    console.log(`Session: Playing segment ${this.currentSegmentIndex}`);
    
    if (this.currentSegmentIndex >= 0 && this.segments[this.currentSegmentIndex]) {
      const segment = this.segments[this.currentSegmentIndex];
      if (segment) {
        console.log(`Session: Playing segment ${this.currentSegmentIndex} with provider: ${segment.ttsProvider}`);
        
        // Handle different TTS providers
        if (segment.ttsProvider === 'elevenlabs' && segment.audio) {
          this.currentAudioElement = segment.audio;
          
          // Set up audio event handlers
          this.currentAudioElement.onended = () => {
            console.log(`Session: Segment ${this.currentSegmentIndex} audio ended`);
            this._handleSegmentEnd();
          };
          
          this.currentAudioElement.onerror = (error) => {
            console.error(`Session: Audio error for segment ${this.currentSegmentIndex}:`, error);
            // Fallback to browser TTS on audio error
            this._playWithBrowserTTS(segment.text);
          };
          
          this.currentAudioElement.play().catch(error => {
            console.error('Session: Audio play error:', error);
            this._playWithBrowserTTS(segment.text);
          });
        } else {
          // Use browser TTS
          this._playWithBrowserTTS(segment.text);
        }
        
        this._updateState({ playState: 'playing' });
        this._emit('play');
      }
    } else {
      console.log(`Session: No segment available at index ${this.currentSegmentIndex}, trying to prefetch...`);
      
      // Try to prefetch current segment if not available
      if (this.scriptPlan && this.scriptPlan.segments && this.scriptPlan.segments[this.currentSegmentIndex]) {
        this._prefetchSegments(this.currentSegmentIndex, 1).then(() => {
          // Retry playing after prefetch
          if (this.segments[this.currentSegmentIndex]) {
            this.play();
          }
        });
      }
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
    if (this.currentSegmentIndex < this.segments.length - 1) {
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
      
      this.currentSegmentIndex++;
      console.log(`Session: Advanced to segment ${this.currentSegmentIndex}`);
      
      this._updateState({ 
        currentSegmentIndex: this.currentSegmentIndex,
        currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id || null
      });
      
      if (this._state.playState === 'playing') {
        // Auto-continue playing next segment
        setTimeout(() => {
          this.play();
        }, 500);
      }
      
      // Prefetch next segments
      this._prefetchSegments(this.currentSegmentIndex + 1, AI.voice.preBufferSegments).catch(() => {
        // Continue without prefetch
      });
    } else {
      console.log('Session: Reached end of segments');
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
  
  private _handleSegmentEnd() {
    // Auto-advance to next segment when current segment finishes
    console.log(`Session: Segment ${this.currentSegmentIndex} ended, auto-advancing...`);
    
    if (this.autoPlayEnabled && this.currentSegmentIndex < this.segments.length - 1) {
      setTimeout(() => {
        this.next();
      }, 1000); // Brief pause between segments
    } else {
      console.log('Session: All segments completed or auto-play disabled');
      this._updateState({ playState: 'stopped' });
      this._emit('end');
    }
  }
  
  private _playWithBrowserTTS(text: string) {
    if (!window.speechSynthesis) {
      console.warn('Browser TTS not available');
      // Auto-advance after estimated duration if no TTS
      setTimeout(() => {
        this._handleSegmentEnd();
      }, text.length * 100); // Rough estimation: 100ms per character
      return;
    }

    console.log(`Session: Playing with browser TTS: ${text.substring(0, 50)}...`);

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.6; // Even slower for hypnotherapy
    utterance.pitch = 0.7; // Lower, more soothing
    utterance.volume = 0.9;

    // Find a suitable voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Karen') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Victoria') ||
      voice.name.includes('Moira') ||
      voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`Session: Using browser voice: ${preferredVoice.name}`);
    }

    utterance.onend = () => {
      console.log('Session: Browser TTS finished');
      this._handleSegmentEnd();
    };

    utterance.onerror = (event) => {
      if (event.error === 'interrupted') {
        console.debug('Browser TTS interrupted (normal when skipping/pausing):', event.error);
      } else {
        console.error('Browser TTS error:', event.error);
        // Continue to next segment even on error
        this._handleSegmentEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  setAutoPlay(enabled: boolean) {
    this.autoPlayEnabled = enabled;
    console.log(`Session: Auto-play ${enabled ? 'enabled' : 'disabled'}`);
  }
}
  setAutoPlay: (enabled: boolean) => void;