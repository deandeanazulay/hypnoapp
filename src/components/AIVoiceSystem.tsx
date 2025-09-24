import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Brain, Pause, Play } from 'lucide-react';

interface AIVoiceSystemProps {
  isActive: boolean;
  sessionType: 'unified' | 'integration';
  onStateChange: (state: any) => void;
}

interface SessionState {
  depth: number;
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest';
  phase: string;
  userResponse: string;
  aiResponse: string;
  isListening: boolean;
}

export default function AIVoiceSystem({ isActive, sessionType, onStateChange }: AIVoiceSystemProps) {
  const [sessionState, setSessionState] = useState<SessionState>({
    depth: 1,
    breathing: 'rest',
    phase: 'preparation',
    userResponse: '',
    aiResponse: '',
    isListening: false,
    isSpeaking: false
  });

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [conversation, setConversation] = useState<Array<{role: 'ai' | 'user', content: string, timestamp: number}>>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech systems
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          if (event.results[event.results.length - 1].isFinal) {
            handleUserSpeech(transcript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
          setSessionState(prev => ({ ...prev, isListening: false }));
        };
      }
    }
  }, []);

  // AI Response Generator
  const generateAIResponse = (userInput: string, currentState: SessionState) => {
    const responses = {
      unified: {
        preparation: [
          "Perfect. I can sense your readiness. Let's begin this journey together by finding your natural breathing rhythm.",
          "Good. I feel your presence here with me. We'll start with breathing, then explore deeper.",
          "Excellent. Your energy is calm and focused. I'll guide you through breathing, then we'll work on what matters most to you."
        ],
        deepening: [
          "I can feel you going deeper now. Your breathing is natural and relaxed. What would you like to work on?",
          "That's it. You're doing beautifully. Now, tell me what's been on your mind lately.",
          "Perfect. I sense you're ready to explore. What belief or feeling would you like to transform?"
        ],
        trance: [
          "You're in a beautiful state now. Your subconscious mind is open and receptive. Let's work with what you've shared.",
          "Wonderful. I can feel your deep relaxation. Your mind is perfectly calm and focused. I sense some resistance here - that's normal.",
          "Excellent depth. Your inner wisdom is now fully accessible. Feel how this new understanding settles into your being."
        ],
        exploration: [
          "I sense some resistance here. That's completely normal. What comes up for you when I say that?",
          "Your energy shifted just then. Tell me what you're experiencing in your body right now.",
          "I feel you connecting with something important. Share what's arising - there's no judgment here."
        ],
        processing: [
          "That's a powerful insight. How does that feel in your body right now? Notice any changes.",
          "I can sense the shift happening. You're doing incredible work. Let's anchor this new feeling.",
          "Beautiful. Your subconscious is releasing what no longer serves you. Breathe into this new space."
        ],
        integration: [
          "Feel how this new understanding settles into every cell of your being. It's becoming part of you.",
          "Perfect. This transformation is now part of who you are. Notice how different you feel.",
          "Excellent. You're integrating this change at the deepest level. This is your new normal."
        ]
      },
      integration: {
        completion: [
          "Feel how this new understanding settles into every cell of your being.",
          "Perfect. This transformation is now part of who you are.",
          "Excellent. You're integrating this change at the deepest level."
        ]
      }
    };

    const sessionResponses = responses[sessionType];
    if (!sessionResponses) {
      return "I'm here with you. Continue to breathe and trust the process.";
    }
    
    const currentResponses = sessionResponses[currentState.phase as keyof typeof sessionResponses];
    
    if (Array.isArray(currentResponses)) {
      return currentResponses[Math.floor(Math.random() * currentResponses.length)];
    }
    
    return "I'm here with you. Continue to breathe and trust the process.";
  };

  // Handle user speech input
  const handleUserSpeech = (transcript: string) => {
    const timestamp = Date.now();
    setConversation(prev => [...prev, { role: 'user', content: transcript, timestamp }]);
    
    // Generate AI response
    const aiResponse = generateAIResponse(transcript, sessionState);
    
    setTimeout(() => {
      setConversation(prev => [...prev, { role: 'ai', content: aiResponse, timestamp: timestamp + 1000 }]);
      if (isVoiceEnabled) {
        speakText(aiResponse);
      }
    }, 1000);

    setSessionState(prev => ({ 
      ...prev, 
      userResponse: transcript,
      aiResponse: aiResponse,
      isListening: false 
    }));
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if (!synthRef.current || !isVoiceEnabled) return;

    // Stop any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 0.9;
    utterance.volume = 0.8;

    // Find a calm, soothing voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setSessionState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      setSessionState(prev => ({ ...prev, isSpeaking: false }));
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (sessionState.isListening) {
      recognitionRef.current.stop();
      setSessionState(prev => ({ ...prev, isListening: false }));
    } else {
      recognitionRef.current.start();
      setSessionState(prev => ({ ...prev, isListening: true }));
    }
  };

  // Session progression
  useEffect(() => {
    if (!isActive) return;

    // Proper breathing cycle: 4s inhale, 4s hold, 6s exhale, 2s rest = 16s total
    const breathingDurations = {
      'inhale': 4000,  // 4 seconds
      'hold': 4000,    // 4 seconds  
      'exhale': 6000,  // 6 seconds
      'rest': 2000     // 2 seconds
    };

    let breathingTimer: NodeJS.Timeout;
    let isCleanedUp = false;
    
    const cycleBreathing = (currentBreathing: typeof sessionState.breathing) => {
      if (isCleanedUp) return;
      
      const duration = breathingDurations[currentBreathing];
      
      breathingTimer = setTimeout(() => {
        if (isCleanedUp) return;
        
        setSessionState(prev => {
          const breathingCycle = ['inhale', 'hold', 'exhale', 'rest'] as const;
          const currentIndex = breathingCycle.indexOf(currentBreathing);
          const nextBreathing = breathingCycle[(currentIndex + 1) % breathingCycle.length];
          
          // Progress depth based on session type (slower, more realistic)
          let newDepth = prev.depth;
          if (sessionType === 'unified' && Math.random() > 0.95) {
            newDepth = Math.min(prev.depth + 0.02, 5);
          }
          
          // Update phase based on depth and time
          let newPhase = prev.phase;
          if (newDepth > 1.5 && prev.phase === 'preparation') {
            newPhase = 'deepening';
          } else if (newDepth > 2.5 && prev.phase === 'deepening') {
            newPhase = 'exploration';
          } else if (newDepth > 3.5 && prev.phase === 'exploration') {
            newPhase = 'trance';
          } else if (newDepth > 4 && prev.phase === 'trance') {
            newPhase = 'integration';
          }

          const newState = {
            ...prev,
            breathing: nextBreathing,
            depth: newDepth,
            phase: newPhase
          };

          onStateChange(newState);
          
          // Schedule next cycle
          cycleBreathing(nextBreathing);
          
          return newState;
        });
      }, duration);
    };

    // Start the breathing cycle
    cycleBreathing(sessionState.breathing);

    return () => {
      isCleanedUp = true;
      if (breathingTimer) {
        clearTimeout(breathingTimer);
      }
    };
  }, [isActive, sessionType, onStateChange]);

  // Auto-start AI guidance
  useEffect(() => {
    if (isActive && conversation.length === 0) {
      setTimeout(() => {
        const welcomeMessage = sessionType === 'unified' 
          ? "Welcome. I'm here to guide you through a complete journey - breathing, deepening, and transformation. Are you ready to begin?"
          : "Feel how this new understanding settles into every cell of your being.";
        
        setConversation([{ role: 'ai', content: welcomeMessage, timestamp: Date.now() }]);
        if (isVoiceEnabled) {
          speakText(welcomeMessage);
        }
      }, 2000);
    }
  }, [isActive, sessionType, isVoiceEnabled]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      {/* Conversation Display */}
      {conversation.length > 0 && (
        <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-2 mb-2 max-h-16 overflow-y-auto border border-white/20">
          {conversation.slice(-2).map((msg, i) => (
            <div key={i} className={`mb-0.5 last:mb-0 ${msg.role === 'ai' ? 'text-teal-400' : 'text-white'}`}>
              <div className="flex items-center space-x-1 mb-0.5">
                {msg.role === 'ai' ? <Brain size={12} /> : <MessageCircle size={12} />}
                <span className="text-xs opacity-50">
                  {msg.role === 'ai' ? 'AI Guide' : 'You'}
                </span>
              </div>
              <p className="text-xs leading-tight">{msg.content}</p>
            </div>
          ))}
        </div>
      )}

              <div className="flex items-center space-x-0.5 px-1">
    </div>
  );
}