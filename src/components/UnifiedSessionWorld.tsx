import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft, Pause, Play, SkipForward, SkipBack, Settings, Target, Brain, Heart, Zap, Wind, Clock, Activity, Eye } from 'lucide-react';
import Orb from './Orb';
import { useAppStore } from "../store";
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';
import AIVoiceSystem from './premium/PremiumFeatures';</action>

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
  const { user, addExperience, incrementStreak, updateEgoStateUsage } = useGameState();</action>
  
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
            phase: sessionState.scriptPlan ? 'active' : 'preparation',
            depth: Math.min(sessionState.currentSegmentIndex + 1, 5),
            breathing: 'inhale',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserInput(textInput.trim());
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (!isVoiceEnabled && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
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
      <div className="relative z-50 flex items-center justify-between p-4 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Exit</span>
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-light text-white">Session with Libero</h1>
          <p className="text-sm text-white/70 capitalize">{sessionConfig.egoState} • {sessionWorldState.phase}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-white font-medium text-sm">{formatTime(sessionWorldState.timeRemaining)}</div>
            <div className="text-white/60 text-xs">remaining</div>
          </div>
          <button
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-all hover:scale-110 ${
              isVoiceEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/10 text-white/60 border border-white/20'
            }`}
          >
            {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Session Area */}
      <div className="relative z-10 flex-1 h-screen">
        {/* Central Orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Orb
              ref={orbRef}
              onTap={() => {}}
              egoState={activeEgoState}
              afterglow={sessionWorldState.orbEnergy > 0.7}
              size={300}
              variant="webgl"
            />
            
            {/* Orb Status Overlay */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
                <div className="text-white/90 text-sm font-medium mb-1">{getBreathingPrompt()}</div>
                <div className="text-white/60 text-xs">Depth Level {sessionWorldState.depth}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Indicators - Top */}
        <div className="absolute top-4 left-4 right-4 z-30">
          <div className="flex items-center justify-between">
            {/* Phase Indicator */}
            <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  sessionWorldState.phase === 'preparation' ? 'bg-blue-400' :
                  sessionWorldState.phase === 'induction' ? 'bg-teal-400' :
                  sessionWorldState.phase === 'deepening' ? 'bg-purple-400' :
                  sessionWorldState.phase === 'exploration' ? 'bg-yellow-400' :
                  sessionWorldState.phase === 'transformation' ? 'bg-orange-400' :
                  sessionWorldState.phase === 'integration' ? 'bg-green-400' :
                  'bg-white'
                } animate-pulse`} />
                <span className="text-white/90 text-sm font-medium capitalize">{sessionWorldState.phase}</span>
              </div>
              <div className="text-white/60 text-xs mt-1">{getPhaseDescription()}</div>
            </div>

            {/* Progress Ring */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle 
                  cx="32" cy="32" r="28" fill="none" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-teal-400"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 28}`,
                    strokeDashoffset: `${2 * Math.PI * 28 * (sessionWorldState.timeRemaining / sessionWorldState.totalTime)}`
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/90 text-xs font-medium">{Math.round((1 - sessionWorldState.timeRemaining / sessionWorldState.totalTime) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons - Left Side */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3">
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            {sessionWorldState.isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-0.5" />}
          </button>
          
          <button
            onClick={skipBack}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            <SkipBack size={18} className="text-white/80" />
          </button>
          
          <button
            onClick={skipForward}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            <SkipForward size={18} className="text-white/80" />
          </button>
        </div>

        {/* Floating Action Buttons - Right Side */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3">
          <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20">
            <div className="text-center">
              <div className="text-white/90 text-lg font-bold">{sessionWorldState.depth}</div>
              <div className="text-white/60 text-xs">Depth</div>
            </div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                sessionWorldState.breathing === 'inhale' ? 'bg-blue-400 animate-pulse' :
                sessionWorldState.breathing === 'hold-inhale' ? 'bg-teal-400' :
                sessionWorldState.breathing === 'exhale' ? 'bg-purple-400 animate-pulse' :
                sessionWorldState.breathing === 'hold-exhale' ? 'bg-pink-400' :
                'bg-white/40'
              }`} />
              <div className="text-white/60 text-xs">Breath</div>
            </div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20">
            <div className="text-center">
              <div className="text-white/90 text-sm font-bold">{Math.round(sessionWorldState.orbEnergy * 100)}%</div>
              <div className="text-white/60 text-xs">Energy</div>
            </div>
          </div>
        </div>

        {/* Conversation Overlay - Bottom Left */}
        {conversation.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 z-40">
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

        {/* Header */}
        {/* Input Dock - The dock you like! */}
        <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-black/60 backdrop-blur-xl border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleListening}
              disabled={!isMicEnabled || micPermission === 'denied'}
              className={`p-3 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : micPermission === 'granted' && isMicEnabled
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message or use voice..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"
              disabled={isThinking}
            />

            <button
              type="submit"
              disabled={!textInput.trim() || isThinking}
              className="p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-white/30 rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

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