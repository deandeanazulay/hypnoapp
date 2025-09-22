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
  selectedAction: any;
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
    const actionSets = {
      guardian: [
        { id: 'protect', name: 'Protect', icon: Shield, cost: 10, description: 'Shield yourself from harm' },
        { id: 'heal', name: 'Heal', icon: Heart, cost: 15, description: 'Restore your vitality' },
        { id: 'fortify', name: 'Fortify', icon: Target, cost: 20, description: 'Strengthen your defenses' },
        { id: 'sanctuary', name: 'Sanctuary', icon: Sparkles, cost: 25, description: 'Create a safe space' }
      ],
      explorer: [
        { id: 'discover', name: 'Discover', icon: Target, cost: 12, description: 'Uncover hidden paths' },
        { id: 'venture', name: 'Venture', icon: Zap, cost: 18, description: 'Take bold risks' },
        { id: 'map', name: 'Map', icon: Brain, cost: 22, description: 'Chart new territories' },
        { id: 'pioneer', name: 'Pioneer', icon: Sparkles, cost: 28, description: 'Blaze new trails' }
      ],
      creator: [
        { id: 'inspire', name: 'Inspire', icon: Sparkles, cost: 14, description: 'Spark new ideas' },
        { id: 'craft', name: 'Craft', icon: Target, cost: 16, description: 'Build something new' },
        { id: 'innovate', name: 'Innovate', icon: Brain, cost: 24, description: 'Revolutionary thinking' },
        { id: 'manifest', name: 'Manifest', icon: Zap, cost: 30, description: 'Bring visions to life' }
      ],
      sage: [
        { id: 'contemplate', name: 'Contemplate', icon: Brain, cost: 8, description: 'Deep reflection' },
        { id: 'analyze', name: 'Analyze', icon: Target, cost: 16, description: 'Examine thoroughly' },
        { id: 'synthesize', name: 'Synthesize', icon: Sparkles, cost: 20, description: 'Combine knowledge' },
        { id: 'transcend', name: 'Transcend', icon: Zap, cost: 35, description: 'Rise above limitations' }
      ]
    };
    return actionSets[egoState as keyof typeof actionSets] || actionSets.guardian;
  };

  const actions = getActionsForEgoState(selectedEgoState);
  const actionsPerPage = 3;
  const totalPages = Math.ceil(actions.length / actionsPerPage);
  const startIndex = currentPage * actionsPerPage;
  const visibleActions = actions.slice(startIndex, startIndex + actionsPerPage);

  const canAfford = (cost: number) => user.energy >= cost;

  const handleActionSelect = (action: any) => {
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
        <h3 className="text-sm font-medium text-white/80">Actions</h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-white/60" />
            </button>
            <span className="text-xs text-white/40">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={nextPage}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-3 h-3 text-white/60" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {visibleActions.map((action) => {
          const IconComponent = action.icon;
          const affordable = canAfford(action.cost);
          const isSelected = selectedAction?.id === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleActionSelect(action)}
              disabled={!affordable}
              className={`
                relative p-3 rounded-lg border transition-all duration-200
                ${isSelected 
                  ? 'bg-purple-500/30 border-purple-400/50 shadow-lg shadow-purple-500/20' 
                  : affordable
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <IconComponent className={`w-4 h-4 ${
                  isSelected ? 'text-purple-300' : affordable ? 'text-white/70' : 'text-white/30'
                }`} />
                <span className={`text-xs font-medium ${
                  isSelected ? 'text-purple-200' : affordable ? 'text-white/80' : 'text-white/40'
                }`}>
                  {action.name}
                </span>
                <div className={`flex items-center gap-1 text-xs ${
                  affordable ? 'text-yellow-400' : 'text-white/30'
                }`}>
                  <Zap className="w-2.5 h-2.5" />
                  <span>{action.cost}</span>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute inset-0 rounded-lg bg-purple-400/10 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {selectedAction && (
        <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-white/60 text-center">
            {selectedAction.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedActionsBar;