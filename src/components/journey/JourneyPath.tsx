import React, { useState, useEffect } from 'react';
import { Lock, Star, CheckCircle, Play, Gift, Trophy, Zap, Target, Crown, ArrowDown, ChevronRight, Clock, Award, Brain, Users, ArrowRight, TrendingUp, Sparkles, Flame, Shield } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore } from '../../store';

interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  unlocked: boolean;
  completed?: boolean;
  active?: boolean;
  xpReward?: number;
  tokenReward?: number;
  badgeReward?: string;
  protocol?: any;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  position: { x: number; y: number }; // Position on the roadmap
}

interface Chapter {
  id: string;
  name: string;
  description: string;
  level: number;
  icon: React.ComponentType<any>;
  color: string;
  milestones: Milestone[];
  unlocked?: boolean;
  chapterReward?: {
    xp: number;
    tokens: number;
    badge: string;
  };
}

interface JourneyPathProps {
  currentLevel: number;
  userGoals: any;
  journeyData: any;
  onMilestoneSelect: (milestone: Milestone) => void;
}

// Celebration Animation Component
function CelebrationEffect({ milestone, onComplete }: { milestone: Milestone; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Confetti particles */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-bounce-in"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: ['#15E0C3', '#7C5CFF', '#FFC960', '#2ED573'][Math.floor(Math.random() * 4)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      
      {/* Achievement Banner */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce-in">
        <div className="bg-gradient-to-br from-yellow-400/90 to-amber-400/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-yellow-300 shadow-2xl shadow-yellow-400/50">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-300 flex items-center justify-center mx-auto mb-4 animate-level-up">
              <Trophy size={32} className="text-black" />
            </div>
            <h3 className="text-black text-2xl font-bold mb-2">Milestone Unlocked!</h3>
            <p className="text-black/80 text-lg font-medium mb-4">{milestone.name}</p>
            <div className="flex items-center justify-center space-x-6">
              {milestone.xpReward && (
                <div className="flex items-center space-x-2">
                  <Star size={20} className="text-orange-600" />
                  <span className="text-black font-bold">+{milestone.xpReward} XP</span>
                </div>
              )}
              {milestone.tokenReward && (
                <div className="flex items-center space-x-2">
                  <Gift size={20} className="text-purple-600" />
                  <span className="text-black font-bold">+{milestone.tokenReward} Tokens</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Screen flash */}
      <div className="absolute inset-0 bg-yellow-400/20 animate-pulse" />
    </div>
  );
}

// Social Progress Component
function SocialProgress({ userLevel, userSessions }: { userLevel: number; userSessions: number }) {
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    // Simulate social comparison data
    const avgLevel = 3.2;
    const avgSessions = 24;
    const userPercentile = Math.min(95, Math.max(5, 
      userLevel > avgLevel ? 65 + (userLevel - avgLevel) * 10 : 35 - (avgLevel - userLevel) * 5
    ));
    
    setComparison({
      percentile: userPercentile,
      avgLevel,
      avgSessions,
      comparison: userLevel > avgLevel ? 'ahead' : userLevel === avgLevel ? 'average' : 'catching-up'
    });
  }, [userLevel, userSessions]);

  if (!comparison) return null;

  return (
    <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
      <div className="flex items-center space-x-2 mb-3">
        <TrendingUp size={16} className="text-teal-400" />
        <h4 className="text-white font-medium">Your Progress</h4>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Progress Percentile</span>
          <span className={`font-bold ${
            comparison.percentile >= 70 ? 'text-green-400' :
            comparison.percentile >= 50 ? 'text-yellow-400' : 'text-blue-400'
          }`}>
            Top {100 - comparison.percentile}%
          </span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              comparison.percentile >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
              comparison.percentile >= 50 ? 'bg-gradient-to-r from-yellow-400 to-amber-400' :
              'bg-gradient-to-r from-blue-400 to-cyan-400'
            }`}
            style={{ width: `${comparison.percentile}%` }}
          />
        </div>
        <p className="text-white/70 text-xs">
          {comparison.comparison === 'ahead' ? 
            `You're ahead of ${comparison.percentile}% of Libero seekers` :
            comparison.comparison === 'average' ?
            'You\'re progressing at the community average' :
            'You\'re building momentum - keep going!'
          }
        </p>
      </div>
    </div>
  );
}

