import React, { useState } from 'react';
import { Target, Settings, Mic, ChevronDown, Zap, Heart, Plus, Edit2, X } from 'lucide-react';
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
  const [customActions, setCustomActions] = useState<any[]>([]);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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

  const allActions = [...quickActions, ...customActions];

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
    <>
      <div className="px-2 sm:px-4">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-2 sm:px-3 py-2">
          {/* Actions - Horizontal Scrollable */}
          <div className="flex space-x-1 sm:space-x-2 mb-2 overflow-x-auto scrollbar-hide pb-1">
            {allActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onActionSelect(action)}
                className={`flex-shrink-0 w-[70px] sm:w-[90px] bg-gradient-to-br ${action.color} border border-white/20 rounded-xl p-1.5 sm:p-2 hover:scale-105 transition-all duration-200 relative group ${
                  selectedAction?.id === action.id ? 'ring-2 ring-white/30' : ''
                }`}
              >
                {/* Edit/Delete buttons for custom actions */}
                {action.isCustom && (
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
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
                
                <div className="flex flex-col items-center space-y-0.5 sm:space-y-1">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    {action.icon}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium text-xs leading-tight w-full px-1">
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
                    <div className="text-white/60 text-xs mt-0.5 truncate hidden sm:block">
                      {action.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {/* Add New Action Button */}
            <button
              onClick={addCustomAction}
              className="flex-shrink-0 w-[70px] sm:w-[90px] bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/30 border-dashed rounded-xl p-1.5 sm:p-2 hover:scale-105 transition-all duration-200 hover:border-white/50"
            >
              <div className="flex flex-col items-center space-y-0.5 sm:space-y-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Plus size={12} className="text-white/60" />
                </div>
                <div className="text-center">
                  <div className="text-white/70 font-medium text-xs leading-tight">Add New</div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Level Progress - Compact */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-center space-x-2">
              <div className="text-teal-400 text-xs font-medium">
                L{user.level}
              </div>
              <div className="w-16 sm:w-20 h-1 bg-white/10 rounded-full overflow-hidden">
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