import React, { useState, useRef, useEffect } from 'react';
import Orb from './Orb';
import { useAppStore, getEgoState } from '../store';
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';
import { 
  X, MessageCircle, Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Mic, Send, Brain, Loader, Activity, Clock, Zap, Wind
} from 'lucide-react';

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
  phase: 'preparation' | 'induction' | 'deepening' | 'exploration' | 'transformation' | 'integration' | 'completion' | 'paused';
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
    phase: 'paused',
    depth: 1,
    breathing: 'rest',
    timeRemaining: sessionConfig.duration * 60,
    totalTime: sessionConfig.duration * 60,
    isPlaying: false,
    orbEnergy: 0.3
  });

  // UI state
  const [showCoachBubble, setShowCoachBubble] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showStatusToast, setShowStatusToast] = useState(false);
  
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
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          goalId: sessionConfig.goal || 'transformation',
          egoState: sessionConfig.egoState,
          lengthSec: sessionConfig.duration * 60,
          locale: 'en-US',
          level: user?.level || 1,
          streak: user?.session_streak || 0,
          userPrefs: {}
        });

        // Auto-start welcome message
        setTimeout(() => {
          const welcomeMessage = `Welcome to your ${sessionConfig.egoState} session. I'm Libero, and I'll be guiding you through this transformation journey. Take a deep breath and let me know - what would you like to work on today?`;
          setConversation([{ role: 'ai', content: welcomeMessage, timestamp: Date.now() }]);
          
          if (isVoiceEnabled) {
            speakText(welcomeMessage);
          }
          setShowCoachBubble(true);
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

  // Auto-hide status toast
  useEffect(() => {
    if (showStatusToast) {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        setShowStatusToast(false);
      }, 3000);
    }
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, [showStatusToast, sessionState.phase]);

  // Phase progression
  useEffect(() => {
    const progressTime = sessionState.totalTime - sessionState.timeRemaining;
    const totalTime = sessionState.totalTime;
    const progress = progressTime / totalTime;

    let newPhase: SessionState['phase'] = 'preparation';
    let newDepth = 1;
    let newOrbEnergy = 0.3;

    if (sessionState.isPlaying) {
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
    } else {
      newPhase = 'paused';
    }

    setSessionState(prev => ({
      ...prev,
      phase: newPhase,
      depth: newDepth,
      orbEnergy: newOrbEnergy
    }));
  }, [sessionState.timeRemaining, sessionState.totalTime, sessionState.isPlaying]);

  // Event handlers
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

  const toggleListening = () => {
    if (!recognitionRef.current) return;

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
    const newIsPlaying = !sessionState.isPlaying;
    setSessionState(prev => ({ ...prev, isPlaying: newIsPlaying }));
    setShowStatusToast(true);
    
    if (sessionManager) {
      newIsPlaying ? sessionManager.play() : sessionManager.pause();
    }
  };

  const skipForward = () => {
    sessionManager?.next();
    setShowStatusToast(true);
  };
  
  const skipBack = () => {
    sessionManager?.prev();
    setShowStatusToast(true);
  };

  const toggleCoachBubble = () => setShowCoachBubble(!showCoachBubble);

  const getSessionTitle = () => {
    if (sessionConfig.customProtocol?.name) return sessionConfig.customProtocol.name;
    if (sessionConfig.protocol?.name) return sessionConfig.protocol.name;
    if (sessionConfig.action?.name) return sessionConfig.action.name;
    return `${currentEgoState.name} Session`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isThinking) {
      handleUserInput(textInput.trim());
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          toggleCoachBubble();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsVoiceEnabled(!isVoiceEnabled);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sessionState.isPlaying, isVoiceEnabled]);

  const progress = (sessionState.totalTime - sessionState.timeRemaining) / sessionState.totalTime;
  const currentSegment = sessionManagerState.currentSegmentIndex + 1;
  const totalSegments = sessionManagerState.scriptPlan?.segments?.length || 5;
  const bufferedAhead = sessionManagerState.bufferedAhead;
  const latestAiMessage = conversation.filter(msg => msg.role === 'ai').slice(-1)[0];

  return (
    <div className="session-world h-screen bg-black text-white relative overflow-hidden">
      {/* CSS Custom Properties */}
      <style jsx>{`
        .session-world {
          --header-h: 64px;
          --dock-h: 72px;
          --rail-w: 72px;
          --gutter: 24px;
        }
        
        @media (max-width: 1023px) {
          .session-world {
            --header-h: 56px;
            --dock-h: 64px;
            --rail-w: 64px;
            --gutter: 16px;
          }
        }
        
        @media (max-width: 767px) {
          .session-world {
            --gutter: 12px;
            --rail-w: 56px;
          }
        }
      `}</style>

      {/* Cosmic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-teal-950/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/8 to-cyan-400/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/8 to-indigo-400/4 rounded-full blur-3xl" />
        
        {/* Subtle stars */}
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              width: `${0.5 + Math.random() * 1.5}px`,
              height: `${0.5 + Math.random() * 1.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* 1. Fixed Header (App Bar) */}
      <header 
        className="fixed top-0 left-0 right-0 z-[200] bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
        style={{ height: 'var(--header-h)' }}
      >
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: Title + Subtitle */}
          <div className="flex-shrink-0">
            <h1 className="text-white text-lg font-semibold leading-tight">{getSessionTitle()}</h1>
            <p className="text-white/60 text-sm">Segment {currentSegment} of {totalSegments}</p>
          </div>

          {/* Center: Progress Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Right: Stats + Close */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-white text-sm font-semibold">{currentSegment}/{totalSegments}</div>
              <div className="text-white/50 text-xs">Queued: {bufferedAhead}</div>
            </div>
            <button
              onClick={onCancel}
              title="Close Session"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105"
            >
              <X size={18} className="text-white/80" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Content Area (below header, above dock) */}
      <div 
        className="fixed left-0 right-0 z-[100]"
        style={{
          top: 'var(--header-h)',
          bottom: 'var(--dock-h)'
        }}
      >
        {/* Left Rail - Controls (Floating Sidebar) */}
        <div 
          className="fixed top-1/2 transform -translate-y-1/2 z-[150] flex flex-col items-center space-y-4"
          style={{ left: 'var(--gutter)' }}
        >
          {/* Play/Pause (Primary) */}
          <button
            onClick={togglePlayPause}
            title={`${sessionState.isPlaying ? 'Pause' : 'Play'} (Space)`}
            className={`w-14 h-14 rounded-full backdrop-blur-xl border-2 transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-xl ${
              sessionState.isPlaying 
                ? 'bg-gradient-to-br from-orange-500/30 to-red-500/20 border-orange-400/60 text-orange-200 shadow-orange-400/20' 
                : 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 border-green-400/60 text-green-200 shadow-green-400/20'
            }`}
          >
            {sessionState.isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </button>

          {/* Chat Toggle */}
          <button
            onClick={toggleCoachBubble}
            title="Chat with Libero (C)"
            className={`w-12 h-12 rounded-full backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg ${
              showCoachBubble 
                ? 'bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-teal-400/60 text-teal-200 shadow-teal-400/20' 
                : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'
            }`}
          >
            <MessageCircle size={16} />
          </button>

          {/* Previous */}
          <button
            onClick={skipBack}
            title="Previous Segment (←)"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-lg text-white/70"
          >
            <SkipBack size={16} />
          </button>

          {/* Next */}
          <button
            onClick={skipForward}
            title="Next Segment (→)"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-lg text-white/70"
          >
            <SkipForward size={16} />
          </button>

          {/* Volume */}
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            title="Toggle Volume (M)"
            className={`w-12 h-12 rounded-full backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center shadow-lg ${
              isVoiceEnabled 
                ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 border-green-400/60 text-green-200 shadow-green-400/20' 
                : 'bg-gradient-to-br from-red-500/30 to-orange-500/20 border-red-400/60 text-red-200 shadow-red-400/20'
            }`}
          >
            {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>

        {/* Right Rail - Indicators (Card Style) */}
        <div 
          className="fixed top-1/2 transform -translate-y-1/2 z-[150] flex flex-col items-center space-y-3"
          style={{ right: 'var(--gutter)' }}
        >
          {/* Breathing Phase Card */}
          <div className={`backdrop-blur-xl border transition-all duration-300 px-4 py-3 rounded-xl shadow-lg min-w-[120px] text-center ${
            sessionState.breathing === 'inhale' ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/15 border-teal-400/40 text-teal-200' :
            sessionState.breathing === 'exhale' ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/15 border-emerald-400/40 text-emerald-200' :
            sessionState.breathing.includes('hold') ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/15 border-amber-400/40 text-amber-200' :
            'bg-white/10 border-white/30 text-white/70'
          }`}>
            <div className="flex items-center justify-between">
              <Wind size={14} className="opacity-70" />
              <div className="text-xs font-semibold capitalize">
                {sessionState.breathing.replace('-', ' ')}
              </div>
            </div>
          </div>

          {/* Session State Card */}
          <div className={`backdrop-blur-xl border transition-all duration-300 px-4 py-3 rounded-xl shadow-lg min-w-[120px] text-center ${
            sessionState.isPlaying 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/15 border-green-400/40 text-green-200' 
              : 'bg-gradient-to-br from-slate-500/20 to-gray-500/15 border-slate-400/40 text-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-2 h-2 rounded-full ${sessionState.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              <div className="text-xs font-semibold">
                {sessionState.isPlaying ? 'Playing' : 'Paused'}
              </div>
            </div>
          </div>

          {/* Depth Level Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/30 px-4 py-3 rounded-xl shadow-lg min-w-[120px] text-center">
            <div className="flex items-center justify-between">
              <Activity size={14} className="text-teal-400 opacity-70" />
              <div className="text-xs font-semibold text-white">Level {sessionState.depth}</div>
            </div>
          </div>

          {/* Timer Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/30 px-4 py-3 rounded-xl shadow-lg min-w-[120px] text-center">
            <div className="flex items-center justify-between">
              <Clock size={14} className="text-white/60 opacity-70" />
              <div className="text-xs font-semibold text-white">{formatTime(sessionState.timeRemaining)}</div>
            </div>
          </div>

          {/* Status Toast (Auto-dismiss) */}
          {showStatusToast && (
            <div className="bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/40 px-4 py-2 rounded-xl shadow-lg animate-fade-in">
              <div className="text-yellow-200 text-xs font-medium text-center">
                Session {sessionState.isPlaying ? 'resumed' : 'paused'}
              </div>
            </div>
          )}
        </div>

        {/* Center Stage - Orb + Chat Bubble */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Chat Bubble (Above Orb) */}
          {showCoachBubble && latestAiMessage && (
            <div className="absolute bottom-full mb-8 z-[170] pointer-events-auto max-w-[720px] w-[90%]">
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 border border-teal-400/60 flex items-center justify-center flex-shrink-0">
                    <Brain size={18} className="text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-white text-lg font-semibold">Libero</span>
                      {isThinking && (
                        <div className="flex items-center space-x-2">
                          <Loader size={14} className="text-teal-300 animate-spin" />
                          <span className="text-teal-200 text-sm">thinking...</span>
                        </div>
                      )}
                      {isSpeaking && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-200 text-sm">speaking</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white/90 text-base leading-relaxed">
                      {latestAiMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orb - Perfectly Centered */}
          <div className="pointer-events-auto">
            <Orb
              ref={orbRef}
              onTap={() => {}}
              egoState={activeEgoState}
              afterglow={sessionState.orbEnergy > 0.7}
              size={Math.min(520, window.innerWidth * 0.3, window.innerHeight * 0.4)}
              variant="webgl"
            />
          </div>
        </div>
      </div>

      {/* 3. Progress Guide (Above Dock) */}
      <div 
        className="fixed left-1/2 transform -translate-x-1/2 z-[160]"
        style={{ bottom: 'calc(var(--dock-h) + 16px)' }}
      >
        <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 shadow-lg">
          <span className="text-white/60 text-sm">
            Session progress: {currentSegment} of {totalSegments} segments • {bufferedAhead} buffered ahead
          </span>
        </div>
      </div>

      {/* 4. Bottom Dock (Clean Composer) */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[180] bg-black/95 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-black/30"
        style={{ height: 'var(--dock-h)' }}
      >
        <div className="h-full px-6 py-4 flex items-center justify-center">
          <form onSubmit={handleSubmit} className="flex items-center space-x-4 w-full max-w-4xl">
            
            {/* Mic Button (Far Left) */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isThinking}
              title="Talk to Libero"
              className={`w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 shadow-xl flex-shrink-0 ${
                isListening 
                  ? 'bg-gradient-to-br from-red-500/40 to-red-600/30 border-2 border-red-400/80 text-red-200 animate-pulse' 
                  : 'bg-gradient-to-br from-blue-500/40 to-cyan-500/30 border-2 border-blue-400/80 text-blue-200'
              }`}
            >
              <Mic size={18} />
            </button>

            {/* Text Input (Center) */}
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
              disabled={isListening || isThinking}
              className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 text-white text-base placeholder-white/50 focus:outline-none focus:border-teal-400/60 focus:bg-white/15 transition-all disabled:opacity-50 shadow-lg"
            />

            {/* Send Button (Right) */}
            <button
              type="submit"
              disabled={!textInput.trim() || isThinking}
              title="Send Message"
              className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/40 to-cyan-500/30 border-2 border-teal-400/80 text-teal-200 hover:scale-110 transition-all duration-200 disabled:opacity-50 shadow-xl flex items-center justify-center flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}