import React, { useState } from 'react';
import { Target, Settings, Mic, ChevronDown } from 'lucide-react';
import { useGameState } from './GameStateManager';
import GoalPicker from './GoalPicker';
import MethodPicker from './MethodPicker';
import ModePicker from './ModePicker';

interface ActionsBarProps {
  selectedGoal: any;
  selectedMethod: any;
  selectedMode: any;
  onGoalChange: (goal: any) => void;
  onMethodChange: (method: any) => void;
  onModeChange: (mode: any) => void;
}

export default function ActionsBar({ 
  selectedGoal, 
  selectedMethod, 
  selectedMode,
  onGoalChange,
  onMethodChange,
  onModeChange
}: ActionsBarProps) {
  const { user } = useGameState();
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);

  return (
    <>
      <div className="px-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
          {/* Three Main Action Tiles */}
          <div className="flex justify-center space-x-3 mb-3">
            {/* Goal Tile */}
            <button
              onClick={() => setShowGoalPicker(true)}
              className="flex-1 max-w-[120px] bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-3 hover:scale-105 transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-400 p-1.5 flex items-center justify-center">
                  <Target size={14} className="text-black" />
                </div>
                <div className="text-center">
                  <div className="text-white font-medium text-xs">Goal</div>
                  <div className="text-white/60 text-xs mt-0.5">
                    {selectedGoal?.name || 'What changes?'}
                  </div>
                </div>
              </div>
            </button>
            
            {/* Method Tile */}
            <button
              onClick={() => setShowMethodPicker(true)}
              className="flex-1 max-w-[120px] bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-3 hover:scale-105 transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 p-1.5 flex items-center justify-center">
                  <Settings size={14} className="text-black" />
                </div>
                <div className="text-center">
                  <div className="text-white font-medium text-xs">Method</div>
                  <div className="text-white/60 text-xs mt-0.5">
                    {selectedMethod?.name || 'How we do it'}
                  </div>
                </div>
              </div>
            </button>
            
            {/* Mode Tile */}
            <button
              onClick={() => setShowModePicker(true)}
              className="flex-1 max-w-[120px] bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-3 hover:scale-105 transition-all duration-200"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 p-1.5 flex items-center justify-center">
                  <Mic size={14} className="text-black" />
                </div>
                <div className="text-center">
                  <div className="text-white font-medium text-xs">Mode</div>
                  <div className="text-white/60 text-xs mt-0.5">
                    {selectedMode?.name || 'Voice/Silent'}
                  </div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Level Progress - Compact */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-center space-x-3">
              <div className="text-teal-400 text-xs font-medium">
                L{user.level}
              </div>
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${(user.experience % 100)}%` }}
                />
              </div>
              {user.sessionStreak > 0 && (
                <div className="text-white/60 text-xs">
                  {user.sessionStreak}d
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pickers */}
      {showGoalPicker && (
        <GoalPicker
          onSelect={(goal) => {
            onGoalChange(goal);
            setShowGoalPicker(false);
          }}
          onClose={() => setShowGoalPicker(false)}
        />
      )}
      
      {showMethodPicker && (
        <MethodPicker
          selectedGoal={selectedGoal}
          onSelect={(method) => {
            onMethodChange(method);
            setShowMethodPicker(false);
          }}
          onClose={() => setShowMethodPicker(false)}
        />
      )}
      
      {showModePicker && (
        <ModePicker
          onSelect={(mode) => {
            onModeChange(mode);
            setShowModePicker(false);
          }}
          onClose={() => setShowModePicker(false)}
        />
      )}
    </>
  );
}