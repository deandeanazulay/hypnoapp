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
  const [chatHeight, setChatHeight] = useState(80); // Default chat height in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
                newCount = 4; // Hold empty for 4 seconds
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
      </header>

      {/* Status Indicators Row - Fixed Position Below Header */}
      <div className="absolute top-20 left-0 right-0 z-40 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Depth Indicator */}
          <div className="flex flex-col items-start space-y-2">
            <span className="text-white/60 text-xs uppercase tracking-wide font-medium">Depth</span>
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
        
          {/* Breathing Instruction - Centered */}
          <div className="flex flex-col items-center space-y-2">
            <span className="text-white/60 text-xs uppercase tracking-wide font-medium">Breathing</span>
            <div 
              className="text-lg font-medium px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-1000"
              style={{ 
                color: egoColor.accent,
                borderColor: egoColor.accent + '40',
                backgroundColor: egoColor.accent + '20',
                boxShadow: `0 0 20px ${egoColor.accent}30`
              }}
            >
              {getBreathingInstruction()}
            </div>
          </div>
        
          {/* Phase Indicator */}
          <div className="flex flex-col items-end space-y-2">
            <span className="text-white/60 text-xs uppercase tracking-wide font-medium">Phase</span>
            <div 
              className="text-sm font-medium px-3 py-1 rounded-full border backdrop-blur-sm"
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
        
      {/* Main Content Area - Flexible Layout */}
      <div className="flex-1 flex flex-col pt-28 pb-6 min-h-0">
        
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
              filter: sessionState.depth > 3 ? `drop-shadow(0 0 40px ${egoColor.accent}80)` : 'none',
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
        
        {/* Premium Chat Interface - Bottom Section */}
        <div className="flex-shrink-0 relative">
          {/* Drag Handle */}
          <div 
            className={`px-6 py-3 cursor-ns-resize hover:bg-white/5 transition-all duration-200 select-none ${
              isDragging ? 'bg-white/10' : ''
            }`}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="flex flex-col items-center space-y-1">
              <div className={`w-16 h-1.5 rounded-full transition-all duration-200 ${
                isDragging ? 'bg-teal-400 shadow-lg shadow-teal-400/50' : 'bg-white/40 hover:bg-white/60'
              }`} />
              <span className="text-white/40 text-xs font-medium">
                {isDragging ? 'Release to set' : 'Drag to resize'}
              </span>
            </div>
          </div>
          
          {/* Premium Chat Container */}
          <div 
            ref={chatContainerRef} 
            className="px-6 overflow-y-auto transition-all duration-200 scrollbar-hide bg-black/20 backdrop-blur-sm border-t border-white/10"
            style={{ height: `${chatHeight}px` }}
          >
            {/* Premium Chat Messages */}
            {conversation.length > 0 && (
              <div className="space-y-3 mb-4">
                {conversation.slice(-4).map((msg, i) => (
                  <div key={i} className={`${msg.role === 'ai' ? 'text-left' : 'text-right'} animate-fade-in`}>
                    <div className={`inline-block max-w-[85%] p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
                      msg.role === 'ai' 
                        ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border-teal-500/40 text-teal-100 shadow-lg shadow-teal-500/20' 
                        : 'bg-gradient-to-br from-white/15 to-white/10 border-white/30 text-white shadow-lg'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {msg.role === 'ai' ? (
                          <div className="w-5 h-5 rounded-full bg-teal-400/20 border border-teal-400/40 flex items-center justify-center">
                            <Brain size={10} className="text-teal-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                            <MessageCircle size={10} className="text-white/80" />
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
                
                {/* Premium Thinking Indicator */}
                {isThinking && (
                  <div className="text-left">
                    <div className="inline-block bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 p-4 rounded-2xl backdrop-blur-sm shadow-lg shadow-teal-500/20">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-teal-400/20 border border-teal-400/40 flex items-center justify-center">
                          <Brain size={10} className="text-teal-400" />
                        </div>
                        <span className="text-xs font-semibold text-teal-100 tracking-wide">Libero</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-teal-100 font-medium">Tuning into your energy...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Premium Input Interface */}
          <div className="px-6 py-4 bg-black/95 backdrop-blur-xl border-t border-white/20">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center space-x-4">
                {/* Voice Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={!isMicEnabled || isThinking}
                  className={`p-4 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 backdrop-blur-sm border-2 ${
                    sessionState.isListening 
                      ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse shadow-lg shadow-red-500/30' 
                      : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
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
                    placeholder={sessionState.isListening ? "Listening..." : "Share what's happening for you..."}
                    disabled={sessionState.isListening || isThinking}
                    className="w-full bg-white/15 border border-white/30 rounded-2xl px-6 py-4 pr-16 text-white placeholder-white/60 focus:outline-none focus:border-teal-500/60 focus:bg-white/20 focus:shadow-lg focus:shadow-teal-500/20 transition-all disabled:opacity-50 text-lg backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isThinking}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-teal-500/30 border border-teal-500/50 text-teal-400 hover:bg-teal-500/40 hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 hover:scale-110 backdrop-blur-sm"
                  >
                    <Send size={18} />
                  </button>
                </div>

                {/* Audio Controls */}
                <button
                  type="button"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`p-4 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm border-2 ${
                    isVoiceEnabled 
                      ? 'bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30 shadow-lg shadow-green-500/30' 
                      : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
              </div>
            </form>
          </div>
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
    </div>
  );
}