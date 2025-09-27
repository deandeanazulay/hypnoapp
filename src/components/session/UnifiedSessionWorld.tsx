import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useAppStore } from '../../store';
import Orb from '../Orb';

interface UnifiedSessionWorldProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedSessionWorld({ isOpen, onClose }: UnifiedSessionWorldProps) {
  const { sessionHandle, sessionState, play, pause, nextSegment, prevSegment, disposeSession } = useSessionStore();
  const { activeEgoState, showToast } = useAppStore();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(80);

  // Session state
  const [depth, setDepth] = useState(1);
  const [breathing, setBreathing] = useState<'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale' | 'rest'>('rest');
  const [phase, setPhase] = useState('preparation');

  // Auto-start session when opened
  useEffect(() => {
    if (isOpen && sessionHandle && sessionState.isInitialized && sessionState.playState === 'stopped') {
      console.log('[SESSION-WORLD] Auto-starting session');
      setTimeout(() => {
        play();
      }, 1000);
    }
  }, [isOpen, sessionHandle, sessionState.isInitialized, sessionState.playState, play]);

  // Handle session state changes
  useEffect(() => {
    if (sessionHandle) {
      sessionHandle.on('state-change', (newState) => {
        console.log('[SESSION-WORLD] Session state changed:', newState);
        
        // Update local state based on session state
        if (newState.currentSegmentId) {
          // Update phase based on segment
          const segmentId = newState.currentSegmentId;
          if (segmentId.includes('intro') || segmentId.includes('welcome')) {
            setPhase('preparation');
          } else if (segmentId.includes('induction')) {
            setPhase('induction');
            setDepth(2);
          } else if (segmentId.includes('deepening')) {
            setPhase('deepening');
            setDepth(3);
          } else if (segmentId.includes('transformation') || segmentId.includes('core')) {
            setPhase('transformation');
            setDepth(4);
          } else if (segmentId.includes('integration')) {
            setPhase('integration');
            setDepth(3);
          } else if (segmentId.includes('emergence') || segmentId.includes('awakening')) {
            setPhase('completion');
            setDepth(1);
          }
        }
      });

      sessionHandle.on('play', () => {
        console.log('[SESSION-WORLD] Session started playing');
      });

      sessionHandle.on('pause', () => {
        console.log('[SESSION-WORLD] Session paused');
      });

      sessionHandle.on('end', () => {
        console.log('[SESSION-WORLD] Session completed');
        showToast({
          type: 'success',
          message: 'Session completed! Well done.'
        });
        onClose();
      });
    }
  }, [sessionHandle, showToast, onClose]);

  // Breathing animation effect
  useEffect(() => {
    if (sessionState.playState === 'playing') {
      const breathingCycle = setInterval(() => {
        setBreathing(prev => {
          switch (prev) {
            case 'rest': return 'inhale';
            case 'inhale': return 'hold-inhale';
            case 'hold-inhale': return 'exhale';
            case 'exhale': return 'hold-exhale';
            case 'hold-exhale': return 'rest';
            default: return 'rest';
          }
        });
      }, 2000); // 2 second breathing cycle

      return () => clearInterval(breathingCycle);
    }
  }, [sessionState.playState]);

  const handleClose = () => {
    if (sessionHandle) {
      sessionHandle.pause();
      disposeSession();
    }
    onClose();
  };

