import React, { useState } from 'react';
import { Plus, Save, Clock, Zap, Target, Sparkles, Edit3, FileText, X } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import AuthModal from '../auth/AuthModal';
import { useUIStore } from '../../state/uiStore';
import { useGameState } from '../GameStateManager';

interface CustomProtocol {
  id: string;
  name: string;
  induction: string;
  deepener: string;
  goals: string[];
  metaphors: string[];
  duration: number;
}

interface CreateScreenProps {
  onProtocolCreate: (protocol: CustomProtocol) => void;
  onShowAuth: () => void;
}

export default function CreateScreen({ onProtocolCreate, onShowAuth }: CreateScreenProps) {
  const { user, canAccess } = useGameState();
  const { showToast } = useUIStore();
  
  // Local state for auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [protocol, setProtocol] = useState<Partial<CustomProtocol>>({
    name: 'Untitled Journey',
    induction: 'progressive-relaxation',
    deepener: 'staircase',
    goals: [],
    metaphors: [],
    duration: 15
  });

  // Modal states
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showInductionModal, setShowInductionModal] = useState(false);
  const [showDeepenerModal, setShowDeepenerModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showMetaphorsModal, setShowMetaphorsModal] = useState(false);

  // Temp editing states
  const [tempName, setTempName] = useState('');
  const [tempDuration, setTempDuration] = useState(15);
  const [newGoal, setNewGoal] = useState('');
  const [newMetaphor, setNewMetaphor] = useState('');

  const inductionOptions = [
    { id: 'progressive-relaxation', name: 'Progressive Relaxation', description: 'Gentle body-based induction', emoji: '🌊' },
    { id: 'rapid-induction', name: 'Rapid Induction', description: 'Quick Elman technique', emoji: '⚡' },
    { id: 'eye-fixation', name: 'Eye Fixation', description: 'Visual focus technique', emoji: '👁️' },
    { id: 'breath-work', name: 'Breath Work', description: 'Breathing-based induction', emoji: '🫁' }
  ];

  const deepenerOptions = [
    { id: 'staircase', name: 'Staircase', description: 'Classic descending stairs', emoji: '🪜' },
    { id: 'elevator', name: 'Elevator', description: 'Smooth descent visualization', emoji: '🛗' },
    { id: 'fractionation', name: 'Fractionation', description: 'In and out technique', emoji: '🌀' },
    { id: 'counting', name: 'Counting Down', description: 'Simple number countdown', emoji: '🔢' }
  ];

  // Check if user can access custom protocol creation
  const canCreateCustom = canAccess('custom_outlines');

  const openNameModal = () => {
    setTempName(protocol.name || '');
    setShowNameModal(true);
  };

  const saveNameModal = () => {
    setProtocol(prev => ({ ...prev, name: tempName }));
    setShowNameModal(false);
  };

  const openDurationModal = () => {
    setTempDuration(protocol.duration || 15);
    setShowDurationModal(true);
  };

  const saveDurationModal = () => {
    setProtocol(prev => ({ ...prev, duration: tempDuration }));
    setShowDurationModal(false);
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setProtocol(prev => ({
        ...prev,
        goals: [...(prev.goals || []), newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setProtocol(prev => ({
      ...prev,
      goals: prev.goals?.filter((_, i) => i !== index) || []
    }));
  };

  const addMetaphor = () => {
    if (newMetaphor.trim()) {
      setProtocol(prev => ({
        ...prev,
        metaphors: [...(prev.metaphors || []), newMetaphor.trim()]
      }));
      setNewMetaphor('');
    }
  };

  const removeMetaphor = (index: number) => {
    setProtocol(prev => ({
      ...prev,
      metaphors: prev.metaphors?.filter((_, i) => i !== index) || []
    }));
  };

  const handleCardClick = (action: () => void) => {
    // Allow all users to interact with the form
    action();
  };

  const handleSave = () => {
    if (!user) {
      showToast({
        type: 'warning',
        message: 'Sign in to save protocols',
        duration: 3000
      });
      return;
    }
    
    if (!canCreateCustom) {
      showToast({
        type: 'info',
        message: 'Upgrade to Pro to save custom protocols',
        duration: 4000
      });
      return;
    }

    if (protocol.name && protocol.induction && protocol.deepener) {
      const newProtocol: CustomProtocol = {
        id: 'custom-' + Date.now(),
        name: protocol.name,
        induction: protocol.induction,
        deepener: protocol.deepener,
        goals: protocol.goals || [],
        metaphors: protocol.metaphors || [],
        duration: protocol.duration || 15
      };
      onProtocolCreate(newProtocol);
      
      showToast({
        type: 'success',
        message: `Protocol "${protocol.name}" created successfully!`,
        duration: 3000
      });
      
      // Reset form
      setProtocol({
        name: 'Untitled Journey',
        induction: 'progressive-relaxation',
        deepener: 'staircase',
        goals: [],
        metaphors: [],
        duration: 15
      });
    }
  };

  const isValid = protocol.name && protocol.induction && protocol.deepener;

  return (
    <div className="h-full bg-black relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black" />

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 border-b border-white/10 relative z-10">
        <h1 className="text-white text-xl font-light mb-1">Create Journey</h1>
        <p className="text-white/60 text-sm">Design your personalized hypnosis experience</p>
      </div>

      {/* Content - Stacked Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 relative z-10">
        <div className="space-y-3 pb-6">
          
          {/* Protocol Name Card */}
          <button
            onClick={() => handleCardClick(openNameModal)}
            className="w-full bg-gradient-to-r from-violet-900/80 to-purple-900/80 border border-violet-500/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40 group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/30 border border-violet-500/40 flex items-center justify-center">
                <FileText size={20} className="text-violet-400" />
              </div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">Protocol Name</div>
                <div className="text-violet-400 text-base font-semibold">{protocol.name}</div>
              </div>
            </div>
            <Edit3 size={18} className="text-violet-400/60 group-hover:text-violet-400 transition-colors" />
          </button>

          {/* Duration Card */}
          <button
            onClick={() => handleCardClick(openDurationModal)}
            className="w-full bg-gradient-to-r from-orange-900/80 to-amber-900/80 border border-orange-500/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-orange-500/40 group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/30 border border-orange-500/40 flex items-center justify-center">
                <Clock size={20} className="text-orange-400" />
              </div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">Duration</div>
                <div className="text-orange-400 text-base font-semibold">{protocol.duration}m</div>
              </div>
            </div>
            <Edit3 size={18} className="text-orange-400/60 group-hover:text-orange-400 transition-colors" />
          </button>

          {/* Induction Card */}
          <button
            onClick={() => handleCardClick(() => setShowInductionModal(true))}
            className="w-full bg-gradient-to-r from-cyan-900/80 to-blue-900/80 border border-cyan-500/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/40 group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/30 border border-cyan-500/40 flex items-center justify-center">
                <Zap size={20} className="text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">Induction</div>
                <div className="text-cyan-400 text-base font-semibold">
                  {inductionOptions.find(opt => opt.id === protocol.induction)?.name || 'Progressive Relaxation'}
                </div>
              </div>
            </div>
            <Edit3 size={18} className="text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
          </button>

          {/* Deepener Card */}
          <button
            onClick={() => handleCardClick(() => setShowDeepenerModal(true))}
            className="w-full bg-gradient-to-r from-teal-900/80 to-emerald-900/80 border border-teal-500/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-teal-500/40 group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/30 border border-teal-500/40 flex items-center justify-center">
                <span className="text-xl">🌀</span>
              </div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">Deepener</div>
                <div className="text-teal-400 text-base font-semibold">
                  {deepenerOptions.find(opt => opt.id === protocol.deepener)?.name || 'Staircase'}
                </div>
              </div>
            </div>
            <Edit3 size={18} className="text-teal-400/60 group-hover:text-teal-400 transition-colors" />
          </button>

          {/* Goals Card */}
          <button
            onClick={() => handleCardClick(() => setShowGoalsModal(true))}
            className="w-full bg-gradient-to-r from-rose-900/80 to-pink-900/80 border border-rose-500/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-rose-500/40 group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/30 border border-rose-500/40 flex items-center justify-center">
                <Target size={20} className="text-rose-400" />
              </div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">Goals</div>
                <div className="text-rose-400 text-base font-semibold">
                  {protocol.goals && protocol.goals.length > 0 ? 
                    `${protocol.goals.length} goal${protocol.goals.length > 1 ? 's' : ''} set` : 
                    'Add goals'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-rose-500/30 border border-rose-500/40 flex items-center justify-center">
                <span className="text-rose-400 text-xs font-bold">{protocol.goals?.length || 0}</span>
              </div>
              <Edit3 size={18} className="text-rose-400/60 group-hover:text-rose-400 transition-colors" />
            </div>
          </button>

          {/* Metaphors Card */}
          <button
            onClick={() => handleCardClick(() => setShowMetaphorsModal(true))}
            className="w-full bg-gradient-to-r from-yellow-900/80 to-lime-900/80 border border-yellow-500/20 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-yellow-500/40 group flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/30 border border-yellow-500/40 flex items-center justify-center">
                <Sparkles size={20} className="text-yellow-400" />
              </div>
              <div className="text-left">
                <div className="text-white/80 text-sm font-medium">Metaphors</div>
                <div className="text-yellow-400 text-base font-semibold">
                  {protocol.metaphors && protocol.metaphors.length > 0 ? 
                    `${protocol.metaphors.length} metaphor${protocol.metaphors.length > 1 ? 's' : ''} added` : 
                    'Add imagery'}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500/30 border border-yellow-500/40 flex items-center justify-center">
                <span className="text-yellow-400 text-xs font-bold">{protocol.metaphors?.length || 0}</span>
              </div>
              <Edit3 size={18} className="text-yellow-400/60 group-hover:text-yellow-400 transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* Save Button - Fixed at Bottom */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-black/95 to-transparent backdrop-blur-sm relative z-10">
        {canCreateCustom && user ? (
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl text-black font-bold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-teal-500/20 flex items-center justify-center space-x-3"
          >
            <Save size={20} />
            <span>Save Protocol</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30 text-center">
              <div className="text-amber-400 font-semibold mb-2">🔒 Premium Feature</div>
              <p className="text-white/80 text-sm mb-3">Custom protocol creation requires a Pro subscription</p>
              <div className="flex flex-col space-y-2">
                <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200">
                  Upgrade to Pro
                </button>
                <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 hover:bg-white/20 transition-all duration-300">
                  Browse Templates Instead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Protocol Name Modal */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title="Protocol Name"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNameModal(false)}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={saveNameModal}
              disabled={!tempName.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-400 to-purple-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50"
            >
              Save Name
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20">
            <h3 className="text-white font-medium mb-3">What's your journey called?</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="My Confidence Builder"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-violet-400/50 focus:bg-white/15"
              autoFocus
            />
          </div>
        </div>
      </ModalShell>

      {/* Duration Modal */}
      <ModalShell
        isOpen={showDurationModal}
        onClose={() => setShowDurationModal(false)}
        title="Session Duration"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDurationModal(false)}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={saveDurationModal}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
            >
              Set Duration
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-orange-500/20">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-orange-400 mb-2">{tempDuration}m</div>
              <p className="text-orange-400/80">Perfect for deep transformation</p>
            </div>
            
            <input
              type="range"
              min="5"
              max="30"
              value={tempDuration}
              onChange={(e) => setTempDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer mb-4"
            />
            
            <div className="flex justify-between text-orange-400/60 text-sm">
              <span>5 min</span>
              <span>Quick</span>
              <span>Standard</span>
              <span>Deep</span>
              <span>30 min</span>
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Induction Modal */}
      <ModalShell
        isOpen={showInductionModal}
        onClose={() => setShowInductionModal(false)}
        title="Select Induction Method"
      >
        <div className="space-y-3">
          {inductionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setProtocol(prev => ({ ...prev, induction: option.id }));
                setShowInductionModal(false);
              }}
              className={`w-full p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] ${
                protocol.induction === option.id
                  ? 'bg-cyan-500/20 border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{option.emoji}</span>
                <div>
                  <div className="text-white font-medium text-lg">{option.name}</div>
                  <div className="text-white/60 text-sm">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ModalShell>

      {/* Deepener Modal */}
      <ModalShell
        isOpen={showDeepenerModal}
        onClose={() => setShowDeepenerModal(false)}
        title="Select Deepening Method"
      >
        <div className="space-y-3">
          {deepenerOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setProtocol(prev => ({ ...prev, deepener: option.id }));
                setShowDeepenerModal(false);
              }}
              className={`w-full p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] ${
                protocol.deepener === option.id
                  ? 'bg-teal-500/20 border-2 border-teal-500/40 shadow-lg shadow-teal-500/20'
                  : 'bg-white/5 border border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{option.emoji}</span>
                <div>
                  <div className="text-white font-medium text-lg">{option.name}</div>
                  <div className="text-white/60 text-sm">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ModalShell>

      {/* Goals Modal */}
      <ModalShell
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        title="Session Goals"
        footer={
          <button
            onClick={() => setShowGoalsModal(false)}
            className="w-full px-4 py-3 bg-gradient-to-r from-rose-400 to-pink-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl p-4 border border-rose-500/20">
            <h3 className="text-white font-medium mb-3">Add a new goal</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Build confidence..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-rose-400/50 focus:bg-white/15"
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              />
              <button
                onClick={addGoal}
                disabled={!newGoal.trim()}
                className="px-4 py-3 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-400 hover:bg-rose-500/30 transition-all duration-300 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {protocol.goals && protocol.goals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Your Goals ({protocol.goals.length})</h4>
              {protocol.goals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 border border-white/20 hover:bg-white/15 transition-colors group">
                  <span className="text-white font-medium flex-1">{goal}</span>
                  <button
                    onClick={() => removeGoal(index)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-3 opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalShell>

      {/* Metaphors Modal */}
      <ModalShell
        isOpen={showMetaphorsModal}
        onClose={() => setShowMetaphorsModal(false)}
        title="Metaphors & Imagery"
        footer={
          <button
            onClick={() => setShowMetaphorsModal(false)}
            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-lime-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-yellow-500/10 to-lime-500/10 rounded-xl p-4 border border-yellow-500/20">
            <h3 className="text-white font-medium mb-3">Add a metaphor</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMetaphor}
                onChange={(e) => setNewMetaphor(e.target.value)}
                placeholder="Strong oak tree..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50 focus:bg-white/15"
                onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
              />
              <button
                onClick={addMetaphor}
                disabled={!newMetaphor.trim()}
                className="px-4 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-all duration-300 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {protocol.metaphors && protocol.metaphors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Your Metaphors ({protocol.metaphors.length})</h4>
              {protocol.metaphors.map((metaphor, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 border border-white/20 hover:bg-white/15 transition-colors group">
                  <span className="text-white font-medium flex-1">{metaphor}</span>
                  <button
                    onClick={() => removeMetaphor(index)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-3 opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
}