import React, { useState } from 'react';
import { Plus, Save, Wand2, Target, Clock, Brain, Eye, Waves, Zap, Wind, Book, Trash2, ChevronDown, ChevronUp, Play, Sparkles, HelpCircle } from 'lucide-react';
import PageShell from '../layout/PageShell';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';

interface CreateScreenProps {
  onProtocolCreate: (protocol: any) => void;
  onShowAuth: () => void;
}

interface ProtocolBuilder {
  name: string;
  description: string;
  induction: string;
  deepener: string;
  goals: string[];
  metaphors: string[];
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const inductionTemplates = [
  {
    id: 'progressive',
    name: 'Progressive Relaxation',
    description: 'Gentle body-based relaxation',
    icon: <Waves size={16} className="text-teal-400" />,
    template: 'Starting with your feet, allow each muscle group to relax completely...'
  },
  {
    id: 'rapid',
    name: 'Rapid Induction',
    description: 'Quick entrance via hand drop',
    icon: <Zap size={16} className="text-yellow-400" />,
    template: 'Look at your hand. As I count from 3 to 1, your hand will become heavy...'
  },
  {
    id: 'eye-fixation',
    name: 'Eye Fixation',
    description: 'Visual focus on a point',
    icon: <Eye size={16} className="text-cyan-400" />,
    template: 'Focus on a point above your eye level. Notice how your eyelids begin to feel heavy...'
  },
  {
    id: 'breath-work',
    name: 'Breath Work',
    description: 'Breathing pattern focus',
    icon: <Wind size={16} className="text-green-400" />,
    template: 'Begin with box breathing: in for 4, hold for 4, out for 4, hold for 4...'
  }
];

const deepenerTemplates = [
  {
    id: 'staircase',
    name: 'Spiral Staircase',
    description: 'Classic descent visualization',
    template: 'Imagine yourself at the top of a beautiful spiral staircase...'
  },
  {
    id: 'elevator',
    name: 'Elevator Down',
    description: 'Modern descent metaphor',
    template: 'Step into a comfortable elevator. As the doors close, you feel completely safe...'
  },
  {
    id: 'fractionation',
    name: 'Fractionation',
    description: 'In and out technique',
    template: 'In a moment, I\'ll count to 3 and you\'ll return to normal awareness...'
  },
  {
    id: 'counting',
    name: 'Counting Down',
    description: 'Simple number countdown',
    template: 'Counting down from 10 to 1, each number takes you deeper...'
  }
];

const goalSuggestions = [
  'Release stress and tension',
  'Increase confidence and self-esteem', 
  'Improve focus and concentration',
  'Enhance creativity and innovation',
  'Better sleep quality',
  'Pain management and comfort',
  'Overcome specific fears',
  'Build healthy habits',
  'Emotional healing and balance',
  'Peak performance enhancement'
];

const metaphorSuggestions = [
  'Ocean waves washing away stress',
  'Mountain of inner strength',
  'Garden of growing confidence',
  'River of flowing creativity',
  'Shield of protection and safety',
  'Light dissolving darkness',
  'Tree roots grounding energy',
  'Phoenix rising transformation',
  'Crystal clear mental clarity',
  'Warm healing light'
];

export default function CreateScreen({ onProtocolCreate, onShowAuth }: CreateScreenProps) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useAppStore();
  const [protocol, setProtocol] = useState<ProtocolBuilder>({
    name: '',
    description: '',
    induction: '',
    deepener: '',
    goals: [],
    metaphors: [],
    duration: 15,
    difficulty: 'beginner'
  });
  
