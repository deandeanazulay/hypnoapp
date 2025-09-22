import React, { useState } from 'react';
import { Target, Settings, Mic, Plus, X, Edit2 } from 'lucide-react';
import { useGameState } from './GameStateManager';

interface ActionsBarProps {
  selectedEgoState: string;
  selectedAction: any;
  onActionSelect: (action: any) => void;
}

export default function ActionsBar({ 
  selectedEgoState,
  selectedAction,
  onActionSelect
}: ActionsBarProps) {
  const { user } = useGameState();
  const [customActions, setCustomActions] = useState<any[]>([]);
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

  const addCustomAction = () => {
    const newAction = {
      id: `custom-${Date.now()}`,
      name: 'New Action',
      icon: <Target size={16} className="text-cyan-400" />,
      color: 'from-cyan-500/20 to-blue-500/20',
      description: 'Custom action',
      isCustom: true
    };
    setCustomActions(prev => [...prev, newAction]);
    setEditingAction(newAction.id);
    setEditText(newAction.name);
  };

  const saveEdit = (actionId: string) => {
    if (editText.trim()) {
      setCustomActions(prev => prev.map(action => 
        action.id === actionId 
          ? { ...action, name: editText.trim(), description: `Custom: ${editText.trim()}` }
          : action
      ));
    }
    setEditingAction(null);
    setEditText('');
  };

  const deleteCustomAction = (actionId: string) => {
    setCustomActions(prev => prev.filter(action => action.id !== actionId));
    if (selectedAction?.id === actionId) {
      onActionSelect(null);
    }
  };

  const startEdit = (action: any) => {
    setEditingAction(action.id);
    setEditText(action.name);
  };

  return (
    <div className="px-2 sm:px-4">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-2 py-1.5">
        {/* Actions - Horizontal Scrollable */}
        <div className="flex space-x-1.5 mb-1.5 overflow-x-auto scrollbar-hide pb-1">
          {allActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`flex-shrink-0 w-[80px] bg-gradient-to-br ${action.color} border border-white/20 rounded-lg p-2 hover:scale-105 hover:z-50 transition-all duration-200 relative group ${
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
                    className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <Edit2 size={6} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomAction(action.id);
                    }}
                    className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X size={6} className="text-white" />
                  </button>
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-1">
                <div className="w-4 h-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="text-center">
                  <div className="text-white font-medium text-xs leading-tight w-full">
                    {editingAction === action.id ? (
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => saveEdit(action.id)}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit(action.id)}
                        className="w-full bg-transparent text-white text-xs text-center border-none outline-none font-medium"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="truncate text-center">{action.name}</div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {/* Add New Action Button */}
          <button
            onClick={addCustomAction}
            className="flex-shrink-0 w-[80px] bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/30 border-dashed rounded-lg p-2 hover:scale-105 hover:z-50 transition-all duration-200 hover:border-white/50"
          >
            <div className="flex flex-col items-center space-y-1">
              <div className="w-4 h-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Plus size={12} className="text-white/60" />
              </div>
              <div className="text-center">
        </div>
        
        {/* Level Progress - Compact */}
        <div className="pt-1 border-t border-white/10">
          <div className="flex items-center justify-center space-x-1.5">
            <div className="text-teal-400 text-xs font-medium">
              L{user.level}
            </div>
            <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
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
  );
}