import React, { useState, useEffect } from 'react';
import { Star, Lock, Play, Gift, Target, Calendar, Zap, Trophy, ArrowRight, CheckCircle, Crown, Clock } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import PageShell from '../layout/PageShell';
import OnboardingWizard from '../journey/OnboardingWizard';
import DailyTasks from '../journey/DailyTasks';

interface JourneyMapScreenProps {
  onProtocolSelect: (protocol: any) => void;
}

// Horizontal Milestone Roadmap Component (same as HomeScreen)
interface HorizontalMilestoneRoadmapProps {
  user: any;
  onMilestoneSelect: (milestone: any) => void;
  onTabChange?: (tabId: any) => void;
}

function HorizontalMilestoneRoadmap({ user, onMilestoneSelect }: HorizontalMilestoneRoadmapProps) {
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
      name: 'Building Momentum',
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

  const handleMilestoneClick = (milestone: any) => {
    if (!milestone.unlocked) {
      const requirements = getMilestoneRequirements(milestone.id);
      showToast({
        type: 'info',
        message: `Unlock requirement: ${requirements}`,
        duration: 4000
      });
      return;
    }
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
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
          <Target size={20} className="text-teal-400" />
          <span>Transformation Roadmap</span>
        </h3>
        <span className="text-white/60 text-sm">{milestones.filter(m => m.completed).length}/{milestones.length} completed</span>
      </div>

      {/* Horizontal Roadmap */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center gap-6">
          {milestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isCompleted = milestone.completed;
            const isActive = milestone.active;
            const isUnlocked = milestone.unlocked;

            return (
              <div key={milestone.id} className="flex items-center gap-5 flex-shrink-0 relative">
                <button
                  onClick={() => (isUnlocked ? handleMilestoneClick(milestone) : null)}
                  disabled={!isUnlocked}
                  className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
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
                    <CheckCircle size={20} className="text-green-400" />
                  ) : !isUnlocked ? (
                    <Lock size={20} className="text-white/40" />
                  ) : (
                    <IconComponent size={20} className={`${isActive ? 'text-orange-400' : 'text-teal-400'}`} />
                  )}

                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center border border-black">
                      <CheckCircle size={12} className="text-black" />
                    </div>
                  )}
                </button>

                {/* Connector */}
                {index < milestones.length - 1 && (
                  <div
                    className={`w-10 h-0.5 rounded-full ${
                      isCompleted && milestones[index + 1].unlocked
                        ? 'bg-gradient-to-r from-green-400 to-teal-400'
                        : isCompleted
                        ? 'bg-gradient-to-r from-green-400/70 to-white/20'
                        : isUnlocked && milestones[index + 1].unlocked
                        ? 'bg-gradient-to-r from-teal-400/70 to-orange-400/70'
                        : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-center gap-5 px-1 mb-4">
        {milestones.map(milestone => (
          <div key={milestone.id} className="text-center" style={{ width: 72 }}>
            <div
              className={`text-[11px] font-medium ${
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
              <div className="text-[10px] text-orange-300 mt-0.5">+{milestone.xpReward}</div>
            ) : (
              <div className="h-[14px]" />
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="text-green-400 text-lg font-bold">
            {milestones.filter(m => m.completed).length}
          </div>
          <div className="text-white/60 text-xs">Completed</div>
        </div>
        <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
          <div className="text-orange-400 text-lg font-bold">
            {milestones.filter(m => m.active).length}
          </div>
          <div className="text-white/60 text-xs">Active</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white text-lg font-bold">
            {milestones.filter(m => !m.unlocked).length}
          </div>
          <div className="text-white/60 text-xs">Locked</div>
        </div>
      </div>
    </div>
  );
}

export default function JourneyMapScreen({ onProtocolSelect }: JourneyMapScreenProps) {
  const { isAuthenticated } = useAuth();
  const { openModal, showToast } = useAppStore();
  const { user } = useGameState();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userGoals, setUserGoals] = useState<any>(null);
  const [journeyData, setJourneyData] = useState<any>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has journey data or goals set
      const hasJourneyData = localStorage.getItem('libero-journey-data');
      const hasGoals = localStorage.getItem('libero-user-goals');
      setHasCompletedOnboarding(!!hasJourneyData && !!hasGoals);
      
      if (hasGoals) {
        setUserGoals(JSON.parse(hasGoals));
      }
      if (hasJourneyData) {
        setJourneyData(JSON.parse(hasJourneyData));
      }
    }
  }, [isAuthenticated, user]);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (goals: any, roadmap: any) => {
    setUserGoals(goals);
    setJourneyData(roadmap);
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
    
    // Save to localStorage
    localStorage.setItem('libero-user-goals', JSON.stringify(goals));
    localStorage.setItem('libero-journey-data', JSON.stringify(roadmap));
    
    showToast({
      type: 'success',
      message: 'Your personalized journey map has been created!'
    });
  };

  const handleResetJourney = () => {
    localStorage.removeItem('libero-journey-data');
    localStorage.removeItem('libero-user-goals');
    setHasCompletedOnboarding(false);
    setUserGoals(null);
    setJourneyData(null);
    showToast({
      type: 'info',
      message: 'Journey reset. Start your onboarding again!'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                  <Target size={32} className="text-purple-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to start your journey</h3>
                <button
                  onClick={() => openModal('auth')}
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
    <div className="h-full bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
            {!hasCompletedOnboarding ? (
              /* Onboarding Entry Point */
              <div className="px-4 h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                    <Target size={36} className="text-teal-400" />
                  </div>
                  <h1 className="text-white text-2xl font-light mb-4">Create Your Transformation Journey</h1>
                  <p className="text-white/70 text-base mb-8 leading-relaxed">
                    Let's design a personalized path to unlock your authentic power through archetypal hypnosis.
                  </p>
                  <button
                    onClick={handleStartOnboarding}
                    className="px-8 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-lg shadow-teal-400/25 flex items-center space-x-3 mx-auto"
                  >
                    <Star size={20} />
                    <span>Begin Journey Design</span>
                    <ArrowRight size={20} />
                  </button>
                  
                  <p className="text-white/50 text-sm mt-4">
                    Takes 2-3 minutes • Personalized by AI • Unlock your full potential
                  </p>
                </div>
              </div>
            ) : (
              /* Journey Map Interface */
              <div className="px-4 space-y-6">
                {/* Journey Header */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-white text-xl font-light mb-1">Your Transformation Map</h1>
                      <p className="text-white/70 text-sm">{userGoals?.mainGoal || 'Personal Transformation'}</p>
                    </div>
                    <button
                      onClick={handleResetJourney}
                      className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                    >
                      Reset Journey
                    </button>
                  </div>
                  
                  {/* Progress Overview */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                      <div className="text-teal-400 text-xl font-bold">{user?.level || 1}</div>
                      <div className="text-white/60 text-xs">Current Stage</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                      <div className="text-purple-400 text-xl font-bold">3</div>
                      <div className="text-white/60 text-xs">Milestones Unlocked</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                      <div className="text-orange-400 text-xl font-bold">{user?.session_streak || 0}</div>
                      <div className="text-white/60 text-xs">Day Streak</div>
                    </div>
                  </div>
                </div>

                {/* Two Column Layout: Daily Tasks + Roadmap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Daily Tasks - Compressed */}
                  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-white font-semibold text-lg flex items-center space-x-2">
                        <Calendar size={18} className="text-teal-400" />
                        <span>Today's Practice</span>
                      </h2>
                      <div className="text-white/60 text-sm">0/1 completed</div>
                    </div>
                    
                    {/* Compressed Daily Task */}
                    <button
                      onClick={() => onProtocolSelect({
                        id: 'daily-primary',
                        name: `Daily ${userGoals?.mainGoal || 'Transformation'}`,
                        category: 'daily',
                        duration: 15,
                        goals: [userGoals?.mainGoal || 'transformation']
                      })}
                      className="w-full bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-3 border border-teal-500/30 hover:scale-105 transition-all text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                          <Target size={16} className="text-teal-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">Daily {userGoals?.mainGoal || 'Transformation'}</h3>
                          <div className="flex items-center space-x-3 text-xs text-white/60">
                            <span className="flex items-center space-x-1">
                              <Clock size={10} />
                              <span>15m</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Star size={10} className="text-orange-400" />
                              <span>+25 XP</span>
                            </span>
                          </div>
                        </div>
                        <Play size={16} className="text-white/40" />
                      </div>
                    </button>
                  </div>

                  {/* Transformation Roadmap - Compressed */}
                  <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                        <Target size={18} className="text-teal-400" />
                        <span>Roadmap</span>
                      </h3>
                      <span className="text-white/60 text-sm">1/5 completed</span>
                    </div>

                    {/* Compact Milestone Grid */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {[
                        { id: 'first', icon: Play, completed: true, active: false, unlocked: true },
                        { id: 'momentum', icon: Zap, completed: false, active: true, unlocked: true },
                        { id: 'explorer', icon: Star, completed: false, active: false, unlocked: false },
                        { id: 'warrior', icon: Trophy, completed: false, active: false, unlocked: false },
                        { id: 'master', icon: Crown, completed: false, active: false, unlocked: false }
                      ].map((milestone, i) => {
                        const IconComponent = milestone.icon;
                        return (
                          <button
                            key={milestone.id}
                            className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110 ${
                              milestone.completed
                                ? 'bg-green-500/30 border-green-400'
                                : milestone.active
                                ? 'bg-orange-500/30 border-orange-400 animate-pulse'
                                : milestone.unlocked
                                ? 'bg-teal-500/20 border-teal-400'
                                : 'bg-white/10 border-white/20 opacity-50'
                            }`}
                          >
                            <IconComponent size={14} className={`${
                              milestone.completed ? 'text-green-400' :
                              milestone.active ? 'text-orange-400' :
                              milestone.unlocked ? 'text-teal-400' : 'text-white/40'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Progress Summary */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                        <div className="text-green-400 text-sm font-bold">1</div>
                        <div className="text-white/60 text-xs">Done</div>
                      </div>
                      <div className="bg-orange-500/10 rounded-lg p-2 border border-orange-500/20">
                        <div className="text-orange-400 text-sm font-bold">1</div>
                        <div className="text-white/60 text-xs">Active</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white text-sm font-bold">3</div>
                        <div className="text-white/60 text-xs">Locked</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Challenge */}
                <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-2xl p-4 border border-yellow-500/20">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                      <Trophy size={18} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Weekly Challenge</h3>
                      <p className="text-white/70 text-sm">Complete for bonus rewards</p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">Master Your Morning Ritual</h4>
                      <div className="flex items-center space-x-1">
                        <Gift size={14} className="text-yellow-400" />
                        <span className="text-yellow-400 font-bold">+50 tokens</span>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-3">Complete 7 consecutive morning sessions this week</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-full ${
                              i < (user?.session_streak || 0) ? 'bg-yellow-400' : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-white/60 text-sm">{user?.session_streak || 0}/7 days</span>
                    </div>
                  </div>
                </div>

                {/* Achievement Showcase */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                  <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <Star size={18} className="text-purple-400" />
                    <span>Recent Achievements</span>
                  </h3>
                  
                  {(user?.achievements?.length || 0) > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {user?.achievements?.slice(0, 4).map((achievement, i) => (
                        <div key={i} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-2 border border-purple-500/20">
                          <div className="text-center">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-1">
                              <Trophy size={12} className="text-purple-400" />
                            </div>
                            <span className="text-white/80 text-xs font-medium">{achievement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center mx-auto mb-3 border border-gray-500/30">
                        <Star size={18} className="text-gray-400" />
                      </div>
                      <h4 className="text-white font-medium mb-1">No Achievements Yet</h4>
                      <p className="text-white/60 text-sm">Complete sessions to unlock badges and rewards</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}