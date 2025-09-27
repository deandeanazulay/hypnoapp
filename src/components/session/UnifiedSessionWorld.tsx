import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useAppStore } from '../../store';
import Orb from '../Orb';
import SessionIndicators from './SessionIndicators';
import SessionProgress from './SessionProgress';
import SessionControls from './SessionControls';

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

  return (
    <div className="fixed inset-0 z-50 bg-black">
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
      <div className="relative h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Session Indicators */}
        <SessionIndicators 
          depth={depth}
          breathing={breathing}
          phase={phase}
        />

        {/* Central Orb */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Orb
            onTap={handlePlayPause}
            egoState={activeEgoState}
            size={window.innerWidth < 768 ? 320 : 480}
            variant="webgl"
        {/* Premium Breathing Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-black/95 backdrop-blur-xl rounded-2xl px-8 py-6 border border-white/10 shadow-2xl shadow-purple-500/20">
            <div className="text-center">
              {/* Breathing State */}
              <div className="mb-4">
                <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Breathing Guide</div>
                <div className={`inline-flex items-center justify-center w-32 h-12 rounded-xl border-2 transition-all duration-1000 ${
                  breathing === 'inhale' ? 'bg-blue-500/20 border-blue-400 text-blue-400 scale-110' :
                  breathing === 'hold-inhale' ? 'bg-teal-500/20 border-teal-400 text-teal-400 scale-105' :
                  breathing === 'exhale' ? 'bg-green-500/20 border-green-400 text-green-400 scale-110' :
                  breathing === 'hold-exhale' ? 'bg-purple-500/20 border-purple-400 text-purple-400 scale-105' :
                  'bg-white/10 border-white/20 text-white/60'
                }`}>
                  <span className="text-lg font-bold capitalize">
                    {breathing === 'hold-inhale' ? 'Hold' : 
                     breathing === 'hold-exhale' ? 'Hold' :
                     breathing}
                  </span>
                </div>
              </div>

              {/* Breathing Timer */}
              <div className="mb-4">
                <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Cycle Timer</div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 border border-teal-400/40 flex items-center justify-center">
                    <span className="text-teal-400 text-xl font-bold">
                      {Math.floor((Date.now() / 2000) % 8) + 1}s
                    </span>
                  </div>
                  <div className="text-white/40 text-sm">/ 8s</div>
                </div>
              </div>

              {/* Breathing Pattern Visualization */}
              <div className="mb-4">
                <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Pattern</div>
                <div className="flex items-center justify-center space-x-1">
                  {['Inhale', 'Hold', 'Exhale', 'Hold'].map((phase, index) => (
                    <div key={phase} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        (breathing === 'inhale' && index === 0) ||
                        (breathing === 'hold-inhale' && index === 1) ||
                        (breathing === 'exhale' && index === 2) ||
                        (breathing === 'hold-exhale' && index === 3)
                          ? 'bg-teal-400 scale-125 animate-pulse'
                          : 'bg-white/20'
                      }`} />
                      {index < 3 && <div className="w-4 h-0.5 bg-white/20 mx-1" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Info */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                  <div className="text-white text-sm font-bold">{sessionState.currentSegmentIndex + 1}</div>
                  <div className="text-white/60 text-xs">Segment</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                  <div className="text-purple-400 text-sm font-bold">{depth}</div>
                  <div className="text-white/60 text-xs">Depth</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                  <div className="text-orange-400 text-sm font-bold">{sessionState.totalSegments}</div>
                  <div className="text-white/60 text-xs">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Segment Info */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-black/80 backdrop-blur-xl rounded-xl px-6 py-3 border border-white/20 text-center">
            <div className="text-white/90 text-sm font-medium">
              {sessionState.currentSegmentId ? (
                <span className="capitalize">{sessionState.currentSegmentId.replace(/[-_]/g, ' ')}</span>
              ) : (
                'Preparing session...'
              )}
            </div>
            {sessionState.error && (
              <div className="text-red-400 text-xs mt-1">{sessionState.error}</div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {!sessionState.isInitialized && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
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