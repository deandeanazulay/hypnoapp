import React, { useState } from 'react';
import { Target, Settings, Mic, ChevronDown, Zap, Moon, Shield, Lightbulb, Heart } from 'lucide-react';
import { useGameState } from './GameStateManager';
import { EGO_STATES } from '../types/EgoState';

interface Action {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  duration: number;
  egoStateBonus?: string[];
}

const ACTIONS: Action[] = [
  {
    id: 'stress-relief',
    name: 'Stress Relief',
    description: 'Release tension and find calm',
    icon: <Shield size={16} className="text-blue-400" />,
    color: 'from-blue-500/20 to-cyan-500/20',
    duration: 10,
    egoStateBonus: ['guardian', 'healer']
  },
  {
    id: 'deep-rest',
    name: 'Deep Rest',
    description: 'Prepare for restorative sleep',
    icon: <Moon size={16} className="text-purple-400" />,
    color: 'from-purple-500/20 to-indigo-500/20',
    duration: 15,
    egoStateBonus: ['healer', 'mystic']
  },
  {
    id: 'focus-boost',
    name: 'Focus Boost',
    description: 'Sharpen concentration and clarity',
    icon: <Zap size={16} className="text-yellow-400" />,
    color: 'from-yellow-500/20 to-orange-500/20',
    duration: 8,
    egoStateBonus: ['sage', 'performer']
  },
  {
    id: 'creative-flow',
    name: 'Creative Flow',
    description: 'Unlock imagination and inspiration',
    icon: <Lightbulb size={16} className="text-green-400" />,
    color: 'from-green-500/20 to-teal-500/20',
    duration: 12,
    egoStateBonus: ['child', 'explorer']
  },
  {
    id: 'confidence-boost',
    name: 'Confidence Boost',
    description: 'Build inner strength and self-assurance',
    icon: <Heart size={16} className="text-pink-400" />,
    color: 'from-pink-500/20 to-red-500/20',
    duration: 10,
    egoStateBonus: ['performer', 'rebel']
  }
];

interface EnhancedActionsBarProps {
  selectedEgoState: string;
  onActionSelect: (action: Action) => void;
}

export default function EnhancedActionsBar({ selectedEgoState, onActionSelect }: EnhancedActionsBarProps) {
  const { user } = useGameState();
  const [showAllActions, setShowAllActions] = useState(false);

  const currentEgoState = EGO_STATES.find(state => state.id === selectedEgoState);
  
  // Get recommended actions based on ego state
  const getRecommendedActions = () => {
    return ACTIONS.filter(action => 
      action.egoStateBonus?.includes(selectedEgoState)
    ).slice(0, 3);
  };

  const recommendedActions = getRecommendedActions();
  const displayActions = showAllActions ? ACTIONS : recommendedActions;

  return (
    <div className="px-4">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4">
        
        {/* Header with Ego State Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentEgoState?.color} p-1.5 flex items-center justify-center`}>
              <span className="text-sm">{currentEgoState?.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">{currentEgoState?.name} Mode</h3>
              <p className="text-white/60 text-xs">{currentEgoState?.role.split(',')[0]}</p>
            </div>
          </div>
          
          {/* Level Indicator */}
          <div className="flex items-center space-x-2">
            <div className="text-teal-400 text-sm font-medium">L{user.level}</div>
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mb-3">
          {displayActions.map((action) => {
            const isRecommended = action.egoStateBonus?.includes(selectedEgoState);
            
            return (
              <button
                key={action.id}
                onClick={() => onActionSelect(action)}
                className={`w-full p-3 rounded-xl bg-gradient-to-br ${action.color} border transition-all duration-200 hover:scale-[1.02] ${
                  isRecommended 
                    ? 'border-white/30 ring-1 ring-teal-400/20' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      {action.icon}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium text-sm">{action.name}</h4>
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 bg-teal-400/20 text-teal-400 text-xs rounded-full border border-teal-400/30">
                            ✨
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 text-xs">{action.description}</p>
                    </div>
                  </div>
                  <div className="text-white/50 text-xs">
                    {action.duration}m
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Show More/Less Toggle */}
        {!showAllActions && recommendedActions.length < ACTIONS.length && (
          <button
            onClick={() => setShowAllActions(true)}
            className="w-full py-2 text-white/60 hover:text-white/80 text-sm flex items-center justify-center space-x-1 transition-colors"
          >
            <span>Show all actions</span>
            <ChevronDown size={14} />
          </button>
        )}
        
        {showAllActions && (
          <button
            onClick={() => setShowAllActions(false)}
            className="w-full py-2 text-white/60 hover:text-white/80 text-sm flex items-center justify-center space-x-1 transition-colors"
          >
            <span>Show recommended</span>
            <ChevronDown size={14} className="rotate-180" />
          </button>
        )}

        {/* Streak Indicator */}
        {user.sessionStreak > 0 && (
          <div className="pt-3 border-t border-white/10 mt-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="text-orange-400 text-xs">🔥</div>
              <div className="text-white/60 text-xs">
                {user.sessionStreak} day streak
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}