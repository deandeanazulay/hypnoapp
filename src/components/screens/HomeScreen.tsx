import React, { useState } from 'react';
import { CheckCircle, Lock, Play, Star, Trophy, Zap, Crown, ArrowRight, Heart, Sparkles, Target, ChevronRight } from 'lucide-react';
import Orb from '../Orb';
import { EGO_STATES, useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import { useGameState } from '../GameStateManager';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
  activeTab?: TabId;
  onShowAuth: () => void;
}

interface HorizontalMilestoneRoadmapProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
  onTabChange: (tabId: TabId) => void;
}

function HorizontalMilestoneRoadmap({ user, onMilestoneSelect, onTabChange }: HorizontalMilestoneRoadmapProps) {
  const milestones = [
    {
      id: 'first-session',
      name: 'First Steps',
      icon: Play,
      unlocked: true,
      completed: (user?.session_streak || 0) > 0,
      active: (user?.session_streak || 0) === 0,
      xpReward: 25,
    },
    {
      id: 'three-day-streak',
      name: 'Momentum',
      icon: Zap,
      unlocked: (user?.session_streak || 0) >= 1,
      completed: (user?.session_streak || 0) >= 3,
      active: (user?.session_streak || 0) >= 1 && (user?.session_streak || 0) < 3,
      xpReward: 50,
    },
    {
      id: 'ego-explorer',
      name: 'Guide Discovery',
      icon: Star,
      unlocked: (user?.session_streak || 0) >= 3,
      completed: Object.keys(user?.ego_state_usage || {}).length >= 3,
      active: (user?.session_streak || 0) >= 3 && Object.keys(user?.ego_state_usage || {}).length < 3,
      xpReward: 75,
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      icon: Trophy,
      unlocked: (user?.session_streak || 0) >= 3,
      completed: (user?.session_streak || 0) >= 7,
      active: (user?.session_streak || 0) >= 3 && (user?.session_streak || 0) < 7,
      xpReward: 100,
    },
    {
      id: 'level-master',
      name: 'Level 5',
      icon: Crown,
      unlocked: user?.level >= 3,
      completed: user?.level >= 5,
      active: user?.level >= 3 && user?.level < 5,
      xpReward: 200,
    }
  ];

  const handleMilestoneClick = (milestone: any) => {
    if (!milestone.unlocked) return;
    onTabChange('explore');
  };

  return (
    <div className="w-full max-w-md mx-auto mb-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white/80 text-sm font-medium">Your Next Milestones</h3>
        <button
          onClick={() => onTabChange('explore')}
          className="text-teal-400 hover:text-teal-300 text-xs font-medium flex items-center space-x-1"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="relative overflow-hidden">
        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-2 py-1">
          {milestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;

            return (
              <div key={milestone.id} className="flex items-center space-x-6 flex-shrink-0">
                <button
                  onClick={() => handleMilestoneClick(milestone)}
                  disabled={!isUnlocked}
                  className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500/30 border-green-400'
                      : isActive
                      ? 'bg-orange-500/30 border-orange-400 animate-pulse'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-400'
                      : 'bg-white/10 border-white/20 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={16} className="text-white/40" />
                  ) : (
                    <IconComponent size={16} className={isActive ? 'text-orange-400' : 'text-teal-400'} />
                  )}
                </button>
                {index < milestones.length - 1 && (
                  <div className="w-8 h-0.5 bg-white/20 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen({ onOrbTap, onTabChange, onShowAuth }: HomeScreenProps) {
  const { activeEgoState } = useAppStore();
  const { isAuthenticated } = useAuth();
  const { user } = useGameState();
  const currentEgoState = getEgoState(activeEgoState);

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    onOrbTap();
  };

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      <div className="relative z-10 h-full flex flex-col items-center px-4" style={{ paddingTop: '8px', paddingBottom: '88px' }}>
        {/* Tagline */}
        <div className="text-center mb-2">
          <h2 className="text-white text-lg font-light leading-tight">
            Enter with Libero in <span className="text-teal-400 font-medium">{currentEgoState.name}</span>
          </h2>
          <p className="text-white/70 text-xs leading-tight">Tap to begin your transformation</p>
        </div>

        {/* Orb */}
        <div className="flex-none">
          <Orb
            onTap={handleOrbTap}
            size={Math.min(window.innerWidth * 0.8, 400)}
            egoState={activeEgoState}
            variant="auto"
            className="mx-auto"
          />
        </div>

        {/* Roadmap */}
        {isAuthenticated && user && (
          <div className="flex-none w-full max-w-lg mx-auto mt-2">
            <HorizontalMilestoneRoadmap
              user={user}
              onMilestoneSelect={() => {}}
              onTabChange={onTabChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
