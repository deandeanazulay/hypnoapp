import React, { useState } from 'react';
import { X, Target, Plus, Star, Clock } from 'lucide-react';
import { 
  HYPNOSIS_PROTOCOLS, 
  PROTOCOL_CATEGORIES, 
  getProtocolsByCategory,
  getRecommendedProtocols 
} from '../data/protocols';

export interface Goal {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  target?: string;
  desiredResponse?: string;
  anchor?: string;
  outcome?: string;
  relatedProtocols?: string[];
}

interface GoalPickerProps {
  onSelect: (goal: Goal) => void;
  onClose: () => void;
  onNavigateToCreate: () => void;
}

export default function GoalPicker({ onSelect, onClose, onNavigateToCreate }: GoalPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('stress-relief');
  const [customGoal, setCustomGoal] = useState({
    name: '',
    target: '',
    desiredResponse: '',
    anchor: '',
    outcome: ''
  });

  // Generate goals from protocol categories
  const generateGoalsFromCategories = () => {
    return PROTOCOL_CATEGORIES.map(category => {
      const protocols = getProtocolsByCategory(category.id);
      const categoryGoals: Goal[] = [];

      // Create specific goals based on protocols in each category
      if (category.id === 'stress-relief') {
        categoryGoals.push({
          id: 'stress-relief',
          name: 'Release Stress & Tension',
          description: 'Let go of daily stress and find deep relaxation',
          icon: <span className="text-lg">🧘</span>,
          color: 'from-blue-500/20 to-cyan-500/20',
          target: 'feeling stressed or overwhelmed',
          desiredResponse: 'calm, relaxed, and peaceful',
          anchor: 'deep breathing and muscle relaxation',
          outcome: 'handling stress with ease and confidence',
          relatedProtocols: protocols.map(p => p.id)
        });
      } else if (category.id === 'confidence') {
        categoryGoals.push({
          id: 'build-confidence',
          name: 'Build Unshakeable Confidence',
          description: 'Develop strong self-esteem and inner confidence',
          icon: <span className="text-lg">💪</span>,
          color: 'from-orange-500/20 to-amber-500/20',
          target: 'situations that make me feel insecure',
          desiredResponse: 'confident, capable, and self-assured',
          anchor: 'confident posture and positive self-talk',
          outcome: 'approaching challenges with confidence',
          relatedProtocols: protocols.map(p => p.id)
        });
      } else if (category.id === 'sleep') {
        categoryGoals.push({
          id: 'better-sleep',
          name: 'Deep, Restful Sleep',
          description: 'Fall asleep easily and wake up refreshed',
          icon: <span className="text-lg">🌙</span>,
          color: 'from-indigo-500/20 to-purple-500/20',
          target: 'bedtime and sleeping',
          desiredResponse: 'drowsy, peaceful, and ready for sleep',
          anchor: 'slow breathing and body relaxation',
          outcome: 'sleeping deeply through the night',
          relatedProtocols: protocols.map(p => p.id)
        });
      }

      return categoryGoals;
    }).flat().filter(goal => goal.id); // Remove empty entries
  };

  const availableGoals = generateGoalsFromCategories();

  const handleCustomSave = () => {
    if (customGoal.name && customGoal.target && customGoal.desiredResponse) {
      const goal: Goal = {
        id: 'custom-' + Date.now(),
        name: customGoal.name,
        description: 'Custom transformation goal',
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

  const handleQuickGoalSelect = (goal: Goal) => {
    onSelect(goal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-light">What do you want to transform?</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {!showCustom ? (
          <>
            {/* Quick Goal Selection */}
            <div className="space-y-4 mb-6">
              {availableGoals.length > 0 ? (
                <div className="space-y-3">
                  {availableGoals.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => handleQuickGoalSelect(goal)}
                      className={`w-full p-4 rounded-xl bg-gradient-to-br ${goal.color} border border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105 text-left`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                          {goal.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-base mb-1">{goal.name}</h3>
                          <p className="text-white/70 text-sm">{goal.description}</p>
                          {goal.relatedProtocols && (
                            <div className="mt-2 text-xs text-white/60">
                              {goal.relatedProtocols.length} protocols available
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                    <Target size={24} className="text-teal-400" />
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">Create Your Goal</h3>
                  <p className="text-white/70 text-sm">Define what you want to transform today</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowCustom(true)}
                className="w-full p-4 rounded-xl bg-gradient-to-br from-white/10 to-gray-500/10 border border-white/20 hover:border-white/30 transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Plus size={20} className="text-white" />
                  <span className="text-white font-medium">Create Custom Goal</span>
                </div>
              </button>

              {/* Recommended Starting Points */}
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
                <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                  <Star size={16} className="text-green-400" />
                  <span>Recommended for Beginners</span>
                </h4>
                <div className="space-y-2">
                  {getRecommendedProtocols().slice(0, 2).map(protocol => (
                    <div key={protocol.id} className="flex items-center justify-between text-sm">
                      <span className="text-white/80">{protocol.name}</span>
                      <div className="flex items-center space-x-1 text-white/60">
                        <Clock size={12} />
                        <span>{protocol.duration}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              <label className="block text-white/80 text-sm mb-2">When I think about... (Target)</label>
              <input
                type="text"
                value={customGoal.target}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, target: e.target.value }))}
                placeholder="e.g., speaking in public"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">I want to feel... (Desired Response)</label>
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
                placeholder="e.g., deep breath + word 'confident'"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50"
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Future Vision (Optional)</label>
              <input
                type="text"
                value={customGoal.outcome}
                onChange={(e) => setCustomGoal(prev => ({ ...prev, outcome: e.target.value }))}
                placeholder="e.g., speaking confidently to any audience"
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
                Create Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}