import React from 'react';

interface TopIndicatorsProps {
  depth: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale' | 'rest';
  phase: string;
}

export default function TopIndicators({ depth, breathing, phase }: TopIndicatorsProps) {
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
    <div className="flex items-center justify-between px-6 py-4">
      {/* Depth Indicator */}
      <div className="text-center">
        <div className="text-white/60 text-xs font-semibold mb-2 tracking-wider">DEPTH</div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                level <= depth 
                  ? 'bg-teal-400 shadow-lg shadow-teal-400/50 animate-pulse' 
                  : 'bg-white/20 border border-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Breathing Indicator */}
      <div className="text-center">
        <div className="text-white/60 text-xs font-semibold mb-2 tracking-wider">BREATHING</div>
        <div className={`px-4 py-2 rounded-xl border transition-all ${getBreathingColor()}`}>
          <span className="text-sm font-bold capitalize">{breathing.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="text-center">
        <div className="text-white/60 text-xs font-semibold mb-2 tracking-wider">PHASE</div>
        <div className={`px-4 py-2 rounded-xl border transition-all ${getPhaseColor()}`}>
          <span className="text-sm font-bold capitalize">{phase}</span>
        </div>
      </div>
    </div>
  );
}