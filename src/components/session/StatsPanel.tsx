import React from 'react';
import { Clock, Activity, Zap, Target } from 'lucide-react';

interface StatsPanelProps {
  timeRemaining: number;
  depth: number;
  orbEnergy: number;
  progress: number;
}

export default function StatsPanel({ timeRemaining, depth, orbEnergy, progress }: StatsPanelProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30">
      <div className="space-y-3">
        {/* Time Remaining */}
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px]">
          <Clock size={16} className="text-white/60 mx-auto mb-2" />
          <div className="text-white text-xl font-bold">{formatTime(timeRemaining)}</div>
          <div className="text-white/60 text-xs">remaining</div>
        </div>

        {/* Depth Level */}
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px]">
          <Activity size={16} className="text-teal-400 mx-auto mb-2" />
          <div className="text-teal-400 text-xl font-bold">{depth}</div>
          <div className="text-white/60 text-xs">Depth</div>
        </div>
        
        {/* Energy Level */}
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px]">
          <Zap size={16} className="text-yellow-400 mx-auto mb-2" />
          <div className="text-yellow-400 text-xl font-bold">{Math.round(orbEnergy * 100)}%</div>
          <div className="text-white/60 text-xs">Energy</div>
        </div>

        {/* Progress */}
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center shadow-2xl min-w-[80px]">
          <Target size={16} className="text-cyan-400 mx-auto mb-2" />
          <div className="text-cyan-400 text-xl font-bold">{Math.round(progress * 100)}%</div>
          <div className="text-white/60 text-xs">Progress</div>
        </div>
      </div>
    </div>
  );
}