export default function JourneyPath({ currentLevel, userGoals, journeyData, onMilestoneSelect }: JourneyPathProps) {
  const { user } = useGameState();
  const { showToast } = useAppStore();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);
  const [isUnlocking, setIsUnlocking] = useState<string | null>(null);

  // Define the gamified journey chapters and milestones with roadmap positions
  const journeyChapters: Chapter[] = [
    {
      id: 'foundation',
      name: 'Foundation',
      description: 'Master the fundamentals of consciousness transformation',
      level: 1,
      icon: Shield,
      color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/40',
      unlocked: true,
      chapterReward: { xp: 200, tokens: 50, badge: 'Foundation Master' },
      milestones: [
        {
          id: 'first-session',
          name: 'First Steps',
          description: 'Complete your first transformation session',
          icon: Play,
          unlocked: true,
          completed: (user?.session_streak || 0) > 0,
          active: (user?.session_streak || 0) === 0,
          xpReward: 25,
          tokenReward: 5,
          difficulty: 'easy',
          estimatedTime: 10,
          position: { x: 20, y: 80 },
          protocol: { id: 'progressive-relaxation-basic', name: 'Progressive Relaxation', category: 'stress-relief' }
        },
        {
          id: 'three-day-streak',
          name: 'Building Momentum',
          description: 'Maintain a 3-day practice streak',
          icon: Zap,
          unlocked: (user?.session_streak || 0) >= 1,
          completed: (user?.session_streak || 0) >= 3,
          active: (user?.session_streak || 0) >= 1 && (user?.session_streak || 0) < 3,
          xpReward: 50,
          tokenReward: 10,
          difficulty: 'easy',
          estimatedTime: 10,
          position: { x: 35, y: 40 },
          protocol: { id: 'stress-relief', name: 'Stress Relief Session', category: 'stress-relief' }
        },
        {
          id: 'ego-state-explorer',
          name: 'Guide Discovery',
          description: 'Try 3 different ego state guides',
          icon: Star,
          unlocked: (user?.session_streak || 0) >= 3,
          completed: Object.keys(user?.ego_state_usage || {}).length >= 3,
          active: (user?.session_streak || 0) >= 3 && Object.keys(user?.ego_state_usage || {}).length < 3,
          xpReward: 75,
          tokenReward: 15,
          badgeReward: 'Guide Explorer',
          difficulty: 'medium',
          estimatedTime: 15,
          position: { x: 65, y: 60 },
          protocol: { id: 'ego-exploration', name: 'Ego State Exploration', category: 'consciousness' }
        },
        {
          id: 'week-warrior',
          name: 'Week Warrior',
          description: 'Complete 7 consecutive days of practice',
          icon: Trophy,
          unlocked: (user?.session_streak || 0) >= 3,
          completed: (user?.session_streak || 0) >= 7,
          active: (user?.session_streak || 0) >= 3 && (user?.session_streak || 0) < 7,
          xpReward: 100,
          tokenReward: 25,
          badgeReward: 'Week Warrior',
          difficulty: 'hard',
          estimatedTime: 15,
          position: { x: 80, y: 20 },
          protocol: { id: 'confidence-builder', name: 'Confidence Building', category: 'confidence' }
        }
      ]
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Unlock advanced techniques and deeper states',
      level: 5,
      icon: Flame,
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40',
      unlocked: currentLevel >= 5,
      chapterReward: { xp: 500, tokens: 100, badge: 'Advanced Practitioner' },
      milestones: [
        {
          id: 'depth-master',
          name: 'Depth Master',
          description: 'Achieve trance depth level 4 in a session',
          icon: Target,
          unlocked: currentLevel >= 5,
          completed: false,
          active: currentLevel >= 5,
          xpReward: 150,
          tokenReward: 30,
          difficulty: 'medium',
          estimatedTime: 20,
          position: { x: 20, y: 70 },
          protocol: { id: 'deep-trance', name: 'Deep Trance Induction', category: 'advanced' }
        },
        {
          id: 'protocol-creator',
          name: 'Protocol Creator',
          description: 'Create and complete your first custom protocol',
          icon: Brain,
          unlocked: currentLevel >= 6,
          completed: false,
          active: false,
          xpReward: 200,
          tokenReward: 40,
          badgeReward: 'Creator',
          difficulty: 'hard',
          estimatedTime: 25,
          position: { x: 50, y: 30 },
          protocol: { id: 'custom-creation', name: 'Custom Protocol Workshop', category: 'creativity' }
        },
        {
          id: 'phenomena-explorer',
          name: 'Phenomena Explorer',
          description: 'Experience advanced hypnotic phenomena',
          icon: Award,
          unlocked: currentLevel >= 8,
          completed: false,
          active: false,
          xpReward: 250,
          tokenReward: 50,
          badgeReward: 'Phenomena Master',
          difficulty: 'hard',
          estimatedTime: 30,
          position: { x: 80, y: 50 },
          protocol: { id: 'advanced-phenomena', name: 'Advanced Phenomena Training', category: 'advanced' }
        }
      ]
    },
    {
      id: 'mastery',
      name: 'Mastery',
      description: 'Become a master of consciousness transformation',
      level: 10,
      icon: Crown,
      color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/40',
      unlocked: currentLevel >= 10,
      chapterReward: { xp: 1000, tokens: 200, badge: 'Consciousness Master' },
      milestones: [
        {
          id: 'guide-others',
          name: 'Guide Others',
          description: 'Share your knowledge with fellow travelers',
          icon: Users,
          unlocked: currentLevel >= 10,
          completed: false,
          active: false,
          xpReward: 300,
          tokenReward: 75,
          badgeReward: 'Mentor',
          difficulty: 'hard',
          estimatedTime: 45,
          position: { x: 30, y: 60 },
          protocol: { id: 'mentor-training', name: 'Consciousness Mentoring', category: 'teaching' }
        },
        {
          id: 'libero-master',
          name: 'Libero Master',
          description: 'Achieve mastery across all archetypal states',
          icon: Crown,
          unlocked: currentLevel >= 15,
          completed: false,
          active: false,
          xpReward: 500,
          tokenReward: 100,
          badgeReward: 'Libero Master',
          difficulty: 'hard',
          estimatedTime: 60,
          position: { x: 70, y: 30 },
          protocol: { id: 'mastery-integration', name: 'Master Integration Ceremony', category: 'mastery' }
        }
      ]
    }
  ];

  const handleMilestoneClick = (milestone: Milestone) => {
    if (!milestone.unlocked) {
      // Unlock animation
      setIsUnlocking(milestone.id);
      setTimeout(() => {
        setIsUnlocking(null);
        showToast({
          type: 'info',
          message: `Reach level ${getChapterByMilestone(milestone.id)?.level || 1} to unlock this milestone`
        });
      }, 1000);
      return;
    }

    if (milestone.completed) {
      showToast({
        type: 'success',
        message: 'Milestone already completed! Choose a new challenge.'
      });
      return;
    }

    setSelectedMilestone(milestone);
  };

  const handleStartMilestone = (milestone: Milestone) => {
    onMilestoneSelect(milestone);
    setSelectedMilestone(null);
    
    // Trigger celebration effect when milestone is completed
    setTimeout(() => {
      setCelebratingMilestone(milestone);
    }, 2000);
  };

  const getChapterByMilestone = (milestoneId: string) => {
    return journeyChapters.find(chapter => 
      chapter.milestones.some(m => m.id === milestoneId)
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getOverallProgress = () => {
    const totalMilestones = journeyChapters.reduce((sum, chapter) => sum + chapter.milestones.length, 0);
    const completedMilestones = journeyChapters.reduce((sum, chapter) => 
      sum + chapter.milestones.filter(m => m.completed).length, 0
    );
    return { completed: completedMilestones, total: totalMilestones };
  };

  const progress = getOverallProgress();
  const totalSessions = Object.values(user?.ego_state_usage || {}).reduce((sum, count) => sum + count, 0);

  // Generate path connections between milestones
  const generatePathConnections = (milestones: Milestone[]) => {
    const connections = [];
    for (let i = 0; i < milestones.length - 1; i++) {
      const from = milestones[i];
      const to = milestones[i + 1];
      connections.push({
        from: from.position,
        to: to.position,
        active: from.completed && to.unlocked,
        completed: from.completed && to.completed
      });
    }
    return connections;
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      {/* Journey Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-xl flex items-center space-x-2">
            <Trophy size={24} className="text-yellow-400" />
            <span>Transformation Roadmap</span>
          </h2>
          <p className="text-white/70 text-sm">Visual progression through consciousness mastery</p>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-lg">{progress.completed}/{progress.total}</div>
          <div className="text-white/60 text-xs">Milestones</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-sm">Journey Progress</span>
          <span className="text-orange-400 font-medium text-sm">{Math.round((progress.completed / progress.total) * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transition-all duration-700 animate-gradient-x"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Roadmap Chapters */}
      <div className="space-y-12">
        {journeyChapters.map((chapter, chapterIndex) => {
          const ChapterIcon = chapter.icon;
          const completedInChapter = chapter.milestones.filter(m => m.completed).length;
          const totalInChapter = chapter.milestones.length;
          const chapterProgress = totalInChapter > 0 ? completedInChapter / totalInChapter : 0;
          const isChapterComplete = completedInChapter === totalInChapter;
          const connections = generatePathConnections(chapter.milestones);

          return (
            <div key={chapter.id} className="relative">
              {/* Chapter Header */}
              <div className={`bg-gradient-to-br ${chapter.color} backdrop-blur-sm rounded-xl p-6 border transition-all duration-300 mb-8 ${
                chapter.unlocked === false ? 'opacity-60' : ''
              } ${isChapterComplete ? 'ring-2 ring-yellow-400/50 animate-pulse' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-20 h-20 rounded-full ${
                      chapter.unlocked === false 
                        ? 'bg-white/10 border border-white/20' 
                        : isChapterComplete
                        ? 'bg-yellow-500/20 border-2 border-yellow-400 animate-level-up'
                        : 'bg-black/20 border border-white/20'
                    } flex items-center justify-center relative overflow-hidden`}>
                      {chapter.unlocked === false ? (
                        <Lock size={32} className="text-white/40" />
                      ) : isChapterComplete ? (
                        <>
                          <ChapterIcon size={32} className="text-yellow-400" />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce-in">
                            <Crown size={12} className="text-black" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full animate-pulse" />
                        </>
                      ) : (
                        <ChapterIcon size={32} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-white font-bold text-2xl">{chapter.name}</h3>
                        {chapter.unlocked === false && (
                          <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-white/60 font-medium">
                            Level {chapter.level} Required
                          </div>
                        )}
                        {isChapterComplete && (
                          <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-sm text-yellow-400 font-bold animate-pulse">
                            ✨ MASTERED ✨
                          </div>
                        )}
                      </div>
                      <p className="text-white/80 text-base mb-3">{chapter.description}</p>
                      {chapter.unlocked !== false && (
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60 text-sm">{completedInChapter}/{totalInChapter} milestones</span>
                            <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-700 animate-gradient-x"
                                style={{ width: `${chapterProgress * 100}%` }}
                              />
                            </div>
                          </div>
                          {chapter.chapterReward && isChapterComplete && (
                            <div className="flex items-center space-x-3 text-sm bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/40">
                              <Gift size={14} className="text-yellow-400" />
                              <span className="text-yellow-400 font-bold">Chapter Reward: +{chapter.chapterReward.xp} XP, +{chapter.chapterReward.tokens} Tokens</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Roadmap Visualization */}
              {chapter.unlocked !== false && (
                <div className="relative h-64 mb-8 bg-gradient-to-br from-black/20 to-black/40 rounded-2xl border border-white/10 overflow-hidden">
                  {/* Background grid pattern */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                  }} />

                  {/* Path connections */}
                  <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                    {connections.map((connection, i) => {
                      const x1 = `${connection.from.x}%`;
                      const y1 = `${connection.from.y}%`;
                      const x2 = `${connection.to.x}%`;
                      const y2 = `${connection.to.y}%`;
                      
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke={connection.completed ? '#15E0C3' : connection.active ? '#FFC960' : 'rgba(255,255,255,0.2)'}
                          strokeWidth="3"
                          strokeDasharray={connection.completed ? '0' : connection.active ? '8,4' : '4,8'}
                          className={connection.active ? 'animate-pulse' : ''}
                        />
                      );
                    })}
                  </svg>

                  {/* Milestone nodes */}
                  {chapter.milestones.map((milestone) => {
                    const MilestoneIcon = milestone.icon;
                    const isActive = milestone.active;
                    const isNext = !milestone.completed && milestone.unlocked && !isActive;
                    const isUnlockingThis = isUnlocking === milestone.id;
                    
                    return (
                      <button
                        key={milestone.id}
                        onClick={() => handleMilestoneClick(milestone)}
                        disabled={!milestone.unlocked && !isUnlockingThis}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 group ${
                          milestone.unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${isUnlockingThis ? 'animate-spin' : ''}`}
                        style={{ 
                          left: `${milestone.position.x}%`, 
                          top: `${milestone.position.y}%`,
                          zIndex: 10
                        }}
                      >
                        {/* Node Circle */}
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center relative ${
                          milestone.completed
                            ? 'bg-green-500/40 border-green-400 shadow-lg shadow-green-400/50 animate-breathe-glow'
                            : isActive
                            ? 'bg-orange-500/40 border-orange-400 animate-pulse shadow-lg shadow-orange-400/50'
                            : isNext
                            ? 'bg-teal-500/40 border-teal-400 shadow-lg shadow-teal-400/50'
                            : milestone.unlocked
                            ? 'bg-white/20 border-white/40 shadow-lg'
                            : 'bg-white/10 border-white/20'
                        } ${isUnlockingThis ? 'animate-spin border-yellow-400 bg-yellow-500/40' : ''}`}>
                          
                          {/* Completion checkmark */}
                          {milestone.completed && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in">
                              <CheckCircle size={14} className="text-black" />
                            </div>
                          )}
                          
                          {/* Lock/unlock animation */}
                          {isUnlockingThis ? (
                            <div className="animate-spin">
                              <Sparkles size={24} className="text-yellow-400" />
                            </div>
                          ) : milestone.completed ? (
                            <CheckCircle size={24} className="text-green-400" />
                          ) : milestone.unlocked ? (
                            <MilestoneIcon size={24} className={`${
                              isActive ? 'text-orange-400' : 
                              isNext ? 'text-teal-400' : 
                              'text-white'
                            }`} />
                          ) : (
                            <Lock size={24} className="text-white/40" />
                          )}
                          
                          {/* Active pulse rings */}
                          {isActive && (
                            <>
                              <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" />
                              <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" style={{ animationDelay: '1s' }} />
                            </>
                          )}
                          
                          {/* Next milestone glow */}
                          {isNext && (
                            <div className="absolute inset-0 rounded-full border-2 border-teal-400 animate-pulse" />
                          )}
                        </div>

                        {/* Milestone Label */}
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center min-w-max">
                          <div className={`px-3 py-1 rounded-lg border backdrop-blur-sm transition-all group-hover:scale-105 ${
                            milestone.completed
                              ? 'bg-green-500/20 border-green-500/40 text-green-400'
                              : isActive
                              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                              : isNext
                              ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                              : milestone.unlocked
                              ? 'bg-white/10 border-white/20 text-white'
                              : 'bg-white/5 border-white/10 text-white/40'
                          }`}>
                            <div className="text-xs font-bold">{milestone.name}</div>
                            {milestone.unlocked && (
                              <div className="flex items-center justify-center space-x-2 text-xs mt-1">
                                {milestone.xpReward && (
                                  <span className="text-orange-400">+{milestone.xpReward} XP</span>
                                )}
                                {milestone.tokenReward && (
                                  <span className="text-yellow-400">+{milestone.tokenReward}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Difficulty badge */}
                        {milestone.unlocked && (
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <div className={`px-2 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(milestone.difficulty)}`}>
                              {milestone.difficulty.toUpperCase()}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Chapter completion celebration */}
                  {isChapterComplete && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-amber-400/10 animate-pulse rounded-2xl" />
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-twinkle"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chapter separator */}
              {chapterIndex < journeyChapters.length - 1 && (
                <div className="flex items-center justify-center my-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                      <ArrowDown size={16} className="text-white/60" />
                    </div>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Social Progress */}
      <SocialProgress userLevel={currentLevel} userSessions={totalSessions} />

      {/* Journey Summary Cards */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/20 text-center group hover:scale-105 transition-all">
          <div className="text-orange-400 text-2xl font-bold mb-1 group-hover:animate-pulse">
            {journeyChapters.reduce((sum, chapter) => 
              sum + chapter.milestones.filter(m => m.completed).reduce((xpSum, m) => xpSum + (m.xpReward || 0), 0), 0
            )}
          </div>
          <div className="text-white/60 text-xs">Journey XP</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20 text-center group hover:scale-105 transition-all">
          <div className="text-yellow-400 text-2xl font-bold mb-1 group-hover:animate-pulse">
            {journeyChapters.reduce((sum, chapter) => 
              sum + chapter.milestones.filter(m => m.completed).reduce((tokenSum, m) => tokenSum + (m.tokenReward || 0), 0), 0
            )}
          </div>
          <div className="text-white/60 text-xs">Tokens Earned</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20 text-center group hover:scale-105 transition-all">
          <div className="text-purple-400 text-2xl font-bold mb-1 group-hover:animate-pulse">
            {journeyChapters.reduce((sum, chapter) => 
              sum + chapter.milestones.filter(m => m.completed && m.badgeReward).length, 0
            )}
          </div>
          <div className="text-white/60 text-xs">Badges</div>
        </div>
      </div>

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMilestone(null)} />
          
          <div className="relative bg-black/95 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full transform animate-slide-up shadow-2xl shadow-purple-500/20">
            <div className="text-center mb-6">
              <div className={`w-24 h-24 rounded-full ${
                selectedMilestone.completed
                  ? 'bg-green-500/20 border-2 border-green-400 animate-breathe-glow'
                  : selectedMilestone.active
                  ? 'bg-orange-500/20 border-2 border-orange-400 animate-pulse'
                  : 'bg-teal-500/20 border-2 border-teal-400'
              } flex items-center justify-center mx-auto mb-4 relative overflow-hidden`}>
                <selectedMilestone.icon size={36} className={`${
                  selectedMilestone.completed ? 'text-green-400' :
                  selectedMilestone.active ? 'text-orange-400' :
                  'text-teal-400'
                }`} />
                
                {selectedMilestone.completed && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-bounce-in">
                    <CheckCircle size={16} className="text-black" />
                  </div>
                )}
              </div>
              <h3 className="text-white text-xl font-bold mb-2">{selectedMilestone.name}</h3>
              <p className="text-white/70 text-sm">{selectedMilestone.description}</p>
            </div>

            {/* Milestone Details */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <Clock size={16} className="text-blue-400 mx-auto mb-1" />
                  <div className="text-white font-medium text-sm">{selectedMilestone.estimatedTime}m</div>
                  <div className="text-white/60 text-xs">Duration</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
                  <div className={`text-sm font-medium px-2 py-1 rounded border ${getDifficultyColor(selectedMilestone.difficulty)}`}>
                    {selectedMilestone.difficulty}
                  </div>
                  <div className="text-white/60 text-xs mt-1">Level</div>
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Gift size={16} className="text-purple-400" />
                  <span>Completion Rewards</span>
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {selectedMilestone.xpReward && (
                    <div className="bg-black/20 rounded-lg p-2 group hover:scale-105 transition-all">
                      <Star size={14} className="text-orange-400 mx-auto mb-1 group-hover:animate-spin" />
                      <div className="text-orange-400 font-bold text-sm">+{selectedMilestone.xpReward}</div>
                      <div className="text-white/60 text-xs">XP</div>
                    </div>
                  )}
                  {selectedMilestone.tokenReward && (
                    <div className="bg-black/20 rounded-lg p-2 group hover:scale-105 transition-all">
                      <Gift size={14} className="text-yellow-400 mx-auto mb-1 group-hover:animate-spin" />
                      <div className="text-yellow-400 font-bold text-sm">+{selectedMilestone.tokenReward}</div>
                      <div className="text-white/60 text-xs">Tokens</div>
                    </div>
                  )}
                  {selectedMilestone.badgeReward && (
                    <div className="bg-black/20 rounded-lg p-2 group hover:scale-105 transition-all">
                      <Award size={14} className="text-purple-400 mx-auto mb-1 group-hover:animate-spin" />
                      <div className="text-purple-400 font-bold text-xs">{selectedMilestone.badgeReward}</div>
                      <div className="text-white/60 text-xs">Badge</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedMilestone(null)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
              {!selectedMilestone.completed && selectedMilestone.unlocked && (
                <button
                  onClick={() => handleStartMilestone(selectedMilestone)}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all duration-200 shadow-lg relative overflow-hidden ${
                    selectedMilestone.active
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-black shadow-orange-400/30 btn-shimmer'
                      : 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black shadow-teal-400/30 btn-shimmer'
                  }`}
                >
                  {selectedMilestone.active ? 'Begin Journey' : 'Start Milestone'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Celebration Effect */}
      {celebratingMilestone && (
        <CelebrationEffect 
          milestone={celebratingMilestone} 
          onComplete={() => setCelebratingMilestone(null)} 
        />
      )}
    </div>
  );
}