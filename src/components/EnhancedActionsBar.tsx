import React, { useState } from 'react';
import { Target, Settings, Mic, ChevronDown, Zap, Heart, Plus, Edit2, X, DollarSign, Sparkles, Palette, Waves, Bird, Brain, Sun, Rope, Eye, Shield, Flame, Star, Om, Moon, Rocket } from 'lucide-react';
import { useGameState } from './GameStateManager';

interface Focus {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  orbColor: string;
  scriptTheme: string;
}

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  focuses: Focus[];
  onSelectFocus: (focus: Focus) => void;
}

const CORE_FOCUSES: Focus[] = [
  {
    id: 'abundance',
    name: 'Abundance',
    icon: <DollarSign size={16} className="text-yellow-400" />,
    description: 'Attract opportunities, dissolve scarcity',
    orbColor: 'golden',
    scriptTheme: 'prosperity'
  },
  {
    id: 'power',
    name: 'Power',
    icon: <Zap size={16} className="text-red-400" />,
    description: 'Inner strength, charisma, influence',
    orbColor: 'red-gold',
    scriptTheme: 'strength'
  },
  {
    id: 'love',
    name: 'Love',
    icon: <Heart size={16} className="text-pink-400" />,
    description: 'Self-love, relationships, connection',
    orbColor: 'rose-pink',
    scriptTheme: 'connection'
  },
  {
    id: 'healing',
    name: 'Healing',
    icon: <Heart size={16} className="text-green-400" />,
    description: 'Body-mind repair, resilience',
    orbColor: 'green-blue',
    scriptTheme: 'recovery'
  },
  {
    id: 'freedom',
    name: 'Freedom',
    icon: <Bird size={16} className="text-cyan-400" />,
    description: 'Break limits, dissolve blocks',
    orbColor: 'sky-blue',
    scriptTheme: 'liberation'
  },
  {
    id: 'creativity',
    name: 'Creativity',
    icon: <Palette size={16} className="text-purple-400" />,
    description: 'Unlock flow, ideas, expression',
    orbColor: 'rainbow',
    scriptTheme: 'creation'
  },
  {
    id: 'calm',
    name: 'Calm',
    icon: <Waves size={16} className="text-blue-400" />,
    description: 'Peace of mind, anxiety reduction',
    orbColor: 'ocean-blue',
    scriptTheme: 'peace'
  },
  {
    id: 'discipline',
    name: 'Discipline',
    icon: <Rope size={16} className="text-gray-400" />,
    description: 'Self-control, consistency, habits',
    orbColor: 'steel-gray',
    scriptTheme: 'structure'
  }
];

const ADVANCED_FOCUSES: Focus[] = [
  {
    id: 'clarity',
    name: 'Clarity',
    icon: <Eye size={16} className="text-indigo-400" />,
    description: 'Decision making, insight, vision',
    orbColor: 'crystal-clear',
    scriptTheme: 'insight'
  },
  {
    id: 'courage',
    name: 'Courage',
    icon: <Shield size={16} className="text-orange-400" />,
    description: 'Overcoming fear, taking action',
    orbColor: 'flame-orange',
    scriptTheme: 'bravery'
  },
  {
    id: 'magnetism',
    name: 'Magnetism',
    icon: <Sparkles size={16} className="text-yellow-400" />,
    description: 'Presence, attraction, charisma',
    orbColor: 'magnetic-gold',
    scriptTheme: 'attraction'
  },
  {
    id: 'spirituality',
    name: 'Spirituality',
    icon: <Om size={16} className="text-violet-400" />,
    description: 'Higher connection, meaning',
    orbColor: 'cosmic-violet',
    scriptTheme: 'transcendence'
  },
  {
    id: 'reprogramming',
    name: 'Reprogramming',
    icon: <Brain size={16} className="text-cyan-400" />,
    description: 'Destroy limiting beliefs, install new ones',
    orbColor: 'neural-blue',
    scriptTheme: 'transformation'
  },
  {
    id: 'joy',
    name: 'Joy',
    icon: <Sun size={16} className="text-yellow-400" />,
    description: 'Raise vibration, happiness baseline',
    orbColor: 'sunshine-yellow',
    scriptTheme: 'bliss'
  },
  {
    id: 'shadow-work',
    name: 'Shadow Work',
    icon: <Moon size={16} className="text-gray-400" />,
    description: 'Integrate hidden parts of self',
    orbColor: 'shadow-purple',
    scriptTheme: 'integration'
  },
  {
    id: 'purpose',
    name: 'Purpose',
    icon: <Rocket size={16} className="text-blue-400" />,
    description: 'Align with mission, drive forward',
    orbColor: 'mission-blue',
    scriptTheme: 'alignment'
  }
];

