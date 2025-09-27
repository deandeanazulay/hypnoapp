import React, { useState, useEffect } from 'react';
import { Play, Zap, Target, Shield, Moon } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import { track } from '../../services/analytics';
import { CheckCircle, Lock, Play, Star, Gift, Trophy, Zap, Target, Shield, Flame, Crown, ArrowRight, Heart, Sparkles, ChevronRight, Clock } from 'lucide-react';
import Orb from '../Orb';
import ActionsBar from '../ActionsBar';
import GoalPicker from '../GoalPicker';
import ModePicker from '../ModePicker';
import MethodPicker from '../MethodPicker';
import { startSession } from '../../services/session';
import { QUICK_ACTIONS } from '../../utils/actions';
import { HYPNOSIS_PROTOCOLS } from '../../data/protocols';
import HorizontalMilestoneRoadmap from '../shared/HorizontalMilestoneRoadmap';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  onShowAuth: () => void;
  activeTab: TabId;
}

// Horizontal Milestone Roadmap Component
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
      tokenReward: 5,
      difficulty: 'easy'
    },
    {
      id: 'three-day-streak',
      name: 'Momentum',
      icon: Zap,
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
      icon: Star,
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
      icon: Trophy,
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
      icon: Crown,
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
    // Future: could pass milestone ID to focus on specific milestone
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
        
        {/* Scrollable container */}
        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-4 py-2">
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
                    <IconComponent size={16} className={`${
                      isActive ? 'text-orange-400' : 'text-teal-400'
                    }`} />
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
      <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-4 mt-2">
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

export default function HomeScreen({ onOrbTap, onTabChange, onShowAuth, activeTab }: HomeScreenProps) {
  const { user } = useGameState();
  const { activeEgoState, showToast } = useAppStore();
  const { isAuthenticated } = useAuth();
  const { customActions } = useProtocolStore();
  
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<any>(null);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  const currentEgoState = getEgoState(activeEgoState);

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    
    if (!selectedAction) {
      setShowGoalPicker(true);
      return;
    }

    if (!selectedGoal) {
      setShowGoalPicker(true);
      return;
    }

    if (!selectedMode) {
      setShowModePicker(true);
      return;
    }

    // Start session with selected parameters
    handleStartSession();
  };

  const handleStartSession = () => {
    const sessionHandle = startSession({
      egoState: activeEgoState,
      goal: selectedGoal,
      action: selectedAction,
      lengthSec: parseInt(selectedMode.duration) * 60,
      userPrefs: user
    });

    track('session_start', {
      egoState: activeEgoState,
      goalId: selectedGoal?.id,
      actionId: selectedAction?.id,
      duration: selectedMode?.duration
    });

    showToast({
      type: 'success',
      message: 'Session started! Let Libero guide your transformation.'
    });

    // Reset selections for next time
    setSelectedAction(null);
    setSelectedGoal(null);
    setSelectedMode(null);
  };

  const handleActionSelect = (action: any) => {
    setSelectedAction(action);
    
    // Auto-advance to goal picker if this is a custom action
    if (action.isCustom) {
      setShowGoalPicker(true);
    }
  };

  const handleGoalSelect = (goal: any) => {
    setSelectedGoal(goal);
    setShowGoalPicker(false);
    setShowModePicker(true);
  };

  const handleModeSelect = ({ mode, duration }: { mode: any; duration: string }) => {
    setSelectedMode({ ...mode, duration });
    setShowModePicker(false);
    
    // For simple modes, start session immediately
    if (mode.id === 'guided-audio' || mode.id === 'silent-meditation') {
      handleStartSession();
    } else {
      // For interactive modes, show method picker
      setShowMethodPicker(true);
    }
  };

  const handleMethodSelect = (method: any) => {
    setShowMethodPicker(false);
    handleStartSession();
  };

  const handleNavigateToCreate = () => {
    onTabChange('create');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Horizontal Milestone Roadmap */}
        {isAuthenticated && user && (
          <HorizontalMilestoneRoadmap 
            user={user}
            onMilestoneSelect={(milestone) => {
              // Navigate to journey tab and focus on milestone
              onTabChange('explore');
            }}
            onTabChange={onTabChange}
          />
        )}

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                  <Play size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to begin transformation</h3>
                <button
                  onClick={onShowAuth}
                  className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-black via-indigo-950/20 to-purple-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full flex flex-col" style={{ paddingTop: '40px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
            {/* Main Content Container - Centered Layout */}
            <div className="flex-1 flex flex-col justify-center items-center px-4 space-y-2 mb-2">
              
              {/* Tagline */}
              <div className="text-center mb-1">
                <p className="text-white/80 text-lg font-light">
                  Enter with Libero in {currentEgoState.name}
                </p>
              </div>

              {/* Main Orb */}
              <div className="flex justify-center">
                <Orb
                  onTap={handleOrbTap}
                  size={420}
                  egoState={activeEgoState}
                  variant="webgl"
                  className="cursor-pointer hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Tap to Begin */}
              <div className="text-center">
                <p className="text-white/60 text-base">
                  Tap to begin with Libero
                </p>
              </div>
            </div>

            {/* Milestone Roadmap - Above Actions */}
            <div className="flex-shrink-0 px-4 mb-4">
              <HorizontalMilestoneRoadmap 
                user={user}
                onMilestoneSelect={(milestone) => {
                  track('milestone_interaction', { milestoneId: milestone.id });
                }}
                onTabChange={onTabChange}
              />
            </div>
          </div>
        }
      />

      {/* Actions Bar - Fixed to bottom */}
      <ActionsBar
        selectedAction={selectedAction}
        onActionSelect={handleActionSelect}
        onNavigateToCreate={handleNavigateToCreate}
        customActions={customActions}
      />

      {/* Modals */}
      <GoalPicker
        isOpen={showGoalPicker}
        onSelect={handleGoalSelect}
        onClose={() => setShowGoalPicker(false)}
        onNavigateToCreate={handleNavigateToCreate}
      />

      <ModePicker
        isOpen={showModePicker}
        onSelect={handleModeSelect}
        onClose={() => setShowModePicker(false)}
      />

      <MethodPicker
        isOpen={showMethodPicker}
        selectedGoal={selectedGoal}
        onSelect={handleMethodSelect}
        onClose={() => setShowMethodPicker(false)}
      />
    </div>
  );
}