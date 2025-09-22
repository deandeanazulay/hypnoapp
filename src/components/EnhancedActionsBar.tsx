import React, { useState } from 'react';
import { Target, Settings, Mic, ChevronDown, Zap, Heart, Plus, Edit2, X, DollarSign, Sparkles, Palette, Waves, Bird, Brain, Sun, Eye, Shield, Flame, Star, Moon, Rocket } from 'lucide-react';
import { useGameState } from './GameStateManager';

interface Focus {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  orbColor: string;
  scriptTheme: string;
  aiSuggestion: string;
}

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionType: string;
  focuses: Focus[];
  onSelectFocus: (focus: Focus) => void;
}

const ALL_FOCUSES: Focus[] = [
  // Stress Relief focuses
  {
    id: 'calm',
    name: 'Calm',
    icon: <Waves size={16} className="text-blue-400" />,
    description: 'Peace of mind, anxiety reduction',
    orbColor: 'ocean-blue',
    scriptTheme: 'peace',
    aiSuggestion: 'Your mind becomes as calm as a still lake, peaceful and serene.'
  },
  {
    id: 'healing',
    name: 'Healing',
    icon: <Heart size={16} className="text-green-400" />,
    description: 'Body-mind repair, resilience',
    orbColor: 'green-blue',
    scriptTheme: 'recovery',
    aiSuggestion: 'Your body and mind heal naturally, restoring balance and vitality.'
  },
  {
    id: 'freedom',
    name: 'Freedom',
    icon: <Bird size={16} className="text-cyan-400" />,
    description: 'Break limits, dissolve blocks',
    orbColor: 'sky-blue',
    scriptTheme: 'liberation',
    aiSuggestion: 'You feel completely free, breaking through all limitations effortlessly.'
  },
  // Focus Boost focuses
  {
    id: 'clarity',
    name: 'Clarity',
    icon: <Eye size={16} className="text-indigo-400" />,
    description: 'Decision making, insight, vision',
    orbColor: 'crystal-clear',
    scriptTheme: 'insight',
    aiSuggestion: 'Your mind clears like a calm lake, seeing everything with perfect clarity.'
  },
  {
    id: 'discipline',
    name: 'Discipline',
    icon: <Shield size={16} className="text-gray-400" />,
    description: 'Self-control, consistency, habits',
    orbColor: 'steel-gray',
    scriptTheme: 'structure',
    aiSuggestion: 'You feel completely in control, disciplined and focused on what matters.'
  },
  // Energy Up focuses
  {
    id: 'power',
    name: 'Power',
    icon: <Zap size={16} className="text-red-400" />,
    description: 'Inner strength, charisma, influence',
    orbColor: 'red-gold',
    scriptTheme: 'strength',
    aiSuggestion: 'You feel powerful and strong, radiating confidence and inner strength.'
  },
  {
    id: 'joy',
    name: 'Joy',
    icon: <Sun size={16} className="text-yellow-400" />,
    description: 'Raise vibration, happiness baseline',
    orbColor: 'sunshine-yellow',
    scriptTheme: 'bliss',
    aiSuggestion: 'Pure joy flows through you, lifting your spirit and energy naturally.'
  },
  {
    id: 'courage',
    name: 'Courage',
    icon: <Flame size={16} className="text-orange-400" />,
    description: 'Overcoming fear, taking action',
    orbColor: 'flame-orange',
    scriptTheme: 'bravery',
    aiSuggestion: 'You feel brave and courageous, ready to face any challenge with confidence.'
  }
];

const CONFIDENCE_FOCUSES: Focus[] = [
  {
    id: 'power-conf',
    name: 'Power',
    icon: <Zap size={16} className="text-red-400" />,
    description: 'Inner strength, charisma, influence',
    orbColor: 'red-gold',
    scriptTheme: 'strength',
    aiSuggestion: 'You radiate power and confidence, naturally commanding respect and attention.'
  },
  {
    id: 'magnetism',
    name: 'Magnetism',
    icon: <Sparkles size={16} className="text-yellow-400" />,
    description: 'Presence, attraction, charisma',
    orbColor: 'magnetic-gold',
    scriptTheme: 'attraction',
    aiSuggestion: 'People feel drawn to your magnetic energy and natural charisma.'
  },
  {
    id: 'abundance',
    name: 'Abundance',
    icon: <DollarSign size={16} className="text-yellow-400" />,
    description: 'Attract opportunities, dissolve scarcity',
    orbColor: 'golden',
    scriptTheme: 'prosperity',
    aiSuggestion: 'Opportunities flow to you naturally, abundance is your natural state.'
  }
];