  const handlePlayPause = () => {
    if (sessionState.playState === 'playing') {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (level: number) => {
    setAudioLevel(level);
    // TODO: Apply volume to audio elements
  };

  if (!isOpen || !sessionHandle) {
    return null;
  }

  const getPhaseColor = () => {
    switch (phase.toLowerCase()) {
      case 'preparation': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'induction': return 'text-teal-400 bg-teal-500/20 border-teal-500/40';
      case 'deepening': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      case 'exploration': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'transformation': return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
      case 'integration': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'completion': return 'text-white bg-white/20 border-white/40';
      case 'paused': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getBreathingColor = () => {
    switch (breathing) {
      case 'inhale': return 'text-blue-400 bg-blue-500/20 border-blue-400';
      case 'hold-inhale': return 'text-teal-400 bg-teal-500/20 border-teal-400';
      case 'exhale': return 'text-green-400 bg-green-500/20 border-green-400';
      case 'hold-exhale': return 'text-purple-400 bg-purple-500/20 border-purple-400';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black h-screen w-screen overflow-hidden">
      {/* Session Header */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-400/30 border border-teal-400/50 flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full ${
                sessionState.playState === 'playing' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
              }`} />
            </div>
            <div>
              <h1 className="text-white font-semibold">Session Active</h1>
              <p className="text-white/60 text-sm">
                Segment {sessionState.currentSegmentIndex + 1} of {sessionState.totalSegments}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          >
            <X size={18} className="text-white/80" />
          </button>
        </div>
      </div>

      {/* Main Session Area */}
      <div className="relative h-screen bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Top Indicators - Only Phase and Depth */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center justify-center space-x-8">
            {/* Depth Indicator */}
            <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20">
              <div className="text-white/80 text-xs font-medium mb-2 text-center">DEPTH</div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      level <= depth ? 'bg-blue-400 animate-pulse' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Phase Indicator */}
            <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20">
              <div className="text-white/80 text-xs font-medium mb-2 text-center">PHASE</div>
              <div className={`px-3 py-1 rounded-full border transition-all ${getPhaseColor()}`}>
                <span className="text-sm font-medium capitalize">{phase}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Controls Sidebar */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3 flex flex-col">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className={`w-14 h-14 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center ${
              sessionState.playState === 'playing' 
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
                : 'bg-green-500/20 border-green-500/40 text-green-400'
            }`}
          >
            {sessionState.playState === 'playing' ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          {/* Skip Back */}
          <button
            onClick={prevSegment}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            <SkipBack size={18} className="text-white/80" />
          </button>

          {/* Skip Forward */}
          <button
            onClick={nextSegment}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            <SkipForward size={18} className="text-white/80" />
          </button>

          {/* Volume Control */}
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`w-12 h-12 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center ${
              isVoiceEnabled 
                ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                : 'bg-red-500/20 border-red-500/40 text-red-400'
            }`}
          >
            {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        {/* Central Orb */}
        <div className="absolute inset-0 flex items-center justify-center z-20 overflow-visible">
          <Orb
            onTap={handlePlayPause}
            egoState={activeEgoState}
            size={window.innerWidth < 768 ? 320 : 480}
            variant="webgl"
            className="overflow-visible"
          />
        </div>

        {/* Premium Breathing Dock - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
          <div className="w-full max-w-5xl mx-auto bg-gradient-to-r from-black/95 via-purple-950/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                {/* Breathing State - Centered */}
                <div className="flex items-center space-x-4">
                  <div className="text-white/60 text-xs font-medium tracking-wider uppercase">Breathing</div>
                  <div className={`flex items-center justify-center w-20 h-8 rounded-xl border-2 transition-all duration-1000 shadow-lg ${getBreathingColor()}`}>
                    <span className="text-xs font-bold capitalize">
                      {breathing === 'hold-inhale' ? 'Hold' : 
                       breathing === 'hold-exhale' ? 'Hold' :
                       breathing}
                    </span>
                  </div>
                </div>

                {/* Live Cycle Timer */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400/40 to-cyan-400/40 border-2 border-teal-400/60 flex items-center justify-center shadow-xl shadow-teal-400/30">
                    <span className="text-teal-400 text-xs font-bold">
                      {Math.floor((Date.now() / 2000) % 8) + 1}s
                    </span>
                  </div>
                  <div className="text-white/50 text-sm font-medium">/ 8s</div>
                </div>

                {/* Pattern Visualization */}
                <div className="flex items-center space-x-3">
                  {['Inhale', 'Hold', 'Exhale', 'Hold'].map((breathPhase, index) => (
                    <div key={breathPhase} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 shadow-lg ${
                        (breathing === 'inhale' && index === 0) ||
                        (breathing === 'hold-inhale' && index === 1) ||
                        (breathing === 'exhale' && index === 2) ||
                        (breathing === 'hold-exhale' && index === 3)
                          ? 'bg-teal-400 scale-150 animate-pulse shadow-teal-400/60'
                          : 'bg-white/20'
                      }`} />
                      {index < 3 && <div className="w-3 h-0.5 bg-white/30 mx-2 rounded-full" />}
                    </div>
                  ))}
                </div>

                {/* Session Stats */}
                <div className="flex items-center space-x-6">
                  <div className="text-center bg-black/30 rounded-lg px-3 py-2 border border-white/10">
                    <div className="text-white text-sm font-bold">{sessionState.currentSegmentIndex + 1}</div>
                    <div className="text-white/50 text-xs">Segment</div>
                  </div>
                  <div className="text-center bg-black/30 rounded-lg px-3 py-2 border border-white/10">
                    <div className="text-purple-400 text-sm font-bold">{depth}</div>
                    <div className="text-white/50 text-xs">Depth</div>
                  </div>
                  <div className="text-center bg-black/30 rounded-lg px-3 py-2 border border-white/10">
                    <div className="text-orange-400 text-sm font-bold">{sessionState.totalSegments}</div>
                    <div className="text-white/50 text-xs">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {!sessionState.isInitialized && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white font-medium mb-2">Preparing Your Session</h3>
              <p className="text-white/70 text-sm">Generating personalized content...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default UnifiedSessionWorld