import React from 'react';
import { Clock, Activity, Zap, Target, Wind, Brain } from 'lucide-react';

interface StatsPanelProps {
  timeRemaining: number;
  depth: number;
  orbEnergy: number;
  progress: number;
  breathing: 'inhale' | 'hold-inhale' | 'exhale' | 'hold-exhale' | 'rest';
  phase: string;
}

export default function StatsPanel({ timeRemaining, depth, orbEnergy, progress, breathing, phase }: StatsPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingColor = () => {
    switch (breathing) {
      case 'inhale': return 'text-blue-400';
      case 'hold-inhale': return 'text-teal-400';
      case 'exhale': return 'text-green-400';
      case 'hold-exhale': return 'text-purple-400';
      default: return 'text-white/60';
    }
  };

  const getPhaseColor = () => {
    switch (phase.toLowerCase()) {
      case 'preparation': return 'text-blue-400';
      case 'induction': return 'text-teal-400';
      case 'deepening': return 'text-purple-400';
      case 'exploration': return 'text-yellow-400';
      case 'transformation': return 'text-orange-400';
      case 'integration': return 'text-green-400';
      case 'completion': return 'text-white';
      case 'paused': return 'text-gray-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="space-y-4">
        {/* Time Remaining */}
        <div className="bg-gradient-to-br from-black/90 to-gray-900/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px] hover:border-white/30 transition-all">
          <Clock size={16} className="text-white/60 mx-auto mb-2" />
          <div className="text-white text-xl font-bold">{formatTime(timeRemaining)}</div>
          <div className="text-white/60 text-xs">remaining</div>
        </div>

        {/* Depth Level */}
        <div className="bg-gradient-to-br from-black/90 to-gray-900/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px] hover:border-teal-400/30 transition-all">
          <Activity size={16} className="text-teal-400 mx-auto mb-2" />
          <div className="text-teal-400 text-xl font-bold">{depth}</div>
          <div className="text-white/60 text-xs">Depth</div>
        </div>
        
        {/* Energy Level */}
        <div className="bg-gradient-to-br from-black/90 to-gray-900/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px] hover:border-yellow-400/30 transition-all">
          <Zap size={16} className="text-yellow-400 mx-auto mb-2" />
          <div className="text-yellow-400 text-xl font-bold">{Math.round(orbEnergy * 100)}%</div>
          <div className="text-white/60 text-xs">Energy</div>
        </div>

        {/* Breathing State */}
        <div className="bg-gradient-to-br from-black/90 to-gray-900/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px] hover:border-cyan-400/30 transition-all">
          <Wind size={16} className={`mx-auto mb-2 ${getBreathingColor()}`} />
          <div className={`text-lg font-bold capitalize ${getBreathingColor()}`}>{breathing.replace('-', ' ')}</div>
          <div className="text-white/60 text-xs">Breathing</div>
        </div>

        {/* Phase */}
        <div className="bg-gradient-to-br from-black/90 to-gray-900/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px] hover:border-purple-400/30 transition-all">
          <Brain size={16} className={`mx-auto mb-2 ${getPhaseColor()}`} />
          <div className={`text-lg font-bold capitalize ${getPhaseColor()}`}>{phase}</div>
          <div className="text-white/60 text-xs">Phase</div>
        </div>
        {/* Progress */}
        <div className="bg-gradient-to-br from-black/90 to-gray-900/70 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px] hover:border-cyan-400/30 transition-all">
          <Target size={16} className="text-cyan-400 mx-auto mb-2" />
          <div className="text-cyan-400 text-xl font-bold">{Math.round(progress * 100)}%</div>
          <div className="text-white/60 text-xs">Progress</div>
        </div>
  );
}
  )
}