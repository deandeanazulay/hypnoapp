// Simplified Actions Bar Component
import React from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { QUICK_ACTIONS } from '../utils/actions';
import { THEME } from '../config/theme';
import GlassCard from './ui/GlassCard';

interface ActionsBarProps {
  selectedAction: any;
  onActionSelect: (action: any) => void;
  onNavigateToCreate: () => void;
  customActions?: any[];
}

export default function ActionsBar({ 
  selectedAction,
  onActionSelect,
  onNavigateToCreate,
  customActions = []
}: ActionsBarProps) {
  const allActions = [...QUICK_ACTIONS, ...customActions];

  const handleActionClick = (action: any) => {
    onActionSelect(action.id === selectedAction?.id ? null : action);
  };

  const portal = document.getElementById('ui-portal');
  if (!portal) return null;

  return createPortal(
    <div className="actions-bar">
      <GlassCard className="px-3 py-3 overflow-hidden">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1" style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {allActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`flex-shrink-0 min-w-[88px] w-[88px] bg-gradient-to-br ${action.color} border border-white/30 rounded-xl p-3 hover:scale-105 transition-all duration-200 shadow-lg ${
                  selectedAction?.id === action.id ? 'ring-2 ring-white/30' : ''
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 rounded-lg bg-black/30 border border-white/30 flex items-center justify-center">
                    <IconComponent size={16} className="text-white" />
                  </div>
                  <div className="text-white font-medium text-xs text-center leading-tight min-h-[32px] flex items-center justify-center">
                    {action.name}
                  </div>
                </div>
              </button>
            );
          })}
          
          {/* Add New Action Button */}
          <button
            onClick={onNavigateToCreate}
            className="flex-shrink-0 min-w-[88px] w-[88px] bg-white/10 border border-white/30 border-dashed rounded-xl p-3 hover:scale-105 transition-all duration-200 hover:border-white/50"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 rounded-lg bg-black/30 border border-white/30 flex items-center justify-center">
                <Plus size={14} className="text-white/60" />
              </div>
              <div className="text-white/60 font-medium text-xs text-center leading-tight min-h-[32px] flex items-center justify-center">
                Create
              </div>
            </div>
          </button>
        </div>
      </GlassCard>
    </div>,
    portal
  );
}