import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, Mic, MicOff, Send, MessageCircle, Brain, Loader } from 'lucide-react';
import Orb from './Orb';
import GlassCard from './ui/GlassCard';
import { useGameState } from './GameStateManager';
import { useAppStore, getEgoState } from '../store';
import { getEgoColor } from '../config/theme';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { scriptGenerator } from '../utils/scriptGenerator';
import { HypnosisProtocol } from '../data/protocols';

interface SessionConfig {
  egoState: string;
  action?: any;
  protocol?: any;
  type: 'unified' | 'protocol' | 'favorite';
  customProtocol?: any;
  goal?: any;
  method?: any;
  duration?: number;
}

interface UnifiedSessionWorldProps {
  onComplete: () => void;
  onCancel: () => void;
  sessionConfig: SessionConfig;
}

interface SessionState {
  depth: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale';
  phase: string;
  isListening: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  timeElapsed: number;
  totalDuration: number;
  breathingCount: number;
  breathingCycle: number;
}

export default function UnifiedSessionWorld({ onComplete, onCancel, sessionConfig }: UnifiedSessionWorldProps) {
  const { user, updateUser, addExperience, incrementStreak } = useGameState();
  const { activeEgoState, showToast, openEgoModal } = useAppStore();
  const { isAuthenticated } = useSimpleAuth();
  
  const [sessionState, setSessionState] = useState<SessionState>({
    depth: 1,
    breathing: 'inhale',
    phase: 'preparation',
    isListening: false,
    isSpeaking: false,
    isPaused: false,
    timeElapsed: 0,
    totalDuration: sessionConfig.customProtocol?.duration * 60 || 15 * 60,
    breathingCount: 4,
    breathingCycle: 1
  });

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'ai' | 'user', content: string, timestamp: number}>>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatHeight, setChatHeight] = useState(80); // Default chat height in pixels
  const [autoProgressEnabled, setAutoProgressEnabled] = useState(true);
  const [currentScriptPhase, setCurrentScriptPhase] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scriptProgressRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');

  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  // Initialize speech systems
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      // Check microphone permission first
      try {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(permission.state);
        
        permission.onchange = () => {
          setMicPermission(permission.state);
        };
      } catch (error) {
        console.log('Permission API not available, will request on first use');
        setMicPermission('prompt');
      }

      // Initialize speech synthesis
      if (typeof window !== 'undefined') {
        synthRef.current = window.speechSynthesis;
        
        // Wait for voices to load
        if (synthRef.current.getVoices().length === 0) {
          synthRef.current.addEventListener('voiceschanged', () => {
            console.log('Speech synthesis voices loaded');
          });
        }
      }

      // Initialize speech recognition
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 1;

          recognitionRef.current.onstart = () => {
            console.log('Speech recognition started');
            setSessionState(prev => ({ ...prev, isListening: true }));
          };

          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Speech recognized:', transcript);
            handleUserInput(transcript);
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setSessionState(prev => ({ ...prev, isListening: false }));
            
            // Handle specific errors
            if (event.error === 'not-allowed') {
              setMicPermission('denied');
              showToast({ 
                type: 'error', 
                message: 'Microphone access denied. Please enable it in your browser settings.' 
              });
            } else if (event.error === 'no-speech') {
              showToast({ 
                type: 'warning', 
                message: 'No speech detected. Try speaking closer to your microphone.' 
              });
            }
          };

          recognitionRef.current.onend = () => {
            console.log('Speech recognition ended');
            setSessionState(prev => ({ ...prev, isListening: false }));
          };

          console.log('Speech recognition initialized successfully');
        } catch (error) {
          console.error('Failed to initialize speech recognition:', error);
        }
      } else {
        console.warn('Speech recognition not supported in this browser');
        setMicPermission('denied');
      }
    };

    initializeSpeechRecognition();
  }, [showToast]);

  // Auto-start session
  useEffect(() => {
    if (conversation.length === 0) {
      setTimeout(() => {
        startHypnotherapySession();
      }, 2000);
    }
  }, [sessionConfig, isVoiceEnabled]);

  // Auto-progression for hypnotherapy protocols
  useEffect(() => {
    const hasProtocol = sessionConfig.protocol || sessionConfig.customProtocol || sessionConfig.method?.protocol;
    if (autoProgressEnabled && hasProtocol && conversation.length > 0) {
      console.log('[SESSION] Starting auto-guided progression');
      startScriptProgression();
    }
    
    return () => {
      if (scriptProgressRef.current) {
        clearTimeout(scriptProgressRef.current);
      }
    };
  }, [autoProgressEnabled, sessionConfig.protocol, sessionConfig.customProtocol, sessionConfig.method?.protocol, conversation.length]);

  const startHypnotherapySession = () => {
    let welcomeMessage = '';
    let sessionContext = {
      egoState: sessionConfig.egoState,
      userProfile: {
        experience_level: 'some' as const,
        preferred_imagery: 'nature' as const,
        voice_tone: 'gentle' as const
      },
      customGoals: sessionConfig.goal ? [sessionConfig.goal.name] : undefined
    };
    
    if (sessionConfig.protocol) {
      // This is a protocol session - start with induction
      const protocol = sessionConfig.protocol;
      const personalizedProtocol = scriptGenerator.generatePersonalizedScript(protocol, sessionContext);
      
      welcomeMessage = `Welcome to your ${protocol.name} session. Find a comfortable position and close your eyes when you're ready. We'll begin with some deep, calming breaths.`;
      
      // Set session state for protocol
      setSessionState(prev => ({ 
        ...prev, 
        phase: 'preparation',
        totalDuration: protocol.duration * 60 
      }));
      
    } else if (sessionConfig.customProtocol?.name) {
      // Generate personalized script for custom protocol
      const personalizedProtocol = scriptGenerator.generatePersonalizedScript(
        sessionConfig.customProtocol,
        sessionContext
      );
      welcomeMessage = `Welcome to your custom ${sessionConfig.customProtocol.name} session. Find a comfortable position and prepare for transformation.`;
      
    } else if (sessionConfig.method?.protocol) {
      // Use the selected method's protocol with personalization
      const personalizedProtocol = scriptGenerator.generatePersonalizedScript(
        sessionConfig.method.protocol,
        sessionContext
      );
      welcomeMessage = `Welcome to your ${sessionConfig.method.protocol.name} session. Let's begin your transformation journey.`;
      
    } else {
      // Interactive session - requires user input
      welcomeMessage = `Welcome to your ${sessionConfig.egoState} session. I'm Libero, and I'll be guiding you through this transformation journey. Take a deep breath and let me know - what would you like to work on today?`;
      setAutoProgressEnabled(false); // Disable auto-progression for interactive sessions
    }
    
    const aiMessage = { role: 'ai' as const, content: welcomeMessage, timestamp: Date.now() };
    setConversation([aiMessage]);
    
    if (isVoiceEnabled) {
      speakText(welcomeMessage);
    }
  };

  const startScriptProgression = () => {
    const protocol = sessionConfig.protocol || sessionConfig.customProtocol || sessionConfig.method?.protocol;
    if (!protocol) {
      console.log('[SESSION] No protocol found for auto-progression');
      return;
    }

    console.log('[SESSION] Starting script progression for protocol:', protocol.name);

    const sessionContext = {
      egoState: sessionConfig.egoState,
      userProfile: {
        experience_level: 'some' as const,
        preferred_imagery: 'nature' as const,
        voice_tone: 'gentle' as const
      },
      customGoals: sessionConfig.goal ? [sessionConfig.goal.name] : undefined
    };

    const personalizedProtocol = scriptGenerator.generatePersonalizedScript(protocol, sessionContext);
    const scriptPhases = [
      { 
        name: 'induction', 
        content: personalizedProtocol.script.induction, 
        duration: Math.floor(protocol.duration * 0.25),
        phase: 'induction'
      },
      { 
        name: 'deepening', 
        content: personalizedProtocol.script.deepening, 
        duration: Math.floor(protocol.duration * 0.3),
        phase: 'deepening'
      },
      { 
        name: 'suggestions', 
        content: personalizedProtocol.script.suggestions, 
        duration: Math.floor(protocol.duration * 0.35),
        phase: 'transformation'
      },
      { 
        name: 'emergence', 
        content: personalizedProtocol.script.emergence, 
        duration: Math.floor(protocol.duration * 0.1),
        phase: 'completion'
      }
    ];

    const progressToNextPhase = (phaseIndex: number) => {
      if (phaseIndex >= scriptPhases.length) {
        console.log('[SESSION] All phases completed, ending session');
        handleSessionComplete();
        return;
      }

      const currentPhase = scriptPhases[phaseIndex];
      console.log('[SESSION] Progressing to phase:', currentPhase.name, 'duration:', currentPhase.duration, 'minutes');
      
      // Update session state
      setSessionState(prev => ({ 
        ...prev, 
        phase: currentPhase.phase,
        depth: Math.min(phaseIndex + 1, 5)
      }));
      
      // Add AI message for this phase
      const aiMessage = { 
        role: 'ai' as const, 
        content: currentPhase.content, 
        timestamp: Date.now() 
      };
      setConversation(prev => [...prev, aiMessage]);
      
      // Speak the content
      if (isVoiceEnabled) {
        speakText(currentPhase.content);
      }
      
      // Schedule next phase
      scriptProgressRef.current = setTimeout(() => {
        console.log('[SESSION] Timer fired for phase:', currentPhase.name);
        progressToNextPhase(phaseIndex + 1);
      }, currentPhase.duration * 60 * 1000); // Convert minutes to milliseconds
    };

    // Start the progression after initial welcome
    console.log('[SESSION] Starting phase progression in 5 seconds');
    setTimeout(() => {
      progressToNextPhase(0);
    }, 5000); // Give 5 seconds after welcome message
  };

  // Breathing cycle management
  useEffect(() => {
    const startBreathingTimer = () => {
      breathingTimerRef.current = setInterval(() => {
        setSessionState(prev => {
          // Don't update if paused
          if (prev.isPaused) return prev;
          
          let newCount = prev.breathingCount - 1;
          let newBreathing = prev.breathing;
          let newCycle = prev.breathingCycle;

          if (newCount <= 0) {
            // Move to next breathing phase
            switch (prev.breathing) {
              case 'inhale':
                newBreathing = 'hold-inhale';
                newCount = 4; // Hold for 4 seconds
                break;
              case 'hold-inhale':
                newBreathing = 'exhale';
                newCount = 6; // Exhale for 6 seconds
                break;
              case 'exhale':
                newBreathing = 'hold-exhale';
                newCount = 4; // Hold empty for 4 seconds
                break;
              case 'hold-exhale':
                newBreathing = 'inhale';
                newCount = 4; // Inhale for 4 seconds
                newCycle = prev.breathingCycle + 1;
                break;
              default:
                // Reset to inhale if somehow in invalid state
                newBreathing = 'inhale';
                newCount = 4;
                break;
            }
          }

          return {
            ...prev,
            breathingCount: newCount,
            breathing: newBreathing,
            breathingCycle: newCycle
          };
        });
      }, 1000);
    };

    // Clear any existing timer first
    if (breathingTimerRef.current) {
      clearInterval(breathingTimerRef.current);
      breathingTimerRef.current = null;
    }

    // Start timer if not paused
    if (!sessionState.isPaused) {
      startBreathingTimer();
    }

    return () => {
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
        breathingTimerRef.current = null;
      }
    };
  }, [sessionState.isPaused]);
  // Timer
  useEffect(() => {
    if (!sessionState.isPaused) {
      timerRef.current = setInterval(() => {
        setSessionState(prev => {
          const newElapsed = prev.timeElapsed + 1;
          if (newElapsed >= prev.totalDuration) {
            handleSessionComplete();
            return prev;
          }
          return { ...prev, timeElapsed: newElapsed };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
      }
      if (scriptProgressRef.current) {
        clearTimeout(scriptProgressRef.current);
      }
    };
  }, [sessionState.isPaused]);

  // Update orb state
  useEffect(() => {
    if (orbRef.current) {
      orbRef.current.updateState(sessionState);
      orbRef.current.setSpeaking(sessionState.isSpeaking);
      orbRef.current.setListening(sessionState.isListening);
    }
  }, [sessionState]);

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
            phase: sessionState.phase,
            depth: sessionState.depth,
            breathing: sessionState.breathing,
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
        const aiMessage = { role: 'ai' as const, content: data.response, timestamp: Date.now() };
        setConversation(prev => [...prev, aiMessage]);
        
        if (data.sessionUpdates && Object.keys(data.sessionUpdates).length > 0) {
          setSessionState(prev => ({ ...prev, ...data.sessionUpdates }));
        }
        
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

    // Only cancel if not currently speaking important content
    if (synthRef.current.speaking && !sessionState.isSpeaking) {
      synthRef.current.cancel();
    }

    // Wait for any pending speech to finish if already speaking
    if (synthRef.current.speaking) {
      console.log('[SPEECH] Already speaking, queuing next utterance');
      setTimeout(() => speakText(text), 500);
      return;
    }

    // Wait for voices to be available
    const voices = synthRef.current.getVoices();
    if (voices.length === 0) {
      console.log('[SPEECH] Waiting for voices to load...');
      synthRef.current.addEventListener('voiceschanged', () => speakText(text), { once: true });
      return;
    }

    console.log('[SPEECH] Starting to speak:', text.substring(0, 50) + '...');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.6; // Slower for hypnotherapy
    utterance.pitch = 0.7; // Lower, more soothing
    utterance.volume = 0.9;

    // Find the most soothing voice available
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.name.includes('Victoria') ||
      voice.name.includes('Moira') ||
      voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('[SPEECH] Using voice:', preferredVoice.name);
    }

    utterance.onstart = () => {
      console.log('[SPEECH] Speech started');
      setSessionState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      console.log('[SPEECH] Speech ended');
      setSessionState(prev => ({ ...prev, isSpeaking: false }));
    };

    utterance.onerror = (event) => {
      console.error('[SPEECH] Speech synthesis error:', event.error);
      setSessionState(prev => ({ ...prev, isSpeaking: false }));
    };

    utterance.onpause = () => {
      console.log('[SPEECH] Speech paused');
    };

    utterance.onresume = () => {
      console.log('[SPEECH] Speech resumed');
    };

    synthRef.current.speak(utterance);
  };

  const toggleListening = async () => {
    if (!recognitionRef.current || !isMicEnabled) return;

    if (sessionState.isListening) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
    } else {
      try {
        // Request microphone permission if needed
        if (micPermission === 'prompt' || micPermission === 'checking') {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission('granted');
          } catch (permError: any) {
            console.error('Microphone permission denied:', permError);
            setMicPermission('denied');
            showToast({
              type: 'error',
              message: 'Microphone access is required for voice input. Please allow microphone access and try again.'
            });
            return;
          }
        }

        if (micPermission === 'denied') {
          showToast({
            type: 'error',
            message: 'Microphone access denied. Please enable it in your browser settings.'
          });
          return;
        }

        // Stop any current speech before listening
        if (synthRef.current) {
          synthRef.current.cancel();
          setSessionState(prev => ({ ...prev, isSpeaking: false }));
        }
        
        console.log('Starting speech recognition');
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        showToast({
          type: 'error',
          message: 'Could not start voice recognition. Please try again.'
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isThinking) {
      handleUserInput(textInput.trim());
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartHeight(chatHeight);
    
    document.body.style.userSelect = 'none';
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY - clientY; // Positive when dragging up
    const newHeight = Math.max(80, Math.min(400, dragStartHeight + deltaY));
    
    setChatHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, dragStartY, dragStartHeight]);

  const handleSessionComplete = () => {
    if (user) {
      addExperience(20);
      incrementStreak();
      updateUser({
        daily_sessions_used: user.daily_sessions_used + 1
      });
    }
    
    showToast({ type: 'success', message: 'Session completed! +20 XP earned.' });
    onComplete();
  };

  const togglePause = () => {
    const newPausedState = !sessionState.isPaused;
    setSessionState(prev => ({ ...prev, isPaused: newPausedState }));
    
    // Handle speech pause/resume properly
    if (synthRef.current) {
      if (newPausedState) {
        console.log('[SESSION] Pausing speech and timers');
        synthRef.current.pause();
        // Pause any script progression
        if (scriptProgressRef.current) {
          clearTimeout(scriptProgressRef.current);
        }
      } else {
        console.log('[SESSION] Resuming speech and timers');
        synthRef.current.resume();
        // Resume script progression if it was active
        if (autoProgressEnabled) {
          // Calculate remaining time and continue
          const protocol = sessionConfig.protocol || sessionConfig.customProtocol || sessionConfig.method?.protocol;
          if (protocol) {
            console.log('[SESSION] Resuming auto-progression after pause');
            // Continue from current phase
            continueScriptProgression();
          }
        }
      }
    }
  };

  const continueScriptProgression = () => {
    // Resume script progression from current state
    const protocol = sessionConfig.protocol || sessionConfig.customProtocol || sessionConfig.method?.protocol;
    if (!protocol) return;

    const sessionContext = {
      egoState: sessionConfig.egoState,
      userProfile: {
        experience_level: 'some' as const,
        preferred_imagery: 'nature' as const,
        voice_tone: 'gentle' as const
      },
      customGoals: sessionConfig.goal ? [sessionConfig.goal.name] : undefined
    };

    const personalizedProtocol = scriptGenerator.generatePersonalizedScript(protocol, sessionContext);
    
    // Determine current phase and continue from there
    const timeElapsed = sessionState.timeElapsed;
    const totalDuration = protocol.duration * 60;
    const progress = timeElapsed / totalDuration;
    
    let nextPhaseIndex = 0;
    let timeUntilNext = 0;
    
    if (progress < 0.25) {
      nextPhaseIndex = 1; // deepening
      timeUntilNext = (totalDuration * 0.25) - timeElapsed;
    } else if (progress < 0.55) {
      nextPhaseIndex = 2; // suggestions  
      timeUntilNext = (totalDuration * 0.55) - timeElapsed;
    } else if (progress < 0.9) {
      nextPhaseIndex = 3; // emergence
      timeUntilNext = (totalDuration * 0.9) - timeElapsed;
    } else {
      // Session should end soon
      handleSessionComplete();
      return;
    }
    
    if (timeUntilNext > 0) {
      scriptProgressRef.current = setTimeout(() => {
        progressToNextPhase(nextPhaseIndex);
      }, timeUntilNext * 1000);
    }
  };

  const progressToNextPhase = (phaseIndex: number) => {
    const protocol = sessionConfig.protocol || sessionConfig.customProtocol || sessionConfig.method?.protocol;
    if (!protocol) return;

    const sessionContext = {
      egoState: sessionConfig.egoState,
      userProfile: {
        experience_level: 'some' as const,
        preferred_imagery: 'nature' as const,
        voice_tone: 'gentle' as const
      },
      customGoals: sessionConfig.goal ? [sessionConfig.goal.name] : undefined
    };

    const personalizedProtocol = scriptGenerator.generatePersonalizedScript(protocol, sessionContext);
    
    const scriptPhases = [
      { 
        name: 'induction', 
        content: personalizedProtocol.script.induction, 
        duration: Math.floor(protocol.duration * 0.25),
        phase: 'induction'
      },
      { 
        name: 'deepening', 
        content: personalizedProtocol.script.deepening, 
        duration: Math.floor(protocol.duration * 0.3),
        phase: 'deepening'
      },
      { 
        name: 'suggestions', 
        content: personalizedProtocol.script.suggestions, 
        duration: Math.floor(protocol.duration * 0.35),
        phase: 'transformation'
      },
      { 
        name: 'emergence', 
        content: personalizedProtocol.script.emergence, 
        duration: Math.floor(protocol.duration * 0.1),
        phase: 'completion'
      }
    ];

    if (phaseIndex >= scriptPhases.length) {
      console.log('[SESSION] All phases completed, ending session');
      handleSessionComplete();
      return;
    }

    const currentPhase = scriptPhases[phaseIndex];
    console.log('[SESSION] Progressing to phase:', currentPhase.name, 'duration:', currentPhase.duration, 'minutes');
    
    // Update session state
    setSessionState(prev => ({ 
      ...prev, 
      phase: currentPhase.phase,
      depth: Math.min(phaseIndex + 2, 5) // Start at depth 2, increase with phases
    }));
    
    // Add AI message for this phase
    const aiMessage = { 
      role: 'ai' as const, 
      content: currentPhase.content, 
      timestamp: Date.now() 
    };
    setConversation(prev => [...prev, aiMessage]);
    
    // Speak the content continuously
    if (isVoiceEnabled && !sessionState.isPaused) {
      speakText(currentPhase.content);
    }
    
    // Schedule next phase (convert minutes to milliseconds)
    if (phaseIndex < scriptPhases.length - 1) {
      scriptProgressRef.current = setTimeout(() => {
        console.log('[SESSION] Timer fired for phase:', currentPhase.name, 'moving to next phase');
        progressToNextPhase(phaseIndex + 1);
      }, currentPhase.duration * 60 * 1000);
    } else {
      // Last phase - end session after duration
      scriptProgressRef.current = setTimeout(() => {
        console.log('[SESSION] Final phase completed, ending session');
        handleSessionComplete();
      }, currentPhase.duration * 60 * 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (sessionState.timeElapsed / sessionState.totalDuration) * 100;

  const getPhaseTitle = () => {
    switch (sessionState.phase) {
      case 'preparation': return 'Getting Comfortable And Centered';
      case 'induction': return 'Entering The Trance State';
      case 'deepening': return 'Going Deeper Into Relaxation';
      case 'transformation': return 'Creating Positive Changes';
      case 'integration': return 'Integrating New Patterns';
      default: return 'Completing The Journey';
    }
  };

  const getBreathingInstruction = () => {
    switch (sessionState.breathing) {
      case 'inhale': return 'Inhale';
      case 'hold-inhale': return 'Hold';
      case 'exhale': return 'Exhale';
      case 'hold-exhale': return 'Hold';
      default: return 'Breathe';
    }
  };

  const getBreathingScale = () => {
    switch (sessionState.breathing) {
      case 'inhale': 
        return 1 + (0.2 * (1 - sessionState.breathingCount / 4)); // Gradually expand from 1.0 to 1.2
      case 'hold-inhale': 
        return 1.2; // Hold expanded state
      case 'exhale': 
        return 1.2 - (0.2 * (1 - sessionState.breathingCount / 6)); // Gradually contract from 1.2 to 1.0
      case 'hold-exhale': 
        return 1; // Stay contracted
      default: 
        return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={openEgoModal}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
                borderColor: egoColor.accent + '80'
              }}
            >
              <span className="text-sm">{egoState.icon}</span>
            </button>
            <div>
              <h2 className="text-white font-semibold text-sm">
                {sessionConfig.customProtocol?.name || `${egoState.name} Session`}
              </h2>
              <p className="text-white/70 text-xs">Transformation Journey</p>
            </div>
          </div>
          
          {/* Time Display */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-white font-medium text-sm">{formatTime(sessionState.timeElapsed)}</div>
              <div className="text-white/60 text-xs">{formatTime(sessionState.totalDuration)}</div>
            </div>
            <button 
              onClick={onCancel} 
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${egoColor.accent}, ${egoColor.accent}cc)`
              }}
            />
          </div>
        </div>

        {/* Status Indicators Row - Integrated into Header */}
        <div className="mt-3 mb-1">
          <div className="flex items-center justify-between">
            {/* Depth Indicator */}
            <div className="flex flex-col items-start space-y-1">
              <span className="text-white/60 text-xs uppercase tracking-wide font-medium">Depth</span>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      level <= sessionState.depth ? 'opacity-100 shadow-lg' : 'opacity-30'
                    }`}
                    style={{
                      backgroundColor: egoColor.accent,
                      boxShadow: level <= sessionState.depth ? `0 0 10px ${egoColor.accent}60` : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          
            {/* Breathing Instruction - Centered */}
            <div className="flex flex-col items-center space-y-1">
              <span className="text-white/60 text-xs uppercase tracking-wide font-medium">Breathing</span>
              <div 
                className="text-sm font-medium px-3 py-1 rounded-full border backdrop-blur-sm transition-all duration-1000"
                style={{ 
                  color: '#22C55E',
                  borderColor: '#22C55E40',
                  backgroundColor: '#22C55E20',
                  boxShadow: `0 0 15px #22C55E30`
                }}
              >
                {getBreathingInstruction()}
              </div>
            </div>
          
            {/* Phase Indicator */}
            <div className="flex flex-col items-end space-y-1">
              <span className="text-white/60 text-xs uppercase tracking-wide font-medium">Phase</span>
              <div 
                className="text-xs font-medium px-2 py-1 rounded-full border backdrop-blur-sm"
                style={{ 
                  color: egoColor.accent,
                  borderColor: egoColor.accent + '40',
                  backgroundColor: egoColor.accent + '20'
                }}
              >
                {sessionState.phase.charAt(0).toUpperCase() + sessionState.phase.slice(1)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Auto-Progress Toggle */}
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={() => setAutoProgressEnabled(!autoProgressEnabled)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all hover:scale-105 ${
              autoProgressEnabled 
                ? 'bg-green-500/20 border border-green-500/40 text-green-400' 
                : 'bg-white/10 border border-white/20 text-white/60'
            }`}
          >
            <Play size={14} />
            <span className="text-xs font-medium">
              {autoProgressEnabled ? 'Auto-guided session' : 'Interactive session'}
            </span>
          </button>
        </div>
      </header>

        
      {/* Main Content Area - Flexible Layout */}
      <div className="flex-1 flex flex-col pt-32 pb-6 min-h-0">
        
        {/* Orb Section - Takes most space, perfectly centered */}
        <div className="flex-1 flex items-center justify-center min-h-0 relative">
          {/* Eye Fixation Instruction */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
            <p className="text-white/80 text-sm font-light text-center tracking-wide">
              Focus softly on the center dot
            </p>
          </div>
          
          {/* Orb with Premium Breathing Animation */}
          <div 
            className="transition-transform duration-300 ease-in-out relative"
            style={{ 
              transform: `scale(${getBreathingScale()})`,
              filter: sessionState.depth > 3 
                ? `drop-shadow(0 0 60px ${egoColor.accent}60) drop-shadow(0 0 120px ${egoColor.accent}30)` 
                : `drop-shadow(0 0 30px ${egoColor.accent}40)`,
              transformOrigin: 'center center'
            }}
          >
            <Orb
              ref={orbRef}
              onTap={togglePause}
              egoState={activeEgoState}
              size={320}
              afterglow={sessionState.depth > 3}
            />
            
            {/* Premium Eye Fixation Dot */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 pointer-events-none transition-all duration-1000"
              style={{
                borderColor: `${egoColor.accent}cc`,
                backgroundColor: egoColor.accent,
                boxShadow: `0 0 30px ${egoColor.accent}90, 0 0 60px ${egoColor.accent}50, inset 0 0 10px rgba(255,255,255,0.3)`,
                animation: sessionState.breathing === 'inhale' || sessionState.breathing === 'exhale' ? 'none' : 'pulse 2s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>
        
      {/* Integrated Bottom Dock with Chat */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-t border-white/20">
        {/* Chat Messages Section */}
        <div 
          ref={chatContainerRef} 
          className="overflow-y-auto scrollbar-hide bg-black/20 backdrop-blur-sm border-b border-white/10"
          style={{ height: `${chatHeight}px` }}
        >
          {/* Drag Handle */}
          <div 
            className={`sticky top-0 z-10 flex justify-center py-2 cursor-ns-resize hover:bg-white/10 transition-all duration-200 select-none bg-black/40 backdrop-blur-sm border-b border-white/5 ${
              isDragging ? 'bg-white/10' : ''
            }`}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className={`w-16 h-1.5 rounded-full transition-all duration-200 ${
              isDragging ? 'bg-teal-400 shadow-lg shadow-teal-400/50' : 'bg-white/60 hover:bg-white/80'
            }`} />
          </div>
          
          {/* Chat Messages */}
          <div className="px-4 pb-3">
            {conversation.length > 0 && (
              <div className="space-y-3 pt-2">
              {conversation.slice(-4).map((msg, i) => (
                <div key={i} className={`${msg.role === 'ai' ? 'text-left' : 'text-right'} animate-fade-in`}>
                  <div className={`inline-block max-w-[85%] p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
                    msg.role === 'ai' 
                      ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/40 text-teal-100 shadow-lg shadow-teal-500/20' 
                      : 'bg-gradient-to-br from-white/15 to-white/10 border-white/30 text-white shadow-lg'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {msg.role === 'ai' ? (
                        <div className="w-4 h-4 rounded-full bg-teal-400/20 border border-teal-400/40 flex items-center justify-center">
                          <Brain size={8} className="text-teal-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                          <MessageCircle size={8} className="text-white/80" />
                        </div>
                      )}
                      <span className="text-xs font-semibold tracking-wide">
                        {msg.role === 'ai' ? 'Libero' : 'You'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {/* Thinking Indicator */}
              {isThinking && (
                <div className="text-left">
                  <div className="inline-block bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 p-3 rounded-xl backdrop-blur-sm shadow-lg shadow-teal-500/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full bg-teal-400/20 border border-teal-400/40 flex items-center justify-center">
                        <Brain size={8} className="text-teal-400" />
                      </div>
                      <span className="text-xs font-semibold text-teal-100 tracking-wide">Libero</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-teal-100 font-medium">Tuning into your energy...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="px-4 py-3 bg-black/95 backdrop-blur-xl">
          {/* Auto-Progress Info */}
          {autoProgressEnabled && (
            <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
              <p className="text-green-400 text-xs font-medium">
                🎵 Auto-guided session in progress - just relax and listen
              </p>
            </div>
          )}
          
          {/* Communication Input Row */}
          <form onSubmit={handleSubmit} className={autoProgressEnabled ? 'opacity-50' : ''}>
            <div className="flex items-center space-x-3">
              {/* Voice Record Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={!isMicEnabled || isThinking || micPermission === 'denied' || autoProgressEnabled}
                className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 backdrop-blur-sm border-2 ${
                  sessionState.isListening 
                    ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse shadow-lg shadow-red-500/30' 
                    : micPermission === 'denied'
                    ? 'bg-gray-500/20 border-gray-500/40 text-gray-400'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
                }`}
                title={
                  micPermission === 'denied' 
                    ? 'Microphone access denied' 
                    : sessionState.isListening 
                    ? 'Stop listening' 
                    : 'Start voice input'
                }
              >
                <Mic size={18} />
              </button>
              
              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    autoProgressEnabled ? "Auto-guided session - just relax..." :
                    sessionState.isListening ? "Listening..." : 
                    "Share what's happening for you..."
                  }
                  disabled={sessionState.isListening || isThinking || autoProgressEnabled}
                  className="w-full bg-white/15 border border-white/30 rounded-2xl px-6 py-3 pr-16 text-white placeholder-white/60 focus:outline-none focus:border-teal-500/60 focus:bg-white/20 focus:shadow-lg focus:shadow-teal-500/20 transition-all disabled:opacity-50 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isThinking || autoProgressEnabled}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-teal-500/30 border border-teal-500/50 text-teal-400 hover:bg-teal-500/40 hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 hover:scale-110 backdrop-blur-sm"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
            </div>
          </form>
          
          {/* Mode Toggle */}
          {!autoProgressEnabled && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setAutoProgressEnabled(true)}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Switch to auto-guided mode →
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Premium CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
      
      {/* Floating Control Sidebar */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 space-y-3">
        {/* Pause/Play */}
        <button
          onClick={togglePause}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg ${
            sessionState.isPaused 
              ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-green-500/30' 
              : 'bg-red-500/20 border-red-500/40 text-red-400 shadow-red-500/30'
          }`}
        >
          {sessionState.isPaused ? <Play size={18} className="ml-0.5" /> : <Pause size={18} />}
        </button>
        
        {/* Volume Control */}
        <button
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg ${
            isVoiceEnabled 
              ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-green-500/30' 
              : 'bg-white/10 border-white/30 text-white/60'
          }`}
        >
          {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        
        {/* Mic Control */}
        <button
          onClick={() => setIsMicEnabled(!isMicEnabled)}
          disabled={micPermission === 'denied'}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg ${
            isMicEnabled && micPermission !== 'denied'
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-blue-500/30' 
              : 'bg-white/10 border-white/30 text-white/60'
          }`}
          title={
            micPermission === 'denied' 
              ? 'Microphone access denied in browser settings' 
              : isMicEnabled 
              ? 'Disable microphone' 
              : 'Enable microphone'
          }
        >
          {isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      </div>
    </div>
  );
}