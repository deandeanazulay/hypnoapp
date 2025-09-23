import React, { useState } from 'react';
import { Plus, Save, Play, Trash2, Clock, Zap, ChevronRight } from 'lucide-react';
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

  const [newGoal, setNewGoal] = useState('');
  const [newMetaphor, setNewMetaphor] = useState('');
  const [showInductionSelector, setShowInductionSelector] = useState(false);
  const [showDeepenerSelector, setShowDeepenerSelector] = useState(false);

  const inductionOptions = [
    { id: 'progressive-relaxation', name: 'Progressive Relaxation', description: 'Gentle body-based induction' },
    { id: 'rapid-induction', name: 'Rapid Induction', description: 'Quick Elman technique' },
    { id: 'eye-fixation', name: 'Eye Fixation', description: 'Visual focus technique' },
    { id: 'breath-work', name: 'Breath Work', description: 'Breathing-based induction' }
  ];

  const deepenerOptions = [
    { id: 'staircase', name: 'Staircase', description: 'Classic descending stairs' },
    { id: 'elevator', name: 'Elevator', description: 'Smooth descent visualization' },
    { id: 'fractionation', name: 'Fractionation', description: 'In and out technique' },
    { id: 'counting', name: 'Counting Down', description: 'Simple number countdown' }
  ];

  const addGoal = () => {
    if (newGoal.trim() && protocol.goals) {
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
    if (newMetaphor.trim() && protocol.metaphors) {
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
      
      // Show success toast
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
      <p className="text-white/60 text-sm">Build your custom hypnosis protocol</p>
    </div>
  );

  const body = (
    <div className="bg-black relative px-4 py-4 h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-teal-950/20" />
      <div className="relative z-10 h-full">
        {/* 2x3 Card Grid */}
        <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full">
          
          {/* Protocol Name Card */}
          <div className="glass-card-premium p-5 bg-gradient-to-br from-purple-500/10 to-teal-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors glass-glow">
                <span className="text-purple-400 text-sm">📝</span>
              </div>
              <h3 className="text-white font-semibold text-lg">Protocol Name</h3>
            </div>
            <input
              type="text"
              value={protocol.name || ''}
              onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Confidence Builder"
              className="glass-input focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20 text-base font-medium"
            />
          </div>

          {/* Duration Card */}
          <div className="glass-card-premium p-5 bg-gradient-to-br from-orange-500/10 to-amber-500/10 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/20 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors glass-glow">
                <Clock size={16} className="text-orange-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">Duration</h3>
            </div>
            <div className="mb-3">
              <div className="text-center mb-2">
                <span className="text-orange-400 font-bold text-2xl">{protocol.duration}m</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={protocol.duration || 15}
              onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer mb-3 glass-progress"
            />
            <div className="flex justify-between text-white/60 text-xs">
              <span>5m</span>
              <span>30m</span>
            </div>
          </div>

          {/* Induction Method Card */}
          <div 
            className="glass-card-premium p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer group glass-hover-lift"
            onClick={() => setShowInductionSelector(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors glass-glow">
                  <Zap size={16} className="text-blue-400" />
                </div>
                <h3 className="text-white font-semibold text-lg">Induction</h3>
              </div>
              <div className="text-blue-400 group-hover:scale-110 transition-transform glass-scale">
                <ChevronRight size={16} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-white font-medium text-lg mb-1">
                {inductionOptions.find(opt => opt.id === protocol.induction)?.name || 'Select Method'}
              </div>
              <div className="text-white/60 text-sm">
                Tap to choose technique
              </div>
            </div>
          </div>

          {/* Deepener Method Card */}
          <div 
            className="glass-card-premium p-5 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer group glass-hover-lift"
            onClick={() => setShowDeepenerSelector(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors glass-glow">
                  <span className="text-purple-400 text-sm">🌀</span>
                </div>
                <h3 className="text-white font-semibold text-lg">Deepener</h3>
              </div>
              <div className="text-purple-400 group-hover:scale-110 transition-transform glass-scale">
                <ChevronRight size={16} />
              </div>
            </div>
            <div className="text-center">
              <div className="text-white font-medium text-lg mb-1">
                {deepenerOptions.find(opt => opt.id === protocol.deepener)?.name || 'Select Method'}
              </div>
              <div className="text-white/60 text-sm">
                Tap to choose technique
              </div>
            </div>
          </div>

          {/* Goals Card */}
          <div className="glass-card-premium p-5 bg-gradient-to-br from-green-500/10 to-teal-500/10 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/20 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors glass-glow">
                <span className="text-green-400 text-sm">🎯</span>
              </div>
              <h3 className="text-white font-semibold text-lg">Goals</h3>
              <span className="text-green-400 text-sm bg-green-500/20 px-2 py-1 rounded-full">
                {protocol.goals?.length || 0}
              </span>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Build confidence"
                className="flex-1 glass-input text-sm focus:border-green-400/60 focus:ring-2 focus:ring-green-400/20"
                onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              />
              <button
                onClick={addGoal}
                className="glass-button px-3 py-2 bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 glass-scale"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-24 overflow-y-auto">
              {protocol.goals?.slice(0, 4).map((goal, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 border border-white/20 hover:bg-white/15 transition-colors group/item">
                  <span className="text-white text-sm truncate flex-1 font-medium">{goal}</span>
                  <button
                    onClick={() => removeGoal(index)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-2 flex-shrink-0 opacity-0 group-hover/item:opacity-100 hover:scale-110"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(protocol.goals?.length || 0) > 4 && (
                <div className="text-white/40 text-xs text-center">
                  +{(protocol.goals?.length || 0) - 4} more
                </div>
              )}
            </div>
          </div>

          {/* Metaphors Card */}
          <div className="glass-card-premium p-5 bg-gradient-to-br from-pink-500/10 to-rose-500/10 hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/20 group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors glass-glow">
                <span className="text-pink-400 text-sm">✨</span>
              </div>
              <h3 className="text-white font-semibold text-lg">Metaphors</h3>
              <span className="text-pink-400 text-sm bg-pink-500/20 px-2 py-1 rounded-full">
                {protocol.metaphors?.length || 0}
              </span>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newMetaphor}
                onChange={(e) => setNewMetaphor(e.target.value)}
                placeholder="Strong oak tree"
                className="flex-1 glass-input text-sm focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/20"
                onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
              />
              <button
                onClick={addMetaphor}
                className="glass-button px-3 py-2 bg-pink-500/20 border border-pink-500/40 text-pink-400 hover:bg-pink-500/30 glass-scale"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {protocol.metaphors?.slice(0, 4).map((metaphor, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 border border-white/20 hover:bg-white/15 transition-colors group/item">
                  <span className="text-white text-sm truncate flex-1 font-medium">{metaphor}</span>
                  <button
                    onClick={() => removeMetaphor(index)}
                    className="text-red-400 hover:text-red-300 transition-colors ml-2 flex-shrink-0 opacity-0 group-hover/item:opacity-100 hover:scale-110"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(protocol.metaphors?.length || 0) > 4 && (
                <div className="text-white/40 text-xs text-center">
                  +{(protocol.metaphors?.length || 0) - 4} more
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="bg-black/80 backdrop-blur-xl px-4 py-4 border-t border-white/10 flex-shrink-0">
      <div className="flex space-x-4">
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 glass-button px-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-bold text-lg glass-scale disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/30"
        >
          <Save size={18} className="inline mr-2" />
          Save Protocol
        </button>
        
        <button
          onClick={() => {/* Preview functionality */}}
          disabled={!isValid}
          className="glass-button px-6 py-4 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed glass-hover-lift glass-scale"
        >
          <Play size={18} className="inline mr-2" />
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

      {/* Induction Selector Modal */}
      <ModalShell
        isOpen={showInductionSelector}
        onClose={() => setShowInductionSelector(false)}
        title="Select Induction Method"
      >
        <div className="space-y-3">
          {inductionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setProtocol(prev => ({ ...prev, induction: option.id }));
                setShowInductionSelector(false);
              }}
              className={`w-full p-4 glass-card text-left glass-hover-lift glass-scale ${
                protocol.induction === option.id
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-400 shadow-lg shadow-teal-500/20 ring-state'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              <div className="font-medium">{option.name}</div>
              <div className="text-sm opacity-70">{option.description}</div>
            </button>
          ))}
        </div>
      </ModalShell>

      {/* Deepener Selector Modal */}
      <ModalShell
        isOpen={showDeepenerSelector}
        onClose={() => setShowDeepenerSelector(false)}
        title="Select Deepening Method"
      >
        <div className="space-y-3">
          {deepenerOptions.map((option) => (
            <button
              key={option.id}
              className={`w-full p-4 glass-card text-left glass-hover-lift glass-scale ${
                protocol.deepener === option.id
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 shadow-lg shadow-purple-500/20 ring-state'
                  : 'text-white/70 hover:bg-white/10'
              }`}
              onClick={() => {
                setProtocol(prev => ({ ...prev, deepener: option.id }));
                setShowDeepenerSelector(false);
              }}
            >
              <div className="font-medium">{option.name}</div>
              <div className="text-sm opacity-70">{option.description}</div>
            </button>
          ))}
        </div>
      </ModalShell>
    </>
  );
}