  const [activeSection, setActiveSection] = useState<string | null>('basics');
  const [showInductionTemplates, setShowInductionTemplates] = useState(false);
  const [showDeepenerTemplates, setShowDeepenerTemplates] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newMetaphor, setNewMetaphor] = useState('');

  const handleSave = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }

    if (!protocol.name.trim()) {
      showToast({ type: 'warning', message: 'Please enter a protocol name' });
      return;
    }

    if (!protocol.induction.trim()) {
      showToast({ type: 'warning', message: 'Please add an induction technique' });
      return;
    }

    onProtocolCreate(protocol);
    showToast({ type: 'success', message: 'Protocol created and added to your actions!' });
    
    // Reset form
    setProtocol({
      name: '',
      description: '',
      induction: '',
      deepener: '',
      goals: [],
      metaphors: [],
      duration: 15,
      difficulty: 'beginner'
    });
  };

  const addGoal = () => {
    if (newGoal.trim() && !protocol.goals.includes(newGoal.trim())) {
      setProtocol(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const addMetaphor = () => {
    if (newMetaphor.trim() && !protocol.metaphors.includes(newMetaphor.trim())) {
      setProtocol(prev => ({
        ...prev,
        metaphors: [...prev.metaphors, newMetaphor.trim()]
      }));
      setNewMetaphor('');
    }
  };

  const removeGoal = (index: number) => {
    setProtocol(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const removeMetaphor = (index: number) => {
    setProtocol(prev => ({
      ...prev,
      metaphors: prev.metaphors.filter((_, i) => i !== index)
    }));
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const progress = [
    protocol.name.trim() ? 1 : 0,
    protocol.induction.trim() ? 1 : 0,
    protocol.goals.length > 0 ? 1 : 0,
    protocol.duration > 0 ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);

  return (
    <PageShell
      header={
        <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 pt-2 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-white text-xl font-light mb-1 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                  Protocol Builder
                </h1>
                <p className="text-white/60 text-sm">Craft your personalized hypnosis journey</p>
              </div>
              <button
                onClick={() => setActiveSection('help')}
                className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center hover:bg-purple-500/30 transition-all hover:scale-110"
              >
                <HelpCircle size={16} className="text-purple-400" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">Protocol Progress</span>
                <span className="text-purple-400 font-medium text-sm">{progress}/4 sections</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-teal-400 transition-all duration-500"
                  style={{ width: `${(progress / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      }
      body={
        <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-y-auto pb-32">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 p-4 space-y-4">
            {/* Basics Section */}
            <GlassCard variant="premium" className="p-4">
              <button
                onClick={() => toggleSection('basics')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Brain size={16} className="text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold">1. Basics</h3>
                </div>
                {activeSection === 'basics' ? 
                  <ChevronUp size={20} className="text-white/60" /> : 
                  <ChevronDown size={20} className="text-white/60" />
                }
              </button>
              
              {activeSection === 'basics' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Protocol Name</label>
                    <input
                      type="text"
                      value={protocol.name}
                      onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Confidence Boost Session"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Description (Optional)</label>
                    <textarea
                      value={protocol.description}
                      onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what this protocol achieves..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all h-20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Duration</label>
                      <select
                        value={protocol.duration}
                        onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all"
                      >
                        <option value={5} className="bg-black">5 minutes</option>
                        <option value={10} className="bg-black">10 minutes</option>
                        <option value={15} className="bg-black">15 minutes</option>
                        <option value={20} className="bg-black">20 minutes</option>
                        <option value={30} className="bg-black">30 minutes</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Difficulty</label>
                      <select
                        value={protocol.difficulty}
                        onChange={(e) => setProtocol(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all"
                      >
                        <option value="beginner" className="bg-black">Beginner</option>
                        <option value="intermediate" className="bg-black">Intermediate</option>
                        <option value="advanced" className="bg-black">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Induction Section */}
            <GlassCard variant="default" className="p-4">
              <button
                onClick={() => toggleSection('induction')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                    <Target size={16} className="text-teal-400" />
                  </div>
                  <h3 className="text-white font-semibold">2. Induction</h3>
                </div>
                {activeSection === 'induction' ? 
                  <ChevronUp size={20} className="text-white/60" /> : 
                  <ChevronDown size={20} className="text-white/60" />
                }
              </button>
              
              {activeSection === 'induction' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/80 text-sm">Choose Template</label>
                      <button
                        onClick={() => setShowInductionTemplates(!showInductionTemplates)}
                        className="text-teal-400 text-sm hover:text-teal-300 transition-colors"
                      >
                        Browse Templates
                      </button>
                    </div>
                    
                    {showInductionTemplates && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {inductionTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setProtocol(prev => ({ ...prev, induction: template.template }));
                              setShowInductionTemplates(false);
                            }}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left transition-all hover:scale-105"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {template.icon}
                              <span className="text-white font-medium text-sm">{template.name}</span>
                            </div>
                            <p className="text-white/60 text-xs">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <textarea
                      value={protocol.induction}
                      onChange={(e) => setProtocol(prev => ({ ...prev, induction: e.target.value }))}
                      placeholder="Describe how you'll guide someone into trance..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-white/15 transition-all h-32 resize-none"
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Deepener Section */}
            <GlassCard variant="default" className="p-4">
              <button
                onClick={() => toggleSection('deepener')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <Waves size={16} className="text-indigo-400" />
                  </div>
                  <h3 className="text-white font-semibold">3. Deepener (Optional)</h3>
                </div>
                {activeSection === 'deepener' ? 
                  <ChevronUp size={20} className="text-white/60" /> : 
                  <ChevronDown size={20} className="text-white/60" />
                }
              </button>
              
              {activeSection === 'deepener' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white/80 text-sm">Choose Template</label>
                      <button
                        onClick={() => setShowDeepenerTemplates(!showDeepenerTemplates)}
                        className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
                      >
                        Browse Templates
                      </button>
                    </div>
                    
                    {showDeepenerTemplates && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {deepenerTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setProtocol(prev => ({ ...prev, deepener: template.template }));
                              setShowDeepenerTemplates(false);
                            }}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-left transition-all hover:scale-105"
                          >
                            <div className="text-white font-medium text-sm mb-1">{template.name}</div>
                            <p className="text-white/60 text-xs">{template.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <textarea
                      value={protocol.deepener}
                      onChange={(e) => setProtocol(prev => ({ ...prev, deepener: e.target.value }))}
                      placeholder="How will you take them deeper? (Leave blank to use default)"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-indigo-400/50 focus:bg-white/15 transition-all h-32 resize-none"
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Goals Section */}
            <GlassCard variant="default" className="p-4">
              <button
                onClick={() => toggleSection('goals')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                    <Target size={16} className="text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold">4. Goals & Outcomes</h3>
                </div>
                {activeSection === 'goals' ? 
                  <ChevronUp size={20} className="text-white/60" /> : 
                  <ChevronDown size={20} className="text-white/60" />
                }
              </button>
              
              {activeSection === 'goals' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Add Goal</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newGoal}
                        onChange={(e) => setNewGoal(e.target.value)}
                        placeholder="What do you want to achieve?"
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-green-400/50 focus:bg-white/15 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                      />
                      <button
                        onClick={addGoal}
                        className="px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 hover:bg-green-500/30 transition-all hover:scale-105"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Goal Suggestions */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Quick Add</label>
                    <div className="flex flex-wrap gap-2">
                      {goalSuggestions.slice(0, 6).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            if (!protocol.goals.includes(suggestion)) {
                              setProtocol(prev => ({ ...prev, goals: [...prev.goals, suggestion] }));
                            }
                          }}
                          disabled={protocol.goals.includes(suggestion)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Goals List */}
                  {protocol.goals.length > 0 && (
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Your Goals</label>
                      <div className="space-y-2">
                        {protocol.goals.map((goal, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg px-3 py-2">
                            <span className="text-white/80 text-sm">{goal}</span>
                            <button
                              onClick={() => removeGoal(index)}
                              className="text-red-400 hover:text-red-300 transition-colors hover:scale-110"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Metaphors Section */}
            <GlassCard variant="default" className="p-4">
              <button
                onClick={() => toggleSection('metaphors')}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Sparkles size={16} className="text-amber-400" />
                  </div>
                  <h3 className="text-white font-semibold">5. Metaphors (Optional)</h3>
                </div>
                {activeSection === 'metaphors' ? 
                  <ChevronUp size={20} className="text-white/60" /> : 
                  <ChevronDown size={20} className="text-white/60" />
                }
              </button>
              
              {activeSection === 'metaphors' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Add Metaphor</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMetaphor}
                        onChange={(e) => setNewMetaphor(e.target.value)}
                        placeholder="e.g., Like a tree growing stronger..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-amber-400/50 focus:bg-white/15 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && addMetaphor()}
                      />
                      <button
                        onClick={addMetaphor}
                        className="px-4 py-3 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 hover:bg-amber-500/30 transition-all hover:scale-105"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Metaphor Suggestions */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Inspiration</label>
                    <div className="flex flex-wrap gap-2">
                      {metaphorSuggestions.slice(0, 6).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            if (!protocol.metaphors.includes(suggestion)) {
                              setProtocol(prev => ({ ...prev, metaphors: [...prev.metaphors, suggestion] }));
                            }
                          }}
                          disabled={protocol.metaphors.includes(suggestion)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 text-xs transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Metaphors List */}
                  {protocol.metaphors.length > 0 && (
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Your Metaphors</label>
                      <div className="space-y-2">
                        {protocol.metaphors.map((metaphor, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg px-3 py-2">
                            <span className="text-white/80 text-sm">{metaphor}</span>
                            <button
                              onClick={() => removeMetaphor(index)}
                              className="text-red-400 hover:text-red-300 transition-colors hover:scale-110"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Preview & Save Section */}
            <GlassCard variant="premium" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-teal-400 flex items-center justify-center">
                    <Save size={16} className="text-black" />
                  </div>
                  <h3 className="text-white font-semibold">Preview & Save</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Quick test/preview functionality
                      showToast({ type: 'info', message: 'Preview mode coming soon!' });
                    }}
                    className="px-3 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-all hover:scale-105 flex items-center space-x-1"
                  >
                    <Play size={14} />
                    <span className="text-sm">Test</span>
                  </button>
                </div>
              </div>
              
              {protocol.name && (
                <div className="bg-black/30 rounded-lg p-4 border border-white/20 mb-4">
                  <h4 className="text-white font-semibold mb-2">{protocol.name}</h4>
                  {protocol.description && (
                    <p className="text-white/70 text-sm mb-3">{protocol.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock size={12} className="text-white/60" />
                      <span className="text-white/60">{protocol.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Brain size={12} className="text-white/60" />
                      <span className="text-white/60 capitalize">{protocol.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target size={12} className="text-white/60" />
                      <span className="text-white/60">{protocol.goals.length} goal{protocol.goals.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <GlassButton
                onClick={handleSave}
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!protocol.name.trim() || !protocol.induction.trim()}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Wand2 size={20} />
                  <span>Create Protocol</span>
                </div>
              </GlassButton>
              
              {(!protocol.name.trim() || !protocol.induction.trim()) && (
                <p className="text-white/50 text-xs mt-2 text-center">
                  Complete the name and induction to save your protocol
                </p>
              )}
            </GlassCard>

            {/* Help Guide */}
            {activeSection === 'help' && (
              <GlassCard variant="premium" className="p-4">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <HelpCircle size={16} className="text-purple-400" />
                  <span>Protocol Building Guide</span>
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                    <h4 className="text-purple-400 font-medium mb-2">1. Start with Intent</h4>
                    <p className="text-white/70">What specific change do you want to create? Be clear and specific.</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                    <h4 className="text-teal-400 font-medium mb-2">2. Choose Your Induction</h4>
                    <p className="text-white/70">How will you guide someone into trance? Progressive is safest for beginners.</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                    <h4 className="text-indigo-400 font-medium mb-2">3. Add Deepening (Optional)</h4>
                    <p className="text-white/70">Take them deeper for more profound change. Staircase is most common.</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                    <h4 className="text-green-400 font-medium mb-2">4. Set Clear Goals</h4>
                    <p className="text-white/70">What exactly will change? Make it specific and positive.</p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                    <h4 className="text-amber-400 font-medium mb-2">5. Use Metaphors</h4>
                    <p className="text-white/70">Images and stories make suggestions more powerful and memorable.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setActiveSection('basics')}
                  className="w-full mt-4 px-4 py-3 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all hover:scale-105"
                >
                  Start Building
                </button>
              </GlassCard>
            )}
          </div>
        </div>
      }
    />
  );
}