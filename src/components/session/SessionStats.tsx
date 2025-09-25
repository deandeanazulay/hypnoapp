import React from 'react';
import { Activity, Zap, Target, Heart } from 'lucide-react';

interface SessionStatsProps {
  depth: number;
  orbEnergy: number;
  timeRemaining: number;
  totalTime: number;
  currentSegment: string;
}

export default function SessionStats({ 
  depth, 
  orbEnergy, 
  timeRemaining, 
  totalTime, 
  currentSegment 
}: SessionStatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeRemaining / totalTime);

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3">
      {/* Time Remaining */}
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 text-center">
        <div className="text-white/90 text-sm font-bold">{formatTime(timeRemaining)}</div>
        <div className="text-white/60 text-xs">remaining</div>
      </div>

      {/* Depth Level */}
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 text-center">
        <Activity size={16} className="text-blue-400 mx-auto mb-1" />
        <div className="text-white/90 text-sm font-bold">{depth}</div>
        <div className="text-white/60 text-xs">Depth</div>
      </div>
      
      {/* Orb Energy */}
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 text-center">
        <Zap size={16} className="text-yellow-400 mx-auto mb-1" />
        <div className="text-white/90 text-sm font-bold">{Math.round(orbEnergy * 100)}%</div>
        <div className="text-white/60 text-xs">Energy</div>
      </div>

      {/* Progress */}
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-3 border border-white/20 text-center">
        <Target size={16} className="text-teal-400 mx-auto mb-1" />
        <div className="text-white/90 text-sm font-bold">{Math.round(progress * 100)}%</div>
        <div className="text-white/60 text-xs">Progress</div>
      </div>
    </div>
  );
}