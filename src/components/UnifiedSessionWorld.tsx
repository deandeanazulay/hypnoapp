import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Volume2, VolumeX, Mic, MicOff, Send, MessageCircle, Brain, Loader, Circle, Users } from 'lucide-react';
import Orb from './Orb';
import GlassCard from './ui/GlassCard';
import { useGameState } from './GameStateManager';
import { useAppStore, getEgoState } from '../store';
import { useSessionStore } from '../store/sessionStore';
import { getEgoColor } from '../config/theme';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

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

export default function UnifiedSessionWorld({ onComplete, onCancel, sessionConfig }: UnifiedSessionWorldProps) {
  const { user, updateUser, addExperience, incrementStreak } = useGameState();
  const { activeEgoState, showToast, openEgoModal } = useAppStore();
  const { isAuthenticated } = useSimpleAuth();
  const { sessionHandle, sessionState, startNewSession, play, pause, nextSegment, prevSegment, disposeSession } = useSessionStore();
  
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [conversation, setConversation] = useState<Array<{role: 'ai' | 'user', content: string, timestamp: number}>>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionMode, setSessionMode] = useState<'auto' | 'interactive'>('auto');
  const [chatHeight, setChatHeight] = useState(80); // Default chat height in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const orbRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');

  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  // Initialize session when component mounts or config changes
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await startNewSession({
          goalId: sessionConfig.goal?.id || sessionConfig.action?.id || 'general-transformation',
          egoState: sessionConfig.egoState,
          lengthSec: (sessionConfig.duration || 15) * 60,
          locale: 'en-US',
          level: user?.level || 1,
          streak: user?.session_streak || 0,
          userPrefs: {
            voiceEnabled: isVoiceEnabled,
            experience: user?.experience || 0,
            customProtocol: sessionConfig.customProtocol
          }
        });
      } catch (error) {
        console.error('[SESSION] Failed to initialize session:', error);
        showToast({ type: 'error', message: 'Failed to start session' });
      }
    };

    initializeSession();

    return () => {
      disposeSession();
    };
  }, [sessionConfig]);

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
          };

          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Speech recognized:', transcript);
            handleUserInput(transcript);
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            
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

  // Update orb state
  useEffect(() => {
    if (orbRef.current) {
      orbRef.current.updateState({
        depth: sessionState.currentSegmentIndex + 1,
        breathing: 'inhale', // Default breathing state
        phase: sessionState.scriptPlan ? 'active' : 'loading'
      });
      orbRef.current.setSpeaking(sessionState.playState === 'playing');
      orbRef.current.setListening(false); // Voice input handled separately
    }
  }, [sessionState]);

  // Handle session state changes
  useEffect(() => {
    if (sessionState.playState === 'stopped' && sessionState.error === null && sessionState.currentSegmentIndex > 0) {
      // Session completed naturally
      handleSessionComplete();
    }
    if (sessionState.error) {
      showToast({ type: 'error', message: sessionState.error.message });
    }
  }, [sessionState.playState, sessionState.error]);

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
    };

    utterance.onend = () => {
      console.log('[SPEECH] Speech ended');
    };

    utterance.onerror = (event) => {
      console.error('[SPEECH] Speech synthesis error:', event.error);
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
      }
      
      if (import.meta.env.DEV) {
        console.log('Starting speech recognition');
      }
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      showToast({
        type: 'error',
        message: 'Could not start voice recognition. Please try again.'
      });
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
    
    disposeSession();
    showToast({ type: 'success', message: 'Session completed! +20 XP earned.' });
    onComplete();
  };

  const togglePlayPause = () => {
    if (sessionState.playState === 'playing') {
      pause();
    } else if (sessionState.playState === 'paused') {
      play();
    }
  };

  const handleSessionCancel = () => {
    disposeSession();
    onCancel();
  };

  const getPhaseTitle = () => {
    if (!sessionState.scriptPlan) return 'Preparing Session...';
    
    const currentSegment = sessionState.scriptPlan.segments[sessionState.currentSegmentIndex];
    if (currentSegment) {
      return `Segment ${sessionState.currentSegmentIndex + 1} of ${sessionState.totalSegments}`;
    }
    return 'Session Active';
  };

  const getBreathingInstruction = () => {
    // Simple breathing pattern for visual guidance
    const breathingCycle = Math.floor(Date.now() / 8000) % 4;
    switch (breathingCycle) {
      case 0: return 'Inhale';
      case 1: return 'Hold';
      case 2: return 'Exhale';
      case 3: return 'Hold';
      default: return 'Breathe';
    }
  };

  const getBreathingScale = () => {
    // Smooth breathing animation based on time
    const breathingTime = (Date.now() % 8000) / 8000; // 8 second cycle
    return 1 + 0.1 * Math.sin(breathingTime * Math.PI * 2);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <p className="text-white/70 text-xs">{getPhaseTitle()}</p>
            </div>
          </div>
          
          {/* Time Display */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-white font-medium text-sm">
                {sessionState.currentSegmentIndex + 1}/{sessionState.totalSegments}
              </div>
              <div className="text-white/60 text-xs">
                {sessionState.playState === 'loading' ? 'Loading...' : 
                 sessionState.bufferedAhead > 0 ? `${sessionState.bufferedAhead} buffered` : 'Ready'}
              </div>
            </div>
            <button 
              onClick={handleSessionCancel} 
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
                width: `${sessionState.totalSegments > 0 ? ((sessionState.currentSegmentIndex + 1) / sessionState.totalSegments) * 100 : 0}%`,
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
                      level <= Math.min(sessionState.currentSegmentIndex + 1, 5) ? 'opacity-100 shadow-lg' : 'opacity-30'
                    }`}
                    style={{
                      backgroundColor: egoColor.accent,
                      boxShadow: level <= Math.min(sessionState.currentSegmentIndex + 1, 5) ? `0 0 10px ${egoColor.accent}60` : 'none'
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
                {sessionState.playState.charAt(0).toUpperCase() + sessionState.playState.slice(1)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Session Status */}
        <div className="mt-3 flex items-center justify-center">
          <div className="flex items-center space-x-2 px-3 py-2 bg-black/30 border border-white/20 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              sessionState.playState === 'playing' ? 'bg-green-400 animate-pulse' :
              sessionState.playState === 'paused' ? 'bg-yellow-400' :
              sessionState.playState === 'loading' ? 'bg-blue-400 animate-spin' :
              'bg-gray-400'
            }`} />
            <span className="text-xs font-medium text-white/80">
              {sessionState.playState === 'playing' ? 'Guided session active' :
               sessionState.playState === 'paused' ? 'Session paused' :
               sessionState.playState === 'loading' ? 'Preparing session...' :
               'Session ready'}
            </span>
          </div>
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
              filter: Math.min(sessionState.currentSegmentIndex + 1, 5) > 3 
                ? `drop-shadow(0 0 60px ${egoColor.accent}60) drop-shadow(0 0 120px ${egoColor.accent}30)` 
                : `drop-shadow(0 0 30px ${egoColor.accent}40)`,
              transformOrigin: 'center center'
            }}
          >
            <Orb
              ref={orbRef}
              onTap={togglePlayPause}
              egoState={activeEgoState}
              size={320}
              afterglow={Math.min(sessionState.currentSegmentIndex + 1, 5) > 3}
            />
            
            {/* Premium Eye Fixation Dot */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 pointer-events-none transition-all duration-1000"
              style={{
                borderColor: `${egoColor.accent}cc`,
                backgroundColor: egoColor.accent,
                boxShadow: `0 0 30px ${egoColor.accent}90, 0 0 60px ${egoColor.accent}50, inset 0 0 10px rgba(255,255,255,0.3)`,
                animation: getBreathingInstruction() === 'inhale' || getBreathingInstruction() === 'exhale' ? 'none' : 'pulse 2s ease-in-out infinite'
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
          {/* Communication Input Row */}
          <form onSubmit={handleSubmit}>
            <div className="flex items-center space-x-3">
              {/* Voice Record Button */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={!isMicEnabled || isThinking || micPermission === 'denied'}
                className={`w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 backdrop-blur-sm border-2 ${
                  false // sessionState.isListening - using local listening state for chat
                    ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse shadow-lg shadow-red-500/30' 
                    : micPermission === 'denied'
                    ? 'bg-gray-500/20 border-gray-500/40 text-gray-400'
                    : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
                }`}
                title={
                  micPermission === 'denied' 
                    ? 'Microphone access denied' 
                    : false // sessionState.isListening
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
                    false ? "Listening..." : // sessionState.isListening - using local state
                    "Share what's happening for you..."
                  }
                  disabled={false || isThinking} // sessionState.isListening - using local state
                  className="w-full bg-white/15 border border-white/30 rounded-2xl px-6 py-3 pr-16 text-white placeholder-white/60 focus:outline-none focus:border-teal-500/60 focus:bg-white/20 focus:shadow-lg focus:shadow-teal-500/20 transition-all disabled:opacity-50 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isThinking}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-teal-500/30 border border-teal-500/50 text-teal-400 hover:bg-teal-500/40 hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 hover:scale-110 backdrop-blur-sm"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
            </div>
          </form>
          
          {/* Session Progress Info */}
          <div className="mt-3 text-center">
            <p className="text-xs text-white/60">
              Session progress: {sessionState.currentSegmentIndex + 1} of {sessionState.totalSegments} segments
              {sessionState.bufferedAhead > 0 && ` • ${sessionState.bufferedAhead} buffered ahead`}
            </p>
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
      
      {/* Floating Control Sidebar */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 space-y-3">
        {/* Auto/Interactive Mode Toggle */}
        <button
          onClick={() => setSessionMode('auto')}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg ${
            sessionMode === 'auto'
              ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-green-500/30' 
              : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/20'
          }`}
          title="Auto-guided session"
        >
          <Circle size={18} />
        </button>
        
        <button
          onClick={() => setSessionMode('interactive')}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg ${
            sessionMode === 'interactive'
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-cyan-500/30' 
              : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/20'
          }`}
          title="Interactive session"
        >
          <MessageCircle size={18} />
        </button>
        
        {/* Pause/Play */}
        <button
          onClick={togglePlayPause}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg ${
            sessionState.playState === 'paused'
              ? 'bg-green-500/20 border-green-500/40 text-green-400 shadow-green-500/30' 
              : 'bg-red-500/20 border-red-500/40 text-red-400 shadow-red-500/30'
          }`}
        >
          {sessionState.playState === 'paused' ? <Play size={18} className="ml-0.5" /> : <Pause size={18} />}
        </button>
        
        {/* Previous Segment */}
        <button
          onClick={prevSegment}
          disabled={sessionState.currentSegmentIndex <= 0}
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg bg-white/10 border-white/30 text-white/60 hover:bg-white/20 disabled:opacity-30"
        >
          <span className="text-sm">‹</span>
        </button>
        
        {/* Next Segment */}
        <button
          onClick={nextSegment}
          disabled={sessionState.currentSegmentIndex >= sessionState.totalSegments - 1}
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm shadow-lg bg-white/10 border-white/30 text-white/60 hover:bg-white/20 disabled:opacity-30"
        >
          <span className="text-sm">›</span>
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