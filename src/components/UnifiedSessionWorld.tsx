import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, Mic, MicOff, Send, MessageCircle, Brain, Loader } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-full border flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
              borderColor: egoColor.accent + '80'
            }}
          >
            <span className="text-sm">{egoState.icon}</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">
              {sessionConfig.customProtocol?.name || `${egoState.name} Session`}
            </h2>
            <p className="text-white/70 text-sm">Transformation Journey</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-white/60 hover:text-white p-2">
          <X size={20} />
        </button>
      </div>

      {/* Main Session Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Orb */}
        <div className="mb-8">
          <Orb
            ref={orbRef}
            onTap={togglePause}
            egoState={activeEgoState}
            size={300}
            afterglow={sessionState.depth > 3}
          />
        </div>

        {/* Session Status */}
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-white text-2xl font-light">
            {sessionState.phase === 'preparation' ? 'Getting Comfortable And Centered' :
             sessionState.phase === 'induction' ? 'Entering The Trance State' :
             sessionState.phase === 'deepening' ? 'Going Deeper Into Relaxation' :
             sessionState.phase === 'transformation' ? 'Creating Positive Changes' :
             sessionState.phase === 'integration' ? 'Integrating New Patterns' :
             'Completing The Journey'}
          </h3>
          
          <p className="text-white/70">
            {sessionState.breathing === 'inhale' ? 'Breathe in slowly...' :
             sessionState.breathing === 'hold-inhale' ? 'Hold gently...' :
             sessionState.breathing === 'exhale' ? 'Breathe out slowly...' :
             'Rest naturally...'}
          </p>

          {/* Depth Indicator */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-white/60 text-sm">Depth:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-full border ${
                    level <= sessionState.depth
                      ? `bg-${egoColor.baseColorName}-400 border-${egoColor.baseColorName}-400`
                      : 'border-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-white font-medium">{sessionState.depth}/5</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="flex items-center justify-between text-white/60 text-sm mb-2">
            <span>{formatTime(sessionState.timeElapsed)}</span>
            <span>{formatTime(sessionState.totalDuration)}</span>
          </div>
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${egoColor.accent}, ${egoColor.accent}cc)`
              }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="absolute bottom-4 flex items-center space-x-4">
          <button
            onClick={togglePause}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          >
            {sessionState.isPaused ? <Play size={20} className="text-white ml-1" /> : <Pause size={20} className="text-white" />}
          </button>

          <button
            onClick={onCancel}
            className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all hover:scale-110"
          >
            <X size={20} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Permanent Chat Interface at Bottom */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-4">
        {/* Recent Conversation (Compact) */}
        {conversation.length > 0 && (
          <div className="mb-4 max-h-32 overflow-y-auto space-y-2">
            {conversation.slice(-2).map((msg, i) => (
              <div key={i} className={`${msg.role === 'ai' ? 'text-left' : 'text-right'}`}>
                <div className={`inline-block max-w-[80%] p-2 rounded-lg text-sm ${
                  msg.role === 'ai' 
                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-100' 
                    : 'bg-white/10 border border-white/20 text-white'
                }`}>
                  <div className="flex items-center space-x-1 mb-1">
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
                <div className="inline-block bg-teal-500/20 border border-teal-500/30 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader size={10} className="text-teal-400 animate-spin" />
                    <span className="text-xs text-teal-100">Tuning into your energy...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
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
              placeholder={sessionState.isListening ? "Listening..." : "Share what's on your mind, or use voice..."}
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
          <div className="flex items-center space-x-2">
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
        </form>
      </div>
    </div>
  );
}