import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import Orb from './Orb';
import AIVoiceSystem from './AIVoiceSystem';
import { useGameState } from './GameStateManager';
import { getEgoState } from '../store';
import { getEgoColor } from '../config/theme';
import { useAppStore } from '../store';

interface SessionConfig {
  egoState: string;
  action?: any;
  goal?: any;
  type: 'unified' | 'protocol' | 'favorite';
  protocol?: any;
  session?: any;
}

interface UnifiedSessionWorldProps {
  onComplete: () => void;
  onCancel: () => void;
  sessionConfig: SessionConfig;
}

interface SessionState {
  phase: 'preparation' | 'induction' | 'deepening' | 'exploration' | 'transformation' | 'integration' | 'completion';
  timeElapsed: number;
  totalDuration: number;
  depth: number;
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest';
  isActive: boolean;
  isPaused: boolean;
  voiceEnabled: boolean;
  micEnabled: boolean;
}

export default function UnifiedSessionWorld({ onComplete, onCancel, sessionConfig }: UnifiedSessionWorldProps) {
  const { completeSession } = useGameState();
  const { showToast } = useAppStore();
  const orbRef = useRef<any>(null);
  
  const [sessionState, setSessionState] = useState<SessionState>({
    phase: 'preparation',
    timeElapsed: 0,
    totalDuration: sessionConfig.action?.duration || 900, // 15 minutes default
    depth: 1,
    breathing: 'rest',
    isActive: false,
    isPaused: false,
    voiceEnabled: true,
    micEnabled: true
  });

  // Get ego state info
  const egoState = getEgoState(sessionConfig.egoState as any);
  const egoColorInfo = getEgoColor(sessionConfig.egoState);
  const selectedAction = sessionConfig.action;
  const selectedGoal = sessionConfig.goal;

  // Timer for session progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionState.isActive && !sessionState.isPaused) {
      interval = setInterval(() => {
        setSessionState(prev => {
          const newTimeElapsed = prev.timeElapsed + 1;
          
          // Auto-complete when time is up
          if (newTimeElapsed >= prev.totalDuration) {
            handleSessionComplete();
            return prev;
          }
          
          // Update phase based on time progression
          let newPhase = prev.phase;
          const progress = newTimeElapsed / prev.totalDuration;
          
          if (progress < 0.1) newPhase = 'preparation';
          else if (progress < 0.25) newPhase = 'induction';
          else if (progress < 0.5) newPhase = 'deepening';
          else if (progress < 0.75) newPhase = 'exploration';
          else if (progress < 0.9) newPhase = 'transformation';
          else if (progress < 0.95) newPhase = 'integration';
          else newPhase = 'completion';
          
          return {
            ...prev,
            timeElapsed: newTimeElapsed,
            phase: newPhase,
            depth: Math.min(prev.depth + 0.01, 5) // Gradual deepening
          };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState.isActive, sessionState.isPaused, sessionState.totalDuration]);

  const handleSessionComplete = () => {
    completeSession(
      selectedAction?.name || 'General Session',
      sessionState.timeElapsed
    );
    
    showToast({
      type: 'success',
      message: `Session complete! Channeled ${egoState.name} energy for transformation.`,
      duration: 4000
    });
    
    onComplete();
  };

  const handleStart = () => {
    setSessionState(prev => ({ ...prev, isActive: true }));
  };

  const handlePause = () => {
    setSessionState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleSkip = () => {
    // Skip to next phase or complete
    const phaseOrder = ['preparation', 'induction', 'deepening', 'exploration', 'transformation', 'integration', 'completion'];
    const currentIndex = phaseOrder.indexOf(sessionState.phase);
    
    if (currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1] as SessionState['phase'];
      setSessionState(prev => ({ ...prev, phase: nextPhase }));
    } else {
      handleSessionComplete();
    }
  };

  const toggleVoice = () => {
    setSessionState(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
  };

  const toggleMic = () => {
    setSessionState(prev => ({ ...prev, micEnabled: !prev.micEnabled }));
  };

  // Breathing cycle management
  useEffect(() => {
    if (!sessionState.isActive || sessionState.isPaused) return;

    const breathingDurations = {
      inhale: 4000,   // 4 seconds
      hold: 4000,     // 4 seconds
      exhale: 6000,   // 6 seconds
      rest: 2000      // 2 seconds
    };

    const duration = breathingDurations[sessionState.breathing];
    
    const timer = setTimeout(() => {
      setSessionState(prev => {
        const breathingCycle = ['inhale', 'hold', 'exhale', 'rest'] as const;
        const currentIndex = breathingCycle.indexOf(prev.breathing);
        const nextBreathing = breathingCycle[(currentIndex + 1) % breathingCycle.length];
        
        return { ...prev, breathing: nextBreathing };
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [sessionState.breathing, sessionState.isActive, sessionState.isPaused]);

  const getPhaseDescription = () => {
    const descriptions = {
      preparation: 'Getting comfortable and centered',
      induction: 'Entering the hypnotic state',
      deepening: 'Going deeper into trance',
      exploration: 'Exploring inner landscapes',
      transformation: 'Installing new patterns',
      integration: 'Integrating changes',
      completion: 'Returning to awareness'
    };
    
    return descriptions[sessionState.phase];
  };

  const getActionSpecificContent = () => {
    if (!selectedAction) return null;
    
    const actionContent: { [key: string]: { title: string; suggestion: string } } = {
      'stress-relief': {
        title: 'Releasing Tension',
        suggestion: 'Notice how each breath releases more stress and brings deeper calm'
      },
      'focus-boost': {
        title: 'Sharpening Concentration', 
        suggestion: 'Feel your mind becoming laser-focused and crystal clear'
      },
      'confidence': {
        title: 'Building Self-Assurance',
        suggestion: 'Sense your inner confidence growing stronger with each moment'
      },
      'energy-up': {
        title: 'Boosting Vitality',
        suggestion: 'Feel renewed energy flowing through every cell of your being'
      },
      'sleep-prep': {
        title: 'Preparing for Rest',
        suggestion: 'Allow yourself to naturally drift toward peaceful sleep'
      }
    };
    
    return actionContent[selectedAction.id] || {
      title: selectedAction.name,
      suggestion: 'Trust in the process of transformation'
    };
  };

  const progress = sessionState.totalDuration > 0 ? (sessionState.timeElapsed / sessionState.totalDuration) * 100 : 0;
  const actionContent = getActionSpecificContent();

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Cosmic Background matching ego state */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br from-black via-${egoColorInfo.baseColorName}-950/20 to-black`} />
        
        {/* Subtle orb-colored glow effects */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br ${egoColorInfo.bg}/10 rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br ${egoColorInfo.bg}/5 rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }} />
      </div>

      {/* Session Header */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${egoState.color} flex items-center justify-center border border-white/30 shadow-lg`}>
            <span className="text-lg">{egoState.icon}</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">{egoState.name} Session</h1>
            {actionContent && (
              <p className="text-white/70 text-sm">{actionContent.title}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300"
        >
          <X size={20} className="text-white/60 hover:text-white" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="relative z-20 px-4 pb-2">
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${egoColorInfo.bg} rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-white/60">
          <span>{Math.floor(sessionState.timeElapsed / 60)}:{(sessionState.timeElapsed % 60).toString().padStart(2, '0')}</span>
          <span className="capitalize">{sessionState.phase}</span>
          <span>{Math.floor(sessionState.totalDuration / 60)}:{(sessionState.totalDuration % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Central Orb Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        {/* Session Info */}
        <div className="text-center mb-6 hidden sm:block">
          <h2 className="text-white text-xl font-light mb-2">
            {getPhaseDescription()}
          </h2>
          {actionContent && (
            <p className="text-white/70 text-sm max-w-md leading-relaxed">
              {actionContent.suggestion}
            </p>
          )}
        </div>

        {/* The Orb - inheriting color from ego state */}
        <div className="mb-6">
          <Orb
            onTap={() => {}}
            afterglow={true}
            egoState={sessionConfig.egoState}
            size={640}
            variant="webgl"
          />
        </div>

        {/* Session Guidance */}
        <div className="text-center max-w-md">
          <div className="bg-black/60 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <p className="text-white/80 text-sm leading-relaxed">
              {sessionState.phase === 'preparation' && "Find a comfortable position. We'll begin when you're ready."}
              {sessionState.phase === 'induction' && "Allow your eyes to close naturally. Focus on the orb's energy."}
              {sessionState.phase === 'deepening' && "Going deeper now. Each breath takes you further within."}
              {sessionState.phase === 'exploration' && `Working with ${egoState.name} energy. ${actionContent?.suggestion}`}
              {sessionState.phase === 'transformation' && "Installing new patterns. Feel the change happening."}
              {sessionState.phase === 'integration' && "Integrating this transformation into your being."}
              {sessionState.phase === 'completion' && "Bringing this awareness back with you."}
            </p>
          </div>
        </div>
      </div>

      {/* Session Controls */}
      <div className="relative z-20 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-center space-x-4">
          {!sessionState.isActive ? (
            <button
              onClick={handleStart}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
            >
              <Play size={20} />
              <span>Begin Session</span>
            </button>
          ) : (
            <>
              {/* Pause/Resume */}
              <button
                onClick={handlePause}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300"
              >
                {sessionState.isPaused ? 
                  <Play size={20} className="text-white ml-0.5" /> : 
                  <Pause size={20} className="text-white" />
                }
              </button>

              {/* Skip Phase */}
              <button
                onClick={handleSkip}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-300"
              >
                <SkipForward size={20} className="text-white" />
              </button>

              {/* Voice Toggle */}
              <button
                onClick={toggleVoice}
                className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 ${
                  sessionState.voiceEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-white/60'
                }`}
              >
                {sessionState.voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>

              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 ${
                  sessionState.micEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'
                }`}
              >
                {sessionState.micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              {/* Complete Session */}
              <button
                onClick={handleSessionComplete}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform duration-200"
              >
                Complete
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Voice System */}
      {sessionState.isActive && (
        <AIVoiceSystem
          isActive={sessionState.isActive}
          sessionType="unified"
          onStateChange={(state) => {
            setSessionState(prev => ({
              ...prev,
              breathing: state.breathing || prev.breathing,
              depth: state.depth || prev.depth
            }));
            
            // Update orb if available
            if (orbRef.current) {
              orbRef.current.updateState(state);
            }
          }}
          orbRef={orbRef}
        />
      )}


      {/* Breathing Guide with Timings */}
      {sessionState.isActive && (
        <div className="absolute top-20 left-4 z-30">
          <BreathingIndicator 
            currentPhase={sessionState.breathing}
            isActive={sessionState.isActive && !sessionState.isPaused}
          />
        </div>
      )}
    </div>
  );
}

// Breathing Indicator Component with Timings
interface BreathingIndicatorProps {
  currentPhase: 'inhale' | 'hold' | 'exhale' | 'rest';
  isActive: boolean;
}

function BreathingIndicator({ currentPhase, isActive }: BreathingIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const breathingDurations = {
    inhale: 4000,   // 4 seconds
    hold: 4000,     // 4 seconds
    exhale: 6000,   // 6 seconds
    rest: 2000      // 2 seconds
  };

  const breathingLabels = {
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out', 
    rest: 'Natural Breathing'
  };

  const breathingColors = {
    inhale: 'bg-teal-400',
    hold: 'bg-yellow-400',
    exhale: 'bg-orange-400',
    rest: 'bg-gray-400'
  };

  useEffect(() => {
    if (!isActive) return;
    
    const duration = breathingDurations[currentPhase];
    setTimeRemaining(Math.ceil(duration / 1000));
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentPhase, isActive]);

  if (!isActive) return null;

  return (
    <div className="bg-black/90 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-center space-x-4">
          {/* Breathing Phase Indicator */}
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${breathingColors[currentPhase]} ${
              currentPhase !== 'rest' ? 'animate-pulse' : ''
            }`} />
            <span className="text-white font-medium text-sm">
              {breathingLabels[currentPhase]}
            </span>
          </div>
          
          {/* Timer - only show for timed phases */}
          {currentPhase !== 'rest' && (
            <>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{timeRemaining}</span>
                </div>
                <div className="text-white/60 text-xs">
                  {timeRemaining > 1 ? 'seconds' : 'second'}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Progress bar for current breathing phase */}
        {currentPhase !== 'rest' && (
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full ${breathingColors[currentPhase]} rounded-full transition-all duration-100`}
              style={{ 
                width: `${((breathingDurations[currentPhase] / 1000 - timeRemaining) / (breathingDurations[currentPhase] / 1000)) * 100}%` 
              }}
            />
          </div>
        )}
    </div>
  );
}