import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, Volume2, VolumeX, Mic, MicOff, Brain, MessageCircle, Send, Loader } from 'lucide-react';
import Orb from './Orb';
import AIVoiceSystem from './AIVoiceSystem';
import { useAppStore, getEgoState } from '../store';
import { getEgoColor } from '../config/theme';

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
  phase: 'preparation' | 'induction' | 'deepening' | 'exploration' | 'transformation' | 'integration' | 'completion';
  depth: number;
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest';
  duration: number;
  isPlaying: boolean;
  progress: number;
}

export default function UnifiedSessionWorld({ onComplete, onCancel, sessionConfig }: UnifiedSessionWorldProps) {
  const { activeEgoState } = useAppStore();
  const [sessionState, setSessionState] = useState<SessionState>({
    phase: 'preparation',
    depth: 1,
    breathing: 'rest',
    duration: 0,
    isPlaying: false,
    progress: 0
  });

  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const orbRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef(15 * 60 * 1000); // 15 minutes default

  const egoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  // Initialize session
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    // Set duration based on session config
    if (sessionConfig.protocol?.duration) {
      totalDurationRef.current = sessionConfig.protocol.duration * 60 * 1000;
    } else if (sessionConfig.action?.duration) {
      totalDurationRef.current = sessionConfig.action.duration * 60 * 1000;
    } else {
      totalDurationRef.current = 15 * 60 * 1000; // 15 minutes default
    }

    // Auto-start the session
    setTimeout(() => {
      setSessionState(prev => ({ ...prev, isPlaying: true }));
    }, 1000);
  }, [sessionConfig]);

  // Session progression logic
  useEffect(() => {
    if (!sessionState.isPlaying) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / totalDurationRef.current, 1);
      
      setSessionState(prev => {
        const newDuration = Math.floor(elapsed / 1000);
        
        // Progress through phases based on time
        let newPhase = prev.phase;
        if (progress < 0.1) newPhase = 'preparation';
        else if (progress < 0.25) newPhase = 'induction';
        else if (progress < 0.4) newPhase = 'deepening';
        else if (progress < 0.7) newPhase = 'exploration';
        else if (progress < 0.85) newPhase = 'transformation';
        else if (progress < 0.95) newPhase = 'integration';
        else newPhase = 'completion';

        // Calculate depth based on phase
        let newDepth = 1;
        if (newPhase === 'induction') newDepth = 2;
        else if (newPhase === 'deepening') newDepth = 3;
        else if (newPhase === 'exploration') newDepth = 4;
        else if (newPhase === 'transformation') newDepth = 4.5;
        else if (newPhase === 'integration') newDepth = 3;
        else if (newPhase === 'completion') newDepth = 1;

        return {
          ...prev,
          duration: newDuration,
          progress,
          phase: newPhase,
          depth: newDepth
        };
      });

      // Complete session when done
      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState.isPlaying, onComplete]);

  // Breathing cycle
  useEffect(() => {
    if (!sessionState.isPlaying) return;

    const breathingCycle = ['inhale', 'hold', 'exhale', 'rest'] as const;
    const durations = { inhale: 4000, hold: 4000, exhale: 6000, rest: 2000 };
    
    let breathingInterval: NodeJS.Timeout;
    
    const cycleBreathing = () => {
      const currentIndex = breathingCycle.indexOf(sessionState.breathing);
      const nextBreathing = breathingCycle[(currentIndex + 1) % breathingCycle.length];
      
      breathingInterval = setTimeout(() => {
        setSessionState(prev => ({ ...prev, breathing: nextBreathing }));
      }, durations[sessionState.breathing]);
    };

    cycleBreathing();
    return () => clearTimeout(breathingInterval);
  }, [sessionState.breathing, sessionState.isPlaying]);

  const handleOrbTap = () => {
    setShowVoiceInterface(!showVoiceInterface);
  };

  const togglePlayPause = () => {
    setSessionState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseDescription = (phase: string) => {
    const descriptions = {
      preparation: 'Getting comfortable and centered',
      induction: 'Entering a state of relaxation',
      deepening: 'Going deeper into trance',
      exploration: 'Exploring inner wisdom',
      transformation: 'Creating positive change',
      integration: 'Integrating new insights',
      completion: 'Returning to normal awareness'
    };
    return descriptions[phase as keyof typeof descriptions] || phase;
  };

  const getBreathingInstruction = (breathing: string) => {
    const instructions = {
      inhale: 'Breathe in deeply...',
      hold: 'Hold your breath...',
      exhale: 'Breathe out slowly...',
      rest: 'Rest and relax...'
    };
    return instructions[breathing as keyof typeof instructions] || 'Breathe naturally';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-teal-950/20" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${egoColor.accent}20 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full bg-gradient-to-br border-2"
            style={{ 
              background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
              borderColor: egoColor.accent + '80'
            }}
          >
            <div className="w-full h-full rounded-full flex items-center justify-center">
              <span className="text-sm">{egoState.icon}</span>
            </div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg">{egoState.name} Session</h1>
            <p className="text-white/60 text-sm">{sessionConfig.action?.name || 'Transformation Journey'}</p>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
        {/* Orb - Center Stage */}
        <div className="mb-8">
          <Orb
            onTap={handleOrbTap}
            egoState={activeEgoState}
            size={320}
            afterglow={sessionState.depth > 3}
            variant="webgl"
          />
        </div>

        {/* Session Status */}
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-light mb-2 capitalize">
            {getPhaseDescription(sessionState.phase)}
          </h2>
          <p className="text-white/70 text-lg mb-4">
            {getBreathingInstruction(sessionState.breathing)}
          </p>
          
          {/* Depth Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-white/60 text-sm">Depth:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-2 h-6 rounded-full transition-all duration-500 ${
                    level <= sessionState.depth
                      ? `bg-gradient-to-t from-${egoColor.baseColorName}-400 to-${egoColor.baseColorName}-600`
                      : 'bg-white/20'
                  }`}
                  style={{
                    backgroundColor: level <= sessionState.depth ? egoColor.accent : 'rgba(255,255,255,0.2)'
                  }}
                />
              ))}
            </div>
            <span className="text-white font-medium text-sm">
              {sessionState.depth.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-6">
          <div className="flex items-center justify-between mb-2 text-sm text-white/60">
            <span>{formatTime(sessionState.duration)}</span>
            <span>{formatTime(Math.floor(totalDurationRef.current / 1000))}</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r transition-all duration-1000"
              style={{ 
                width: `${sessionState.progress * 100}%`,
                background: `linear-gradient(90deg, ${egoColor.accent}, ${egoColor.accent}cc)`
              }}
            />
          </div>
        </div>


        {/* Breathing Visual Cue */}
        <div className="mt-8 flex items-center justify-center">
          <div 
            className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-1000 ${
              sessionState.breathing === 'inhale' ? 'scale-125' :
              sessionState.breathing === 'hold' ? 'scale-125' :
              sessionState.breathing === 'exhale' ? 'scale-75' :
              'scale-100'
            }`}
            style={{ 
              borderColor: egoColor.accent + '60',
              background: `radial-gradient(circle, ${egoColor.accent}20 0%, transparent 70%)`
            }}
          >
            <div 
              className="text-white/80 text-sm font-medium transition-all duration-1000"
              style={{ 
                opacity: sessionState.breathing === 'rest' ? 0.5 : 1
              }}
            >
              {sessionState.breathing === 'inhale' ? 'In' :
               sessionState.breathing === 'hold' ? 'Hold' :
               sessionState.breathing === 'exhale' ? 'Out' :
               'Rest'}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-10 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4">
        {/* Session Controls */}
        <div className="flex items-center justify-center space-x-6 mb-4">
          <button
            onClick={togglePlayPause}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          >
            {sessionState.isPlaying ? (
              <Pause size={24} className="text-white" />
            ) : (
              <Play size={24} className="text-white ml-1" />
            )}
          </button>
          
          <button
            onClick={() => setShowVoiceInterface(!showVoiceInterface)}
            className={`w-12 h-12 rounded-full border transition-all hover:scale-110 ${
              showVoiceInterface
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
          >
            <MessageCircle size={20} />
          </button>
          
          <button
            onClick={onCancel}
            className="w-12 h-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all hover:scale-110"
          >
            <X size={20} className="text-red-400" />
          </button>
        </div>
        
        {/* Voice Interface - Always show when enabled */}
        {showVoiceInterface && (
          <AIVoiceSystem
            isActive={true}
            sessionType="unified"
            onStateChange={(updates) => {
              setSessionState(prev => ({ ...prev, ...updates }));
            }}
            sessionState={sessionState}
            sessionConfig={sessionConfig}
          />
        )}
      </div>

    </div>
  );
}