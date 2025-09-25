@@ .. @@
   const handleUserInput = async (input: string) => {
     if (!input.trim()) return;

     const userMessage = { role: 'user' as const, content: input, timestamp: Date.now() };
     setConversation(prev => [...prev, userMessage]);
     setTextInput('');
     setIsThinking(true);

     try {
       const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
       if (!supabaseUrl) {
         throw new Error('Supabase URL not configured');
       }
       
       const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
       
       const response = await fetch(`${baseUrl}/functions/v1/ai-hypnosis`, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           message: input,
           sessionContext: {
             egoState: sessionConfig.egoState,
             phase: sessionState.scriptPlan ? 'active' : 'preparation',
             depth: Math.min(sessionState.currentSegmentIndex + 1, 5),
             breathing: 'inhale',
             userProfile: user,
             customProtocol: sessionConfig.customProtocol,
             goal: sessionConfig.goal,
             method: sessionConfig.method,
             conversationHistory: conversation.map(msg => ({
               role: msg.role === 'ai' ? 'assistant' : 'user',
               content: msg.content
             }))
           },
           requestType: 'guidance'
         })
       });

       const data = await response.json();
       
       if (data.response) {
+        console.log('Session: Received AI response');
         const aiMessage = { role: 'ai' as const, content: data.response, timestamp: Date.now() };
         setConversation(prev => [...prev, aiMessage]);
         
         if (isVoiceEnabled) {
           speakText(data.response);
         }
         
         // Auto-scroll to bottom after AI message
         setTimeout(() => {
           if (chatContainerRef.current) {
             chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
           }
         }, 100);
       }
     } catch (error) {
       console.error('AI conversation error:', error);
       const fallbackMessage = "I'm here with you. Continue breathing and trust the process.";
       const aiMessage = { role: 'ai' as const, content: fallbackMessage, timestamp: Date.now() };
       setConversation(prev => [...prev, aiMessage]);
       
       if (isVoiceEnabled) {
         speakText(fallbackMessage);
       }
       
       // Auto-scroll to bottom after fallback message
       setTimeout(() => {
         if (chatContainerRef.current) {
           chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
         }
       }, 100);
     } finally {
       setIsThinking(false);
     }
   };

   const speakText = (text: string) => {
     if (!synthRef.current || !isVoiceEnabled) return;

+    console.log(`Session: Speaking text: ${text.substring(0, 50)}...`);

     // Wait for any pending speech to finish if already speaking
     if (synthRef.current.speaking) {
-      console.log('[SPEECH] Already speaking, queuing next utterance');
+      console.log('Session: Already speaking, canceling previous and starting new');
+      synthRef.current.cancel();
+    }
+
+    // Wait a moment for cancel to take effect
+    setTimeout(() => {
+      if (!synthRef.current || !isVoiceEnabled) return;
+      
+      // Wait for voices to be available
+      const voices = synthRef.current.getVoices();
+      if (voices.length === 0) {
+        console.log('Session: Waiting for voices to load...');
+        synthRef.current.addEventListener('voiceschanged', () => speakText(text), { once: true });
+        return;
+      }

+      const utterance = new SpeechSynthesisUtterance(text);
+      utterance.rate = 0.6; // Slower for hypnotherapy
+      utterance.pitch = 0.7; // Lower, more soothing
+      utterance.volume = 0.9;

+      // Find the most soothing voice available
+      const preferredVoice = voices.find(voice => 
+        voice.name.includes('Female') || 
+        voice.name.includes('Samantha') ||
+        voice.name.includes('Karen') ||
+        voice.name.includes('Victoria') ||
+        voice.name.includes('Moira') ||
+        voice.lang.includes('en')
+      ) || voices[0];
+      
+      if (preferredVoice) {
+        utterance.voice = preferredVoice;
+        console.log('Session: Using voice:', preferredVoice.name);
+      }

+      utterance.onstart = () => {
+        console.log('Session: Speech started');
+      };

+      utterance.onend = () => {
+        console.log('Session: Speech ended');
+      };

+      utterance.onerror = (event) => {
+        console.error('Session: Speech synthesis error:', event.error);
+      };

+      synthRef.current.speak(utterance);
+    }, 100);
+  };
+
+  const toggleListening = async () => {
+    if (!recognitionRef.current || !isMicEnabled) {
+      console.warn('Session: Speech recognition not available');
       setTimeout(() => speakText(text), 500);
       return;
     }

-    // Wait for voices to be available
-    const voices = synthRef.current.getVoices();
-    if (voices.length === 0) {
-      console.log('Session: Waiting for voices to load...');
-      synthRef.current.addEventListener('voiceschanged', () => speakText(text), { once: true });
-      return;
+    try {
+      // Request microphone permission if needed
+      if (micPermission === 'prompt' || micPermission === 'checking') {
+        try {
+          await navigator.mediaDevices.getUserMedia({ audio: true });
+          setMicPermission('granted');
+        } catch (permError: any) {
+          console.error('Session: Microphone permission denied:', permError);
+          setMicPermission('denied');
+          showToast({
+            type: 'error',
+            message: 'Microphone access is required for voice input. Please allow microphone access and try again.'
+          });
+          return;
+        }
+      }
+
+      if (micPermission === 'denied') {
+        showToast({
+          type: 'error',
+          message: 'Microphone access denied. Please enable it in your browser settings.'
+        });
+        return;
+      }
+
+      // Stop any current speech before listening
+      if (synthRef.current) {
+        synthRef.cu
   }rrent.cancel();
+      }
+      
+      console.log('Session: Starting speech recognition');
+      recognitionRef.current.start();
+    } catch (error) {
+      console.error('Session: Error starting speech recognition:', error);
+      showToast({
+        type: 'error',
+        message: 'Could not start voice recognition. Please try again.'
+      });
     }

-    console.log('[SPEECH] Starting to speak:', text.substring(0, 50) + '...');

-    const utterance = new SpeechSynthesisUtterance(text);
-    utterance.rate = 0.6; // Slower for hypnotherapy
-    utterance.pitch = 0.7; // Lower, more soothing
-    utterance.volume = 0.9;

-    // Find the most soothing voice available
-    const preferredVoice = voices.find(voice => 
-      voice.name.includes('Female') || 
-      voice.name.includes('Samantha') ||
-      voice.name.includes('Karen') ||
-      voice.name.includes('Victoria') ||
-      voice.name.includes('Moira') ||
-      voice.lang.includes('en')
-    ) || voices[0];
-    
-    if (preferredVoice) {
-      utterance.voice = preferredVoice;
-      console.log('[SPEECH] Using voice:', preferredVoice.name);
-    }

-    utterance.onstart = () => {
-      console.log('[SPEECH] Speech started');
-    };

-    utterance.onend = () => {
-      console.log('[SPEECH] Speech ended');
-    };

-    utterance.onerror = (event) => {
-      console.error('[SPEECH] Speech synthesis error:', event.error);
-    };

-    utterance.onpause = () => {
-      console.log('[SPEECH] Speech paused');
-    };

-    utterance.onresume = () => {
-      console.log('[SPEECH] Speech resumed');
-    };

-    synthRef.current.speak(utterance);
   };