const ACTION_FOCUS_MAPPING = {
  'stress-relief': ['calm', 'healing', 'freedom'],
  'focus-boost': ['clarity', 'discipline', 'power'],
  'energy-up': ['power', 'joy', 'courage'],
  'confidence': ['power', 'magnetism', 'abundance'],
  'sleep-prep': ['calm', 'healing', 'spirituality']
};

function FocusModal({ isOpen, onClose, actionName, focuses, onSelectFocus }: FocusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">Choose Focus</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
          <p className="text-teal-400 text-sm">
            <span className="font-medium">Session:</span> {actionName}
          </p>
        </div>

        <div className="space-y-3">
          {focuses.map((focus) => (
            <button
              key={focus.id}
              onClick={() => onSelectFocus(focus)}
              className="w-full p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  {focus.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-semibold text-base mb-1">{focus.name}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{focus.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [selectedActionForFocus, setSelectedActionForFocus] = useState<string | null>(null);
  const [customActions, setCustomActions] = useState<any[]>([]);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const quickActions = [
    {
      id: 'stress-relief',
      name: 'Stress Relief',
      icon: <Heart size={16} className="text-teal-400" />,
      color: 'from-teal-500/20 to-cyan-500/20',
      description: 'Release tension and find calm',
      focuses: ['calm', 'healing', 'freedom']
    },
    {
      id: 'focus-boost',
      name: 'Focus Boost',
      icon: <Target size={16} className="text-purple-400" />,
      color: 'from-purple-500/20 to-blue-500/20',
      description: 'Sharpen concentration',
      focuses: ['clarity', 'discipline', 'power']
    },
    {
      id: 'energy-up',
      name: 'Energy Up',
      icon: <Zap size={16} className="text-orange-400" />,
      color: 'from-orange-500/20 to-amber-500/20',
      description: 'Boost motivation and energy',
      focuses: ['power', 'joy', 'courage']
    },
    {
      id: 'confidence',
      name: 'Confidence',
      icon: <Settings size={16} className="text-yellow-400" />,
      color: 'from-yellow-500/20 to-amber-500/20',
      description: 'Build self-assurance',
      focuses: ['power', 'magnetism', 'abundance']
    },
    {
      id: 'sleep-prep',
      name: 'Sleep Prep',
      icon: <Mic size={16} className="text-indigo-400" />,
      color: 'from-indigo-500/20 to-purple-500/20',
      description: 'Prepare for rest',
      focuses: ['calm', 'healing', 'spirituality']
    }
  ];

  const allActions = [...quickActions, ...customActions];
  const allFocuses = [...CORE_FOCUSES, ...ADVANCED_FOCUSES];

  const handleActionClick = (action: any) => {
    if (action.id === selectedAction?.id) {
      // Deselect if clicking the same action
      onActionSelect(null);
    } else if (action.focuses && action.focuses.length > 0) {
      // Show focus modal for actions with focuses
      setSelectedActionForFocus(action.id);
      setShowFocusModal(true);
    } else {
      // Select action directly if no focuses
      onActionSelect(action);
    }
  };

  const handleFocusSelect = (focus: Focus) => {
    const baseAction = quickActions.find(a => a.id === selectedActionForFocus);
    if (baseAction) {
      const actionWithFocus = {
        ...baseAction,
        focus: focus,
        name: `${baseAction.name} • ${focus.name}`,
        orbColor: focus.orbColor,
        scriptTheme: focus.scriptTheme
      };
      onActionSelect(actionWithFocus);
    }
    setShowFocusModal(false);
    setSelectedActionForFocus(null);
  };

  const getAvailableFocuses = (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action || !action.focuses) return [];
    
    return allFocuses.filter(focus => action.focuses.includes(focus.id));
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
    <>
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
                  <div className="text-white/70 font-medium text-xs leading-tight">Add</div>
                </div>
              </div>
            </button>
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

      {/* Focus Modal */}
      {showFocusModal && selectedActionForFocus && (
        <FocusModal
          isOpen={showFocusModal}
          onClose={() => {
            setShowFocusModal(false);
            setSelectedActionForFocus(null);
          }}
          actionName={quickActions.find(a => a.id === selectedActionForFocus)?.name || ''}
          focuses={getAvailableFocuses(selectedActionForFocus)}
          onSelectFocus={handleFocusSelect}
        />
      )}
    </>
  );
}