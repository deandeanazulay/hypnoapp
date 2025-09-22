import React, { useState } from 'react';
import { useGameState } from './GameStateManager';
import { 
  Zap, 
  Shield, 
  Heart, 
  Brain, 
  Target, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface EnhancedActionsBarProps {
  selectedEgoState: string;
  selectedAction?: any;
  onActionSelect: (action: any) => void;
}

const EnhancedActionsBar: React.FC<EnhancedActionsBarProps> = ({
  selectedEgoState,
  selectedAction,
  onActionSelect
}) => {
  const { userState: user } = useGameState();
  const [currentPage, setCurrentPage] = useState(0);

  // Define actions based on ego state
  const getActionsForEgoState = (egoState: string) => {
    const baseActions = {
      guardian: [
        { id: 'protect', name: 'Protect', icon: Shield, color: 'blue', cost: 10 },
        { id: 'heal', name: 'Heal', icon: Heart, color: 'green', cost: 15 },
        { id: 'fortify', name: 'Fortify', icon: Target, color: 'purple', cost: 20 }
      ],
      warrior: [
        { id: 'strike', name: 'Strike', icon: Zap, color: 'red', cost: 12 },
        { id: 'charge', name: 'Charge', icon: Target, color: 'orange', cost: 18 },
        { id: 'berserker', name: 'Berserker', icon: Sparkles, color: 'yellow', cost: 25 }
      ],
      sage: [
        { id: 'analyze', name: 'Analyze', icon: Brain, color: 'indigo', cost: 8 },
        { id: 'enlighten', name: 'Enlighten', icon: Sparkles, color: 'cyan', cost: 22 },
        { id: 'transcend', name: 'Transcend', icon: Target, color: 'violet', cost: 30 }
      ]
    };

    return baseActions[egoState as keyof typeof baseActions] || baseActions.guardian;
  };

  const actions = getActionsForEgoState(selectedEgoState);
  const actionsPerPage = 3;
  const totalPages = Math.ceil(actions.length / actionsPerPage);
  const startIndex = currentPage * actionsPerPage;
  const visibleActions = actions.slice(startIndex, startIndex + actionsPerPage);

  const canAfford = (cost: number) => user?.energy >= cost;

  const handleActionClick = (action: any) => {
    if (canAfford(action.cost)) {
      onActionSelect(action);
    }
  };

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">
          {selectedEgoState.charAt(0).toUpperCase() + selectedEgoState.slice(1)} Actions
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-xs text-gray-500">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={nextPage}
              className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          const affordable = canAfford(action.cost);
          const isSelected = selectedAction?.id === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={!affordable}
              className={`
                relative p-3 rounded-lg border transition-all duration-200
                ${isSelected 
                  ? `border-${action.color}-500 bg-${action.color}-500/20` 
                  : affordable
                    ? `border-gray-700 bg-gray-800/50 hover:border-${action.color}-500/50 hover:bg-${action.color}-500/10`
                    : 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon 
                  className={`w-5 h-5 ${
                    isSelected 
                      ? `text-${action.color}-400` 
                      : affordable 
                        ? 'text-gray-300' 
                        : 'text-gray-600'
                  }`} 
                />
                <span className={`text-xs font-medium ${
                  isSelected 
                    ? `text-${action.color}-300` 
                    : affordable 
                      ? 'text-gray-300' 
                      : 'text-gray-600'
                }`}>
                  {action.name}
                </span>
                <span className={`text-xs ${
                  affordable ? 'text-gray-400' : 'text-red-400'
                }`}>
                  {action.cost} EN
                </span>
              </div>

              {isSelected && (
                <div className={`absolute inset-0 rounded-lg border-2 border-${action.color}-400 pointer-events-none`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Energy indicator */}
      <div className="mt-3 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Zap className="w-3 h-3" />
          <span>Energy: {user?.energy || 0}/{user?.maxEnergy || 100}</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedActionsBar;