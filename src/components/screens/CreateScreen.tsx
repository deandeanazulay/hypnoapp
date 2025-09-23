import React, { useState } from 'react';
import { Plus, Save, Play, Trash2 } from 'lucide-react';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';

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
    <div className="bg-black/60 backdrop-blur-xl px-4 pt-4 pb-3">
      <h1 className="text-white text-2xl font-light mb-2">Create Journey</h1>
      <p className="text-white/60 text-sm">Build your custom hypnosis protocol</p>
    </div>
  );

  const body = (
    <div className="bg-black relative px-4 py-4 h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-teal-950/20" />
      <div className="relative z-10 h-full">
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* Left Column */}
          <div className="space-y-3 overflow-y-auto">
            {/* Protocol Name */}
            <div className="bg-gradient-to-br from-purple-500/10 to-teal-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-purple-500/30 transition-all duration-300">
              <label className="block text-white/80 text-sm font-medium mb-2">Protocol Name</label>
              <input
                type="text"
                value={protocol.name || ''}
                onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Confidence Builder"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
              />
            </div>

            {/* Induction Selection */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/80 text-sm font-medium">Induction Method</label>
                <button
                  onClick={() => setShowInductionSelector(true)}
                  className="px-2 py-1 bg-blue-500/20 border border-blue-500/40 rounded text-blue-400 text-xs hover:bg-blue-500/30 transition-all duration-300"
                >
                  More
                </button>
              </div>
              <div className="space-y-1">
                {inductionOptions.slice(0, 2).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setProtocol(prev => ({ ...prev, induction: option.id }))}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 text-left text-sm ${
                      protocol.induction === option.id
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{option.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-green-500/30 transition-all duration-300">
              <label className="block text-white/80 text-sm font-medium mb-2">Session Goals</label>
              
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Build confidence"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                />
                <button
                  onClick={addGoal}
                  className="px-2 py-1 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all duration-300"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-1 max-h-20 overflow-y-auto">
                {protocol.goals?.slice(0, 3).map((goal, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                    <span className="text-white/80 text-sm truncate">{goal}</span>
                    <button
                      onClick={() => removeGoal(index)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {(protocol.goals?.length || 0) > 3 && (
                  <div className="text-white/40 text-xs text-center">
                    +{(protocol.goals?.length || 0) - 3} more goals
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3 overflow-y-auto">
            {/* Duration */}
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-orange-500/30 transition-all duration-300">
              <label className="block text-white/80 text-sm font-medium mb-2">Duration</label>
              <input
                type="range"
                min="5"
                max="30"
                value={protocol.duration || 15}
                onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-white/60 text-sm mt-1">
                <span>5m</span>
                <span className="text-orange-400 font-medium">{protocol.duration}m</span>
                <span>30m</span>
              </div>
            </div>

            {/* Deepener Selection */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <label className="text-white/80 text-sm font-medium">Deepening Method</label>
                <button
                  onClick={() => setShowDeepenerSelector(true)}
                  className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-purple-400 text-xs hover:bg-purple-500/30 transition-all duration-300"
                >
                  More
                </button>
              </div>
              <div className="space-y-1">
                {deepenerOptions.slice(0, 2).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setProtocol(prev => ({ ...prev, deepener: option.id }))}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 text-left text-sm ${
                      protocol.deepener === option.id
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{option.name}</div>
                  </button>
                ))}
              </div>
            {/* Metaphors */}
            <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-pink-500/30 transition-all duration-300">
              <label className="block text-white/80 text-sm font-medium mb-2">Metaphors & Imagery</label>
              
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newMetaphor}
                  onChange={(e) => setNewMetaphor(e.target.value)}
                  placeholder="Strong oak tree"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
                />
                <button
                  onClick={addMetaphor}
                  className="px-2 py-1 bg-pink-500/20 border border-pink-500/40 rounded-lg text-pink-400 hover:bg-pink-500/30 transition-all duration-300"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {protocol.metaphors?.slice(0, 3).map((metaphor, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1 border border-white/10">
                    <span className="text-white/80 text-sm truncate">{metaphor}</span>
                    <button
                      onClick={() => removeMetaphor(index)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-2"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {(protocol.metaphors?.length || 0) > 3 && (
                  <div className="text-white/40 text-xs text-center">
                    +{(protocol.metaphors?.length || 0) - 3} more metaphors
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="bg-black/60 backdrop-blur-xl px-4 py-3 border-t border-white/10">
      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-400/30"
        >
          <Save size={16} className="inline mr-2" />
          Save Protocol
        </button>
        
        <button
          onClick={() => {/* Preview functionality */}}
          disabled={!isValid}
          className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/20"
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
              className={`w-full p-4 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${
                protocol.induction === option.id
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-400 shadow-lg shadow-teal-500/20'
                  : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <div className="font-medium mb-1">{option.name}</div>
              <div className="text-sm text-white/50">{option.description}</div>
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
              onClick={() => {
                setProtocol(prev => ({ ...prev, deepener: option.id }));
                setShowDeepenerSelector(false);
              }}
              className={`w-full p-4 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${
                protocol.deepener === option.id
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <div className="font-medium mb-1">{option.name}</div>
              <div className="text-sm text-white/50">{option.description}</div>
            </button>
          ))}
        </div>
      </ModalShell>
    </>
  );
}