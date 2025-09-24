import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, SkipForward, Volume2, VolumeX, Mic, MicOff, BarChart3 } from 'lucide-react';
import { useGameState } from './GameStateManager';
import { useAppStore, getEgoState } from '../store';
import { getEgoColor } from '../config/theme';
import Orb from './Orb';
import AIVoiceSystem from './AIVoiceSystem';

interface UnifiedSessionWorldProps {
  onComplete: () => void;
  onCancel: () => void;
  sessionConfig: {
    egoState: string;
    action?: any;
    protocol?: any;
    type: 'unified' | 'protocol' | 'favorite';
    session?: any;
  };
}

interface SessionState {
  depth: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale';
  phase: 'preparation' | 'induction' | 'deepening' | 'exploration' | 'transformation' | 'integration' | 'completion';
  isPaused: false;
  timeElapsed: number;
  targetDuration: number;
  isVoiceEnabled: boolean;
  isMicEnabled: boolean;
}

const BREATHING_DURATIONS = {
  'inhale': 4000,
  'hold-inhale': 4000,
  'exhale': 4000,
  'hold-exhale': 4000
};

export default function UnifiedSessionWorld({ onComplete, onCancel, sessionConfig }: UnifiedSessionWorldProps) {
  const { completeSession, canAccess, user } = useGameState();
  const { activeEgoState, showToast } = useAppStore();
  const [sessionState, setSessionState] = useState<SessionState>({
    depth: 1,
    breathing: 'inhale',
    phase: 'preparation',
    isPaused: false,
    timeElapsed: 0,
    targetDuration: sessionConfig.protocol?.duration ? sessionConfig.protocol.duration * 60 : 900, // 15 min default
    isVoiceEnabled: true,
    isMicEnabled: true
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const orbRef = useRef<any>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  const currentEgoState = getEgoState(sessionConfig.egoState || activeEgoState);
  const egoColor = getEgoColor(currentEgoState.id);

  // Session timer
  useEffect(() => {
    if (!sessionState.isPaused) {
      intervalRef.current = setInterval(() => {
        setSessionState(prev => {
          const newElapsed = prev.timeElapsed + 1;
          
          // Auto-complete when time is up
          if (newElapsed >= prev.targetDuration && !hasCompleted) {
            setHasCompleted(true);
            setTimeout(() => {
              handleComplete();
            }, 2000);
          }
          
          return { ...prev, timeElapsed: newElapsed };
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionState.isPaused, hasCompleted]);

  // Breathing cycle
  useEffect(() => {
    if (sessionState.isPaused) return;

    const cycleBreathing = () => {
      const currentBreathing = sessionState.breathing;
      const duration = BREATHING_DURATIONS[currentBreathing];
      
      breathingTimerRef.current = setTimeout(() => {
        setSessionState(prev => {
          const cycle: (keyof typeof BREATHING_DURATIONS)[] = ['inhale', 'hold-inhale', 'exhale', 'hold-exhale'];
          const currentIndex = cycle.indexOf(currentBreathing);
          const nextBreathing = cycle[(currentIndex + 1) % cycle.length];
          
          // Gradually increase depth based on time and breathing
          let newDepth = prev.depth;
          if (Math.random() > 0.85) { // Gradual, realistic depth progression
            newDepth = Math.min(prev.depth + 0.05, 5);
          }
          
          // Update phase based on depth and time
          let newPhase = prev.phase;
          const timeRatio = prev.timeElapsed / prev.targetDuration;
          
          if (timeRatio > 0.1 && prev.phase === 'preparation') newPhase = 'induction';
          else if (timeRatio > 0.25 && prev.phase === 'induction') newPhase = 'deepening';
          else if (timeRatio > 0.4 && prev.phase === 'deepening') newPhase = 'exploration';
          else if (timeRatio > 0.6 && prev.phase === 'exploration') newPhase = 'transformation';
          else if (timeRatio > 0.8 && prev.phase === 'transformation') newPhase = 'integration';
          else if (timeRatio > 0.95 && prev.phase === 'integration') newPhase = 'completion';

          return {
            ...prev,
            breathing: nextBreathing,
            depth: newDepth,
            phase: newPhase
          };
        });
        
        cycleBreathing();
      }, duration);
    };

    cycleBreathing();

    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
    };
  }, [sessionState.breathing, sessionState.isPaused]);

  const handlePause = () => {
    setSessionState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleSkip = () => {
    setSessionState(prev => ({ 
      ...prev, 
      phase: prev.phase === 'preparation' ? 'induction' :
             prev.phase === 'induction' ? 'deepening' :
             prev.phase === 'deepening' ? 'exploration' :
             prev.phase === 'exploration' ? 'transformation' :
             prev.phase === 'transformation' ? 'integration' : 'completion'
    }));
  };

  const handleComplete = () => {
    const sessionDuration = sessionState.timeElapsed;
    const sessionType = sessionConfig.action?.name || sessionConfig.protocol?.name || 'Custom Session';
    
    completeSession(sessionType, sessionDuration);
    
    showToast({
      type: 'success',
      message: `Session complete! ${Math.floor(sessionDuration / 60)}:${(sessionDuration % 60).toString().padStart(2, '0')}`,
      duration: 4000
    });
    
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingColor = () => {
    switch (sessionState.breathing) {
      case 'inhale': return '#14B8A6'; // Teal
      case 'hold-inhale': return '#F59E0B'; // Amber
      case 'exhale': return '#F97316'; // Orange
      case 'hold-exhale': return '#3B82F6'; // Blue
      default: return '#6B7280'; // Gray
    }
  };

  const getBreathingInstruction = () => {
    switch (sessionState.breathing) {
      case 'inhale': return 'Breathe In';
      case 'hold-inhale': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'hold-exhale': return 'Hold';
      default: return 'Rest';
    }
  };

  const progressPercentage = (sessionState.timeElapsed / sessionState.targetDuration) * 100;

  return (
    <div className="fixed inset-0 bg-black z-[1001] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${egoColor.bg} flex items-center justify-center border border-white/30`}>
            <span className="text-sm">{currentEgoState.icon}</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">{currentEgoState.name} Session</h1>
            <p className="text-white/60 text-sm">{sessionConfig.action?.name || sessionConfig.protocol?.name || 'Custom Journey'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-white text-sm font-medium capitalize">{sessionState.phase}</div>
            <div className="text-white/60 text-xs">{formatTime(sessionState.targetDuration - sessionState.timeElapsed)}</div>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Main Session Area */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/30 to-black">
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={`star-${i}`}
                className="absolute bg-white rounded-full"
                style={{
                  width: `${0.5 + Math.random() * 1.5}px`,
                  height: `${0.5 + Math.random() * 1.5}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `twinkle ${2 + Math.random() * 3}s infinite`
                }}
              />
            ))}
          </div>
        </div>

        {/* Breathing Instruction Overlay */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center">
            <div 
              className="text-2xl font-light text-white mb-2 transition-all duration-300"
              style={{ color: getBreathingColor() }}
            >
              {getBreathingInstruction()}
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: getBreathingColor() }}
              />
              <span className="text-white/60 text-sm">Depth Level {Math.floor(sessionState.depth)}</span>
            </div>
          </div>
        </div>

        {/* Main Orb */}
        <div className="flex-1 flex items-center justify-center relative z-20">
          <Orb
            ref={orbRef}
            onTap={() => {}}
            egoState={currentEgoState.id}
            size={400}
            variant="webgl"
            afterglow={sessionState.depth > 3}
          />
        </div>

        {/* AI Voice System */}
        <AIVoiceSystem
          isActive={true}
          sessionType="unified"
          onStateChange={(state) => {
            setSessionState(prev => ({ ...prev, ...state }));
          }}
          sessionState={sessionState}
          sessionConfig={sessionConfig}
        />

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-black/50 z-30">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-purple-400 transition-all duration-1000"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Session Controls */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePause}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            {sessionState.isPaused ? <Play size={24} className="text-white ml-1" /> : <Pause size={24} className="text-white" />}
          </button>

          <button
            onClick={handleSkip}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
          >
            <SkipForward size={24} className="text-white" />
          </button>

          <button
            onClick={() => setSessionState(prev => ({ ...prev, isVoiceEnabled: !prev.isVoiceEnabled }))}
            className={`w-14 h-14 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              sessionState.isVoiceEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-white/60'
            }`}
          >
            {sessionState.isVoiceEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>

          <button
            onClick={() => setSessionState(prev => ({ ...prev, isMicEnabled: !prev.isMicEnabled }))}
            className={`w-14 h-14 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
              sessionState.isMicEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'
            }`}
          >
            {sessionState.isMicEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>

          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform duration-200"
          >
            Complete
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}