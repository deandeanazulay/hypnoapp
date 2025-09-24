import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Target, Settings, Mic, Plus, X, Edit2 } from 'lucide-react';
import { useGameState } from './GameStateManager';
import { useProtocolStore, CustomAction } from '../state/protocolStore';

interface ActionsBarProps {
  selectedEgoState: string;
  selectedAction: any;
  onActionSelect: (action: any) => void;
  onNavigateToCreate: () => void;
}

export default function ActionsBar({ 
  selectedEgoState,
  selectedAction,
  onActionSelect,
  onNavigateToCreate
}: ActionsBarProps) {
  const { user } = useGameState();
  const { customActions, removeCustomAction, updateCustomAction } = useProtocolStore();
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const quickActions = [
    {
      id: 'stress-relief',
      name: 'Stress Relief',
      icon: <Target size={16} className="text-teal-400" />,
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
      icon: <Settings size={16} className="text-orange-400" />,
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

  const allActions = [...quickActions, ...customActions];

  const handleActionClick = (action: any) => {
    onActionSelect(action.id === selectedAction?.id ? null : action);
  };


  const saveEdit = (actionId: string) => {
    if (editText.trim()) {
      updateCustomAction(actionId, {
        name: editText.trim(),
        description: `Custom: ${editText.trim()}`
      });
    }
    setEditingAction(null);
    setEditText('');
  };

  const deleteCustomAction = (actionId: string) => {
    removeCustomAction(actionId);
    if (selectedAction?.id === actionId) {
      onActionSelect(null);
    }
  };

  const startEdit = (action: any) => {
    setEditingAction(action.id);
    setEditText(action.name);
  };

  const portal = document.getElementById('ui-portal');
  if (!portal) return null;

  return createPortal(
    <div className="actions-bar">
      <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-3 shadow-2xl">
        {/* Actions - Horizontal Scrollable */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
          {allActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`flex-shrink-0 w-[88px] bg-gradient-to-br ${action.color} border border-white/30 rounded-xl p-3 hover:scale-105 hover:z-50 transition-all duration-200 relative group shadow-lg ${
                selectedAction?.id === action.id ? 'ring-2 ring-white/30' : ''
              }`}
            >
              {/* Edit/Delete buttons for custom actions */}
              {action.isCustom && (
                <div className="absolute -top-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(action);
                    }}
                    className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <Edit2 size={8} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomAction(action.id);
                    }}
                    className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X size={8} className="text-white" />
                  </button>
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-2">
                <div className="w-6 h-6 rounded-lg bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="text-center">
                  <div className="text-white font-medium text-xs leading-tight w-full min-h-[32px] flex items-center justify-center">
                    {editingAction === action.id ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => saveEdit(action.id)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit(action.id)}
                        className="w-full bg-transparent text-white text-xs text-center border-none outline-none font-medium px-1"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-center leading-tight">{action.name}</div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {/* Add New Action Button */}
          <button
            onClick={onNavigateToCreate}
            className="flex-shrink-0 w-[88px] bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/30 border-dashed rounded-xl p-3 hover:scale-105 hover:z-50 transition-all duration-200 hover:border-white/50 shadow-lg"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-6 h-6 rounded-lg bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Plus size={14} className="text-white/60" />
              </div>
              <div className="text-center">
                <div className="text-white/60 font-medium text-xs leading-tight min-h-[32px] flex items-center justify-center">
                  Create
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>,
    portal
  );
}