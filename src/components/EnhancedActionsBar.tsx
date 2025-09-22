import React, { useState } from 'react';
import { Target, Settings, Mic, ChevronDown, Zap, Heart } from 'lucide-react';
import { useGameState } from './GameStateManager';
import GoalPicker from './GoalPicker';
import MethodPicker from './MethodPicker';
import ModePicker from './ModePicker';

interface EnhancedActionsBarProps {
  selectedEgoState: string;
  selectedAction: any;
  onActionSelect: (action: any) => void;
}

export default function EnhancedActionsBar({ 
  selectedEgoState,
  selectedAction,
  onActionSelect
}: EnhancedActionsBarProps) {
  const { user } = useGameState();
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);

  const quickActions = [
    {
      id: 'stress-relief',
      name: 'Stress Relief',
      icon: <Heart size={16} className="text-teal-400" />,
      color: 'from-teal-500/20 to-cyan-500/20',
      description: 'Release tension and find calm'
    },
    {
      id: 'focus-boost',
      name: 'Focus Boost',
      icon: <Target size={16} className="text-purple-400" />,
      color: 'from-purple-500/20 to-blue-500/20',
      description: 'Sharpen concentration'
    },
    {
      id: 'energy-up',
      name: 'Energy Up',
      icon: <Zap size={16} className="text-orange-400" />,
      color: 'from-orange-500/20 to-amber-500/20',
      description: 'Boost motivation and energy'
    },
    {
      id: 'confidence',
      name: 'Confidence',
      icon: <Settings size={16} className="text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/20',
      description: 'Build self-assurance'
    },
    {
      id: 'sleep-prep',
      name: 'Sleep Prep',
      icon: <Mic size={16} className="text-indigo-400" />,
      color: 'from-indigo-500/20 to-purple-500/20',
      description: 'Prepare for rest'
    }
  ];

  return (
    <>
      <div className="px-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2">
          {/* Quick Actions */}
          <div className="flex justify-center space-x-2 mb-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onActionSelect(action)}
                className={`flex-1 max-w-[90px] bg-gradient-to-br ${action.color} border border-white/20 rounded-xl p-2 hover:scale-105 transition-all duration-200 ${
                  selectedAction?.id === action.id ? 'ring-2 ring-white/30' : ''
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-5 h-5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium text-xs leading-tight">{action.name}</div>
                    <div className="text-white/60 text-xs mt-0.5 line-clamp-1">
                      {action.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Level Progress - Compact */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-center space-x-2">
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
            onActionSelect(goal);
            setShowGoalPicker(false);
          }}
          onClose={() => setShowGoalPicker(false)}
        />
      )}
      
      {showMethodPicker && (
        <MethodPicker
          selectedGoal={selectedAction}
          onSelect={(method) => {
            onActionSelect(method);
            setShowMethodPicker(false);
          }}
          onClose={() => setShowMethodPicker(false)}
        />
      )}
      
      {showModePicker && (
        <ModePicker
          onSelect={(mode) => {
            onActionSelect(mode);
            setShowModePicker(false);
          }}
          onClose={() => setShowModePicker(false)}
        />
      )}
    </>
  );
}