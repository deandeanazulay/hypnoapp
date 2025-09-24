import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, Mic, MicOff, Send, MessageCircle, Brain, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import Orb from './Orb';
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
}

export default function UnifiedSessionWorld({ onComplete, onCancel, sessionConfig }: UnifiedSessionWorldProps) {
  const { user, updateUser, addExperience, incrementStreak } = useGameState();
  const { activeEgoState, showToast } = useAppStore();
  
  const [sessionState, setSessionState] = useState<SessionState>({
    depth: 1,
    breathing: 'inhale',
    phase: 'preparation',
    isListening: false,
    isSpeaking: false,
    isPaused: false,
    timeElapsed: 0,
    totalDuration: sessionConfig.customProtocol?.duration * 60 || 15 * 60 // Convert to seconds
  });

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'ai' | 'user', content: string, timestamp: number}>>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);

  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  // Initialize speech systems
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Initialize speech recognition
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

  // Auto-start session with protocol context
  useEffect(() => {
    if (conversation.length === 0) {
      setTimeout(() => {
        let welcomeMessage = '';
        
        if (sessionConfig.customProtocol?.name) {
          // Custom protocol - start immediately with script
          welcomeMessage = `Welcome to your ${sessionConfig.customProtocol.name}. We're focusing on ${sessionConfig.customProtocol.goals?.join(' and ') || 'transformation'} today. Let's begin right away. Close your eyes gently and take a deep, slow breath in through your nose...`;
        } else {
          // Default session
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

  // Timer for session
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
    // Award XP and update stats
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

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header - Clean and Minimal */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
                borderColor: egoColor.accent + '80'
              }}
            >
              <span className="text-sm">{egoState.icon}</span>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">
                {sessionConfig.customProtocol?.name || `${egoState.name} Session`}
              </h2>
              <p className="text-white/70 text-sm">Transformation Journey</p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area - Uses CSS Grid for Perfect Layout */}
      <div className="flex-1 grid grid-rows-[1fr_auto_auto] gap-6 p-6 overflow-hidden">
        
        {/* Top Section: Orb + Status */}
        <div className="flex flex-col items-center justify-center space-y-8 min-h-0">
          {/* Orb */}
          <div className="flex-shrink-0">
            <Orb
              ref={orbRef}
              onTap={togglePause}
              egoState={activeEgoState}
              size={280}
              afterglow={sessionState.depth > 3}
            />
          </div>

          {/* Session Status - Organized in Cards */}
          <div className="flex-shrink-0 w-full max-w-md space-y-4">
            {/* Phase Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
              <h3 className="text-white text-xl font-light mb-2">
                {sessionState.phase === 'preparation' ? 'Getting Comfortable And Centered' :
                 sessionState.phase === 'induction' ? 'Entering The Trance State' :
                 sessionState.phase === 'deepening' ? 'Going Deeper Into Relaxation' :
                 sessionState.phase === 'transformation' ? 'Creating Positive Changes' :
                 sessionState.phase === 'integration' ? 'Integrating New Patterns' :
                 'Completing The Journey'}
              </h3>
              <p className="text-white/70 text-sm">
                {sessionState.breathing === 'inhale' ? 'Breathe in slowly...' :
                 sessionState.breathing === 'hold-inhale' ? 'Hold gently...' :
                 sessionState.breathing === 'exhale' ? 'Breathe out slowly...' :
                 'Rest naturally...'}
              </p>
            </div>

            {/* Depth Indicator Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Trance Depth</span>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                          level <= sessionState.depth
                            ? 'border-transparent'
                            : 'border-white/20'
                        }`}
                        style={{
                          backgroundColor: level <= sessionState.depth ? egoColor.accent : 'transparent'
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-white font-medium text-sm">{sessionState.depth}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Progress & Controls */}
        <div className="flex-shrink-0 space-y-4">
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex items-center justify-between text-white/60 text-sm mb-2">
              <span>{formatTime(sessionState.timeElapsed)}</span>
              <span>{formatTime(sessionState.totalDuration)}</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${egoColor.accent}, ${egoColor.accent}cc)`
                }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={togglePause}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
            >
              {sessionState.isPaused ? <Play size={20} className="text-white ml-1" /> : <Pause size={20} className="text-white" />}
            </button>

            <button
              onClick={onCancel}
              className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all hover:scale-110"
            >
              <X size={20} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* Bottom Section: Chat Interface - Collapsible */}
        <div className="flex-shrink-0">
          {/* Chat Toggle */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setChatExpanded(!chatExpanded)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all hover:scale-105 text-sm"
            >
              <MessageCircle size={16} className="text-teal-400" />
              <span className="text-white/80">
                {chatExpanded ? 'Hide Chat' : 'Open Chat'}
              </span>
              {chatExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>

          {/* Expandable Chat Interface */}
          {chatExpanded && (
            <div className="bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 p-4 max-h-64 flex flex-col">
              {/* Recent Conversation */}
              {conversation.length > 0 && (
                <div className="flex-1 max-h-32 overflow-y-auto space-y-2 mb-4">
                  {conversation.slice(-2).map((msg, i) => (
                    <div key={i} className={`${msg.role === 'ai' ? 'text-left' : 'text-right'}`}>
                      <div className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'ai' 
                          ? 'bg-teal-500/20 border border-teal-500/30 text-teal-100' 
                          : 'bg-white/10 border border-white/20 text-white'
                      }`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {msg.role === 'ai' ? <Brain size={10} className="text-teal-400" /> : <MessageCircle size={10} className="text-white/60" />}
                          <span className="text-xs font-medium opacity-80">
                            {msg.role === 'ai' ? 'Libero' : 'You'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isThinking && (
                    <div className="text-left">
                      <div className="inline-block bg-teal-500/20 border border-teal-500/30 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Loader size={12} className="text-teal-400 animate-spin" />
                          <span className="text-xs text-teal-100">Tuning into your energy...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleSubmit} className="flex-shrink-0">
                <div className="flex items-center space-x-3">
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={!isMicEnabled || isThinking}
                    className={`p-3 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 ${
                      sessionState.isListening 
                        ? 'bg-red-500/20 border-2 border-red-500/60 text-red-400 animate-pulse' 
                        : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                    }`}
                  >
                    <Mic size={16} />
                  </button>

                  {/* Text Input with Send Button */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={sessionState.isListening ? "Listening..." : "Share what's on your mind..."}
                      disabled={sessionState.isListening || isThinking}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/50 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!textInput.trim() || isThinking}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 hover:bg-teal-500/30 transition-all disabled:opacity-50 hover:scale-110"
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                      className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                        isVoiceEnabled 
                          ? 'bg-green-500/20 border border-green-500/40 text-green-400' 
                          : 'bg-white/10 border border-white/20 text-white/60'
                      }`}
                    >
                      {isVoiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMicEnabled(!isMicEnabled)}
                      className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                        isMicEnabled 
                          ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' 
                          : 'bg-white/10 border border-white/20 text-white/60'
                      }`}
                    >
                      {isMicEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}