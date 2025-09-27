import React, { useState } from 'react';
import { CheckCircle, Lock, Play, Star, Gift, Trophy, Zap, Target, Shield, Flame, Crown, ArrowRight, Heart, Sparkles, ChevronRight, Clock } from 'lucide-react';
import Orb from '../Orb';
import { EGO_STATES, useAppStore } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import { useGameState } from '../GameStateManager';
import { TabId } from '../../types/Navigation';
import { THEME, getEgoColor, LIBERO_BRAND } from '../../config/theme';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
  activeTab?: TabId;
  onShowAuth: () => void;
}

// 1. Ego States Carousel Component - Perfectly centered
interface EgoStatesCarouselProps {
  activeEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

function EgoStatesCarousel({ activeEgoState, onEgoStateChange }: EgoStatesCarouselProps) {
  return (
    <div className="relative w-full flex justify-center items-center">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      {/* Perfectly centered scrolling container */}
      <div className="flex items-center justify-center space-x-3 px-8 animate-scroll-x">
        {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => {
          const isSelected = activeEgoState === state.id;
          const egoColor = getEgoColor(state.id);
          return (
            <div key={`${state.id}-${index}`} className="flex-shrink-0">
              <button
                onClick={() => onEgoStateChange(state.id)}
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${egoColor.bg} border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isSelected ? 'border-white/80 scale-115 opacity-100' : 'border-white/30 opacity-60 hover:opacity-80'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 20px ${egoColor.accent}80` : `0 0 10px ${egoColor.accent}40`
                }}
              >
                <span className="text-lg">{state.icon}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CurrentRoadmapPreviewProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
}

function CurrentRoadmapPreview({ user, onMilestoneSelect }: CurrentRoadmapPreviewProps) {
  // Define the same milestone structure as JourneyPath for consistency
  const currentMilestones = [
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
      name: 'Building Momentum',
      icon: Zap,
      unlocked: (user?.session_streak || 0) >= 1,
      completed: (user?.session_streak || 0) >= 3,
      active: (user?.session_streak || 0) >= 1 && (user?.session_streak || 0) < 3,
      xpReward: 50,
      tokenReward: 10,
      difficulty: 'easy'
    },
    {
      id: 'ego-state-explorer',
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
      id: 'development-unlock',
      name: 'Development',
      icon: Flame,
      unlocked: user?.level >= 5,
      completed: user?.level >= 10,
      active: user?.level >= 5 && user?.level < 10,
      xpReward: 200,
      tokenReward: 50,
      difficulty: 'hard'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  return (
    <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl shadow-purple-500/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
          <Target size={20} className="text-teal-400" />
          <span>Your Path</span>
        </h3>
        <button
          onClick={() => onMilestoneSelect(null)}
          className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors flex items-center space-x-1 hover:scale-105"
        >
          <span>View Full Journey</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Horizontal Roadmap */}
      <div className="relative overflow-hidden mb-4">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black via-black/95 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black via-black/95 to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable milestone path */}
        <div className="flex items-center space-x-8 overflow-x-auto scrollbar-hide px-8 py-4">
          {currentMilestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;
            
            return (
              <div key={milestone.id} className="flex items-center space-x-6 flex-shrink-0">
                {/* Milestone Node */}
                <button
                  onClick={() => isUnlocked ? onMilestoneSelect(milestone) : null}
                  disabled={!isUnlocked}
                  className={`relative w-20 h-20 rounded-full border-3 flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
                    isCompleted
                      ? 'bg-green-500/30 border-green-400 shadow-xl shadow-green-400/50 animate-breathe-glow'
                      : isActive  
                      ? 'bg-orange-500/30 border-orange-400 animate-pulse shadow-xl shadow-orange-400/50'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-400 shadow-xl shadow-teal-400/40 hover:bg-teal-500/30'
                      : 'bg-white/10 border-white/20 cursor-not-allowed'
                  }`}
                  
                >
                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in border-2 border-black">
                      <CheckCircle size={16} className="text-black" />
                    </div>
                  )}
                  
                  {/* Active pulse rings */}
                  {isActive && (
                    <>
                      <div className="absolute -inset-2 rounded-full border-2 border-orange-400/60 animate-ping" />
                      <div className="absolute -inset-4 rounded-full border border-orange-400/40 animate-ping" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  
                  {/* Icon */}
                  {isCompleted ? (
                    <CheckCircle size={24} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={24} className="text-white/40" />
                  ) : (
                    <IconComponent size={24} className={`${
                      isActive ? 'text-orange-400' : 'text-teal-400'
                    }`} />
                  )}
                </button>

                {/* Milestone Label */}
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-center min-w-max">
                  <div className={`px-3 py-2 rounded-xl border backdrop-blur-sm text-sm font-medium ${
                    isCompleted
                      ? 'bg-green-500/30 border-green-500/50 text-green-300'
                      : isActive
                      ? 'bg-orange-500/30 border-orange-500/50 text-orange-300'
                      : isUnlocked
                      ? 'bg-teal-500/30 border-teal-500/50 text-teal-300'
                      : 'bg-white/10 border-white/20 text-white/40'
                  }`}>
                    <div>{milestone.name}</div>
                    {isUnlocked && (
                      <div className="flex items-center justify-center space-x-2 text-xs mt-1">
                        {milestone.xpReward && (
                          <span className="px-2 py-0.5 bg-orange-400/20 text-orange-400 rounded-full">
                            +{milestone.xpReward} XP
                          </span>
                        )}
                        {milestone.tokenReward && (
                          <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full">
                            +{milestone.tokenReward}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Line */}
                {index < currentMilestones.length - 1 && (
                  <div className={`w-12 h-1 ${
                    isCompleted && currentMilestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-green-400 to-teal-400 shadow-lg shadow-green-400/50'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-400/60 to-white/20'
                      : isUnlocked && currentMilestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-teal-400/60 to-orange-400/60 animate-pulse'
                      : 'bg-white/20'
                  } rounded-full relative overflow-hidden`}>
                    {/* Flowing progress dot */}
                    {isCompleted && currentMilestones[index + 1].unlocked && (
                      <div className="absolute left-0 top-0 w-2 h-full bg-white rounded-full animate-flow-right" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Progress Summary */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="text-green-400 text-lg font-bold">
            {currentMilestones.filter(m => m.completed).length}
          </div>
          <div className="text-white/60 text-xs">Completed</div>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
          <div className="text-orange-400 text-lg font-bold">
            {currentMilestones.filter(m => m.active).length}
          </div>
          <div className="text-white/60 text-xs">Active</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white text-lg font-bold">
            {currentMilestones.filter(m => !m.unlocked).length}
          </div>
          <div className="text-white/60 text-xs">Locked</div>
        </div>
      </div>
    </div>
  );
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

export default function HomeScreen({ 
  onOrbTap, 
  onTabChange,
  selectedEgoState,
  onEgoStateChange,
  activeTab,
  onShowAuth
}: HomeScreenProps) {
  const { activeEgoState } = useAppStore();
  const { isAuthenticated } = useAuth();
  const { user } = useGameState();
  const { customActions } = useProtocolStore();
  
  const currentState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  // Handle orb tap with authentication check
  const handleOrbTap = () => {
    if (import.meta.env.DEV) {
      console.log('[HOME] Orb tapped, isAuthenticated:', isAuthenticated);
    }
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[HOME] Not authenticated, showing auth modal');
      }
      onShowAuth();
      return;
    }
    onOrbTap();
  };

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-2">
        {/* Tagline - Above orb */}
        <div className="text-center mb-2">
          <h2 className="text-white text-lg font-light mb-1">
            Enter with Libero in {currentState.name}
          </h2>
          <p className="text-white/70 text-xs">Tap to begin with Libero</p>
        </div>

        {/* Center Orb */}
        <div>
          <Orb 
            onTap={handleOrbTap}
            egoState={currentState.id}
            size={window.innerWidth < 768 ? 320 : 400}
            variant="webgl"
            afterglow={false}
          />
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

        <div className="grid grid-cols-2 gap-2 max-w-xs w-full mb-3">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              // TODO: Start quick session
            }}
            className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl rounded-lg p-2 border border-teal-500/30 hover:border-teal-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-1">
              <Zap size={12} className="text-teal-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Quick Session</h3>
            <p className="text-white/70 text-xs">5-10 minute transformation</p>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              onTabChange('explore');
            }}
            className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-lg p-2 border border-purple-500/30 hover:border-purple-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-1">
              <Target size={12} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Deep Journey</h3>
            <p className="text-white/70 text-xs">15-30 minute protocols</p>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              onTabChange('create');
            }}
            className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-lg p-2 border border-orange-500/30 hover:border-orange-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-1">
              <Sparkles size={12} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Custom</h3>
            <p className="text-white/70 text-xs">Create your own protocol</p>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              onTabChange('chat');
            }}
            className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg p-2 border border-rose-500/30 hover:border-rose-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-1">
              <Heart size={12} className="text-rose-400" />
            </div>
            <h3 className="text-white font-semibold text-xs mb-0.5">Chat</h3>
            <p className="text-white/70 text-xs">Talk with Libero</p>
          </button>
        </div>

        {/* Current State Display */}
        <div className="text-center">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              // Open ego states modal
              useAppStore.getState().openModal('egoStates');
            }}
            className="flex items-center space-x-2 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-lg p-2 border border-white/20 hover:border-white/30 hover:scale-105 transition-all"
          >
            <div className="text-lg">{currentState.icon}</div>
            <div className="text-left">
              <div className="text-white font-semibold text-xs">{currentState.name}</div>
              <div className="text-white/70 text-xs">{currentState.role}</div>
            </div>
            <ChevronRight size={12} className="text-white/40" />
          </button>
        </div>
      </div>
    </div>
  );
}