-  const toggleListening = async () => {
-    if (!recognitionRef.current || !isMicEnabled) {
-      console.warn('Session: Speech recognition not available');
-      return;
-    }

-    try {
-      // Request microphone permission if needed
-      if (micPermission === 'prompt' || micPermission === 'checking') {
-        try {
-          await navigator.mediaDevices.getUserMedia({ audio: true });
-          setMicPermission('granted');
-        } catch (permError: any) {
-          console.error('Session: Microphone permission denied:', permError);
-          setMicPermission('denied');
-          showToast({
-            type: 'error',
-            message: 'Microphone access is required for voice input. Please allow microphone access and try again.'
-          });
-          return;
-        }
-      }

-      if (micPermission === 'denied') {
-        showToast({
-          type: 'error',
-          message: 'Microphone access denied. Please enable it in your browser settings.'
-        });
-        return;
-      }

-      // Stop any current speech before listening
-      if (synthRef.current) {
-        synthRef.current.cancel();
-      }
-      
-      console.log('Session: Starting speech recognition');
-      recognitionRef.current.start();
-    } catch (error) {
-      console.error('Session: Error starting speech recognition:', error);
-      showToast({
-        type: 'error',
-        message: 'Could not start voice recognition. Please try again.'
-      });
-    }
-  };

   const handleSubmit = (e: React.FormEvent) => {