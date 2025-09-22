import React, { useState } from 'react';
import { X, Target, Snowflake, Flame, Star, Moon, Shield, Lightbulb, Plus } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  target?: string;
  desiredResponse?: string;
  anchor?: string;
  outcome?: string;
}

const quickGoals: Goal[] = [
  {
    id: 'stress',
    name: 'Release Stress',
    description: 'Down-regulation, longer exhales, gentle unwinding',
    icon: <Shield size={20} className="text-amber-400" />,
    color: 'from-amber-500/20 to-orange-500/20',
    target: 'tension and stress',
    desiredResponse: 'calm and centered',
    anchor: 'breath + shoulders drop',
    outcome: 'moving through your day with ease'
  },
  {
    id: 'focus',
    name: 'Dial in Focus',
    description: 'Laser concentration, mental clarity, flow state',
    icon: <Target size={20} className="text-cyan-400" />,
    color: 'from-cyan-500/20 to-blue-500/20',
    target: 'distractions and mental fog',
    desiredResponse: 'sharp and focused',
    anchor: 'breath + word "focus"',
    outcome: 'completing tasks with precision'
  },
  {
    id: 'confidence',
    name: 'Confidence On Camera',
    description: 'Self-assurance, natural presence, authentic expression',
    icon: <Star size={20} className="text-yellow-400" />,
    color: 'from-yellow-500/20 to-amber-500/20',
    target: 'camera anxiety and self-doubt',
    desiredResponse: 'confident and natural',
    anchor: 'breath + "I belong here"',
    outcome: 'speaking authentically on camera'
  },
  {
    id: 'sleep',
    name: 'Sleep Priming',
    description: 'Deep rest preparation, mind quieting, body release',
    icon: <Moon size={20} className="text-purple-400" />,
    color: 'from-purple-500/20 to-indigo-500/20',
    target: 'racing thoughts and tension',
    desiredResponse: 'deeply relaxed and sleepy',
    anchor: 'breath + body melting',
    outcome: 'drifting into peaceful sleep'
  },
  {
    id: 'cravings',
    name: 'Craving Control',
    description: 'Impulse regulation, mindful choices, inner strength',
    icon: <Flame size={20} className="text-red-400" />,
    color: 'from-red-500/20 to-orange-500/20',
    target: 'overwhelming cravings',
    desiredResponse: 'in control and mindful',
    anchor: 'breath + "I choose"',
    outcome: 'making healthy choices easily'
  },
  {
    id: 'pain',
    name: 'Pain Dial',
    description: 'Comfort enhancement, sensation modulation, relief',
    icon: <Snowflake size={20} className="text-teal-400" />,
    color: 'from-teal-500/20 to-cyan-500/20',
    target: 'pain and discomfort',
    desiredResponse: 'comfortable and at ease',
    anchor: 'breath + cooling sensation',
    outcome: 'moving with comfort and ease'
  },
  {
    id: 'creative',
    name: 'Creative Unlock',
    description: 'Innovation flow, idea generation, artistic expression',
    icon: <Lightbulb size={20} className="text-green-400" />,
    color: 'from-green-500/20 to-teal-500/20',
    target: 'creative blocks and limitations',
    desiredResponse: 'inspired and flowing',
    anchor: 'breath + "ideas flow"',
    outcome: 'creating with joy and ease'
  }
];

interface GoalPickerProps {
  onSelect: (goal: Goal) => void;
  onClose: () => void;
}

export default function GoalPicker({ onSelect, onClose }: GoalPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customGoal, setCustomGoal] = useState({
    name: '',
    target: '',
    desiredResponse: '',
    anchor: '',
    outcome: ''
  });

  const handleCustomSave = () => {
    if (customGoal.name && customGoal.target && customGoal.desiredResponse) {
      const goal: Goal = {
        id: 'custom-' + Date.now(),
        name: customGoal.name,
        description: 'Custom goal',
        icon: <Target size={20} className="text-white" />,
        color: 'from-white/20 to-gray-500/20',
        target: customGoal.target,
        desiredResponse: customGoal.desiredResponse,
        anchor: customGoal.anchor || 'breath + relaxation',
        outcome: customGoal.outcome || 'feeling transformed'
      };
      onSelect(goal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">What changes today?</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {!showCustom ? (
          <>
            {/* Quick Goals */}
            <div className="space-y-3 mb-6">
              {quickGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => onSelect(goal)}
                  className={`w-full p-4 rounded-xl bg-gradient-to-br ${goal.color} border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                      {goal.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-white font-semibold text-base mb-1">{goal.name}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">{goal.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Goal Button */}
            <button
              onClick={() => setShowCustom(true)}
              className="w-full p-4 rounded-xl bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center justify-center space-x-3">
                <Plus size={20} className="text-white" />
                <span className="text-white font-medium">Create Custom Goal</span>
              </div>
            </button>
          </>
        ) : (
          /* Custom Goal Builder */
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Goal Name</label>
              <input
                type="text"
                value={customGoal.name}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Public Speaking Confidence"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Target (When I think about...)</label>
              <input
                type="text"
                value={customGoal.target}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, target: e.target.value }))}
                placeholder="e.g., speaking in public"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Desired Response (I feel...)</label>
              <input
                type="text"
                value={customGoal.desiredResponse}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, desiredResponse: e.target.value }))}
                placeholder="e.g., confident and calm"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Anchor (Optional)</label>
              <input
                type="text"
                value={customGoal.anchor}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, anchor: e.target.value }))}
                placeholder="e.g., breath + word 'steady'"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Future Scene (Optional)</label>
              <input
                type="text"
                value={customGoal.outcome}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, outcome: e.target.value }))}
                placeholder="e.g., speaking confidently to the audience"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleCustomSave}
                disabled={!customGoal.name || !customGoal.target || !customGoal.desiredResponse}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg text-black font-semibold hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}