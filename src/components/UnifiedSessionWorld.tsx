import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Orb from './Orb';
import { useAppStore, getEgoState } from '../store';
import { useGameState } from './GameStateManager';
import { SessionManager } from '../services/session';
import AIVoiceSystem from './premium/PremiumFeatures';

// Reusable Session Components
import SessionHeader from './session/SessionHeader';
import SessionIndicators from './session/SessionIndicators';
import SessionControls from './session/SessionControls';
import SessionStats from './session/SessionStats';
import SessionStatusBar from './session/SessionStatusBar';
import SessionProgress from './session/SessionProgress';
import VoiceInputDock from './session/VoiceInputDock';

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
  const { user, addExperience, incrementStreak, updateEgoStateUsage } = useGameState();
  
  // Session state tracking
  const [sessionWorldState, setSessionWorldState] = useState<SessionState>({
    phase: 'preparation',
    depth: 1,
    breathing: 'rest',
    timeRemaining: sessionConfig.duration * 60,
    totalTime: sessionConfig.duration * 60,
    currentSegment: '',
    isPlaying: false,
    orbEnergy: 0.3,
  });

  // Audio and session controls
  const [audioLevel, setAudioLevel] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  
  // Session management
  const [sessionManager, setSessionManager] = useState<SessionManager | null>(null);
  const [sessionState, setSessionState] = useState<any>({
    playState: 'stopped',
    currentSegmentIndex: 0,
    scriptPlan: null,
    bufferedAhead: 0
  });
  
  // Refs for audio and speech
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);

  const currentEgoState = getEgoState(activeEgoState);

  useEffect(() => {
    return () => {
    };

  // Session timer
  useEffect(() => {
    if (sessionWorldState.isPlaying && sessionWorldState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSessionWorldState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
            // Session complete
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionWorldState.isPlaying, sessionWorldState.timeRemaining]);

  // Breathing cycle
  useEffect(() => {
    const breathingCycle = setInterval(() => {
      setSessionWorldState(prev => {
        const cycle = ['inhale', 'hold-inhale', 'exhale', 'hold-exhale'] as const;
        const currentIndex = cycle.indexOf(prev.breathing);
        const nextIndex = (currentIndex + 1) % cycle.length;
        return { ...prev, breathing: cycle[nextIndex] };
      });
    }, 4000); // 4 second breathing cycle

    return () => clearInterval(breathingCycle);
  }, []);

  // Phase progression
  useEffect(() => {
    const progressTime = sessionWorldState.totalTime - sessionWorldState.timeRemaining;
    const totalTime = sessionWorldState.totalTime;
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

    setSessionWorldState(prev => ({
      ...prev,
      phase: newPhase,
      depth: newDepth,
      orbEnergy: newOrbEnergy
    }));
  }, [sessionWorldState.timeRemaining, sessionWorldState.totalTime]);

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
        console.log('Session: Initialized successfully');
        
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

  const handleSessionComplete = async () => {
    console.log('[SESSION] Session completed');
    
    // Award experience and update stats
    if (user) {
      const baseXP = Math.floor(sessionConfig.duration * 2);
      const bonusXP = sessionWorldState.depth * 5;
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
    setSessionWorldState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    if (sessionManager) {
      if (sessionWorldState.isPlaying) {
        sessionManager.pause();
      } else {
        sessionManager.play();
      }
    }
  };

  const skipForward = () => {
    if (sessionManager) {
      sessionManager.next();
    }
  };

  const skipBack = () => {
    if (sessionManager) {
      sessionManager.prev();
    }
  };

  // Get session title based on config
  const getSessionTitle = () => {
    if (sessionConfig.customProtocol?.name) {
      return sessionConfig.customProtocol.name;
    }
    if (sessionConfig.protocol?.name) {
      return sessionConfig.protocol.name;
    }
    if (sessionConfig.action?.name) {
      return sessionConfig.action.name;
    }
    return `${currentEgoState.name} Session`;
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Cosmic Background */}
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

      {/* Main Session Layout */}
      <div className="flex flex-col h-screen relative z-10">
        {/* Session Header */}
        <SessionHeader
          sessionTitle={getSessionTitle()}
          currentSegment={sessionState.currentSegmentIndex + 1}
          totalSegments={sessionState.scriptPlan?.segments?.length || 6}
          bufferedAhead={sessionState.bufferedAhead}
          onClose={onCancel}
        />

        {/* Session Indicators */}
        <SessionIndicators
          depth={sessionWorldState.depth}
          breathing={sessionWorldState.breathing}
          phase={sessionWorldState.isPlaying ? sessionWorldState.phase : 'paused'}
        />

        {/* Session Status Bar */}
        <SessionStatusBar
          isPlaying={sessionWorldState.isPlaying}
          currentSegment={sessionState.currentSegmentIndex + 1}
          totalSegments={sessionState.scriptPlan?.segments?.length || 6}
          phase={sessionWorldState.phase}
        />

        {/* Central Orb Area - Flex 1 */}
        <div className="flex-1 relative min-h-0">
          {/* Central Orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Orb
              ref={orbRef}
              onTap={() => {}}
              egoState={activeEgoState}
              afterglow={sessionWorldState.orbEnergy > 0.7}
              size={300}
              variant="webgl"
            />
          </div>

          {/* Floating Controls - Left Side */}
          <SessionControls
            isPlaying={sessionWorldState.isPlaying}
            isVoiceEnabled={true}
            audioLevel={audioLevel}
            onPlayPause={togglePlayPause}
            onSkipBack={skipBack}
            onSkipForward={skipForward}
            onToggleVoice={() => {}}
            onVolumeChange={setAudioLevel}
          />

          {/* Session Stats - Right Side */}
          <SessionStats
            depth={sessionWorldState.depth}
            orbEnergy={sessionWorldState.orbEnergy}
            timeRemaining={sessionWorldState.timeRemaining}
            totalTime={sessionWorldState.totalTime}
            currentSegment={sessionWorldState.currentSegment}
          />
        </div>

        {/* Bottom Section - Chat & Progress */}
        <div className="flex-shrink-0">
          {/* AI Voice System Integration */}
          <AIVoiceSystem
            isActive={true}
            sessionType="unified"
            onStateChange={(updates) => {
              setSessionWorldState(prev => ({ ...prev, ...updates }));
            }}
            sessionState={sessionWorldState}
            sessionConfig={sessionConfig}
          />

          {/* Session Progress */}
          <SessionProgress
            currentSegment={sessionState.currentSegmentIndex + 1}
            totalSegments={sessionState.scriptPlan?.segments?.length || 6}
            bufferedAhead={sessionState.bufferedAhead}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}