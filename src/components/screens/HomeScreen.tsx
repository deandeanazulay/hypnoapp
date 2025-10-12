import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle, Lock, Play, Star, Trophy, Zap, Target,
  Flame, Crown, ArrowRight, Heart, Sparkles, ChevronRight
} from 'lucide-react';
import { EGO_STATES, useAppStore } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useProtocolStore } from '../../state/protocolStore';
import { useGameState } from '../GameStateManager';
import { TabId } from '../../types/Navigation';
import { getEgoColor } from '../../config/theme';
import SessionSelectionModal from '../modals/SessionSelectionModal';
import { useOrbBackground } from '../layout/OrbBackgroundLayer';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  selectedEgoState?: string;
  onEgoStateChange?: (egoStateId: string) => void;
  activeTab?: TabId;
  onShowAuth: () => void;
}

/* ===========================
   1) Ego States Carousel
   =========================== */
interface EgoStatesCarouselProps {
  activeEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

function EgoStatesCarousel({ activeEgoState, onEgoStateChange }: EgoStatesCarouselProps) {
  return (
    <div className="relative w-full flex justify-center items-center">
      <div className="flex items-center justify-center space-x-3 px-8">
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

/* ===========================
   2) Optional Roadmap Preview
   (kept as-is, minor spacing polish)
   =========================== */
interface CurrentRoadmapPreviewProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
}

function CurrentRoadmapPreview({ user, onMilestoneSelect }: CurrentRoadmapPreviewProps) {
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

  const displayMilestones = currentMilestones.slice(0, 5);

  return (
    <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl shadow-purple-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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

      {/* Compact Horizontal Roadmap */}
      <div className="relative mb-4">
        <div className="flex items-center justify-center gap-4 px-2">
          {displayMilestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;

            return (
              <div key={milestone.id} className="flex items-center gap-3 flex-shrink-0 relative">
                <button
                  onClick={() => (isUnlocked ? onMilestoneSelect(milestone) : null)}
                  disabled={!isUnlocked}
                  className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    isCompleted
                      ? 'bg-green-500/30 border-green-400 shadow-xl shadow-green-400/40'
                      : isActive
                      ? 'bg-orange-500/30 border-orange-400 animate-pulse shadow-xl shadow-orange-400/40'
                      : isUnlocked
                      ? 'bg-teal-500/20 border-teal-400 shadow-xl shadow-teal-400/30 hover:bg-teal-500/30'
                      : 'bg-white/10 border-white/20 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={18} className="text-white/40" />
                  ) : (
                    <IconComponent size={18} className={`${isActive ? 'text-orange-400' : 'text-teal-400'}`} />
                  )}

                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border border-black">
                      <CheckCircle size={10} className="text-black" />
                    </div>
                  )}
                </button>

                {/* Connector */}
                {index < displayMilestones.length - 1 && (
                  <div
                    className={`w-6 h-0.5 rounded-full ${
                      isCompleted && displayMilestones[index + 1].unlocked
                        ? 'bg-gradient-to-r from-green-400 to-teal-400'
                        : isCompleted
                        ? 'bg-gradient-to-r from-green-400/70 to-white/20'
                        : isUnlocked && displayMilestones[index + 1].unlocked
                        ? 'bg-gradient-to-r from-teal-400/70 to-orange-400/70'
                        : 'bg-white/20'
                    }`}
                  />
                )}

                {/* Label */}
                <div className="absolute top-[72px] left-1/2 -translate-x-1/2 text-center min-w-max">
                  <div
                    className={`px-2 py-1.5 rounded-lg border backdrop-blur-sm text-xs font-medium ${
                      isCompleted
                        ? 'bg-green-500/20 border-green-500/40 text-green-300'
                        : isActive
                        ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                        : isUnlocked
                        ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                        : 'bg-white/10 border-white/20 text-white/40'
                    }`}
                  >
                    <div>{milestone.name}</div>
                    {isUnlocked && (
                      <div className="flex items-center justify-center gap-2 text-[10px] mt-1">
                        {milestone.xpReward && <span className="text-orange-300">+{milestone.xpReward} XP</span>}
                        {milestone.tokenReward && <span className="text-yellow-300">+{milestone.tokenReward}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
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

/* ========================================
   3) Compact Horizontal Milestone Roadmap
   (used on the Home screen under the orb)
   ======================================== */
interface HorizontalMilestoneRoadmapProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
  onTabChange: (tabId: TabId) => void;
}

function HorizontalMilestoneRoadmap({ user, onMilestoneSelect, onTabChange }: HorizontalMilestoneRoadmapProps) {
  const { showToast } = useAppStore();
  
  // Calculate dynamic milestone status based on real user data
  const getTotalSessions = () => {
    return Object.values(user?.ego_state_usage || {}).reduce((sum, count) => sum + count, 0);
  };

  const getUniqueEgoStatesUsed = () => {
    return Object.keys(user?.ego_state_usage || {}).length;
  };

  const milestones = [
    {
      id: 'first-session',
      name: 'First Steps',
      icon: Play,
      unlocked: true,
      completed: (user?.session_streak || 0) >= 1,
      active: getTotalSessions() === 0,
      xpReward: 25,
      tokenReward: 5,
      difficulty: 'easy',
      protocol: {
        id: 'progressive-relaxation-basic',
        name: 'Progressive Relaxation',
        category: 'stress-relief',
        duration: 10,
        description: 'Gentle introduction to hypnotherapy'
      }
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
      difficulty: 'easy',
      protocol: {
        id: 'rapid-stress-release',
        name: 'Rapid Stress Release',
        category: 'stress-relief',
        duration: 10,
        description: 'Quick stress relief technique'
      }
    },
    {
      id: 'ego-explorer',
      name: 'Guide Discovery',
      icon: Star,
      unlocked: (user?.session_streak || 0) >= 3,
      completed: (user?.session_streak || 0) >= 3 && getUniqueEgoStatesUsed() >= 3,
      active: (user?.session_streak || 0) >= 3 && getUniqueEgoStatesUsed() < 3,
      xpReward: 75,
      tokenReward: 15,
      difficulty: 'medium',
      protocol: {
        id: 'ego-exploration',
        name: 'Ego State Exploration',
        category: 'consciousness',
        duration: 15,
        description: 'Explore different archetypal energies'
      }
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      icon: Trophy,
      unlocked: (user?.session_streak || 0) >= 3 && getUniqueEgoStatesUsed() >= 3,
      completed: (user?.session_streak || 0) >= 7,
      active: (user?.session_streak || 0) >= 3 && getUniqueEgoStatesUsed() >= 3 && (user?.session_streak || 0) < 7,
      xpReward: 100,
      tokenReward: 25,
      difficulty: 'hard',
      protocol: {
        id: 'confidence-builder',
        name: 'Confidence Building',
        category: 'confidence',
        duration: 20,
        description: 'Build unshakeable confidence'
      }
    },
    {
      id: 'level-master',
      name: 'Level 5',
      icon: Crown,
      unlocked: (user?.session_streak || 0) >= 7 && getUniqueEgoStatesUsed() >= 3,
      completed: (user?.level || 1) >= 5,
      active: (user?.session_streak || 0) >= 7 && getUniqueEgoStatesUsed() >= 3 && (user?.level || 1) < 5,
      xpReward: 200,
      tokenReward: 50,
      difficulty: 'hard',
      protocol: {
        id: 'advanced-transformation',
        name: 'Advanced Transformation',
        category: 'advanced',
        duration: 30,
        description: 'Deep consciousness work'
      }
    }
  ];

  // Always show first 5 milestones for consistency
  const displayMilestones = milestones.slice(0, 5);

  const handleMilestoneClick = (milestone: any) => {
    if (!milestone.unlocked) return;
      const requirements = getMilestoneRequirements(milestone.id);
      showToast({
        type: 'info',
        message: `Unlock requirement: ${requirements}`,
        duration: 4000
      });
    onMilestoneSelect(milestone);
  };

  const getMilestoneRequirements = (milestoneId: string): string => {
    switch (milestoneId) {
      case 'three-day-streak': return 'Complete your first session';
      case 'ego-explorer': return 'Maintain a 3-day streak';
      case 'week-warrior': return 'Try 2 different ego states';
      case 'level-master': return 'Achieve a 7-day streak';
      default: return 'Complete previous milestones';
    }
  };
  return (
    <div className="w-full max-w-[720px] mx-auto mb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <h3 className="text-white/80 text-[13px] font-medium">Your Next Milestones</h3>
        <button
          onClick={() => onTabChange('explore')}
          className="text-teal-400 hover:text-teal-300 text-[12px] font-medium transition-colors flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Compact rail (no fades, no scroll) */}
      <div className="flex items-center justify-center gap-5 px-1 py-1">
        {milestones.map((milestone, index) => {
          const IconComponent = milestone.icon;
          const isCompleted = milestone.completed;
          const isActive = milestone.active;
          const isUnlocked = milestone.unlocked;

          return (
            <div key={milestone.id} className="flex items-center gap-5">
              <button
                onClick={() => handleMilestoneClick(milestone)}
                disabled={!isUnlocked}
                className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isCompleted
                    ? 'bg-green-500/30 border-green-400 shadow-lg shadow-green-400/40'
                    : isActive
                    ? 'bg-orange-500/30 border-orange-400 animate-pulse shadow-lg shadow-orange-400/40'
                    : isUnlocked
                    ? 'bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-400/30 hover:bg-teal-500/30'
                    : 'bg-white/10 border-white/20 cursor-not-allowed opacity-60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : !isUnlocked ? (
                  <Lock size={16} className="text-white/40" />
                ) : (
                  <IconComponent size={16} className={`${isActive ? 'text-orange-400' : 'text-teal-400'}`} />
                )}

                {isCompleted && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border border-black">
                    <CheckCircle size={12} className="text-black" />
                  </div>
                )}
              </button>

              {/* Connector */}
              {index < milestones.length - 1 && (
                <div
                  className={`w-8 h-0.5 rounded-full ${
                    isCompleted && milestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-green-400 to-teal-400'
                      : isCompleted
                      ? 'bg-gradient-to-r from-green-400 to-white/20'
                      : isUnlocked && milestones[index + 1].unlocked
                      ? 'bg-gradient-to-r from-teal-400 to-orange-400'
                      : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex items-center justify-center gap-3 px-2 mb-4">
        {displayMilestones.map(milestone => (
          <div key={milestone.id} className="text-center" style={{ width: 64 }}>
            <div
              className={`text-[10px] font-medium leading-tight ${
                milestone.completed
                  ? 'text-green-400'
                  : milestone.active
                  ? 'text-orange-400'
                  : milestone.unlocked
                  ? 'text-teal-400'
                  : 'text-white/40'
              }`}
            >
              {milestone.name}
            </div>
            {milestone.unlocked && milestone.xpReward ? (
              <div className="text-[9px] text-orange-300 mt-0.5">+{milestone.xpReward}</div>
            ) : (
              <div className="h-[12px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===========================
   4) Home Screen
   =========================== */
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
  const [showSessionMenu, setShowSessionMenu] = useState(false);

  const currentState = EGO_STATES.find(s => s.id === activeEgoState) || EGO_STATES[0];

  const handleOrbTap = useCallback(() => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    setShowSessionMenu(true);
  }, [isAuthenticated, onShowAuth]);

  const handleQuickSessionTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    setShowSessionMenu(true);
  };

  const handleMilestoneSelect = (milestone: any) => {
    setShowSessionMenu(true);
  };

  const handleSessionSelect = (session: any) => {
    setShowSessionMenu(false);
    // TODO: Start the actual session
    console.log('Starting session:', session);
  };
  const { orbSize, setOrbTapHandler } = useOrbBackground();
  useEffect(() => {
    setOrbTapHandler(handleOrbTap);
    return () => setOrbTapHandler(null);
  }, [handleOrbTap, setOrbTapHandler]);
  const topPadding = Math.max(Math.round(orbSize * 0.35), 220);

  return (
    <div className="relative h-full" style={{ overflow: 'visible' }}>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 backdrop-blur-3xl"
        aria-hidden
      >
        <div className="absolute left-1/2 top-[22vh] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-teal-500/20 blur-[160px]" />
        <div className="absolute -left-10 bottom-0 h-[320px] w-[320px] rounded-full bg-purple-500/15 blur-[140px]" />
      </div>

      {/* NOTE: no justify-center on the whole page to avoid giant top/bottom gaps */}
      <div
        className="relative z-10 flex min-h-full flex-col items-center px-4"
        style={{
          paddingTop: `${topPadding}px`,
          paddingBottom: 'calc(var(--total-nav-height, 96px) + 56px)',
          overflow: 'visible',
        }}
      >
        {/* Tagline */}
        <div className="text-center mb-1">
          <h2 className="text-white text-[15px] font-light leading-tight">
            Enter with Libero in {currentState.name}
          </h2>
          <p className="text-white/70 text-[11px] leading-tight">Tap to begin with Libero</p>
        </div>

        {/* Milestones (only when signed in) */}
        {isAuthenticated && user && (
          <HorizontalMilestoneRoadmap
            user={user}
            onMilestoneSelect={handleMilestoneSelect}
            onTabChange={onTabChange}
          />
        )}

        {/* Actions — single row of 4, compact */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-[680px] mb-2 px-2">
          <button
            onClick={handleQuickSessionTap}
            className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-xl rounded-lg p-2 border border-teal-500/30 hover:border-teal-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-1">
              <Zap size={12} className="text-teal-400" />
            </div>
            <h3 className="text-white font-semibold text-[11px] mb-0.5">Quick Session</h3>
            <p className="text-white/70 text-[10px] leading-tight">5–10 minute transformation</p>
          </button>

          <button
            onClick={() => (isAuthenticated ? onTabChange('explore') : onShowAuth())}
            className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-lg p-2 border border-purple-500/30 hover:border-purple-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-1">
              <Target size={12} className="text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-[11px] mb-0.5">Deep Journey</h3>
            <p className="text-white/70 text-[10px] leading-tight">15–30 minute protocols</p>
          </button>

          <button
            onClick={() => (isAuthenticated ? onTabChange('create') : onShowAuth())}
            className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-lg p-2 border border-orange-500/30 hover:border-orange-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mx-auto mb-1">
              <Sparkles size={12} className="text-orange-400" />
            </div>
            <h3 className="text-white font-semibold text-[11px] mb-0.5">Custom</h3>
            <p className="text-white/70 text-[10px] leading-tight">Create your own protocol</p>
          </button>

          <button
            onClick={() => (isAuthenticated ? onTabChange('chat') : onShowAuth())}
            className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-lg p-2 border border-rose-500/30 hover:border-rose-500/40 hover:scale-105 transition-all text-center"
          >
            <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-1">
              <Heart size={12} className="text-rose-400" />
            </div>
            <h3 className="text-white font-semibold text-[11px] mb-0.5">Chat</h3>
            <p className="text-white/70 text-[10px] leading-tight">Talk with Libero</p>
          </button>
        </div>

        {/* Current ego-state chip */}
      </div>

      {/* Session Selection Modal */}
      <SessionSelectionModal
        isOpen={showSessionMenu}
        onClose={() => setShowSessionMenu(false)}
        onSessionSelect={handleSessionSelect}
        user={user}
        activeEgoState={activeEgoState}
      />
    </div>
  );
}
