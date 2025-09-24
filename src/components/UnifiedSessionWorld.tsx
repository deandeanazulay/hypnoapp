import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, Mic, MicOff, Send, MessageCircle, Brain, Loader } from 'lucide-react';
import Orb from './Orb';
import GlassCard from './ui/GlassCard';
import { useGameState } from './GameStateManager';
import { useAppStore, getEgoState } from '../store';
import { getEgoColor } from '../config/theme';

interface SessionConfig {
  egoState: string;
  action?: any;
  protocol?: any;
  type: 'unified' | 'protocol' | 'favorite';
  customProtocol?: any;
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

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

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
          setSessionState(prev => ({ ...prev, isListening: false }));
        };

        recognitionRef.current.onerror = () => {
          setSessionState(prev => ({ ...prev, isListening: false }));
        };

        recognitionRef.current.onend = () => {
          setSessionState(prev => ({ ...prev, isListening: false }));
        };
      }
    }
  }, []);

  // Auto-start session
  useEffect(() => {
    if (conversation.length === 0) {
      setTimeout(() => {
        let welcomeMessage = '';
        
        if (sessionConfig.customProtocol?.name) {
          welcomeMessage = `Welcome to your ${sessionConfig.customProtocol.name}. We're focusing on ${sessionConfig.customProtocol.goals?.join(' and ') || 'transformation'} today. Let's begin right away. Close your eyes gently and take a deep, slow breath in through your nose...`;
        } else {
          welcomeMessage = `Welcome to your ${sessionConfig.egoState} session. I'm Libero, and I'll be guiding you through this transformation journey. Take a deep breath and let me know - what would you like to work on today?`;
        }
        
        const aiMessage = { role: 'ai' as const, content: welcomeMessage, timestamp: Date.now() };
        setConversation([aiMessage]);
        
        if (isVoiceEnabled) {
          speakText(welcomeMessage);
        }
      }, 2000);
    }
  }, [sessionConfig, isVoiceEnabled]);

  // Breathing cycle management
  useEffect(() => {
    if (!sessionState.isPaused) {
      breathingTimerRef.current = setInterval(() => {
        setSessionState(prev => {
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
                newCount = 2; // Hold empty for 2 seconds
                break;
              case 'hold-exhale':
                newBreathing = 'inhale';
                newCount = 4; // Inhale for 4 seconds
                newCycle = prev.breathingCycle + 1;
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
    }

    return () => {
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
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
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.lang.includes('en')
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

    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current || !isMicEnabled) return;

    if (sessionState.isListening) {
      recognitionRef.current.stop();
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setSessionState(prev => ({ ...prev, isSpeaking: false }));
      }
      
      recognitionRef.current.start();
      setSessionState(prev => ({ ...prev, isListening: true }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isThinking) {
      handleUserInput(textInput.trim());
    }
  };

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
    setSessionState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    if (synthRef.current) {
      if (sessionState.isPaused) {
        synthRef.current.resume();
      } else {
        synthRef.current.pause();
      }
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
      case 'hold-exhale': return 'Rest';
      default: return 'Breathe';
    }
  };

  const getBreathingScale = () => {
    switch (sessionState.breathing) {
      case 'inhale': 
        return 1 + (0.3 * (1 - sessionState.breathingCount / 4)); // Expand as count decreases
      case 'hold-inhale': 
        return 1.3; // Stay expanded
      case 'exhale': 
        return 1.3 - (0.3 * (1 - sessionState.breathingCount / 6)); // Contract as count decreases
      case 'hold-exhale': 
        return 1; // Stay contracted
      default: 
        return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={openEgoModal}
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
                borderColor: egoColor.accent + '80'
              }}
            >
              <span className="text-lg">{egoState.icon}</span>
            </button>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {sessionConfig.customProtocol?.name || `${egoState.name} Session`}
              </h2>
              <p className="text-white/70 text-sm">Transformation Journey</p>
            </div>
          </div>
          
          {/* Time Display */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-white font-medium">{formatTime(sessionState.timeElapsed)}</div>
              <div className="text-white/60 text-xs">{formatTime(sessionState.totalDuration)}</div>
            </div>
            <button 
              onClick={onCancel} 
              className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
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
      </header>

      {/* Main Content - Perfect Flexbox Layout */}
      <div className="flex flex-col h-full pt-32 pb-4">
        
        {/* Status Indicators - Positioned below header */}
        <div className="absolute top-32 left-6 z-20 pt-4">
          <div className="flex flex-col items-start space-y-2">
            <span className="text-white/60 text-xs uppercase tracking-wide">Depth</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
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
        </div>
        
        <div className="absolute top-32 right-6 z-20 pt-4">
          <div className="flex flex-col items-end space-y-2">
            <span className="text-white/60 text-xs uppercase tracking-wide">Phase</span>
            <span 
              className="text-sm font-medium px-3 py-1 rounded-full border"
              style={{ 
                color: egoColor.accent,
                borderColor: egoColor.accent + '40',
                backgroundColor: egoColor.accent + '20'
              }}
            >
              {sessionState.phase.charAt(0).toUpperCase() + sessionState.phase.slice(1)}
            </span>
          </div>
        </div>
        
        {/* 1. Orb Section - Takes most space, perfectly centered */}
        <div className="flex-1 flex items-center justify-center min-h-0 relative">
          {/* Eye Fixation Instruction - Absolutely positioned above orb */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
            <p className="text-white/80 text-sm font-light text-center">
              Focus softly on the center dot
            </p>
          </div>
          
          {/* Orb with Breathing Animation */}
          <div 
            className="transition-transform duration-1000 ease-in-out relative"
            style={{ 
              transform: `scale(${getBreathingScale()})`,
              filter: sessionState.depth > 3 ? `drop-shadow(0 0 40px ${egoColor.accent}80)` : 'none'
            }}
          >
            <Orb
              ref={orbRef}
              onTap={togglePause}
              egoState={activeEgoState}
              size={280}
              afterglow={sessionState.depth > 3}
            />
            
            {/* Eye Fixation Dot - Centered in orb */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white/80 bg-white/60 animate-pulse pointer-events-none"
              style={{
                boxShadow: `0 0 20px ${egoColor.accent}80, 0 0 40px ${egoColor.accent}40`,
                backgroundColor: egoColor.accent
              }}
            />
          </div>
        </div>
        
        {/* 2. Breathing Instructions - Clean centered section */}
        <div className="flex-shrink-0 text-center py-4 space-y-3">
          {/* Breathing Instructions */}
          <div className="space-y-1">
            <div className="text-white/90 text-xl font-light">
              {getBreathingInstruction()}
            </div>
          </div>
        </div>
        
        {/* 3. Status Indicators - Glass card with proper spacing */}
        {/* 3. Chat Interface - Fixed height, proper container */}
        <div className="flex-shrink-0">
          <div className="px-6 max-h-64 overflow-y-auto ">
          
          {/* Latest AI Message */}
          {conversation.length > 0 && (
            <div className="mb-4">
              {/* Show last AI message */}
              {conversation.slice(-1).map((msg, i) => (
                msg.role === 'ai' && (
                  <GlassCard key={i} variant="premium" className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain size={14} className="text-teal-400" />
                      <span className="text-teal-100 font-medium text-sm">Libero</span>
                    </div>
                    <p className="text-teal-100 leading-relaxed">{msg.content}</p>
                  </GlassCard>
                )
              ))}
              
              {/* Thinking indicator */}
              {isThinking && (
                <GlassCard variant="premium" className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain size={14} className="text-teal-400" />
                    <span className="text-teal-100 font-medium text-sm">Libero</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Loader size={16} className="text-teal-400 animate-spin" />
                    <span className="text-teal-100">Tuning into your energy...</span>
                  </div>
                </GlassCard>
              )}
            </div>
          )}
          </div>

          {/* Input Interface - Clean bottom section */}
          <div className="px-6 bg-black/95 backdrop-blur-xl border-t border-white/10 pt-4">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center space-x-3">
                {/* Voice Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!isMicEnabled || isThinking}
                  className={`p-4 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
                    sessionState.isListening 
                      ? 'bg-red-500/20 border-2 border-red-500/60 text-red-400 animate-pulse' 
                      : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                  }`}
                >
                  <Mic size={20} />
                </button>
                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={sessionState.isListening ? "Listening..." : "Share what's on your mind..."}
                    disabled={sessionState.isListening || isThinking}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 pr-16 text-white placeholder-white/50 focus:outline-none focus:border-teal-500/50 focus:bg-white/15 transition-all disabled:opacity-50 text-lg"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isThinking}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 hover:bg-teal-500/30 transition-all disabled:opacity-50 hover:scale-110"
                  >
                    <Send size={18} />
                  </button>
                </div>

                {/* Audio Controls */}
                <button
                  type="button"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`p-4 rounded-full transition-all duration-300 hover:scale-110 ${
                    isVoiceEnabled 
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400' 
                      : 'bg-white/10 border border-white/20 text-white/60'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMicEnabled(!isMicEnabled)}
                  className={`p-4 rounded-full transition-all duration-300 hover:scale-110 ${
                    isMicEnabled 
                      ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' 
                      : 'bg-white/10 border border-white/20 text-white/60'
                  }`}
                >
                  {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}