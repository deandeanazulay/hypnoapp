import React from 'react';
import { AlertTriangle, Flame, Snowflake } from 'lucide-react';
import { useGameState } from './GameStateManager';

export default function ActionsBar() {
  const { user } = useGameState();

  return (
    <div className="px-4">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
        {/* Session Actions - Centered */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Stress Release */}
            <div className="flex flex-col items-center min-w-[60px] cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-400 to-orange-400 p-1.5 flex items-center justify-center mb-1">
                <AlertTriangle size={10} className="text-black sm:size-3" />
              </div>
              <span className="text-white font-medium text-xs text-center">Stress</span>
            </div>
            
            {/* Focus Training */}
            <div className={`flex flex-col items-center min-w-[60px] cursor-pointer transition-all duration-200 ${
              user.level < 3 ? 'opacity-50' : 'hover:scale-105'
            }`}>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 p-1.5 flex items-center justify-center mb-1">
                <Flame size={10} className="text-black sm:size-3" />
              </div>
              <span className="text-white font-medium text-xs text-center">
                {user.level < 3 ? 'L3' : 'Focus'}
              </span>
            </div>
            
            {/* Deep Rest */}
            <div className="flex flex-col items-center min-w-[60px] cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-400 p-1.5 flex items-center justify-center mb-1">
                <Snowflake size={10} className="text-black sm:size-3" />
              </div>
              <span className="text-white font-medium text-xs text-center">Deep</span>
            </div>
          </div>
        </div>
        
        {/* Level Indicator - Below Actions - Always Visible */}
        <div className="mt-3 pt-2 border-t border-white/10 w-full">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-teal-400 text-xs font-medium">
              Level {user.level}
            </div>
            <div className="w-24 sm:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
            {user.sessionStreak > 0 && (
              <div className="text-white/60 text-xs hidden sm:block">
                {user.sessionStreak} day streak
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}