const SLEEP_PREP_FOCUSES: Focus[] = [
  {
    id: 'calm-sleep',
    name: 'Calm',
    icon: <Waves size={16} className="text-blue-400" />,
    description: 'Peace of mind, anxiety reduction',
    orbColor: 'ocean-blue',
    scriptTheme: 'peace',
    aiSuggestion: 'Your mind becomes perfectly calm and peaceful, ready for deep rest.'
  },
  {
    id: 'healing-sleep',
    name: 'Healing',
    icon: <Heart size={16} className="text-green-400" />,
    description: 'Body-mind repair, resilience',
    orbColor: 'green-blue',
    scriptTheme: 'recovery',
    aiSuggestion: 'Your body heals and restores itself as you drift into peaceful sleep.'
  },
  {
    id: 'spirituality',
    name: 'Spirituality',
    icon: <Star size={16} className="text-violet-400" />,
    description: 'Higher connection, meaning',
    orbColor: 'cosmic-violet',
    scriptTheme: 'transcendence',
    aiSuggestion: 'You connect with deeper peace and spiritual tranquility as you rest.'
  }
];

// Session type to focus mapping
const SESSION_FOCUS_MAPPING = {
  'stress-relief': ALL_FOCUSES.filter(f => ['calm', 'healing', 'freedom'].includes(f.id)),
  'focus-boost': ALL_FOCUSES.filter(f => ['clarity', 'discipline'].includes(f.id)).concat([{
    id: 'power-focus',
    name: 'Power',
    icon: <Zap size={16} className="text-red-400" />,
    description: 'Inner strength, charisma, influence',
    orbColor: 'red-gold',
    scriptTheme: 'strength',
    aiSuggestion: 'You feel mentally powerful and focused, with laser-sharp concentration.'
  }]),
  'energy-up': ALL_FOCUSES.filter(f => ['power', 'joy', 'courage'].includes(f.id)),
  'confidence': CONFIDENCE_FOCUSES,
  'sleep-prep': SLEEP_PREP_FOCUSES
};

function FocusModal({ isOpen, onClose, sessionType, focuses, onSelectFocus }: FocusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Bottom sheet style modal */}
      <div className="relative bg-black/95 backdrop-blur-xl rounded-t-3xl p-6 border-t border-white/20 max-w-md w-full max-h-[70vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">Choose Focus</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
          <p className="text-teal-400 text-sm">
            <span className="font-medium">Session:</span> {sessionType}
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
                  <p className="text-white/70 text-sm leading-relaxed mb-2">{focus.description}</p>
                  <p className="text-white/50 text-xs italic">"{focus.aiSuggestion}"</p>
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
  const [currentSessionType, setCurrentSessionType] = useState<string>('');
  const [customActions, setCustomActions] = useState<any[]>([]);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const sessionTypes = [
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

  const allActions = [...sessionTypes, ...customActions];

  const handleActionClick = (action: any) => {
    if (action.isCustom) {
      // For custom actions, just select directly
      onActionSelect(action.id === selectedAction?.id ? null : action);
    } else {
      // For session types, open focus modal
      setCurrentSessionType(action.name);
      setShowFocusModal(true);
    }
  };

  const handleFocusSelect = (focus: Focus) => {
    const sessionWithFocus = {
      id: `${currentSessionType.toLowerCase().replace(' ', '-')}-${focus.id}`,
      name: `${currentSessionType}: ${focus.name}`,
      focus: focus,
      sessionType: currentSessionType,
      orbColor: focus.orbColor,
      scriptTheme: focus.scriptTheme,
      aiSuggestion: focus.aiSuggestion
    };
    onActionSelect(sessionWithFocus);
    setShowFocusModal(false);
    setCurrentSessionType('');
  };

  const getSessionFocuses = (sessionType: string): Focus[] => {
    const sessionKey = sessionType.toLowerCase().replace(' ', '-') as keyof typeof SESSION_FOCUS_MAPPING;
    return SESSION_FOCUS_MAPPING[sessionKey] || [];
  };
  },
  {
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

      {/* Focus Selection Modal */}
      {showFocusModal && currentSessionType && (
        <FocusModal
          isOpen={showFocusModal}
          onClose={() => {
            setShowFocusModal(false);
            setCurrentSessionType('');
          }}
          sessionType={currentSessionType}
          focuses={getSessionFocuses(currentSessionType)}
          onSelectFocus={handleFocusSelect}
        />
      )}
    </>
  );
}