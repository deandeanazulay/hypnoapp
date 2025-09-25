@@ .. @@
   private async _prefetchSegments(startIndex: number, count: number) {
     const segmentsToPrefetch = [];
     for (let i = startIndex; i < Math.min(startIndex + count, this.scriptPlan!.segments.length); i++) {
       if (!this.segments[i]) {
         segmentsToPrefetch.push({ index: i, segment: this.scriptPlan!.segments[i] });
       }
     }

     if (segmentsToPrefetch.length === 0) return;

+    console.log(`Session: Prefetching ${segmentsToPrefetch.length} segments starting from ${startIndex}`);

     await Promise.all(segmentsToPrefetch.map(async ({ index, segment }) => {
       try {
-        const voiceId = AI.voice.defaultVoiceId;
-        const voiceModel = AI.voice.model;
-        const cacheKey = `${this.scriptPlan!.title || 'script'}-${segment.id}-${voiceId}-${voiceModel}`;
         const voiceResult = await synthesizeSegment(segment.text, {
-          voiceId: voiceId,
-          model: voiceModel,
-          cacheKey: cacheKey,
+          voiceId: AI.voice.defaultVoiceId,
+          model: AI.voice.model,
+          cacheKey: `${this.scriptPlan!.title || 'script'}-${segment.id}`,
           mode: 'pre-gen'
         });

+        console.log(`Session: Segment ${index} (${segment.id}) synthesized with provider: ${voiceResult.provider}`);

         // Handle different TTS providers
-        let audioElement: HTMLAudioElement | null = null;
+        let playableSegment: PlayableSegment;
         
         if (voiceResult.provider === 'elevenlabs' && voiceResult.audioUrl) {
-          audioElement = new Audio(voiceResult.audioUrl);
-        }
-        
-        this.segments[index] = { 
-          ...segment, 
-          audio: audioElement,
-          ttsProvider: voiceResult.provider,
-          ttsError: voiceResult.error
-        };
+          const audioElement = new Audio(voiceResult.audioUrl);
+          
+          // Preload the audio
+          audioElement.preload = 'auto';
+          
+          // Handle audio events
+          audioElement.onended = () => {
+            console.log(`Session: Audio ended for segment ${index}`);
+            this._handleSegmentEnd();
+          };
+          
+          audioElement.onerror = (e) => {
+            console.error(`Session: Audio error for segment ${index}:`, e);
+          };
+          
+          playableSegment = {
+            id: segment.id,
+            text: segment.text,
+            approxSec: segment.approxSec || 30,
+            audio: audioElement,
+            ttsProvider: 'elevenlabs'
+          };
+        } else {
+          // Browser TTS or no audio
+          playableSegment = {
+            id: segment.id,
+            text: segment.text,
+            approxSec: segment.approxSec || 30,
+            audio: null,
+            ttsProvider: voiceResult.provider
+          };
+        }
+        
+        this.segments[index] = playableSegment;
         
-        if (import.meta.env.DEV) {
-          console.log('Session: Prefetched segment', index, ':', segment.id, 'provider:', voiceResult.provider);
-        }
         this._emit('segment-ready', segment.id);
         track('segment_buffered', { 
           segmentId: segment.id, 
           index: index, 
           provider: voiceResult.provider 
         });

       } catch (error: any) {
-        if (import.meta.env.DEV) {
-          console.error('Session: Failed to prefetch segment', index, ':', error);
-        }
+        console.error(`Session: Failed to prefetch segment ${index}:`, error.message);
         
         // Don't fail the entire session - create a text-only segment
-        this.segments[index] = { 
-          ...segment, 
+        this.segments[index] = {
+          id: segment.id,
+          text: segment.text,
+          approxSec: segment.approxSec || 30,
           audio: null,
-          ttsProvider: 'browser-tts', // Default to browser TTS fallback
-          ttsError: error.message
+          ttsProvider: 'browser-tts'
         };
         
         track('segment_buffer_error', { segmentId: segment.id, error: error.message });
       }
     }));

     this._updateState({ bufferedAhead: this.segments.filter(s => s !== null).length - this.currentSegmentIndex - 1 });
+    console.log(`Session: Prefetch complete. ${this.segments.filter(s => s !== null).length} segments ready`);
   }

   play() {
     if (this._state.playState === 'playing') return;
     
     if (this.currentSegmentIndex >= 0 && this.segments[this.currentSegmentIndex]) {
       const segment = this.segments[this.currentSegmentIndex];
       if (segment) {
+        console.log(`Session: Playing segment ${this.currentSegmentIndex} with provider: ${segment.ttsProvider}`);
+        
         // Handle different TTS providers
-        if (segment.audio && segment.ttsProvider === 'elevenlabs') {
+        if (segment.ttsProvider === 'elevenlabs' && segment.audio) {
           this.currentAudioElement = segment.audio;
-          this.currentAudioElement.play();
-        } else if (segment.ttsProvider === 'browser-tts' || segment.ttsProvider === 'none') {
+          this.currentAudioElement.play().catch(error => {
+            console.error('Session: Audio play error:', error);
+            this._playWithBrowserTTS(segment.text);
+          });
+        } else {
           // Use browser TTS
-          this.playWithBrowserTTS(segment.text);
+          this._playWithBrowserTTS(segment.text);
         }
+        
         this._updateState({ playState: 'playing' });
         this._emit('play');
       }
     }
   }

   pause() {
     if (this._state.playState === 'paused') return;
     
     if (this.currentAudioElement) {
       this.currentAudioElement.pause();
     }
+    
+    // Stop browser TTS if active
+    if (window.speechSynthesis) {
+      window.speechSynthesis.pause();
+    }
+    
     this._updateState({ playState: 'paused' });
     this._emit('pause');
   }

   next() {
     if (this.currentSegmentIndex < this.segments.length - 1) {
+      // Stop current audio
+      if (this.currentAudioElement) {
+        this.currentAudioElement.pause();
+        this.currentAudioElement = null;
+      }
+      if (window.speechSynthesis) {
+        window.speechSynthesis.cancel();
+      }
+      
       this.currentSegmentIndex++;
       this._updateState({ 
         currentSegmentIndex: this.currentSegmentIndex,
         currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id 
       });
       
       if (this._state.playState === 'playing') {
         this.play();
       }
+      
+      // Prefetch next segments
+      this._prefetchSegments(this.currentSegmentIndex + 1, AI.voice.preBufferSegments).catch(() => {
+        // Continue without prefetch
+      });
     }
   }

   prev() {
     if (this.currentSegmentIndex > 0) {
+      // Stop current audio
+      if (this.currentAudioElement) {
+        this.currentAudioElement.pause();
+        this.currentAudioElement = null;
+      }
+      if (window.speechSynthesis) {
+        window.speechSynthesis.cancel();
+      }
+      
       this.currentSegmentIndex--;
       this._updateState({ 
         currentSegmentIndex: this.currentSegmentIndex,
         currentSegmentId: this.scriptPlan!.segments[this.currentSegmentIndex]?.id 
       });
       
       if (this._state.playState === 'playing') {
         this.play();
       }
     }
   }

   dispose() {
+    console.log('Session: Disposing session manager');
+    
     if (this.currentAudioElement) {
       this.currentAudioElement.pause();
+      this.currentAudioElement.src = '';
       this.currentAudioElement = null;
     }
     
     // Stop any browser TTS
     if (window.speechSynthesis) {
       window.speechSynthesis.cancel();
     }
     
+    // Clean up audio URLs to prevent memory leaks
+    this.segments.forEach(segment => {
+      if (segment?.audio?.src) {
+        URL.revokeObjectURL(segment.audio.src);
+      }
+    });
+    
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
   
-  private playWithBrowserTTS(text: string) {
+  private _handleSegmentEnd() {
+    // Auto-advance to next segment when current segment finishes
+    setTimeout(() => {
+      if (this.currentSegmentIndex < this.segments.length - 1) {
+        this.next();
+      } else {
+        this._updateState({ playState: 'stopped' });
+        this._emit('end');
+      }
+    }, 500);
+  }
+  
+  private _playWithBrowserTTS(text: string) {
     if (!window.speechSynthesis) {
       console.warn('Browser TTS not available');
       return;
     }

+    console.log(`Session: Playing with browser TTS: ${text.substring(0, 50)}...`);

     // Stop any current speech
     window.speechSynthesis.cancel();

     const utterance = new SpeechSynthesisUtterance(text);
-    utterance.rate = 0.7;
-    utterance.pitch = 0.8;
+    utterance.rate = 0.6; // Even slower for hypnotherapy
+    utterance.pitch = 0.7; // Lower, more soothing
     utterance.volume = 0.9;

     // Find a suitable voice
     const voices = speechSynthesis.getVoices();
     const preferredVoice = voices.find(voice => 
       voice.name.includes('Female') || 
       voice.name.includes('Karen') ||
       voice.name.includes('Samantha') ||
+      voice.name.includes('Victoria') ||
+      voice.name.includes('Moira') ||
       voice.lang.includes('en')
     ) || voices[0];
     
     if (preferredVoice) {
       utterance.voice = preferredVoice;
+      console.log(`Session: Using browser voice: ${preferredVoice.name}`);
     }

     utterance.onend = () => {
-      // Auto-advance to next segment when browser TTS finishes
-      setTimeout(() => {
-        if (this.currentSegmentIndex < this.segments.length - 1) {
-          this.next();
-        } else {
-          this._updateState({ playState: 'stopped' });
-          this._emit('end');
-        }
-      }, 500);
+      console.log('Session: Browser TTS finished');
+      this._handleSegmentEnd();
     };

     utterance.onerror = (event) => {
       console.error('Browser TTS error:', event.error);
+      // Continue to next segment even on error
+      this._handleSegmentEnd();
     };

     window.speechSynthesis.speak(utterance);
   }
 }