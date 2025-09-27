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
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Cosmic Background Effects - matching ChatScreen */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Subtle stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* 1. Ego States Carousel - Refined styling */}
        <div className="flex-shrink-0 py-6">
          <EgoStatesCarousel 
            activeEgoState={activeEgoState}
            onEgoStateChange={(egoStateId) => {
              const { setActiveEgoState } = useAppStore.getState();
              setActiveEgoState(egoStateId);
            }}
          />
        </div>

        {/* 2. Main Orb Section - Centered with refined presentation */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            {/* Orb Container */}
            <div className="mb-8">
              <Orb
                onTap={handleOrbTap}
                egoState={activeEgoState}
                afterglow={true}
                size={window.innerWidth < 768 ? 300 : 380}
                variant="webgl"
              />
            </div>
            
            {/* Refined Text Presentation */}
            <div className="space-y-4">
              {/* Ego State Name - Prominent */}
              <h1 className={`text-4xl md:text-5xl font-light bg-gradient-to-r bg-clip-text text-transparent`}
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${getEgoColor(activeEgoState).accent}, ${getEgoColor(activeEgoState).accent}CC, #FFFFFF90)`,
                  }}>
                {currentState.name}
              </h1>
              
              {/* Main CTA */}
              <div className="space-y-2">
                <p className="text-xl md:text-2xl font-light text-white/90">
                  Tap to begin your journey
                </p>
                <p className="text-base text-white/70">
                  with Libero in {currentState.role} mode
                </p>
                {!isAuthenticated && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl border border-teal-500/20">
                    <p className="text-teal-400 text-sm font-medium">
                      Sign in to unlock your complete transformation experience
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Current Roadmap Preview - Refined styling */}
        {isAuthenticated && user && (
          <div className="flex-shrink-0 px-4 pb-8">
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
    </div>
  );
}

// 1. Ego States Carousel Component - Enhanced styling
interface EgoStatesCarouselProps {
  activeEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

function EgoStatesCarousel({ activeEgoState, onEgoStateChange }: EgoStatesCarouselProps) {
  const [animationPaused, setAnimationPaused] = React.useState(false);

  return (
    <div 
      className="relative w-full flex justify-center items-center py-2"
      onMouseEnter={() => setAnimationPaused(true)}
      onMouseLeave={() => setAnimationPaused(false)}
    >
      {/* Enhanced gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black via-black/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black via-black/90 to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container with pause on hover */}
      <div className={`flex items-center space-x-4 px-16 ${animationPaused ? '' : 'animate-scroll-x'}`}>
        {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => {
          const isSelected = activeEgoState === state.id;
          const egoColor = getEgoColor(state.id);
          return (
            <div key={`${state.id}-${index}`} className="flex-shrink-0 flex flex-col items-center space-y-2">
              <button
                onClick={() => onEgoStateChange(state.id)}
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative group ${
                  isSelected 
                    ? 'border-white/80 scale-110 opacity-100' 
                    : 'border-white/30 opacity-50 hover:opacity-75 hover:scale-105'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}30)`,
                  boxShadow: isSelected 
                    ? `0 0 24px ${egoColor.accent}80, inset 0 0 12px rgba(255,255,255,0.2)`
                    : `0 0 12px ${egoColor.accent}40, inset 0 0 8px rgba(255,255,255,0.1)`
                }}
              >
                <span className="text-xl">{state.icon}</span>
                
                {/* Active state indicator */}
                {isSelected && (
                  <div className="absolute -inset-1 rounded-full border border-white/20 animate-pulse" />
                )}
              </button>
              
              {/* State name - refined typography */}
              <span className={`text-xs font-medium tracking-wide transition-all duration-300 text-center ${
                isSelected ? 'text-white opacity-100' : 'text-white/40 opacity-60'
              }`}>
                {state.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Current Roadmap Preview Component - Enhanced styling
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
      </div>
    </div>
  );
}