import React, { useState } from 'react';
import { CheckCircle, Lock, Play, Star, Gift, Trophy, Zap, Target, Shield, Flame, Crown, ArrowRight, Heart, Sparkles, ChevronRight } from 'lucide-react';
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

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4" style={{ paddingBottom: 'calc(var(--total-nav-height, 200) + 2rem)' }}>
        {/* Center Orb */}
        <div className="mb-4">
          <Orb 
            onTap={handleOrbTap}
            egoState={currentState.id}
            size={window.innerWidth < 768 ? 220 : 320}
            variant="webgl"
            afterglow={false}
          />
        </div>

        {/* Tagline */}
        <div className="text-center mb-6">
          <h2 className="text-white text-lg font-light mb-1">
            Enter with Libero in {currentState.name}
          </h2>
          <p className="text-white/70 text-xs">Tap to begin with Libero</p>
        </div>

        {/* Session Type Buttons */}
        <div className="grid grid-cols-2 gap-3 max-w-sm w-full mb-4">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                onShowAuth();
                return;
              }
              // TODO: Start quick session
            }}
            className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl rounded-xl p-3 border border-teal-500/30 hover:border-teal-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-2">
              <Zap size={16} className="text-teal-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">Quick Session</h3>
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
            className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-xl p-3 border border-purple-500/30 hover:border-purple-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-2">
              <Target size={16} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">Deep Journey</h3>
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
            className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-xl p-3 border border-orange-500/30 hover:border-orange-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-2">
              <Sparkles size={16} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">Custom</h3>
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
            className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-xl p-3 border border-rose-500/30 hover:border-rose-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-2">
              <Heart size={16} className="text-rose-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">Chat</h3>
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
            className="flex items-center space-x-3 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/20 hover:border-white/30 hover:scale-105 transition-all"
          >
            <div className="text-xl">{currentState.icon}</div>
            <div className="text-left">
              <div className="text-white font-semibold text-sm">{currentState.name}</div>
              <div className="text-white/70 text-xs">{currentState.role}</div>
            </div>
            <ChevronRight size={14} className="text-white/40" />
          </button>
        </div>
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
      <div className="flex items-center justify-between mb-4">
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
                  style={{
                    boxShadow: isCompleted 
                      ? '0 0 32px rgba(34, 197, 94, 0.6), inset 0 0 16px rgba(255,255,255,0.1)'
                      : isActive 
                      ? '0 0 32px rgba(251, 146, 60, 0.6), inset 0 0 16px rgba(255,255,255,0.1)'
                      : isUnlocked
                      ? '0 0 24px rgba(20, 184, 166, 0.4), inset 0 0 12px rgba(255,255,255,0.1)'
                      : '0 0 8px rgba(255,255,255,0.1)'
                  }}
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
        <div className="bg-orange-500/10 rounded-lg \p-3 border border-orange-500/20">
          <div className="text-orange-400 text-lg font-bold">
            {currentMilestones.filter(m => m.active).length}
          </div>
          <div className="text-white/60 text-xs">Active</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
    \      <div className="text-white text-lg font-bold">
            {currentMilestones.filter(m => !m.unlocked).length}
          </div>
          <div className="text-white/60 text-xs">Locked</div>
        </div>
      </div>
    </div>
  );
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