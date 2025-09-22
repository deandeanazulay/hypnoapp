import React from 'react';
import { Shield, Heart, Zap, Brain, Star, Crown } from 'lucide-react';
import { useGameState } from './GameStateManager';

interface EgoStatesRowProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
}

const EgoStatesRow: React.FC<EgoStatesRowProps> = ({
  selectedEgoState,
  onEgoStateChange
}) => {
  const { userState: user } = useGameState();

  const egoStates = [
    {
      id: 'guardian',
      name: 'Guardian',
      icon: Shield,
      color: 'from-blue-500 to-cyan-500',
      unlocked: true
    },
    {
      id: 'lover',
      name: 'Lover',
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      unlocked: user.level >= 2
    },
    {
      id: 'warrior',
      name: 'Warrior',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      unlocked: user.level >= 5
    },
    {
      id: 'sage',
      name: 'Sage',
      icon: Brain,
      color: 'from-purple-500 to-indigo-500',
      unlocked: user.level >= 10
    },
    {
      id: 'creator',
      name: 'Creator',
      icon: Star,
      color: 'from-yellow-500 to-amber-500',
      unlocked: user.level >= 15
    },
    {
      id: 'ruler',
      name: 'Ruler',
      icon: Crown,
      color: 'from-emerald-500 to-teal-500',
      unlocked: user.level >= 20
    }
  ];

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {egoStates.map((state) => {
        const Icon = state.icon;
        const isSelected = selectedEgoState === state.id;
        const isUnlocked = state.unlocked;

        return (
          <button
            key={state.id}
            onClick={() => isUnlocked && onEgoStateChange(state.id)}
            disabled={!isUnlocked}
            className={`
              flex-shrink-0 relative p-2 rounded-xl transition-all duration-300
              ${isSelected 
                ? `bg-gradient-to-br ${state.color} shadow-lg scale-105` 
                : isUnlocked
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600'
                  : 'bg-gray-900/50 border border-gray-800 opacity-50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <Icon 
                size={20} 
                className={`
                  ${isSelected 
                    ? 'text-white' 
                    : isUnlocked 
                      ? 'text-gray-300' 
                      : 'text-gray-600'
                  }
                `} 
              />
              <span className={`
                text-xs font-medium
                ${isSelected 
                  ? 'text-white' 
                  : isUnlocked 
                    ? 'text-gray-300' 
                    : 'text-gray-600'
                }
              `}>
                {state.name}
              </span>
            </div>
            
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                <span className="text-xs text-gray-400">Lv {
                  state.id === 'lover' ? 2 :
                  state.id === 'warrior' ? 5 :
                  state.id === 'sage' ? 10 :
                  state.id === 'creator' ? 15 :
                  state.id === 'ruler' ? 20 : 1
                }</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default EgoStatesRow;