import React, { useState } from 'react';
import { Plus, Save, Play, Trash2, Clock, Zap, ChevronRight, Edit3, Target, Sparkles } from 'lucide-react';
import PageShell from '../layout/PageShell';
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

  const header = (
    <div className="bg-black/60 backdrop-blur-xl px-4 pt-4 pb-3 flex-shrink-0">
      <h1 className="text-white text-2xl font-light mb-2">Create Journey</h1>
      <p className="text-white/60 text-sm">Design your personalized hypnosis experience</p>
    </div>
  );

  const body = (
    <div className="bg-black relative px-4 py-4 h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-teal-950/20" />
      <div className="relative z-10 h-full overflow-hidden">
        
        {/* Dynamic Grid */}
        <div className="flex flex-col gap-4 h-full">
          
          {/* Protocol Name Card */}
          <div 
            onClick={openNameModal}
            className="glass-card-premium p-4 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-fuchsia-500/20 border-violet-500/20 hover:border-violet-500/40 cursor-pointer group glass-hover-lift glass-scale overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 flex items-center justify-center group-hover:scale-110 transition-transform glass-glow">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-white font-semibold text-lg">Protocol Name</h3>
              </div>
              <Edit3 size={18} className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-left pl-11">
              <div className="text-xl font-bold text-white mb-1 truncate">
                {protocol.name || 'Untitled Journey'}
              </div>
              <p className="text-violet-400/80 text-sm">
                {protocol.name ? 'Tap to edit name' : 'Tap to add a name'}
              </p>
            </div>
          </div>

          {/* Duration Card */}
          <div 
            onClick={openDurationModal}
            className="glass-card-premium p-4 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 hover:from-amber-500/20 hover:via-orange-500/20 hover:to-red-500/20 border-amber-500/20 hover:border-amber-500/40 cursor-pointer group glass-hover-lift glass-scale overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-red-500/30 flex items-center justify-center group-hover:scale-110 transition-transform glass-glow">
                  <Clock size={16} className="text-amber-300" />
                </div>
                <h3 className="text-white font-semibold text-lg">Duration</h3>
              </div>
              <Edit3 size={18} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-left pl-11">
              <div className="text-2xl font-bold text-amber-400 mb-1">
                {protocol.duration}m
              </div>
              <p className="text-amber-400/80 text-sm">Perfect timing</p>
            </div>
          </div>

          {/* Induction Card */}
          <div 
            onClick={() => setShowInductionModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:via-blue-500/20 hover:to-indigo-500/20 border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer group glass-hover-lift glass-scale overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform glass-glow">
                  <Zap size={16} className="text-cyan-300" />
                </div>
                <h3 className="text-white font-semibold text-lg">Induction</h3>
              </div>
              <Edit3 size={18} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-left pl-11">
              <div className="text-lg font-bold text-white mb-1 truncate">
                {inductionOptions.find(opt => opt.id === protocol.induction)?.name || 'Select Method'}
              </div>
              <p className="text-cyan-400/80 text-sm">
                {inductionOptions.find(opt => opt.id === protocol.induction)?.description || 'Choose your method'}
              </p>
            </div>
          </div>

          {/* Deepener Card */}
          <div 
            onClick={() => setShowDeepenerModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:via-teal-500/20 hover:to-cyan-500/20 border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer group glass-hover-lift glass-scale overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform glass-glow">
                  <span className="text-lg">🌀</span>
                </div>
                <h3 className="text-white font-semibold text-lg">Deepener</h3>
              </div>
              <Edit3 size={18} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-left pl-11">
              <div className="text-lg font-bold text-white mb-1 truncate">
                {deepenerOptions.find(opt => opt.id === protocol.deepener)?.name || 'Select Method'}
              </div>
              <p className="text-emerald-400/80 text-sm">
                {deepenerOptions.find(opt => opt.id === protocol.deepener)?.description || 'Choose your method'}
              </p>
            </div>
          </div>

          {/* Goals Card */}
          <div 
            onClick={() => setShowGoalsModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 hover:from-rose-500/20 hover:via-pink-500/20 hover:to-fuchsia-500/20 border-rose-500/20 hover:border-rose-500/40 cursor-pointer group glass-hover-lift glass-scale overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/30 to-fuchsia-500/30 flex items-center justify-center group-hover:scale-110 transition-transform glass-glow">
                  <Target size={16} className="text-rose-300" />
                </div>
                <h3 className="text-white font-semibold text-lg">Goals</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-rose-400 text-sm bg-rose-500/20 px-2 py-1 rounded-full font-medium">
                  {protocol.goals?.length || 0}
                </span>
                <Edit3 size={18} className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="text-left pl-11">
              <p className="text-rose-400/80 text-sm">
                {protocol.goals && protocol.goals.length > 0 ? 
                  `${protocol.goals.length} goal${protocol.goals.length > 1 ? 's' : ''} configured` : 
                  'Add transformation goals'}
              </p>
            </div>
          </div>

          {/* Metaphors Card */}
          <div 
            onClick={() => setShowMetaphorsModal(true)}
            className="glass-card-premium p-4 bg-gradient-to-br from-yellow-500/10 via-lime-500/10 to-emerald-500/10 hover:from-yellow-500/20 hover:via-lime-500/20 hover:to-emerald-500/20 border-yellow-500/20 hover:border-yellow-500/40 cursor-pointer group glass-hover-lift glass-scale overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500/30 to-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform glass-glow">
                  <Sparkles size={16} className="text-yellow-300" />
                </div>
                <h3 className="text-white font-semibold text-lg">Metaphors</h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 text-sm bg-yellow-500/20 px-2 py-1 rounded-full font-medium">
                  {protocol.metaphors?.length || 0}
                </span>
                <Edit3 size={18} className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="text-left pl-11">
              <p className="text-yellow-400/80 text-sm">
                {protocol.metaphors && protocol.metaphors.length > 0 ? 
                  `${protocol.metaphors.length} metaphor${protocol.metaphors.length > 1 ? 's' : ''} added` : 
                  'Add powerful imagery'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="bg-black/80 backdrop-blur-xl px-4 py-3 border-t border-white/10 flex-shrink-0">
      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 glass-button px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-semibold text-sm glass-scale disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/20 hover:shadow-teal-400/40"
        >
          <Save size={16} className="inline mr-2" />
          Save Protocol
        </button>
        
        <button
          onClick={() => {/* Preview functionality */}}
          disabled={!isValid}
          className="glass-button px-4 py-2 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed glass-hover-lift glass-scale bg-white/5 hover:bg-white/10 border border-white/20"
        >
          <Play size={16} className="inline mr-2" />
          Preview
        </button>
      </div>
    </div>
  );

  return (
    <>
      <PageShell
        header={header}
        body={body}
        footer={footer}
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
              className="flex-1 glass-button bg-white/10 hover:bg-white/20 text-white"
            >
              Cancel
            </button>
            <button
              onClick={saveNameModal}
              disabled={!tempName.trim()}
              className="flex-1 glass-button bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black font-semibold disabled:opacity-50"
            >
              Save Name
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-violet-500/20">
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
              className="flex-1 glass-button bg-gradient-to-r from-amber-400 to-red-400 text-black font-semibold"
            >
              Set Duration
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-red-500/10 rounded-xl p-6 border border-amber-500/20">
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
            className="w-full glass-button bg-gradient-to-r from-rose-400 to-fuchsia-400 text-black font-semibold"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-rose-500/20">
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
            className="w-full glass-button bg-gradient-to-r from-yellow-400 to-emerald-400 text-black font-semibold"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-yellow-500/10 to-emerald-500/10 rounded-xl p-4 border border-yellow-500/20">
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
    </>
  );
}