import React, { useState, useRef, useEffect } from 'react';
import Orb from './Orb';
import { useAppStore, getEgoState } from '../store';
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';

// Premium Session Components
import SessionHeader from './session/SessionHeader';
import StatusBar from './session/StatusBar';
import FloatingControls from './session/FloatingControls';
import StatsPanel from './session/StatsPanel';
import ChatInterface from './session/ChatInterface';

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
  isPlaying: boolean;
  orbEnergy: number;
}

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
}

export default function UnifiedSessionWorld({ sessionConfig, onComplete, onCancel }: UnifiedSessionWorldProps) {
  const { showToast, activeEgoState } = useAppStore();
  const { user, addExperience, incrementStreak, updateEgoStateUsage } = useGameState();
  
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>({
    phase: 'preparation',
    depth: 1,
    breathing: 'rest',
    timeRemaining: sessionConfig.duration * 60,
    totalTime: sessionConfig.duration * 60,
    isPlaying: false,
    orbEnergy: 0.3
  });

  // Audio controls
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  
  // Chat system
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Session management
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const [sessionManagerState, setSessionManagerState] = useState<any>({
    playState: 'stopped',
    currentSegmentIndex: 0,
    scriptPlan: null,
    bufferedAhead: 0
  });
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const currentEgoState = getEgoState(activeEgoState);

  // Initialize speech systems
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleUserInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.onend = () => setIsListening(false);
      }
    }
  }, []);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const manager = new SessionManager();
        setSessionManager(manager);
        
        manager.on('state-change', (newState: any) => {
          setSessionManagerState(newState);
        });
        
        await manager.initialize({
          egoState: sessionConfig.egoState,
          goal: sessionConfig.goal,
          method: sessionConfig.method,
          customProtocol: sessionConfig.customProtocol,
          userProfile: user || {}
        });

        // Auto-start welcome message
        setTimeout(() => {
          const welcomeMessage = `Welcome to your ${sessionConfig.egoState} session. I'm Libero, and I'll be guiding you through this transformation journey. Take a deep breath and let me know - what would you like to work on today?`;
          setConversation([{ role: 'ai', content: welcomeMessage, timestamp: Date.now() }]);
          
          if (isVoiceEnabled) {
            speakText(welcomeMessage);
          }
        }, 2000);
        
      } catch (error) {
        console.error('Session initialization failed:', error);
        showToast({ type: 'error', message: 'Failed to start session' });
      }
    };

    initSession();

    return () => {
      if (sessionManager) {
        sessionManager.dispose();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Session timer
  useEffect(() => {
    if (sessionState.isPlaying && sessionState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSessionState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState.isPlaying, sessionState.timeRemaining]);

  // Breathing cycle
  useEffect(() => {
    const breathingCycle = setInterval(() => {
      setSessionState(prev => {
        const cycle = ['inhale', 'hold-inhale', 'exhale', 'hold-exhale'] as const;
        const currentIndex = cycle.indexOf(prev.breathing);
        const nextIndex = (currentIndex + 1) % cycle.length;
        return { ...prev, breathing: cycle[nextIndex] };
      });
    }, 4000);

    return () => clearInterval(breathingCycle);
  }, []);

  // Phase progression
  useEffect(() => {
    const progressTime = sessionState.totalTime - sessionState.timeRemaining;
    const totalTime = sessionState.totalTime;
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

    setSessionState(prev => ({
      ...prev,
      phase: newPhase,
      depth: newDepth,
      orbEnergy: newOrbEnergy
    }));
  }, [sessionState.timeRemaining, sessionState.totalTime]);

  // AI conversation handler
  const handleUserInput = async (input: string) => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input, timestamp: Date.now() };
    setConversation(prev => [...prev, userMessage]);
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
            userProfile: user || {},
            conversationHistory: conversation.map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : 'user',
              content: msg.content
            })),
            customProtocol: sessionConfig.customProtocol
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
      }
    } catch (error) {
      console.error('AI conversation error:', error);
      const fallbackMessage = "I'm here with you. Continue breathing and trust the process.";
      const aiMessage = { role: 'ai' as const, content: fallbackMessage, timestamp: Date.now() };
      setConversation(prev => [...prev, aiMessage]);
      
      if (isVoiceEnabled) {
        speakText(fallbackMessage);
      }
    } finally {
      setIsThinking(false);
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if (!synthRef.current || !isVoiceEnabled) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.7;
    utterance.pitch = 0.8;
    utterance.volume = 0.9;

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || voice.lang.includes('en')
    ) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Voice recognition toggle
  const toggleListening = () => {
    if (!recognitionRef.current || !isMicEnabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSessionComplete = async () => {
    if (user) {
      const baseXP = Math.floor(sessionConfig.duration * 2);
      const bonusXP = sessionState.depth * 5;
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
    setSessionState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    if (sessionManager) {
      sessionState.isPlaying ? sessionManager.pause() : sessionManager.play();
    }
  };

  const skipForward = () => sessionManager?.next();
  const skipBack = () => sessionManager?.prev();

  const getSessionTitle = () => {
    if (sessionConfig.customProtocol?.name) return sessionConfig.customProtocol.name;
    if (sessionConfig.protocol?.name) return sessionConfig.protocol.name;
    if (sessionConfig.action?.name) return sessionConfig.action.name;
    return `${currentEgoState.name} Session`;
  };

  const progress = (sessionState.totalTime - sessionState.timeRemaining) / sessionState.totalTime;

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Premium Cosmic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-teal-950/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-indigo-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Premium stars */}
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full opacity-30"
            style={{
              width: `${0.5 + Math.random() * 3}px`,
              height: `${0.5 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Session Layout */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Session Header */}
        <SessionHeader
          sessionTitle={getSessionTitle()}
          currentSegment={sessionManagerState.currentSegmentIndex + 1}
          totalSegments={sessionManagerState.scriptPlan?.segments?.length || 5}
          bufferedAhead={sessionManagerState.bufferedAhead}
          egoState={activeEgoState}
          onClose={onCancel}
        />

        {/* Main 3-Column Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-6 px-6 py-4">
          {/* Left Column: Controller Buttons */}
          <div className="flex flex-col justify-center">
            <FloatingControls
              isPlaying={sessionState.isPlaying}
              isVoiceEnabled={isVoiceEnabled}
              onPlayPause={togglePlayPause}
              onSkipBack={skipBack}
              onSkipForward={skipForward}
              onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
            />
          </div>

          {/* Center Column: Orb */}
          <div className="flex items-center justify-center">
            <Orb
              ref={orbRef}
              onTap={() => {}}
              egoState={activeEgoState}
              afterglow={sessionState.orbEnergy > 0.7}
              size={280}
              variant="webgl"
            />
          </div>

          {/* Right Column: Indicators */}
          <div className="flex flex-col justify-center">
            <StatsPanel
              timeRemaining={sessionState.timeRemaining}
              depth={sessionState.depth}
              orbEnergy={sessionState.orbEnergy}
              progress={progress}
              breathing={sessionState.breathing}
              phase={sessionState.isPlaying ? sessionState.phase : 'paused'}
            />
          </div>
        </div>

        {/* Bottom Dock */}
        <div className="flex-shrink-0">
          <ChatInterface
            conversation={conversation}
            onUserInput={handleUserInput}
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            isListening={isListening}
            isVoiceEnabled={isVoiceEnabled}
            isMicEnabled={isMicEnabled}
            onToggleListening={toggleListening}
            onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
            onToggleMic={() => setIsMicEnabled(!isMicEnabled)}
            currentSegment={sessionManagerState.currentSegmentIndex + 1}
            totalSegments={sessionManagerState.scriptPlan?.segments?.length || 5}
            bufferedAhead={sessionManagerState.bufferedAhead}
          />
        </div>
      </div>

      {/* Premium animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}