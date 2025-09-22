import React, { useState, useEffect } from 'react';
import { Search, Play, Pause, SkipBack, SkipForward, Shuffle, X } from 'lucide-react';

interface InductionPlayerProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function InductionPlayer({ onComplete, onCancel }: InductionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);
  const [breathPhase, setBreathPhase] = useState(0);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 1) % 120); // 4 second cycle
    }, 33); // ~30fps
    return () => clearInterval(interval);
  }, []);

  // Progress simulation when playing
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.1, 100));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const breathScale = 1 + Math.sin(breathPhase * 0.05) * 0.1;
  const breathOpacity = 0.6 + Math.sin(breathPhase * 0.05) * 0.3;

  // Generate waveform bars
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const baseHeight = 20 + Math.sin(i * 0.3) * 15;
    const breathMultiplier = isPlaying ? (1 + Math.sin(breathPhase * 0.05 + i * 0.2) * 0.5) : 0.3;
    return Math.max(baseHeight * breathMultiplier, 4);
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-black to-purple-950/20" />
        <div 
          className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-purple-500/10 to-orange-500/10 animate-pulse"
          style={{
            animation: 'aurora 8s ease-in-out infinite alternate'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_rgba(20,184,166,0.05)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(251,146,60,0.05)_0%,_transparent_50%)]" />
      </div>

      {/* Exit button - top right */}
      <button 
        onClick={onCancel}
        className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all duration-300"
      >
        <X size={20} />
      </button>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-16">
        {/* Title */}
        <h2 className="text-white/60 text-sm font-medium tracking-widest mb-16 text-center">
          NOW INDUCING STATE
        </h2>

        {/* Central Orb */}
        <div className="relative mb-12">
          {/* Radial pulse rings */}
          {isPlaying && (
            <>
              <div 
                className="absolute inset-0 rounded-full border border-teal-400/20 animate-ping"
                style={{
                  transform: `scale(${1.5 + breathScale * 0.3})`,
                  opacity: breathOpacity * 0.3
                }}
              />
              <div 
                className="absolute inset-0 rounded-full border border-orange-400/20 animate-ping"
                style={{
                  transform: `scale(${1.8 + breathScale * 0.4})`,
                  opacity: breathOpacity * 0.2,
                  animationDelay: '0.5s'
                }}
              />
            </>
          )}

          {/* Main orb */}
          <div 
            className="relative w-64 h-64 rounded-full transition-transform duration-75"
            style={{
              transform: `scale(${breathScale})`,
              filter: `brightness(${0.8 + breathOpacity * 0.4})`
            }}
          >
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400/30 via-blue-500/20 to-orange-400/30 blur-xl" />
            
            {/* Orb surface */}
            <div 
              className="relative w-full h-full rounded-full bg-gradient-to-br from-teal-400/80 via-blue-500/60 to-orange-400/80 p-1"
              style={{
                boxShadow: `
                  0 0 60px rgba(20, 184, 166, ${breathOpacity * 0.4}),
                  0 0 120px rgba(59, 130, 246, ${breathOpacity * 0.3}),
                  0 0 180px rgba(251, 146, 60, ${breathOpacity * 0.2}),
                  inset 0 0 60px rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-black/40 via-transparent to-black/60 backdrop-blur-sm relative overflow-hidden">
                {/* Volumetric light effect */}
                <div 
                  className="absolute top-1/4 left-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-lg"
                  style={{
                    opacity: breathOpacity
                  }}
                />
                
                {/* Neural network pattern */}
                <div className="absolute inset-8">
                  <svg className="w-full h-full opacity-40" viewBox="0 0 100 100">
                    <defs>
                      <radialGradient id="neuralGrad" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                      </radialGradient>
                    </defs>
                    <g fill="none" stroke="url(#neuralGrad)" strokeWidth="0.5">
                      <circle cx="50" cy="25" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                      <circle cx="25" cy="50" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                      <circle cx="75" cy="50" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                      <circle cx="50" cy="75" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                      <circle cx="50" cy="50" r="2" fill="url(#neuralGrad)" opacity={breathOpacity} />
                      <path d="M 50 25 L 50 50 L 25 50 M 50 50 L 75 50 M 50 50 L 50 75" opacity={breathOpacity * 0.8} />
                      <path d="M 25 25 Q 50 35 75 25 M 25 75 Q 50 65 75 75" opacity={breathOpacity * 0.6} />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* State label */}
        <h3 className="text-white text-2xl font-light tracking-wider mb-8">
          ENTERING TRANCE
        </h3>

        {/* Waveform equalizer */}
        <div className="flex items-end justify-center space-x-1 mb-8 h-16">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-orange-400 via-teal-400 to-teal-300 rounded-full transition-all duration-75"
              style={{
                width: '3px',
                height: `${height}px`,
                opacity: isPlaying ? 0.8 : 0.3
              }}
            />
          ))}
        </div>

        {/* Progress bar / Depth gauge */}
        <div className="w-full max-w-sm mb-12">
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-400 to-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute top-0 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1 transition-all duration-300"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>Surface</span>
            <span>Deep State</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <button className="text-white/60 hover:text-white transition-colors p-2">
            <Shuffle size={20} />
          </button>
          
          <button className="text-white/80 hover:text-white transition-colors p-2">
            <SkipBack size={24} />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            {isPlaying ? (
              <Pause size={24} className="text-white ml-0" />
            ) : (
              <Play size={24} className="text-white ml-1" />
            )}
          </button>
          
          <button className="text-white/80 hover:text-white transition-colors p-2">
            <SkipForward size={24} />
          </button>
          
          <button 
            onClick={onCancel}
            className="text-white/60 hover:text-white transition-colors p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Volume/Intensity control */}
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-2 h-2 bg-orange-400/60 rounded-full" />
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-orange-400 to-teal-400 rounded-full" />
            </div>
            <div className="w-2 h-2 bg-teal-400 rounded-full" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes aurora {
          0% { opacity: 0.3; transform: translateX(-10px) translateY(-5px); }
          50% { opacity: 0.6; transform: translateX(10px) translateY(5px); }
          100% { opacity: 0.4; transform: translateX(-5px) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}