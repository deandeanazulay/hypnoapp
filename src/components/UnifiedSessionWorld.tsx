import React, { useState, useRef, useEffect } from 'react';
import Orb from './Orb';
import { useAppStore, getEgoState } from '../store';
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';
import { X, MessageCircle } from 'lucide-react';

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

  // Audio controls
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  
  // Chat system
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCoachBubble, setShowCoachBubble] = useState(false);
  const [textInput, setTextInput] = useState('');
  
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

  // AI conversation handler
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

  const progress = (sessionState.totalTime - sessionState.timeRemaining) / sessionState.totalTime;
  const currentSegment = sessionManagerState.currentSegmentIndex + 1;
  const totalSegments = sessionManagerState.scriptPlan?.segments?.length || 5;
  const bufferedAhead = sessionManagerState.bufferedAhead;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingDisplay = () => {
    const displays = {
      'inhale': { text: 'Inhale', color: 'text-teal-400 bg-teal-500/20 border-teal-500/40' },
      'hold-inhale': { text: 'Hold', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' },
      'exhale': { text: 'Exhale', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' },
      'hold-exhale': { text: 'Hold', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' },
      'rest': { text: 'Rest', color: 'text-slate-400 bg-slate-500/20 border-slate-500/40' }
    };
    return displays[sessionState.breathing] || displays.rest;
  };

  const getPhaseDisplay = () => {
    const displays = {
      'paused': { text: 'Paused', color: 'text-slate-400 bg-slate-500/20 border-slate-500/40' },
      'preparation': { text: 'Preparing', color: 'text-blue-400 bg-blue-500/20 border-blue-500/40' },
      'induction': { text: 'Guiding', color: 'text-teal-400 bg-teal-500/20 border-teal-500/40' },
      'deepening': { text: 'Deepening', color: 'text-purple-400 bg-purple-500/20 border-purple-500/40' },
      'exploration': { text: 'Exploring', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40' },
      'transformation': { text: 'Transforming', color: 'text-orange-400 bg-orange-500/20 border-orange-500/40' },
      'integration': { text: 'Integrating', color: 'text-green-400 bg-green-500/20 border-green-500/40' },
      'completion': { text: 'Complete', color: 'text-white bg-white/20 border-white/40' }
    };
    return displays[sessionState.phase] || displays.paused;
  };

  const latestAiMessage = conversation.filter(msg => msg.role === 'ai').slice(-1)[0];

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col">
      {/* Premium Cosmic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-teal-950/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-indigo-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Subtle stars */}
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute bg-white rounded-full opacity-20"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header - Sticky, Minimal */}
      <header className="relative z-30 bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        {/* Left: Title + Subtitle */}
        <div>
          <h1 className="text-white text-lg font-medium">{getSessionTitle()}</h1>
          <p className="text-white/60 text-sm">Segment {currentSegment} of {totalSegments}</p>
        </div>

        {/* Center: Progress Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Stats + Close */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-white/80 text-sm font-medium">{currentSegment}/{totalSegments}</div>
            <div className="text-white/50 text-xs">Queued: {bufferedAhead}</div>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-105"
          >
            <X size={18} className="text-white/80" />
          </button>
        </div>
      </header>

      {/* 3-Column Main Layout */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 grid grid-cols-[72px_1fr_96px] gap-6 px-4 py-6">
          
          {/* Left Rail - Controllers */}
          <div className="flex flex-col justify-center space-y-3 z-20">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              title={`${sessionState.isPlaying ? 'Pause' : 'Play'} (Space)`}
              className={`w-14 h-14 rounded-xl backdrop-blur-xl border transition-all hover:scale-[0.98] flex items-center justify-center shadow-lg ${
                sessionState.isPlaying 
                  ? 'bg-orange-500/20 border-orange-400/60 text-orange-300 shadow-orange-400/25 hover:shadow-orange-400/40' 
                  : 'bg-green-500/20 border-green-400/60 text-green-300 shadow-green-400/25 hover:shadow-green-400/40'
              }`}
            >
              {sessionState.isPlaying ? '⏸' : '▶'}
            </button>

            {/* Coach Bubble Toggle */}
            <button
              onClick={toggleCoachBubble}
              title="Open Chat (C)"
              className={`w-12 h-12 rounded-xl backdrop-blur-xl border transition-all hover:scale-[0.98] flex items-center justify-center shadow-lg ${
                showCoachBubble 
                  ? 'bg-teal-500/20 border-teal-400/60 text-teal-300 shadow-teal-400/25' 
                  : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'
              }`}
            >
              <MessageCircle size={16} />
            </button>

            {/* Previous */}
            <button
              onClick={skipBack}
              title="Previous (←)"
              className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/20 hover:scale-[0.98] transition-all shadow-lg text-white/70"
            >
              ⏮
            </button>

            {/* Next */}
            <button
              onClick={skipForward}
              title="Next (→)"
              className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/30 flex items-center justify-center hover:bg-white/20 hover:scale-[0.98] transition-all shadow-lg text-white/70"
            >
              ⏭
            </button>

            {/* Volume */}
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              title="Volume (M)"
              className={`w-12 h-12 rounded-xl backdrop-blur-xl border transition-all hover:scale-[0.98] flex items-center justify-center shadow-lg ${
                isVoiceEnabled 
                  ? 'bg-green-500/20 border-green-400/60 text-green-300 shadow-green-400/25' 
                  : 'bg-red-500/20 border-red-400/60 text-red-300 shadow-red-400/25'
              }`}
            >
              {isVoiceEnabled ? '🔊' : '🔇'}
            </button>

            {/* Mic/PTT */}
            <button
              onClick={toggleListening}
              title="Talk (Hold V)"
              disabled={!isMicEnabled}
              className={`w-12 h-12 rounded-xl backdrop-blur-xl border transition-all hover:scale-[0.98] flex items-center justify-center shadow-lg disabled:opacity-50 ${
                isListening 
                  ? 'bg-red-500/20 border-red-400/60 text-red-300 animate-pulse shadow-red-400/25' 
                  : 'bg-blue-500/20 border-blue-400/60 text-blue-300 shadow-blue-400/25'
              }`}
            >
              🎤
            </button>
          </div>

          {/* Center Stage - Orb */}
          <div className="flex items-center justify-center relative z-10">
            {/* Coach Bubble - Above orb in stage */}
            {showCoachBubble && latestAiMessage && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 max-w-[720px] w-full mb-8 z-26">
                <div className="bg-gradient-to-br from-teal-500/25 to-cyan-500/15 backdrop-blur-xl rounded-2xl p-5 border border-teal-500/30 shadow-2xl animate-slide-up">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 border border-teal-400/60 flex items-center justify-center flex-shrink-0">
                      🧠
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-teal-100 text-lg font-medium">Libero</span>
                        {isThinking && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse"></div>
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
                      <p className="text-teal-50 text-base leading-relaxed">
                        {latestAiMessage.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orb - Perfectly Centered */}
            <Orb
              ref={orbRef}
              onTap={() => {}}
              egoState={activeEgoState}
              afterglow={sessionState.orbEnergy > 0.7}
              size={Math.min(480, window.innerWidth * 0.4)}
              variant="webgl"
            />
          </div>

          {/* Right Rail - Indicators */}
          <div className="flex flex-col justify-center space-y-3 z-20">
            {/* Breathing Pill */}
            <div className={`px-3 py-2 rounded-full border text-sm font-medium transition-all ${
              sessionState.isPlaying ? 'animate-pulse' : ''
            } ${getBreathingDisplay().color}`}>
              <div className="text-center">
                <div className="text-xs opacity-80 mb-1">💨</div>
                <div className="text-xs">{getBreathingDisplay().text}</div>
              </div>
            </div>

            {/* Phase Badge */}
            <div className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${getPhaseDisplay().color}`}>
              <div className="text-center">
                <div className="text-xs opacity-80 mb-1">⚡</div>
                <div className="text-xs">{getPhaseDisplay().text}</div>
              </div>
            </div>

            {/* Depth Indicator */}
            <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-center">
              <div className="text-teal-400 text-xs mb-1">📊</div>
              <div className="text-white text-sm font-bold">Level {sessionState.depth}</div>
            </div>

            {/* Timer */}
            <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-center">
              <div className="text-white/60 text-xs mb-1">⏱</div>
              <div className="text-white text-sm font-bold">{formatTime(sessionState.timeRemaining)}</div>
            </div>

            {/* Status Callout (Auto-dismiss) */}
            <div className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
              <div className="text-yellow-400 text-xs">
                Session {sessionState.isPlaying ? 'active' : 'paused'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dock - Like Purple Screenshot */}
      <div className="relative z-25 bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 py-4">
        {/* Session Progress Text */}
        <div className="text-center mb-4">
          <span className="text-white/50 text-sm">
            Session progress: {currentSegment} of {totalSegments} segments • {bufferedAhead} buffered ahead
          </span>
        </div>

        {/* Main Input Row */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-4 mb-4">
          {/* Large Circular Mic Button - Far Left */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={!isMicEnabled || isThinking}
            className={`w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 shadow-xl ${
              isListening 
                ? 'bg-gradient-to-br from-red-500/30 to-red-600/20 border-2 border-red-400/60 text-red-300 animate-pulse' 
                : 'bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-2 border-teal-400/60 text-teal-300'
            }`}
          >
            🎤
          </button>

          {/* Wide Text Input - Center */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
              disabled={isListening || isThinking}
              className="w-full bg-black/40 backdrop-blur-xl border border-white/20 rounded-full px-6 py-4 text-white text-base placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-black/60 transition-all disabled:opacity-50"
            />
          </div>

          {/* Send Button - Circular, Right of Input */}
          <button
            type="submit"
            disabled={!textInput.trim() || isThinking}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-2 border-teal-400/60 text-teal-300 hover:scale-110 transition-all disabled:opacity-50 shadow-xl"
          >
            ⬆
          </button>

          {/* Audio Controls - Far Right */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`w-14 h-14 rounded-full transition-all duration-300 hover:scale-110 shadow-xl ${
                isVoiceEnabled 
                  ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 border-2 border-green-400/60 text-green-300' 
                  : 'bg-black/60 border-2 border-white/30 text-white/60'
              }`}
            >
              {isVoiceEnabled ? '🔊' : '🔇'}
            </button>

            <button
              type="button"
              onClick={() => setIsMicEnabled(!isMicEnabled)}
              className={`w-14 h-14 rounded-full transition-all duration-300 hover:scale-110 shadow-xl ${
                isMicEnabled 
                  ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border-2 border-blue-400/60 text-blue-300' 
                  : 'bg-black/60 border-2 border-white/30 text-white/60'
              }`}
            >
              🎤
            </button>
          </div>
        </form>

        {/* Quick Suggestions Pills - Below Input */}
        {conversation.length <= 1 && (
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              'I feel stressed',
              'Help me focus', 
              'I want to relax',
              'I need confidence'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleUserInput(suggestion)}
                disabled={isThinking}
                className="px-4 py-2 bg-gradient-to-br from-black/40 to-gray-900/30 backdrop-blur-sm hover:bg-black/60 border border-white/20 rounded-full text-white/70 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 hover:border-teal-400/40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Premium animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) translateX(-50%); opacity: 0; }
          to { transform: translateY(0) translateX(-50%); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}