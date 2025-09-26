import React, { useState, useRef, useEffect } from 'react';
import Orb from './Orb';
import { useAppStore, getEgoState } from '../store';
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';
import { LIBERO_BRAND } from '../config/theme';
import { 
  X, MessageCircle, Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Mic, Send, Brain, Loader, Activity, Clock, Wind, Eye
} from 'lucide-react';

// Fixation Cue Component
interface FixationCueProps {
  breathing: string;
  isVisible: boolean;
  showAIMessage: boolean;
  orbSize: number;
}

function FixationCue({ breathing, isVisible, showAIMessage, orbSize }: FixationCueProps) {
  const [opacity, setOpacity] = useState(1);
  const [isAutoDimmed, setIsAutoDimmed] = useState(false);
  const autoDimTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-dim after 10 seconds
  useEffect(() => {
    if (isVisible && !showAIMessage) {
      if (autoDimTimerRef.current) {
        clearTimeout(autoDimTimerRef.current);
      }
      
      setIsAutoDimmed(false);
      setOpacity(1);
      
      autoDimTimerRef.current = setTimeout(() => {
        setIsAutoDimmed(true);
        setOpacity(0.6);
      }, 10000);
    }
    
    return () => {
      if (autoDimTimerRef.current) {
        clearTimeout(autoDimTimerRef.current);
      }
    };
  }, [isVisible, showAIMessage, breathing]);
  
  if (!isVisible || showAIMessage) return null;
  
  // Phase-aware text variations
  const getFixationText = () => {
    switch (breathing) {
      case 'inhale': return 'Let the orb gently grow—keep your eyes soft';
      case 'hold-inhale': return 'Stay with the stillness';
      case 'exhale': return 'Follow the release';
      case 'hold-exhale': return 'Rest in the quiet space';
      default: return 'Rest your gaze softly on the orb';
    }
  };
  
  // Breathing opacity sync
  const getBreathingOpacity = () => {
    const baseOpacity = isAutoDimmed ? 0.6 : 1;
    switch (breathing) {
      case 'inhale': return baseOpacity * 1.0;
      case 'hold-inhale': return baseOpacity * 0.85;
      case 'exhale': return baseOpacity * 0.9;
      case 'hold-exhale': return baseOpacity * 0.8;
      default: return baseOpacity * 0.9;
    }
  };
  
  // Check if we should flip above orb
  const shouldFlipAbove = window.innerHeight < 700;
  
  return (
    <div 
      className={`absolute z-[120] pointer-events-none transition-all duration-1000 ${
        shouldFlipAbove ? 'bottom-full mb-8' : 'top-full mt-8'
      }`}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: getBreathingOpacity(),
        maxWidth: '320px',
        textAlign: 'center'
      }}
    >
      <p 
        className="text-sm font-medium leading-relaxed"
        style={{ 
          color: LIBERO_BRAND.colors.textSecondary,
          fontFamily: LIBERO_BRAND.typography.bodyM.fontFamily || 'Inter, sans-serif'
        }}
      >
        {getFixationText()}
      </p>
    </div>
  );
}

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
  const [showFixationCue, setShowFixationCue] = useState(true);
  
  // Session management
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [sessionManagerState, setSessionManagerState] = useState<any>({
    playState: 'stopped',
    currentSegmentIndex: 0,
    currentSegmentId: null,
    totalSegments: 0,
    scriptPlan: null,
    bufferedAhead: 0
  });
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const initSessionOnce = useRef(false);

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
    if (initSessionOnce.current) {
      return;
    }
    initSessionOnce.current = true;
    
    const initSession = async () => {
      setScriptLoading(true);
      try {
        console.log('Session: Initializing session manager...');
        const manager = new SessionManager();
        setSessionManager(manager);
        
        manager.on('state-change', (newState: any) => {
          setSessionManagerState(newState);
        });

        manager.on('play', () => {
          setSessionState(prev => ({ ...prev, isPlaying: true }));
        });

        manager.on('pause', () => {
          setSessionState(prev => ({ ...prev, isPlaying: false }));
        });

        manager.on('end', () => {
          console.log('Session: Session ended by manager');
          handleSessionComplete();
        });
        
        // Create proper context for script generation
        const scriptContext = {
          goalId: sessionConfig.goal || sessionConfig.customProtocol?.goals?.[0] || sessionConfig.protocol?.category || 'transformation',
          egoState: sessionConfig.egoState,
          lengthSec: sessionConfig.duration * 60,
          locale: 'en-US',
          level: user?.level || 1,
          streak: user?.session_streak || 0,
          userPrefs: {
            customProtocol: sessionConfig.customProtocol,
            protocol: sessionConfig.protocol,
            sessionType: sessionConfig.type
          }
        };
        
        await manager.initialize(scriptContext);
        console.log('Session: Manager initialized successfully');
        setScriptLoading(false);
        
      } catch (error) {
        console.error('Session initialization failed:', error);
        setScriptLoading(false);
        showToast({ type: 'error', message: 'Failed to start session' });
      }
    };

    initSession();

    return () => {
      console.log('Session: Cleaning up session effect');
      initSessionOnce.current = false;
      
      if (sessionManager) {
        sessionManager.dispose();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Empty deps - init once only

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

  // Listen for segment changes and update conversation
  useEffect(() => {
    if (sessionManagerState.scriptPlan && sessionManagerState.currentSegmentId) {
      const currentSegment = sessionManagerState.scriptPlan.segments?.find(
        (s: any) => s.id === sessionManagerState.currentSegmentId
      );
      
      if (currentSegment?.text) {
        const aiMessage = { 
          role: 'ai' as const, 
          content: currentSegment.text, 
          timestamp: Date.now() 
        };
        
        setConversation(prev => {
          // Only add if it's not already the last message
          const lastMessage = prev[prev.length - 1];
          if (!lastMessage || lastMessage.content !== currentSegment.text) {
            return [...prev, aiMessage];
          }
          return prev;
        });
        
        setShowCoachBubble(true);
      }
    }
  }, [sessionManagerState.currentSegmentId, sessionManagerState.scriptPlan]);

  // Event handlers
  const handleUserInput = async (input: string) => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input, timestamp: Date.now() };
    setConversation(prev => [...prev, userMessage]);
    setTextInput('');
    setIsThinking(true);

    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl) {
        const fallbackMessage = getLocalFallbackResponse(input, sessionConfig.egoState);
        const aiMessage = { role: 'ai' as const, content: fallbackMessage, timestamp: Date.now() };
        setConversation(prev => [...prev, aiMessage]);
        
        if (isVoiceEnabled) {
          speakText(fallbackMessage);
        }
        return;
      }
      
      const baseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;
      
      const response = await fetch(`${baseUrl}/functions/v1/ai-hypnosis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionContext: {
            egoState: sessionConfig.egoState,
            phase: sessionState.phase,
            depth: sessionState.depth,
            breathing: sessionState.breathing,
            userProfile: user || { level: 1 },
            conversationHistory: conversation.map(msg => ({
              role: msg.role === 'ai' ? 'assistant' : 'user',
              content: msg.content
            })),
            customProtocol: sessionConfig.customProtocol
          },
          requestType: 'guidance'
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }

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
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      const fallbackMessage = getLocalFallbackResponse(input, sessionConfig.egoState);
      
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
    console.log('UI: Play/Pause clicked, current state:', sessionManagerState.playState);
    if (sessionManager) {
      if (sessionManagerState.playState === 'playing') {
        console.log('UI: Calling pause()');
        sessionManager.pause();
      } else {
        console.log('UI: Calling play() - USER GESTURE');
        sessionManager.play();
      }
    } else {
      console.error('UI: SessionManager not ready');
    }
  };

  const skipForward = () => {
    console.log('UI: Skip forward clicked');
    sessionManager?.next();
  };
  
  const skipBack = () => {
    console.log('UI: Skip back clicked');
    sessionManager?.prev();
  };

  const toggleCoachBubble = () => setShowCoachBubble(!showCoachBubble);

  const getSessionTitle = () => {
    if (sessionConfig.customProtocol?.name) return sessionConfig.customProtocol.name;
    if (sessionConfig.protocol?.name) return sessionConfig.protocol.name;
    if (sessionConfig.action?.name) return sessionConfig.action.name;
    return `${currentEgoState.name} Session`;
  };

  // Local fallback responses for when API is not available
  const getLocalFallbackResponse = (input: string, egoState: string) => {
    const inputLower = input.toLowerCase();
    
    // Context-aware responses based on input
    if (inputLower.includes('stress') || inputLower.includes('anxious') || inputLower.includes('worried')) {
      return "Feel your breath naturally slowing down. With each exhale, stress flows away like water. You are safe and protected here.";
    }
    
    if (inputLower.includes('relax') || inputLower.includes('calm') || inputLower.includes('peace')) {
      return "Yes, let that relaxation deepen now. Feel it spreading through every muscle, every fiber of your being. Perfect.";
    }
    
    if (inputLower.includes('confident') || inputLower.includes('strong') || inputLower.includes('powerful')) {
      return "Feel that confidence growing stronger within you. You carry this strength in every cell of your body. Trust in your power.";
    }
    
    if (inputLower.includes('ready') || inputLower.includes('begin') || inputLower.includes('start')) {
      return "Excellent. You're ready for this transformation. Close your eyes and let your breathing become natural and deep.";
    }
    
    // Ego state specific responses
    const egoResponses: { [key: string]: string } = {
      guardian: "You are completely safe and protected. Trust in your inner guardian as you continue this journey deeper.",
      rebel: "Feel your power to break free from what no longer serves you. Each breath is an act of liberation.",
      healer: "Healing energy flows through you now. Feel it reaching every part that needs restoration and renewal.",
      explorer: "What a wonderful discovery you're making. Keep exploring these new territories within yourself.",
      mystic: "Connect with the infinite wisdom within you. You are tapping into something much greater than yourself."
    };
    
    return egoResponses[egoState] || "I'm here with you. Continue breathing naturally and trust the process. You're doing perfectly.";
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
        case 'f':
        case 'F':
          e.preventDefault();
          setShowFixationCue(!showFixationCue);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sessionManagerState.playState, isVoiceEnabled, showFixationCue]);

  // Show loading screen while script is being generated
  if (scriptLoading) {
    return (
      <div 
        className="h-screen text-white overflow-hidden flex items-center justify-center"
        style={{ 
          background: LIBERO_BRAND.colors.midnight,
          fontFamily: LIBERO_BRAND.typography.bodyM.fontFamily || 'Inter, sans-serif'
        }}
      >
        {/* Cosmic Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, ${LIBERO_BRAND.colors.midnight} 0%, ${LIBERO_BRAND.colors.deepSpace} 50%, ${LIBERO_BRAND.colors.midnight} 100%)`
            }}
          />
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-35 animate-pulse"
            style={{ background: LIBERO_BRAND.gradients.brandAura }}
          />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center max-w-lg px-6">
          {/* Loading Orb */}
          <div className="mb-8">
            <div 
              className="w-24 h-24 mx-auto rounded-full border-4 border-t-transparent animate-spin"
              style={{ 
                borderColor: `${LIBERO_BRAND.colors.liberoTeal}40`,
                borderTopColor: LIBERO_BRAND.colors.liberoTeal
              }}
            />
          </div>

          {/* Loading Text */}
          <h2 
            className="text-2xl font-light mb-4"
            style={{ 
              color: LIBERO_BRAND.colors.textPrimary,
              fontFamily: LIBERO_BRAND.typography.h2.fontFamily || 'Cal Sans, Inter, sans-serif'
            }}
          >
            Libero is creating your custom hypnosis session
          </h2>
          
          <div className="space-y-3 mb-6">
            <p 
              className="text-base"
              style={{ color: LIBERO_BRAND.colors.textSecondary }}
            >
              {sessionConfig.customProtocol?.name || sessionConfig.protocol?.name || 'Crafting your personalized transformation'}
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Brain size={16} style={{ color: LIBERO_BRAND.colors.liberoTeal }} />
              <span style={{ color: LIBERO_BRAND.colors.textMuted }}>
                AI generating {sessionConfig.duration}-minute script with {currentEgoState.name} energy
              </span>
            </div>
          </div>

          {/* Session Details */}
          <div 
            className="backdrop-blur-xl border rounded-xl p-4"
            style={{
              background: LIBERO_BRAND.colors.surface1,
              borderColor: `${LIBERO_BRAND.colors.divider}40`
            }}
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: LIBERO_BRAND.colors.textMuted }}>Ego State:</span>
                <span style={{ color: LIBERO_BRAND.colors.textPrimary }}>{currentEgoState.name} {currentEgoState.icon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: LIBERO_BRAND.colors.textMuted }}>Duration:</span>
                <span style={{ color: LIBERO_BRAND.colors.textPrimary }}>{sessionConfig.duration} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: LIBERO_BRAND.colors.textMuted }}>Focus:</span>
                <span style={{ color: LIBERO_BRAND.colors.textPrimary }}>
                  {sessionConfig.customProtocol?.goals?.[0] || 
                   sessionConfig.goal?.name || 
                   sessionConfig.protocol?.category || 
                   'Personal transformation'}
                </span>
              </div>
            </div>
          </div>

          {/* Subtle animation hints */}
          <div className="mt-8 flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: LIBERO_BRAND.colors.liberoTeal,
                  animation: `breathe-glow 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progress = (sessionState.totalTime - sessionState.timeRemaining) / sessionState.totalTime;
  const currentSegment = (sessionManagerState.currentSegmentIndex || 0) + 1;
  const totalSegments = sessionManagerState.scriptPlan?.segments?.length || 0;
  const bufferedAhead = sessionManagerState.bufferedAhead;
  const latestAiMessage = conversation.filter(msg => msg.role === 'ai').slice(-1)[0];

  return (
    <div 
      className="h-screen text-white overflow-hidden"
      style={{ 
        background: LIBERO_BRAND.colors.midnight,
        fontFamily: LIBERO_BRAND.typography.bodyM.fontFamily || 'Inter, sans-serif'
      }}
    >

      {/* Cosmic Background with Brand Aura */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, ${LIBERO_BRAND.colors.midnight} 0%, ${LIBERO_BRAND.colors.deepSpace} 50%, ${LIBERO_BRAND.colors.midnight} 100%)`
          }}
        />
        
        {/* Brand aura gradients */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-35"
          style={{ background: LIBERO_BRAND.gradients.brandAura }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{ 
            background: `radial-gradient(circle at center, ${LIBERO_BRAND.colors.iris}15 0%, transparent 70%)`
          }}
        />
        
        {/* Subtle stars */}
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${0.5 + Math.random() * 1.5}px`,
              height: `${0.5 + Math.random() * 1.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: LIBERO_BRAND.colors.textMuted,
              opacity: 0.2,
              animation: `twinkle ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Container with Layout Variables */}
      <div className="h-full flex flex-col session-layout">
        
        {/* Fixed Header (App Bar) - Brand Style */}
        <header 
          className="fixed top-0 left-0 right-0 z-[200] backdrop-blur-xl border-b border-white/10"
          style={{ 
            height: '64px',
            background: `${LIBERO_BRAND.colors.midnight}F0`,
            boxShadow: LIBERO_BRAND.elevation.e1
          }}
        >
          <div 
            className="h-full flex items-center justify-between"
            style={{ padding: '0 24px' }}
          >
            {/* Left: Title + Subtitle */}
            <div className="flex-shrink-0">
              <h1 
                className="font-semibold leading-tight"
                style={{ 
                  fontSize: '18px',
                  color: LIBERO_BRAND.colors.textPrimary,
                  fontFamily: LIBERO_BRAND.typography.h3.fontFamily || 'Cal Sans, Inter, sans-serif'
                }}
              >
                {getSessionTitle()}
              </h1>
              <p 
                className="text-sm"
                style={{ color: LIBERO_BRAND.colors.textSecondary }}
              >
                Segment {currentSegment} of {totalSegments}
              </p>
            </div>

            {/* Center: Progress Bar (Brand Primary) */}
            <div className="flex-1 max-w-md mx-8">
              <div 
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: `${LIBERO_BRAND.colors.divider}60` }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-700"
                  style={{ 
                    width: `${progress * 100}%`,
                    background: `linear-gradient(90deg, ${LIBERO_BRAND.colors.liberoTeal}, ${LIBERO_BRAND.colors.iris})`
                  }}
                />
              </div>
            </div>

            {/* Right: Stats + Close */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="text-right">
                <div 
                  className="text-sm font-semibold"
                  style={{ color: LIBERO_BRAND.colors.textPrimary }}
                >
                  {currentSegment}/{totalSegments}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: LIBERO_BRAND.colors.textMuted }}
                >
                  Queued: {bufferedAhead}
                </div>
              </div>
              <button
                onClick={onCancel}
                title="Close Session"
                className="w-10 h-10 backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
                style={{
                  background: LIBERO_BRAND.colors.surface1,
                  borderColor: `${LIBERO_BRAND.colors.divider}60`,
                  borderRadius: LIBERO_BRAND.radius.control,
                  color: LIBERO_BRAND.colors.textSecondary
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area - 3 Column Grid */}
        <div 
          className="flex-1 grid"
          style={{
            gridTemplateColumns: '72px 1fr 84px',
            paddingTop: '80px',
            paddingBottom: '104px',
            paddingLeft: '24px',
            paddingRight: '24px',
            gap: '24px'
          }}
        >
          {/* Left Rail - Square Control Cards */}
          <div className="flex flex-col justify-center space-y-3 z-[150]">
            {/* Play/Pause (Primary Control) */}
            <button
              onClick={togglePlayPause}
              title={`${sessionManagerState.playState === 'playing' ? 'Pause' : 'Start'} Session (Space)`}
              className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: sessionManagerState.playState === 'playing' 
                  ? `linear-gradient(135deg, ${LIBERO_BRAND.colors.gold}30, ${LIBERO_BRAND.colors.danger}20)`
                  : `linear-gradient(135deg, ${LIBERO_BRAND.colors.success}30, ${LIBERO_BRAND.colors.liberoTeal}20)`,
                borderColor: sessionManagerState.playState === 'playing' 
                  ? `${LIBERO_BRAND.colors.gold}60` 
                  : `${LIBERO_BRAND.colors.success}60`,
                color: sessionManagerState.playState === 'playing' ? LIBERO_BRAND.colors.gold : LIBERO_BRAND.colors.success,
                boxShadow: sessionManagerState.playState === 'playing' ? LIBERO_BRAND.gradients.ctaGlow : LIBERO_BRAND.elevation.e1
              }}
            >
              {sessionManagerState.playState === 'playing' ? (
                <Pause size={24} />
              ) : (
                <Play size={24} className="ml-0.5" />
              )}
            </button>

            {/* Chat Toggle */}
            <button
              onClick={toggleCoachBubble}
              title="Chat with Libero (C)"
              className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: showCoachBubble 
                  ? `${LIBERO_BRAND.colors.liberoTeal}30`
                  : LIBERO_BRAND.colors.surface1,
                borderColor: showCoachBubble 
                  ? `${LIBERO_BRAND.colors.liberoTeal}60` 
                  : `${LIBERO_BRAND.colors.divider}40`,
                color: showCoachBubble ? LIBERO_BRAND.colors.liberoTeal : LIBERO_BRAND.colors.textSecondary
              }}
            >
              <MessageCircle size={16} />
            </button>

            {/* Previous */}
            <button
              onClick={skipBack}
              title="Previous Segment (←)"
              className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: LIBERO_BRAND.colors.surface1,
                borderColor: `${LIBERO_BRAND.colors.divider}40`,
                color: LIBERO_BRAND.colors.textSecondary
              }}
            >
              <SkipBack size={16} />
            </button>

            {/* Next */}
            <button
              onClick={skipForward}
              title="Next Segment (→)"
              className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: LIBERO_BRAND.colors.surface1,
                borderColor: `${LIBERO_BRAND.colors.divider}40`,
                color: LIBERO_BRAND.colors.textSecondary
              }}
            >
              <SkipForward size={16} />
            </button>

            {/* Volume */}
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              title="Toggle Volume (M)"
              className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: isVoiceEnabled 
                  ? `${LIBERO_BRAND.colors.success}30`
                  : `${LIBERO_BRAND.colors.danger}30`,
                borderColor: isVoiceEnabled 
                  ? `${LIBERO_BRAND.colors.success}60` 
                  : `${LIBERO_BRAND.colors.danger}60`,
                color: isVoiceEnabled ? LIBERO_BRAND.colors.success : LIBERO_BRAND.colors.danger
              }}
            >
              {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            
            {/* Fixation Toggle */}
            <button
              onClick={() => setShowFixationCue(!showFixationCue)}
              title="Toggle Fixation Cue (F)"
              className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 flex items-center justify-center"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: showFixationCue 
                  ? `${LIBERO_BRAND.colors.iris}20`
                  : LIBERO_BRAND.colors.surface1,
                borderColor: showFixationCue 
                  ? `${LIBERO_BRAND.colors.iris}40` 
                  : `${LIBERO_BRAND.colors.divider}40`,
                color: showFixationCue ? LIBERO_BRAND.colors.iris : LIBERO_BRAND.colors.textMuted
              }}
            >
              <Eye size={16} />
            </button>
          </div>

          {/* Center Stage - Orb */}
          <div className="relative flex flex-col items-center justify-center z-[100]">
            {/* AI Message Card (Brand Style) */}
            {showCoachBubble && latestAiMessage && (
              <div 
                className="absolute bottom-full mb-8 z-[170] w-full px-4"
                style={{ maxWidth: '720px' }}
              >
                <div 
                  className="backdrop-blur-xl border shadow-2xl"
                  style={{
                    background: LIBERO_BRAND.colors.surface1,
                    borderColor: `${LIBERO_BRAND.colors.divider}60`,
                    borderRadius: LIBERO_BRAND.radius.card,
                    boxShadow: LIBERO_BRAND.elevation.e2,
                    padding: LIBERO_BRAND.spacing.xl
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div 
                      className="border flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: LIBERO_BRAND.radius.control,
                        background: `linear-gradient(135deg, ${LIBERO_BRAND.colors.liberoTeal}, ${LIBERO_BRAND.colors.iris})`,
                        borderColor: `${LIBERO_BRAND.colors.liberoTeal}60`
                      }}
                    >
                      <Brain size={18} className="text-black" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span 
                          className="font-semibold"
                          style={{ 
                            color: LIBERO_BRAND.colors.textPrimary,
                            fontSize: '18px',
                            fontFamily: LIBERO_BRAND.typography.h3.fontFamily || 'Cal Sans, Inter, sans-serif'
                          }}
                        >
                          Libero
                        </span>
                        {isThinking && (
                          <div className="flex items-center space-x-2">
                            <Loader size={14} className="animate-spin" style={{ color: LIBERO_BRAND.colors.liberoTeal }} />
                            <span 
                              className="text-sm"
                              style={{ color: LIBERO_BRAND.colors.textSecondary }}
                            >
                              thinking...
                            </span>
                          </div>
                        )}
                        {isSpeaking && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{ backgroundColor: LIBERO_BRAND.colors.success }}
                            />
                            <span 
                              className="text-sm"
                              style={{ color: LIBERO_BRAND.colors.success }}
                            >
                              speaking
                            </span>
                          </div>
                        )}
                      </div>
                      <p 
                        className="leading-relaxed"
                        style={{ 
                          color: LIBERO_BRAND.colors.textPrimary,
                          fontSize: LIBERO_BRAND.typography.bodyL.fontSize,
                          lineHeight: LIBERO_BRAND.typography.bodyL.lineHeight
                        }}
                      >
                        {latestAiMessage.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orb - Perfectly Centered */}
            <div className="flex items-center justify-center">
              <Orb
                onTap={() => {}}
                egoState={activeEgoState}
                afterglow={sessionState.orbEnergy > 0.7}
                size={Math.min(
                  window.innerWidth < 768 ? 280 : 
                  window.innerWidth < 1024 ? 360 : 480,
                  Math.min(window.innerWidth * 0.42, window.innerHeight * 0.42)
                )}
                variant="webgl"
              />
              
              {/* Fixation Cue - Brand Typography */}
              <FixationCue
                breathing={sessionState.breathing}
                isVisible={showFixationCue}
                showAIMessage={showCoachBubble && latestAiMessage !== undefined}
                orbSize={Math.min(
                  window.innerWidth < 768 ? 280 : 
                  window.innerWidth < 1024 ? 360 : 480,
                  Math.min(window.innerWidth * 0.42, window.innerHeight * 0.42)
                )}
              />
            </div>
          </div>

          {/* Right Rail - Square Indicator Cards */}
          <div className="flex flex-col justify-center space-y-3 z-[150]">
            {/* Breathing Phase Card */}
            <div 
              className="backdrop-blur-xl border transition-all duration-300 flex flex-col items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: getBreathingCardBackground(),
                borderColor: getBreathingCardBorder(),
                boxShadow: LIBERO_BRAND.elevation.e1
              }}
            >
              <Wind size={12} className="mb-1" style={{ color: getBreathingColor() }} />
              <div 
                className="text-xs font-semibold leading-none text-center"
                style={{ color: getBreathingColor() }}
              >
                {sessionState.breathing === 'hold-inhale' ? 'Hold' : 
                 sessionState.breathing === 'hold-exhale' ? 'Hold' :
                 sessionState.breathing.split('-')[0]}
              </div>
            </div>

            {/* Session State Card */}
            <div 
              className="backdrop-blur-xl border transition-all duration-300 flex flex-col items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: sessionState.isPlaying ? `${LIBERO_BRAND.colors.success}20` : LIBERO_BRAND.colors.surface1,
                borderColor: sessionState.isPlaying ? `${LIBERO_BRAND.colors.success}40` : `${LIBERO_BRAND.colors.divider}40`,
                boxShadow: LIBERO_BRAND.elevation.e1
              }}
            >
              <div 
                className="w-2 h-2 rounded-full mb-1"
                style={{ 
                  backgroundColor: sessionState.isPlaying ? LIBERO_BRAND.colors.success : LIBERO_BRAND.colors.textMuted,
                  animation: sessionState.isPlaying ? 'breathe-glow 2s ease-in-out infinite' : 'none'
                }}
              />
              <div 
                className="text-xs font-semibold leading-none"
                style={{ 
                  color: sessionState.isPlaying ? LIBERO_BRAND.colors.success : LIBERO_BRAND.colors.textMuted
                }}
              >
                {sessionState.isPlaying ? 'Play' : 'Pause'}
              </div>
            </div>

            {/* Depth Level Card */}
            <div 
              className="backdrop-blur-xl border transition-all duration-300 flex flex-col items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: `${LIBERO_BRAND.colors.iris}20`,
                borderColor: `${LIBERO_BRAND.colors.iris}40`,
                boxShadow: LIBERO_BRAND.elevation.e1
              }}
            >
              <Activity size={12} className="mb-1" style={{ color: LIBERO_BRAND.colors.iris }} />
              <div 
                className="text-xs font-semibold leading-none"
                style={{ color: LIBERO_BRAND.colors.iris }}
              >
                L{sessionState.depth}
              </div>
            </div>

            {/* Timer Card */}
            <div 
              className="backdrop-blur-xl border transition-all duration-300 flex flex-col items-center justify-center"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: LIBERO_BRAND.radius.control,
                background: `${LIBERO_BRAND.colors.gold}20`,
                borderColor: `${LIBERO_BRAND.colors.gold}40`,
                boxShadow: LIBERO_BRAND.elevation.e1
              }}
            >
              <Clock size={12} className="mb-1" style={{ color: LIBERO_BRAND.colors.gold }} />
              <div 
                className="text-xs font-semibold leading-none text-center"
                style={{ color: LIBERO_BRAND.colors.gold }}
              >
                {formatTime(sessionState.timeRemaining)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Dock (Brand Style Composer) */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-[180] backdrop-blur-xl border-t"
          style={{ 
            height: '88px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            background: `${LIBERO_BRAND.colors.midnight}F0`,
            borderColor: `${LIBERO_BRAND.colors.divider}30`,
            boxShadow: LIBERO_BRAND.elevation.e2
          }}
        >
          <div 
            className="h-full flex items-center justify-center"
            style={{ padding: `0 24px` }}
          >
            <form onSubmit={handleSubmit} className="flex items-center space-x-4 w-full max-w-4xl">
              
              {/* Mic Button (Brand Primary) */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={isThinking}
                title="Talk to Libero"
                className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 disabled:opacity-50 flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: LIBERO_BRAND.radius.control,
                  background: isListening 
                    ? `${LIBERO_BRAND.colors.danger}30`
                    : `${LIBERO_BRAND.colors.liberoTeal}20`,
                  borderColor: isListening 
                    ? `${LIBERO_BRAND.colors.danger}60`
                    : `${LIBERO_BRAND.colors.liberoTeal}40`,
                  color: isListening ? LIBERO_BRAND.colors.danger : LIBERO_BRAND.colors.liberoTeal,
                  animation: isListening ? 'breathe-glow 1s ease-in-out infinite' : 'none'
                }}
              >
                <Mic size={18} />
              </button>

              {/* Text Input (Brand Style) */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message or use voice..."}
                disabled={isListening || isThinking}
                className="flex-1 backdrop-blur-xl border transition-all disabled:opacity-50 focus:outline-none"
                style={{
                  background: LIBERO_BRAND.colors.surface1,
                  borderColor: `${LIBERO_BRAND.colors.divider}40`,
                  borderRadius: LIBERO_BRAND.radius.card,
                  padding: `${LIBERO_BRAND.spacing.md} ${LIBERO_BRAND.spacing.lg}`,
                  color: LIBERO_BRAND.colors.textPrimary,
                  fontSize: LIBERO_BRAND.typography.bodyL.fontSize,
                  lineHeight: LIBERO_BRAND.typography.bodyL.lineHeight
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = `${LIBERO_BRAND.colors.liberoTeal}60`;
                  e.target.style.boxShadow = `0 0 0 2px ${LIBERO_BRAND.colors.liberoTeal}40`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = `${LIBERO_BRAND.colors.divider}40`;
                  e.target.style.boxShadow = 'none';
                }}
              />

              {/* Send Button (Brand Primary) */}
              <button
                type="submit"
                disabled={!textInput.trim() || isThinking}
                title="Send Message"
                className="backdrop-blur-xl border transition-all duration-200 hover:scale-105 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: LIBERO_BRAND.radius.control,
                  background: `linear-gradient(135deg, ${LIBERO_BRAND.colors.liberoTeal}, ${LIBERO_BRAND.colors.iris})`,
                  borderColor: `${LIBERO_BRAND.colors.liberoTeal}60`,
                  color: '#000000',
                  boxShadow: LIBERO_BRAND.gradients.ctaGlow
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper functions for breathing card styling
  function getBreathingColor() {
    switch (sessionState.breathing) {
      case 'inhale': return LIBERO_BRAND.colors.liberoTeal;
      case 'hold-inhale': return LIBERO_BRAND.colors.iris;
      case 'exhale': return LIBERO_BRAND.colors.success;
      case 'hold-exhale': return LIBERO_BRAND.colors.gold;
      default: return LIBERO_BRAND.colors.textMuted;
    }
  }

  function getBreathingCardBackground() {
    switch (sessionState.breathing) {
      case 'inhale': return `${LIBERO_BRAND.colors.liberoTeal}20`;
      case 'hold-inhale': return `${LIBERO_BRAND.colors.iris}20`;
      case 'exhale': return `${LIBERO_BRAND.colors.success}20`;
      case 'hold-exhale': return `${LIBERO_BRAND.colors.gold}20`;
      default: return LIBERO_BRAND.colors.surface1;
    }
  }

  function getBreathingCardBorder() {
    switch (sessionState.breathing) {
      case 'inhale': return `${LIBERO_BRAND.colors.liberoTeal}40`;
      case 'hold-inhale': return `${LIBERO_BRAND.colors.iris}40`;
      case 'exhale': return `${LIBERO_BRAND.colors.success}40`;
      case 'hold-exhale': return `${LIBERO_BRAND.colors.gold}40`;
      default: return `${LIBERO_BRAND.colors.divider}40`;
    }
  }
}