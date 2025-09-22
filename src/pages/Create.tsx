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

interface CreateProps {
  onProtocolCreate: (protocol: CustomProtocol) => void;
}

export default function Create({ onProtocolCreate }: CreateProps) {
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
    { id: 'progressive-relaxation', name: 'Progressive Relaxation' },
    { id: 'rapid-induction', name: 'Rapid Induction' },
    { id: 'eye-fixation', name: 'Eye Fixation' }
  ];

  const deepenerOptions = [
    { id: 'staircase', name: 'Staircase' },
    { id: 'elevator', name: 'Elevator' },
    { id: 'fractionation', name: 'Fractionation' }
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
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-white text-xl font-light truncate">Create Journey</h1>
          <p className="text-white/60 text-xs truncate">Build custom protocol</p>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-3">
        <div className="grid h-full gap-3 grid-cols-1 md:grid-cols-[1fr_0.8fr]">
          
          {/* Zone A - Selection Lists */}
          <div className="flex flex-col gap-3 overflow-hidden">
            {/* Protocol Name */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex-shrink-0">
              <label className="block text-white/80 text-sm font-medium mb-2">Protocol Name</label>
              <input
                type="text"
                value={protocol.name || ''}
                onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Custom Protocol"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
              />
            </div>

            {/* Induction Selection */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex-shrink-0">
              <label className="block text-white/80 text-sm font-medium mb-2">Induction</label>
              <div className="grid grid-cols-1 gap-2">
                {inductionOptions.slice(0, 3).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setProtocol(prev => ({ ...prev, induction: option.id }))}
                    className={`p-2 rounded-lg border transition-all duration-200 text-left text-sm ${
                      protocol.induction === option.id
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex-1 min-h-0 overflow-hidden">
              <label className="block text-white/80 text-sm font-medium mb-2">Goals</label>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Add goal"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                />
                <button
                  onClick={addGoal}
                  className="px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="space-y-1 overflow-hidden">
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
          </div>

          {/* Zone B - Preview */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col overflow-hidden">
            <h3 className="text-white font-medium mb-3 text-sm">Preview</h3>
            
            <div className="flex-1 overflow-hidden">
              <div className="space-y-2">
                <div className="text-white/80 text-sm">
                  <span className="text-teal-400">Name:</span> {protocol.name || 'Untitled'}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="text-purple-400">Induction:</span> {inductionOptions.find(i => i.id === protocol.induction)?.name}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="text-orange-400">Goals:</span> {protocol.goals?.length || 0}
                </div>
                <div className="text-white/80 text-sm">
                  <span className="text-yellow-400">Duration:</span> {protocol.duration}m
                </div>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <label className="block text-white/80 text-sm font-medium mb-2">Duration</label>
              <input
                type="range"
                min="5"
                max="30"
                value={protocol.duration || 15}
                onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-white/60 text-xs mt-1">
                <span>5m</span>
                <span className="text-teal-400 font-medium">{protocol.duration}m</span>
                <span>30m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 flex-shrink-0 mt-3">
          <button
            onClick={handleSave}
            disabled={!protocol.name || !protocol.induction}
            className="px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
          >
            <Save size={14} className="inline mr-1" />
            Save
          </button>
          
          <button
            disabled={!protocol.name || !protocol.induction}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Play size={14} className="inline mr-1" />
            Test
          </button>
        </div>
      </div>
    </div>
  );
}