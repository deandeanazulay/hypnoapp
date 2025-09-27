import React from 'react';
import { CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { TabId } from '../../types/Navigation';

export interface HorizontalMilestoneRoadmapProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
  onTabChange: (tabId: TabId) => void;
}

export default function HorizontalMilestoneRoadmap({ user, onMilestoneSelect, onTabChange }: HorizontalMilestoneRoadmapProps) {
  const milestones = [
    {
      id: 'first-session',
      name: 'First Steps',
      icon: () => <div className="w-3 h-3 bg-green-400 rounded-full" />,
      unlocked: true,
      completed: (user?.session_streak || 0) > 0,
      active: (user?.session_streak || 0) === 0,
      xpReward: 25,
      tokenReward: 5,
      difficulty: 'easy'
    },
    {
      id: 'three-day-streak',
      name: 'Momentum',
      icon: () => <div className="w-3 h-3 bg-yellow-400 rounded-full" />,
      unlocked: (user?.session_streak || 0) >= 1,
      completed: (user?.session_streak || 0) >= 3,
      active: (user?.session_streak || 0) >= 1 && (user?.session_streak || 0) < 3,
      xpReward: 50,
      tokenReward: 10,
      difficulty: 'easy'
    },
    {
      id: 'ego-explorer',
      name: 'Guide Discovery',
      icon: () => <div className="w-3 h-3 bg-blue-400 rounded-full" />,
      unlocked: (user?.session_streak || 0) >= 3,
      completed: Object.keys(user?.ego_state_usage || {}).length >= 3,
      active: (user?.session_streak || 0) >= 3 && Object.keys(user?.ego_state_usage || {}).length < 3,
      xpReward: 75,
      tokenReward: 15,
      difficulty: 'medium'
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      icon: () => <div className="w-3 h-3 bg-purple-400 rounded-full" />,
      unlocked: (user?.session_streak || 0) >= 3,
      completed: (user?.session_streak || 0) >= 7,
      active: (user?.session_streak || 0) >= 3 && (user?.session_streak || 0) < 7,
      xpReward: 100,
      tokenReward: 25,
      difficulty: 'hard'
    },
    {
      id: 'level-master',
      name: 'Level 5',
      icon: () => <div className="w-3 h-3 bg-orange-400 rounded-full" />,
      unlocked: user?.level >= 3,
      completed: user?.level >= 5,
      active: user?.level >= 3 && user?.level < 5,
      xpReward: 200,
      tokenReward: 50,
      difficulty: 'hard'
    }
  ];

  const handleMilestoneClick = (milestone: any) => {
    if (!milestone.unlocked) return;
    onTabChange('explore');
  };

  return (
    <div className="w-full max-w-md mx-auto mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/80 text-sm font-medium">Your Next Milestones</h3>
        <button
          onClick={() => onTabChange('explore')}
          className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Horizontal Roadmap */}
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        
        {/* Non-scrollable container */}
        <div className="flex items-center space-x-6 px-4 py-2 justify-center">
          {milestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;
            
            return (
              <div key={milestone.id} className="flex items-center space-x-6 flex-shrink-0">
                {/* Milestone Node */}
                <button
                  onClick={() => handleMilestoneClick(milestone)}
                  disabled={!isUnlocked}
                  className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
                    isCompleted
                      ? 'bg-green-500/30 border-green-400 shadow-lg shadow-green-400/50'
                      : isActive  
                      ? 'bg-orange-500/30 border-orange-400 animate-pulse shadow-lg shadow-orange-400/50'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-400/40 hover:bg-teal-500/30'
                      : 'bg-white/10 border-white/20 cursor-not-allowed opacity-60'
                  }`}
                >
                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in border border-black">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                  )}
                  
                  {/* Active pulse ring */}
                  {isActive && (
                    <div className="absolute -inset-1 rounded-full border border-orange-400 animate-ping" />
                  )}
                  
                  {/* Icon */}
                  {isCompleted ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={16} className="text-white/40" />
                  ) : (
                    <IconComponent />
                  )}
                </button>

                {/* Connection Line */}
                {index < milestones.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted && milestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-green-400 to-teal-400'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-400 to-white/20'
                      : isUnlocked && milestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-teal-400 to-orange-400 animate-pulse'
                      : 'bg-white/20'
                  } rounded-full`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Labels - Below the roadmap */}
      <div className="flex items-center space-x-6 px-4 mt-2 justify-center">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="flex-shrink-0 text-center" style={{ width: '72px' }}>
            <div className={`text-xs font-medium ${
              milestone.completed
                ? 'text-green-400'
                : milestone.active
                ? 'text-orange-400'
                : milestone.unlocked
                ? 'text-teal-400'
                : 'text-white/40'
            }`}>
              {milestone.name}
            </div>
            {milestone.unlocked && (
              <div className="flex items-center justify-center space-x-1 text-xs mt-1">
                {milestone.xpReward && (
                  <span className="text-orange-400/80">+{milestone.xpReward}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}