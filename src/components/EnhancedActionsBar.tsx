import React from 'react';
import { Shield, Moon, Zap, Lightbulb, Heart } from 'lucide-react';
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
    id: 'stress_release',
    name: 'Stress Relief',
    description: 'Release tension and find calm',
    icon: <Shield size={16} className="text-blue-400" />,
    color: 'from-blue-500/20 to-cyan-500/20',
    duration: 10,
    egoStateBonus: ['guardian', 'healer']
  },
  {
    id: 'sleep_priming',
    name: 'Sleep Prep',
    description: 'Prepare for restorative sleep',
    icon: <Moon size={16} className="text-purple-400" />,
    color: 'from-purple-500/20 to-indigo-500/20',
    duration: 15,
    egoStateBonus: ['healer', 'mystic']
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Sharpen concentration and clarity',
    icon: <Zap size={16} className="text-yellow-400" />,
    color: 'from-yellow-500/20 to-orange-500/20',
    duration: 8,
    egoStateBonus: ['sage', 'performer']
  },
  {
    id: 'creative_unlock',
    name: 'Creative',
    description: 'Unlock imagination and inspiration',
    icon: <Lightbulb size={16} className="text-green-400" />,
    color: 'from-green-500/20 to-teal-500/20',
    duration: 12,
    egoStateBonus: ['child', 'explorer']
  },
  {
    id: 'confidence',
    name: 'Confidence',
    description: 'Build inner strength and self-assurance',
    icon: <Heart size={16} className="text-pink-400" />,
    color: 'from-pink-500/20 to-red-500/20',
    duration: 10,
    egoStateBonus: ['performer', 'rebel']
  }
];

interface EnhancedActionsBarProps {
  selectedEgoState: string;
  selectedAction?: any;
  onActionSelect: (action: Action) => void;
}

export default function EnhancedActionsBar({ selectedEgoState, selectedAction, onActionSelect }: EnhancedActionsBarProps) {
  const { user } = useGameState();
  const currentEgoState = EGO_STATES.find(state => state.id === selectedEgoState);

  return (
    <div className="w-full max-w-4xl bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mx-auto min-h-[120px] flex flex-col justify-between">
        
      {/* Compact Header */}
      <div className="flex items-center justify-between space-x-2 sm:space-x-4 mb-3 flex-shrink-0">
        <div className="flex items-center justify-start space-x-3 flex-shrink-0">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${currentEgoState?.color} p-1 flex items-center justify-center`}>
            <span className="text-xs">{currentEgoState?.icon}</span>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-white font-medium text-xs sm:text-sm">{currentEgoState?.name} Mode</h3>
            <p className="text-white/60 text-xs hidden sm:block">{currentEgoState?.role.split(',')[0]}</p>
          </div>
        </div>
        
        {/* Compact Level */}
        <div className="flex items-center justify-end space-x-1 sm:space-x-3 flex-shrink-0">
          {/* HP/MP indicators */}
          <div className="hidden md:flex items-center justify-center space-x-1">
            <div className="text-red-400 text-xs">HP</div>
            <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400 rounded-full transition-all duration-500"
                style={{ width: `${user.hp}%` }}
              />
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center space-x-1">
            <div className="text-blue-400 text-xs">MP</div>
            <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${user.mp}%` }}
              />
            </div>
          </div>
          
          {/* Level and XP */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            <div className="text-teal-400 text-xs font-medium">lvl.{user.level}</div>
            <div className="w-8 sm:w-12 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(user.experience % 100)}%` }}
              />
            </div>
          </div>
          
          {/* Tokens */}
          <div className="flex items-center justify-center space-x-1">
            <span className="text-yellow-400 text-xs">⚡</span>
            <span className="text-yellow-400 text-xs font-medium">{user.tokens}</span>
          </div>
        </div>
      </div>

      {/* Action Grid - Responsive: 3 cols on mobile, 5 cols on desktop */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 justify-items-center flex-shrink-0">
        {ACTIONS.map((action) => {
          const isRecommended = action.egoStateBonus?.includes(selectedEgoState);
          const isSelected = selectedAction?.id === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => onActionSelect(action)}
              className={`w-full p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br ${action.color} border transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center space-y-1 lg:space-y-2 min-h-[60px] sm:min-h-[70px] ${
                isSelected
                  ? 'border-teal-400/60 ring-2 ring-teal-400/40 scale-105'
                  : isRecommended 
                    ? 'border-white/30 ring-1 ring-teal-400/20' 
                    : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                {action.icon}
              </div>
              <div className="text-center hidden sm:flex sm:flex-col sm:items-center sm:justify-center space-y-1">
                <div className="flex items-center justify-center space-x-1">
                  <h4 className="text-white font-medium text-xs leading-tight truncate max-w-[60px] sm:max-w-none">{action.name}</h4>
                  {isSelected && (
                    <span className="text-teal-400 text-xs">✓</span>
                  )}
                  {!isSelected && isRecommended && (
                    <span className="text-teal-400 text-xs">✨</span>
                  )}
                </div>
                <div className="text-white/60 text-xs flex items-center justify-center hidden lg:flex">
                  {action.duration}m
                </div>
              </div>
              {/* Mobile/Small screens: Show only recommended indicator */}
              <div className="flex items-center justify-center sm:hidden">
                {isSelected && (
                  <span className="text-teal-400 text-xs">✓</span>
                )}
                {!isSelected && isRecommended && (
                  <span className="text-teal-400 text-xs">✨</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}