import React, { useState } from 'react';
import { CheckCircle, Lock, Play, Star, Gift, Trophy, Zap, Target, Shield, Flame, Crown } from 'lucide-react';
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
    if (import.meta.env.DEV) {
      console.log('[HOME] Authenticated, calling original onOrbTap');
    }
    onOrbTap();
  };

  return (
    <div 
      className="h-full flex flex-col overflow-hidden"
      style={{ background: LIBERO_BRAND.colors.midnight }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{ background: LIBERO_BRAND.gradients.brandAura }}
        />
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: LIBERO_BRAND.colors.textMuted
            }}
          />
        ))}
      </div>

      {/* 1. Ego States Carousel - Fixed Height */}
      <div className="flex-shrink-0 h-12 flex items-center justify-center relative z-40 pt-10">
        <EgoStatesCarousel 
          activeEgoState={activeEgoState}
          onEgoStateChange={(egoStateId) => {
            const { setActiveEgoState } = useAppStore.getState();
            setActiveEgoState(egoStateId);
          }}
        />
      </div>

      {/* 2. Main Orb Section - Takes remaining space and centers orb */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative z-30 -pt-50">
        <div className="flex flex-col items-center justify-center ">
          <Orb
            onTap={handleOrbTap}
            egoState={activeEgoState}
            afterglow={true}
            size={420}
            variant="webgl"
          />
          
          {/* Orb Guidance Text - Closer to orb */}
          <div className="text-center max-w-md px-4 -mt-8">
            {/* Current Ego State in Color */}
            <div className="mb-3">
              <span 
                className="text-brand-h2 font-light"
                style={{ color: getEgoColor(activeEgoState).accent }}
              >
                {currentState.name}
              </span>
            </div>
            
            <p 
              className="text-lg font-light mb-2"
              style={{ color: LIBERO_BRAND.colors.textSecondary }}
            >
              Tap to begin your journey
            </p>
            <p 
              className="text-sm"
              style={{ color: LIBERO_BRAND.colors.textMuted }}
            >
              with Libero in {currentState.role} mode
            </p>
            {!isAuthenticated && (
              <p 
                className="text-xs mt-2"
                style={{ color: `${LIBERO_BRAND.colors.liberoTeal}CC` }}
              >
                Sign in to unlock full transformation experience
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Current Roadmap Preview - Below orb, above nav */}
      {isAuthenticated && user && (
        <div className="flex-shrink-0 px-4 pb-6">
          <CurrentRoadmapPreview 
            user={user}
            onMilestoneSelect={(milestone) => {
              // Navigate to Journey tab to see full roadmap
              onTabChange('explore');
            }}
          />
        </div>
      )}
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

// Current Roadmap Preview Component
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
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium text-sm">Your Path</h3>
        <button
          onClick={() => onMilestoneSelect(null)}
          className="text-teal-400 hover:text-teal-300 text-xs font-medium transition-colors"
        >
          View Full Journey →
        </button>
      </div>

      {/* Horizontal Roadmap */}
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black via-black/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black via-black/60 to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable milestone path */}
        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide px-4 py-2">
          {currentMilestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;
            
            return (
              <div key={milestone.id} className="flex items-center space-x-4 flex-shrink-0">
                {/* Milestone Node */}
                <button
                  onClick={() => isUnlocked ? onMilestoneSelect(milestone) : null}
                  disabled={!isUnlocked}
                  className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
                    isCompleted
                      ? 'bg-green-500/40 border-green-400 shadow-lg shadow-green-400/50 animate-breathe-glow'
                      : isActive  
                      ? 'bg-orange-500/40 border-orange-400 animate-pulse shadow-lg shadow-orange-400/50'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-400/30 hover:bg-teal-500/30'
                      : 'bg-white/10 border-white/20 cursor-not-allowed'
                  }`}
                >
                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                  )}
                  
                  {/* Active pulse rings */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" />
                      <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                  
                  {/* Icon */}
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={20} className="text-white/40" />
                  ) : (
                    <IconComponent size={20} className={`${
                      isActive ? 'text-orange-400' : 'text-teal-400'
                    }`} />
                  )}
                </button>

                {/* Milestone Label */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center min-w-max">
                  <div className={`px-2 py-1 rounded-lg border text-xs font-medium ${
                    isCompleted
                      ? 'bg-green-500/20 border-green-500/40 text-green-400'
                      : isActive
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    {milestone.name}
                  </div>
                  
                  {/* Rewards preview */}
                  {isUnlocked && (
                    <div className="flex items-center justify-center space-x-1 text-xs mt-1 opacity-80">
                      {milestone.xpReward && (
                        <span className="text-orange-400">+{milestone.xpReward}</span>
                      )}
                      {milestone.tokenReward && (
                        <span className="text-yellow-400">+{milestone.tokenReward}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Connection line to next milestone */}
                {index < currentMilestones.length - 1 && (
                  <div className={`w-8 h-0.5 ${
                    isCompleted ? 'bg-green-400' : 
                    isActive ? 'bg-orange-400' : 
                    'bg-white/20'
                  } transition-all duration-500`} style={{
                    background: isCompleted 
                      ? 'linear-gradient(90deg, #22c55e, #15e0c3)' 
                      : isActive 
                      ? 'linear-gradient(90deg, #fb923c, #fbbf24)'
                      : 'rgba(255,255,255,0.2)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="mt-3 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-white/60">{currentMilestones.filter(m => m.completed).length} completed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          <span className="text-white/60">{currentMilestones.filter(m => m.active).length} active</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-white/40 rounded-full" />
          <span className="text-white/60">{currentMilestones.filter(m => !m.unlocked).length} locked</span>
        </div>
      </div>
    </div>
  );
}