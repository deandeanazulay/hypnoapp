import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Orb from './Orb';
import { useAppStore, getEgoState } from '../store';
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';
import AIVoiceSystem from './premium/PremiumFeatures';

// Reusable Session Components
import SessionHeader from './session/SessionHeader';
import SessionIndicators from './session/SessionIndicators';
import SessionControls from './session/SessionControls';
import SessionStats from './session/SessionStats';
import SessionStatusBar from './session/SessionStatusBar';
import SessionProgress from './session/SessionProgress';
import VoiceInputDock from './session/VoiceInputDock';

interface UnifiedSessionWorldProps {
  sessionConfig: {
    egoState: string;
    goal?: string;
    method?: string;
    customProtocol?: any;
    duration: number;
    type: 'unified' | 'protocol' | 'favorite';
    protocol?: any;
    action?: any;
    mode?: any;
    session?: any;
  };
  onComplete: () => void;
  onCancel: () => void;
}

interface SessionState {
  phase: 'preparation' | 'induction' | 'deepening' | 'exploration' | 'transformation' | 'integration' | 'completion';
  depth: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale' | 'rest';
  timeRemaining: number;
  totalTime: number;
  currentSegment: string;
  isPlaying: boolean;
  orbEnergy: number;
}

export default function UnifiedSessionWorld({ sessionConfig, onComplete, onCancel }: UnifiedSessionWorldProps) {
  const { showToast, activeEgoState } = useAppStore();
  const { user, addExperience, incrementStreak, updateEgoStateUsage } = useGameState();
  
  // Session state tracking
  const [sessionWorldState, setSessionWorldState] = useState<SessionState>({
    phase: 'preparation',
    depth: 1,
    breathing: 'rest',
    timeRemaining: sessionConfig.duration * 60,
    totalTime: sessionConfig.duration * 60,
    currentSegment: '',
    isPlaying: false,
    orbEnergy: 0.3,
  });

  // Audio and session controls
  const [audioLevel, setAudioLevel] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
  }>>([]);
  
  const [textInput, setTextInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('prompt');
  
  // Session management
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const [sessionState, setSessionState] = useState<any>({
    playState: 'stopped',
    currentSegmentIndex: 0,
    scriptPlan: null,
    bufferedAhead: 0
  });
  
  // Refs for audio and speech
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);

  const currentEgoState = getEgoState(activeEgoState);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
          console.log('Session: Speech recognition started');
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0]?.transcript;
          if (transcript) {
            console.log('Session: Speech recognized:', transcript);
            handleUserInput(transcript);
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          console.log('Session: Speech recognition ended');
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Session: Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            setMicPermission('denied');
            showToast({
              type: 'error',
              message: 'Microphone access denied. Please allow microphone access in your browser settings.'
            });
          }
        };
      }
    }

    // Check microphone permission on mount
    if (navigator.permissions) {
      setMicPermission('checking');
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(permission => {
        setMicPermission(permission.state as any);
        permission.onchange = () => {
          setMicPermission(permission.state as any);
        };
      }).catch(() => {
        setMicPermission('prompt');
      });
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [showToast]);

  // Session timer
  useEffect(() => {
    if (sessionWorldState.isPlaying && sessionWorldState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSessionWorldState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
            // Session complete
            setTimeout(handleSessionComplete, 1000);
            return { ...prev, timeRemaining: 0, isPlaying: false };
          }
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionWorldState.isPlaying, sessionWorldState.timeRemaining]);

  // Breathing cycle
  useEffect(() => {
    const breathingCycle = setInterval(() => {
      setSessionWorldState(prev => {
        const cycle = ['inhale', 'hold-inhale', 'exhale', 'hold-exhale'] as const;
        const currentIndex = cycle.indexOf(prev.breathing);
        const nextIndex = (currentIndex + 1) % cycle.length;
        return { ...prev, breathing: cycle[nextIndex] };
      });
    }, 4000); // 4 second breathing cycle

    return () => clearInterval(breathingCycle);
  }, []);

  // Phase progression
  useEffect(() => {
    const progressTime = sessionWorldState.totalTime - sessionWorldState.timeRemaining;
    const totalTime = sessionWorldState.totalTime;
    const progress = progressTime / totalTime;

    let newPhase: SessionState['phase'] = 'preparation';
    let newDepth = 1;
    let newOrbEnergy = 0.3;

    if (progress < 0.1) {
      newPhase = 'preparation';
      newDepth = 1;
      newOrbEnergy = 0.3;
    } else if (progress < 0.25) {
      newPhase = 'induction';
      newDepth = 2;
      newOrbEnergy = 0.5;
    } else if (progress < 0.4) {
      newPhase = 'deepening';
      newDepth = 3;
      newOrbEnergy = 0.7;
    } else if (progress < 0.6) {
      newPhase = 'exploration';
      newDepth = 4;
      newOrbEnergy = 0.8;
    } else if (progress < 0.8) {
      newPhase = 'transformation';
      newDepth = 5;
      newOrbEnergy = 1.0;
    } else if (progress < 0.95) {
      newPhase = 'integration';
      newDepth = 4;
      newOrbEnergy = 0.9;
    } else {
      newPhase = 'completion';
      newDepth = 2;
      newOrbEnergy = 0.6;
    }

    setSessionWorldState(prev => ({
      ...prev,
      phase: newPhase,
      depth: newDepth,
      orbEnergy: newOrbEnergy
    }));
  }, [sessionWorldState.timeRemaining, sessionWorldState.totalTime]);

  // Initialize session when component mounts
  useEffect(() => {
    const initSession = async () => {
      try {
        const manager = new SessionManager();
        setSessionManager(manager);
        
        manager.on('state-change', (newState: any) => {
          setSessionState(newState);
        });
        
        // Initialize the session with user context and templates
        await manager.initialize({
          egoState: sessionConfig.egoState,
          goal: sessionConfig.goal,
          method: sessionConfig.method,
          customProtocol: sessionConfig.customProtocol,
          userProfile: {}
        });
        
        // Start with a welcome message
        const welcomeMessage = {
          role: 'ai' as const,
          content: `Welcome to your ${sessionConfig.egoState} session. I am Libero, and I'm here to guide you. How are you feeling right now?`,
          timestamp: Date.now()
        };
        
        setConversation([welcomeMessage]);
        
        if (isVoiceEnabled) {
          speakText(welcomeMessage.content);
        }
        
      } catch (error) {
        console.error('Session: Failed to initialize session:', error);
        showToast({
          type: 'error',
          message: 'Failed to start session. Please try again.'
        });
      }
    };

    initSession();

    return () => {
      if (sessionManager) {
        sessionManager.dispose();
      }
    };
  }, [sessionConfig, isVoiceEnabled, showToast]);

  const handleSessionComplete = async () => {
    console.log('[SESSION] Session completed');
    
    // Award experience and update stats
    if (user) {
      const baseXP = Math.floor(sessionConfig.duration * 2);
      const bonusXP = sessionWorldState.depth * 5;
      const totalXP = baseXP + bonusXP;
      
      await addExperience(totalXP);
      await incrementStreak();
      await updateEgoStateUsage(activeEgoState);
      
      showToast({
        type: 'success',
        message: `Session complete! +${totalXP} XP earned`
      });
    }
    
    setTimeout(onComplete, 2000);
  };

  const togglePlayPause = () => {
    setSessionWorldState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    if (sessionManager) {
      if (sessionWorldState.isPlaying) {
        sessionManager.pause();
      } else {
        sessionManager.play();
      }
    }
  };

  const skipForward = () => {
    if (sessionManager) {
      sessionManager.next();
    }
  };

  const skipBack = () => {
    if (sessionManager) {
      sessionManager.prev();
    }
  };

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
            phase: sessionWorldState.phase,
            depth: sessionWorldState.depth,
            breathing: sessionWorldState.breathing,
            userProfile: {},
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
        console.log('Session: Received AI response');
        const aiMessage = { role: 'ai' as const, content: data.response, timestamp: Date.now() };
        setConversation(prev => [...prev, aiMessage]);
        
        if (isVoiceEnabled) {
          speakText(data.response);
        }
        
        // Apply any session updates from AI
        if (data.sessionUpdates && Object.keys(data.sessionUpdates).length > 0) {
          setSessionWorldState(prev => ({ ...prev, ...data.sessionUpdates }));
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

    console.log(`Session: Speaking text: ${text.substring(0, 50)}...`);

    // Wait for any pending speech to finish if already speaking
    if (synthRef.current.speaking) {
      console.log('Session: Already speaking, canceling previous and starting new');
      synthRef.current.cancel();
    }

    // Wait a moment for cancel to take effect
    setTimeout(() => {
      if (!synthRef.current || !isVoiceEnabled) return;
      
      // Wait for voices to be available
      const voices = synthRef.current.getVoices();
      if (voices.length === 0) {
        console.log('Session: Waiting for voices to load...');
        synthRef.current.addEventListener('voiceschanged', () => speakText(text), { once: true });
        return;
      }

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
        console.log('Session: Using voice:', preferredVoice.name);
      }

      utterance.onstart = () => {
        console.log('Session: Speech started');
      };

      utterance.onend = () => {
        console.log('Session: Speech ended');
      };

      utterance.onerror = (event) => {
        console.error('Session: Speech synthesis error:', event.error);
      };

      synthRef.current.speak(utterance);
    }, 100);
  };

  const toggleListening = async () => {
    if (!recognitionRef.current || !isMicEnabled) {
      console.warn('Session: Speech recognition not available');
      return;
    }

    try {
      // Request microphone permission if needed
      if (micPermission === 'prompt' || micPermission === 'checking') {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicPermission('granted');
        } catch (permError: any) {
          console.error('Session: Microphone permission denied:', permError);
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
      }
      
      console.log('Session: Starting speech recognition');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Session: Error starting speech recognition:', error);
      showToast({
        type: 'error',
        message: 'Could not start voice recognition. Please try again.'
      });
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get session title based on config
  const getSessionTitle = () => {
    if (sessionConfig.customProtocol?.name) {
      return sessionConfig.customProtocol.name;
    }
    if (sessionConfig.protocol?.name) {
      return sessionConfig.protocol.name;
    }
    if (sessionConfig.action?.name) {
      return sessionConfig.action.name;
    }
    return `${currentEgoState.name} Session`;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-teal-950/20" />
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`
            }}
          />
        ))}
      </div>

      {/* Session Header */}
      <SessionHeader
        sessionTitle={getSessionTitle()}
        currentSegment={sessionState.currentSegmentIndex + 1}
        totalSegments={sessionState.scriptPlan?.segments?.length || 6}
        bufferedAhead={sessionState.bufferedAhead}
        onClose={onCancel}
      />

      {/* Session Indicators */}
      <SessionIndicators
        depth={sessionWorldState.depth}
        breathing={sessionWorldState.breathing}
        phase={sessionWorldState.isPlaying ? sessionWorldState.phase : 'paused'}
      />

      {/* Session Status Bar */}
      <SessionStatusBar
        isPlaying={sessionWorldState.isPlaying}
        currentSegment={sessionState.currentSegmentIndex + 1}
        totalSegments={sessionState.scriptPlan?.segments?.length || 6}
        phase={sessionWorldState.phase}
      />

      {/* Main Session Area */}
      <div className="relative z-10 flex-1 h-screen">
        {/* Central Orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Orb
            ref={orbRef}
            onTap={() => {}}
            egoState={activeEgoState}
            afterglow={sessionWorldState.orbEnergy > 0.7}
            size={300}
            variant="webgl"
          />
        </div>

        {/* Floating Controls - Left Side */}
        <SessionControls
          isPlaying={sessionWorldState.isPlaying}
          isVoiceEnabled={isVoiceEnabled}
          audioLevel={audioLevel}
          onPlayPause={togglePlayPause}
          onSkipBack={skipBack}
          onSkipForward={skipForward}
          onToggleVoice={toggleVoice}
          onVolumeChange={setAudioLevel}
        />

        {/* Session Stats - Right Side */}
        <SessionStats
          depth={sessionWorldState.depth}
          orbEnergy={sessionWorldState.orbEnergy}
          timeRemaining={sessionWorldState.timeRemaining}
          totalTime={sessionWorldState.totalTime}
          currentSegment={sessionWorldState.currentSegment}
        />

        {/* Conversation Overlay */}
        {conversation.length > 0 && (
          <div className="absolute bottom-36 left-4 right-4 z-40">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 max-h-48 overflow-y-auto">
              <div 
                ref={chatContainerRef}
                className="space-y-3"
              >
                {conversation.slice(-3).map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                          : 'bg-white/10 text-white border border-white/20'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-teal-500/20 border border-teal-500/30 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-teal-100">Libero is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Progress */}
      <SessionProgress
        currentSegment={sessionState.currentSegmentIndex + 1}
        totalSegments={sessionState.scriptPlan?.segments?.length || 6}
        bufferedAhead={sessionState.bufferedAhead}
      />

      {/* Voice Input Dock */}
      <VoiceInputDock
        textInput={textInput}
        onTextChange={setTextInput}
        onSubmit={handleUserInput}
        isListening={isListening}
        onToggleListening={toggleListening}
        isMicEnabled={isMicEnabled}
        micPermission={micPermission}
        isThinking={isThinking}
      />

      {/* AI Voice System Integration */}
      <AIVoiceSystem
        isActive={conversation.length > 0}
        sessionType="unified"
        onStateChange={(updates) => {
          setSessionWorldState(prev => ({ ...prev, ...updates }));
        }}
        sessionState={sessionWorldState}
        sessionConfig={sessionConfig}
      />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}