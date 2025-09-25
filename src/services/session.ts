```typescript
// src/services/session.ts

import { ScriptPlan, getSessionScript } from './gemini';
import { synthesizeSegment, AudioBlob } from './voice';
import { AI } from '../config/ai';

/**
 * Represents a single segment ready for playback, including its audio.
 */
export interface PlayableSegment {
  id: string;
  text: string;
  approxSec: number;
  audio: AudioBuffer | HTMLAudioElement; // Or a URL to the audio
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
  // Expose current state for UI consumption (e.g., via a store)
  getCurrentState(): {
    playState: 'playing' | 'paused' | 'stopped';
    currentSegmentId: string | null;
    bufferedAhead: number; // Number of segments buffered ahead
    error: Error | null;
  };
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

/**
 * Orchestrates the creation and playback of a hypnotherapy session.
 *
 * @param options - Options for the session.
 * @returns A promise that resolves to a SessionHandle.
 */
export async function startSession(options: StartSessionOptions): Promise<SessionHandle> {
  console.log('Session: Starting new session with options:', options);

  let scriptPlan: ScriptPlan;
  try {
    scriptPlan = await getSessionScript(options);
    console.log('Session: Script plan received:', scriptPlan);
  } catch (error) {
    console.error('Session: Failed to get script plan:', error);
    throw new Error('Failed to generate session script.');
  }

  const segments: PlayableSegment[] = [];
  let currentSegmentIndex = 0;
  let playState: 'playing' | 'paused' | 'stopped' = 'stopped';
  const eventListeners: { [key: string]: Function[] } = {};

  const emit = (event: string, ...args: any[]) => {
    eventListeners[event]?.forEach(listener => listener(...args));
  };

  const prefetchSegments = async (startIndex: number, count: number) => {
    for (let i = startIndex; i < Math.min(startIndex + count, scriptPlan.segments.length); i++) {
      const segment = scriptPlan.segments[i];
      if (!segments[i]) { // Only fetch if not already fetched
        try {
          const cacheKey = `${scriptPlan.hash}-${segment.id}-${AI.voice.defaultVoiceId}-${AI.voice.model}`;
          const audioBlob = await synthesizeSegment(segment.text, {
            voiceId: AI.voice.defaultVoiceId,
            model: AI.voice.model,
            cacheKey: cacheKey,
            mode: 'pre-gen' // Or 'live' if streaming is preferred
          });
          // For simplicity, we'll just store the blob. In a real app, you'd decode to AudioBuffer or create an AudioElement.
          segments[i] = { ...segment, audio: new Audio(URL.createObjectURL(audioBlob)) };
          console.log(`Session: Prefetched segment ${i}: ${segment.id}`);
          emit('segment-ready', segment.id);
        } catch (error) {
          console.error(`Session: Failed to prefetch segment ${i}:`, error);
          emit('error', new Error(`Failed to load audio for segment ${segment.id}`));
        }
      }
    }
  };

  // Initial prefetch
  await prefetchSegments(0, AI.voice.preBufferSegments);

  const handle: SessionHandle = {
    play: () => {
      if (playState === 'paused' || playState === 'stopped') {
        playState = 'playing';
        emit('play');
        // TODO: Implement actual audio playback logic
        console.log('Session: Playing from segment', currentSegmentIndex);
        // Simulate playing and advancing
        setTimeout(() => {
          if (playState === 'playing') {
            currentSegmentIndex++;
            if (currentSegmentIndex < scriptPlan.segments.length) {
              prefetchSegments(currentSegmentIndex + AI.voice.preBufferSegments -1, 1); // Prefetch next one
              handle.play(); // Play next segment
            } else {
              playState = 'stopped';
              emit('end');
              console.log('Session: Playback ended.');
            }
          }
        }, (segments[currentSegmentIndex]?.approxSec || 10) * 1000); // Simulate segment duration
      }
    },
    pause: () => {
      if (playState === 'playing') {
        playState = 'paused';
        emit('pause');
        // TODO: Pause actual audio playback
        console.log('Session: Paused.');
      }
    },
    next: () => {
      if (currentSegmentIndex < scriptPlan.segments.length - 1) {
        currentSegmentIndex++;
        console.log('Session: Skipping to next segment:', currentSegmentIndex);
        // TODO: Stop current audio, start next
        if (playState === 'playing') handle.play();
      }
    },
    prev: () => {
      if (currentSegmentIndex > 0) {
        currentSegmentIndex--;
        console.log('Session: Skipping to previous segment:', currentSegmentIndex);
        // TODO: Stop current audio, start previous
        if (playState === 'playing') handle.play();
      }
    },
    dispose: () => {
      playState = 'stopped';
      // TODO: Clean up audio resources, stop all timers
      console.log('Session: Disposed.');
    },
    on: (event: string, listener: Function) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(listener);
    },
    getCurrentState: () => ({
      playState,
      currentSegmentId: scriptPlan.segments[currentSegmentIndex]?.id || null,
      bufferedAhead: segments.filter((s, i) => i > currentSegmentIndex && s).length,
      error: null, // TODO: Populate real errors
    }),
  };

  return handle;
}
```