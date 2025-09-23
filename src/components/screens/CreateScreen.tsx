import React, { useState } from 'react';
import { Plus, Save, Play, Trash2, Clock, Zap, ChevronRight, Edit3, Target, Sparkles } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useUIStore } from '../../state/uiStore';
import '../../styles/glass.css';

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
}

export default function CreateScreen({ onProtocolCreate }: CreateScreenProps) {
  const [protocol, setProtocol] = useState<Partial<CustomProtocol>>({
    name: '',
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

  // Modal handlers
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

  const handleSave = () => {
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
      
      const { showToast } = useUIStore.getState();
      showToast({
        type: 'success',
        message: `Protocol "${protocol.name}" created successfully!`,
        duration: 3000
      });
      
      // Reset form
      setProtocol({
        name: '',
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
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-teal-950/20" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content - Perfect vertical distribution */}
      <div className="relative z-10 h-full flex flex-col px-4">
        
        {/* Header - Compact */}
        <div className="flex-shrink-0 pt-2 pb-4">
          <h1 className="text-white text-lg font-light mb-1">Create Journey</h1>
          <p className="text-white/60 text-sm">Design your personalized hypnosis experience</p>
        </div>

        {/* Content Grid - Fills available space */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4">
          
          {/* Protocol Name Card */}
          <div 
            onClick={openNameModal}
            className="glass-card-premium p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20 hover:border-violet-500/40 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Protocol Name</h3>
                  <div className="text-violet-400 font-semibold text-base">
                    {protocol.name || 'Untitled Journey'}
                  </div>
                </div>
              </div>
              <Edit3 size={16} className="text-violet-400 opacity-60 group-hover:opacity-100" />
            </div>
          </div>

          {/* Duration Card */}
          <div 
            onClick={openDurationModal}
            className="glass-card-premium p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center">
                  <Clock size={16} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Duration</h3>
                  <div className="text-amber-400 font-semibold text-base">
                    {protocol.duration}m
                  </div>
                </div>
              </div>
              <Edit3 size={16} className="text-amber-400 opacity-60 group-hover:opacity-100" />
            </div>
          </div>

          {/* Induction Card */}
          <div 
            onClick={() => setShowInductionModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center">
                  <Zap size={16} className="text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Induction</h3>
                  <div className="text-cyan-400 font-semibold text-base">
                    {inductionOptions.find(opt => opt.id === protocol.induction)?.name || 'Select Method'}
                  </div>
                </div>
              </div>
              <Edit3 size={16} className="text-cyan-400 opacity-60 group-hover:opacity-100" />
            </div>
          </div>

          {/* Deepener Card */}
          <div 
            onClick={() => setShowDeepenerModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                  <span className="text-lg">🌀</span>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Deepener</h3>
                  <div className="text-emerald-400 font-semibold text-base">
                    {deepenerOptions.find(opt => opt.id === protocol.deepener)?.name || 'Select Method'}
                  </div>
                </div>
              </div>
              <Edit3 size={16} className="text-emerald-400 opacity-60 group-hover:opacity-100" />
            </div>
          </div>

          {/* Goals Card */}
          <div 
            onClick={() => setShowGoalsModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20 hover:border-rose-500/40 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/30 to-pink-500/30 flex items-center justify-center">
                  <Target size={16} className="text-rose-300" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Goals</h3>
                  <div className="text-rose-400 font-semibold text-base">
                    {protocol.goals && protocol.goals.length > 0 ? 
                      `${protocol.goals.length} goal${protocol.goals.length > 1 ? 's' : ''} set` : 
                      'Add goals'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-rose-400 text-xs bg-rose-500/20 px-2 py-0.5 rounded-full font-medium border border-rose-500/30">
                  {protocol.goals?.length || 0}
                </span>
                <Edit3 size={16} className="text-rose-400 opacity-60 group-hover:opacity-100" />
              </div>
            </div>
          </div>

          {/* Metaphors Card */}
          <div 
            onClick={() => setShowMetaphorsModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-yellow-500/10 to-lime-500/10 border-yellow-500/20 hover:border-yellow-500/40 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/30 to-lime-500/30 flex items-center justify-center">
                  <Sparkles size={16} className="text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">Metaphors</h3>
                  <div className="text-yellow-400 font-semibold text-base">
                    {protocol.metaphors && protocol.metaphors.length > 0 ? 
                      `${protocol.metaphors.length} metaphor${protocol.metaphors.length > 1 ? 's' : ''} added` : 
                      'Add imagery'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-0.5 rounded-full font-medium border border-yellow-500/30">
                  {protocol.metaphors?.length || 0}
                </span>
                <Edit3 size={16} className="text-yellow-400 opacity-60 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions - Fixed */}
        <div className="flex-shrink-0 py-4">
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/20 hover:shadow-teal-400/40"
              style={{ minHeight: '44px' }}
            >
              <Save size={16} className="inline mr-2" />
              Save Protocol
            </button>
            
            <button
              onClick={() => {/* Preview functionality */}}
              disabled={!isValid}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              style={{ minHeight: '44px' }}
            >
              <Play size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Name Modal */}
      <ModalShell
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title="Protocol Name"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNameModal(false)}
              className="flex-1 glass-button bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </button>
            <button
              onClick={saveNameModal}
              disabled={!tempName.trim()}
              className="flex-1 glass-button bg-gradient-to-r from-violet-400 to-purple-400 text-black font-semibold disabled:opacity-50"
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
              className="glass-input focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20 text-lg font-medium"
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
              className="flex-1 glass-button bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </button>
            <button
              onClick={saveDurationModal}
              className="flex-1 glass-button bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold"
            >
              Set Duration
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-amber-400 mb-2">{tempDuration}m</div>
              <p className="text-amber-400/80">Perfect for deep transformation</p>
            </div>
            
            <input
              type="range"
              min="5"
              max="30"
              value={tempDuration}
              onChange={(e) => setTempDuration(parseInt(e.target.value))}
              className="glass-slider w-full mb-4"
            />
            
            <div className="flex justify-between text-amber-400/60 text-sm">
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
              className={`w-full p-4 glass-card text-left glass-hover-lift glass-scale transition-all duration-300 ${
                protocol.induction === option.id
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20 ring-state'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{option.emoji}</span>
                <div>
                  <div className="font-medium text-lg">{option.name}</div>
                  <div className="text-sm opacity-70">{option.description}</div>
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
              className={`w-full p-4 glass-card text-left glass-hover-lift glass-scale transition-all duration-300 ${
                protocol.deepener === option.id
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20 ring-state'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{option.emoji}</span>
                <div>
                  <div className="font-medium text-lg">{option.name}</div>
                  <div className="text-sm opacity-70">{option.description}</div>
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
            className="w-full glass-button bg-gradient-to-r from-rose-400 to-pink-400 text-black font-semibold"
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
                className="flex-1 glass-input focus:border-rose-400/60 focus:ring-2 focus:ring-rose-400/20"
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              />
              <button
                onClick={addGoal}
                disabled={!newGoal.trim()}
                className="glass-button px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-400 hover:bg-rose-500/30 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {protocol.goals && protocol.goals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Your Goals ({protocol.goals.length})</h4>
              {protocol.goals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 border border-white/20 hover:bg-white/15 transition-colors group/item">
                  <span className="text-white font-medium flex-1">{goal}</span>
                  <button
                    onClick={() => removeGoal(index)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-3 opacity-0 group-hover/item:opacity-100"
                  >
                    <Trash2 size={16} />
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
            className="w-full glass-button bg-gradient-to-r from-yellow-400 to-lime-400 text-black font-semibold"
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
                className="flex-1 glass-input focus:border-yellow-400/60 focus:ring-2 focus:ring-yellow-400/20"
                onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
              />
              <button
                onClick={addMetaphor}
                disabled={!newMetaphor.trim()}
                className="glass-button px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {protocol.metaphors && protocol.metaphors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Your Metaphors ({protocol.metaphors.length})</h4>
              {protocol.metaphors.map((metaphor, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 border border-white/20 hover:bg-white/15 transition-colors group/item">
                  <span className="text-white font-medium flex-1">{metaphor}</span>
                  <button
                    onClick={() => removeMetaphor(index)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-3 opacity-0 group-hover/item:opacity-100"
                  >
                    <Trash2 size={16} />
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