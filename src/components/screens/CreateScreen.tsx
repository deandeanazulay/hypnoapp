import React, { useState } from 'react';
import { Plus, Save, Play, Trash2 } from 'lucide-react';

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

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-teal-950/20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col pb-20">
        {/* Header */}
        <div className="flex-shrink-0 pt-8 pb-3 px-6">
          <h1 className="text-white text-2xl font-light mb-2">Create Journey</h1>
          <p className="text-white/60 text-sm">Build your custom hypnosis protocol</p>
        </div>

        {/* Form */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full">
          
            {/* Left Column */}
            <div className="space-y-3">
              {/* Protocol Name */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <label className="block text-white/80 text-sm font-medium mb-2">Protocol Name</label>
                <input
                  type="text"
                  value={protocol.name || ''}
                  onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Confidence Builder"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
                />
              </div>

              {/* Induction Selection */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <label className="block text-white/80 text-sm font-medium mb-2">Induction Technique</label>
                <div className="space-y-1">
                  {inductionOptions.slice(0, 3).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setProtocol(prev => ({ ...prev, induction: option.id }))}
                      className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                        protocol.induction === option.id
                          ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs opacity-70">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deepener Selection */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <label className="block text-white/80 text-sm font-medium mb-2">Deepening Method</label>
                <div className="space-y-1">
                  {deepenerOptions.slice(0, 3).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setProtocol(prev => ({ ...prev, deepener: option.id }))}
                      className={`w-full p-2 rounded-lg border transition-all duration-200 text-left ${
                        protocol.deepener === option.id
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs opacity-70">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Goals */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex-1 min-h-0">
                <label className="block text-white/80 text-sm font-medium mb-2">Goals & Suggestions</label>
                
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="e.g., Build confidence"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  />
                  <button
                    onClick={addGoal}
                    className="px-2 py-1 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {protocol.goals?.slice(0, 4).map((goal, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1">
                      <span className="text-white/80 text-sm truncate">{goal}</span>
                      <button
                        onClick={() => removeGoal(index)}
                        className="text-red-400 hover:text-red-300 transition-colors ml-2"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metaphors */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex-1 min-h-0">
                <label className="block text-white/80 text-sm font-medium mb-2">Metaphors & Imagery</label>
                
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={newMetaphor}
                    onChange={(e) => setNewMetaphor(e.target.value)}
                    placeholder="e.g., Strong oak tree"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
                  />
                  <button
                    onClick={addMetaphor}
                    className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 hover:bg-orange-500/30 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {protocol.metaphors?.slice(0, 4).map((metaphor, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1">
                      <span className="text-white/80 text-sm truncate">{metaphor}</span>
                      <button
                        onClick={() => removeMetaphor(index)}
                        className="text-red-400 hover:text-red-300 transition-colors ml-2"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
                <label className="block text-white/80 text-sm font-medium mb-2">Duration (minutes)</label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={protocol.duration || 15}
                  onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-white/60 text-xs mt-1">
                  <span>5 min</span>
                  <span className="text-teal-400 font-medium">{protocol.duration} min</span>
                  <span>30 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 px-6 pt-3">
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
            >
              <Save size={14} className="inline mr-1" />
              Save Protocol
            </button>
            
            <button
              onClick={() => {/* Preview functionality */}}
              disabled={!isValid}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Play size={14} className="inline mr-1" />
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}