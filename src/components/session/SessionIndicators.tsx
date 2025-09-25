import React from 'react';

interface SessionIndicatorsProps {
  depth: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale' | 'rest';
  phase: string;
}

export default function SessionIndicators({ depth, breathing, phase }: SessionIndicatorsProps) {
  const getBreathingColor = () => {
    switch (breathing) {
      case 'inhale': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'hold-inhale': return 'text-teal-400 bg-teal-500/20 border-teal-500/40';
      case 'exhale': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'hold-exhale': return 'text-purple-400 bg-purple-500/20 border-purple-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

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

  return (
    <div className="absolute top-20 left-4 right-4 z-30">
      <div className="flex items-center justify-between">
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

        {/* Breathing Indicator */}
        <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20">
          <div className="text-white/80 text-xs font-medium mb-2 text-center">BREATHING</div>
          <div className={`px-3 py-1 rounded-full border transition-all ${getBreathingColor()}`}>
            <span className="text-sm font-medium capitalize">{breathing.replace('-', ' ')}</span>
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
  );
}