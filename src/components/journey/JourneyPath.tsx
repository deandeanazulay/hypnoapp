import React, { useState } from 'react';
import { Lock, Star, CheckCircle, Play, Gift, Trophy, Zap, Target, Crown, ArrowDown, ChevronRight, Clock, Award } from 'lucide-react';
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

export default function JourneyPath({ currentLevel, userGoals, journeyData, onMilestoneSelect }: JourneyPathProps) {
  const { user } = useGameState();
  const { showToast } = useAppStore();
  const [expandedChapter, setExpandedChapter] = useState<string>('foundation');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Define the gamified journey chapters and milestones
  const journeyChapters: Chapter[] = [
    {
      id: 'foundation',
      name: 'Foundation',
      description: 'Master the fundamentals of consciousness transformation',
      level: 1,
      icon: Target,
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
          protocol: { id: 'confidence-builder', name: 'Confidence Building', category: 'confidence' }
        }
      ]
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Unlock advanced techniques and deeper states',
      level: 5,
      icon: Zap,
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
          protocol: { id: 'mastery-integration', name: 'Master Integration Ceremony', category: 'mastery' }
        }
      ]
    }
  ];

  const handleMilestoneClick = (milestone: Milestone) => {
    if (!milestone.unlocked) {
      showToast({
        type: 'info',
        message: `Reach level ${getChapterByMilestone(milestone.id)?.level || 1} to unlock this milestone`
      });
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

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      {/* Journey Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-xl flex items-center space-x-2">
            <Trophy size={24} className="text-yellow-400" />
            <span>Transformation Journey</span>
          </h2>
          <p className="text-white/70 text-sm">Visual milestone progression • Level {currentLevel}</p>
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
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transition-all duration-700"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Journey Chapters */}
      <div className="space-y-6">
        {journeyChapters.map((chapter, chapterIndex) => {
          const ChapterIcon = chapter.icon;
          const completedInChapter = chapter.milestones.filter(m => m.completed).length;
          const totalInChapter = chapter.milestones.length;
          const chapterProgress = totalInChapter > 0 ? completedInChapter / totalInChapter : 0;
          const isExpanded = expandedChapter === chapter.id;
          const isChapterComplete = completedInChapter === totalInChapter;

          return (
            <div key={chapter.id} className="relative">
              {/* Chapter Header */}
              <button
                onClick={() => setExpandedChapter(isExpanded ? '' : chapter.id)}
                disabled={chapter.unlocked === false}
                className={`w-full bg-gradient-to-br ${chapter.color} backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:scale-105 text-left disabled:opacity-60 disabled:hover:scale-100 ${
                  isChapterComplete ? 'ring-2 ring-yellow-400/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full ${
                      chapter.unlocked === false 
                        ? 'bg-white/10 border border-white/20' 
                        : isChapterComplete
                        ? 'bg-yellow-500/20 border border-yellow-500/40'
                        : 'bg-black/20 border border-white/20'
                    } flex items-center justify-center relative`}>
                      {chapter.unlocked === false ? (
                        <Lock size={24} className="text-white/40" />
                      ) : isChapterComplete ? (
                        <>
                          <ChapterIcon size={24} className="text-yellow-400" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <CheckCircle size={12} className="text-black" />
                          </div>
                        </>
                      ) : (
                        <ChapterIcon size={24} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-bold text-lg">{chapter.name}</h3>
                        {chapter.unlocked === false && (
                          <div className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white/60">
                            Level {chapter.level}
                          </div>
                        )}
                        {isChapterComplete && (
                          <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full text-xs text-yellow-400 font-medium">
                            Complete!
                          </div>
                        )}
                      </div>
                      <p className="text-white/70 text-sm mb-2">{chapter.description}</p>
                      {chapter.unlocked !== false && (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60 text-sm">{completedInChapter}/{totalInChapter} milestones</span>
                            <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500"
                                style={{ width: `${chapterProgress * 100}%` }}
                              />
                            </div>
                          </div>
                          {chapter.chapterReward && completedInChapter > 0 && (
                            <div className="flex items-center space-x-2 text-xs">
                              <Gift size={12} className="text-orange-400" />
                              <span className="text-orange-400">+{Math.round(chapter.chapterReward.xp * chapterProgress)} XP</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {chapter.unlocked !== false && (
                    <ArrowDown 
                      size={20} 
                      className={`text-white/60 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  )}
                </div>
              </button>

              {/* Milestone Path - Visual progression */}
              {isExpanded && chapter.unlocked !== false && (
                <div className="mt-6 ml-8 animate-slide-up">
                  <div className="relative">
                    {/* Milestone Nodes */}
                    <div className="space-y-6">
                      {chapter.milestones.map((milestone, milestoneIndex) => {
                        const MilestoneIcon = milestone.icon;
                        const isActive = milestone.active;
                        const isNext = !milestone.completed && milestone.unlocked && !isActive;
                        
                        return (
                          <div key={milestone.id} className="relative flex items-center">
                            {/* Connection Line */}
                            {milestoneIndex < chapter.milestones.length - 1 && (
                              <div className="absolute left-6 top-12 w-0.5 h-6 bg-gradient-to-b from-white/40 to-white/20" />
                            )}
                            
                            {/* Milestone Node */}
                            <button
                              onClick={() => handleMilestoneClick(milestone)}
                              disabled={!milestone.unlocked}
                              className={`flex items-center space-x-4 w-full p-4 rounded-xl border transition-all duration-300 hover:scale-105 text-left group ${
                                milestone.completed
                                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/40'
                                  : isActive
                                  ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500/40 animate-pulse'
                                  : isNext
                                  ? 'bg-gradient-to-br from-teal-500/15 to-cyan-500/15 border-teal-500/30 hover:border-teal-500/50'
                                  : milestone.unlocked
                                  ? 'bg-white/10 border-white/20 hover:border-white/30'
                                  : 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed'
                              } disabled:hover:scale-100`}
                            >
                              {/* Node Circle */}
                              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 relative ${
                                milestone.completed
                                  ? 'bg-green-500/30 border-green-400'
                                  : isActive
                                  ? 'bg-orange-500/30 border-orange-400 animate-pulse'
                                  : isNext
                                  ? 'bg-teal-500/30 border-teal-400'
                                  : milestone.unlocked
                                  ? 'bg-white/20 border-white/40'
                                  : 'bg-white/10 border-white/20'
                              }`}>
                                {milestone.completed ? (
                                  <CheckCircle size={20} className="text-green-400" />
                                ) : milestone.unlocked ? (
                                  <MilestoneIcon size={20} className={`${
                                    isActive ? 'text-orange-400' : 
                                    isNext ? 'text-teal-400' : 
                                    'text-white'
                                  }`} />
                                ) : (
                                  <Lock size={20} className="text-white/40" />
                                )}
                                
                                {/* Active pulse ring */}
                                {isActive && (
                                  <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" />
                                )}
                              </div>

                              {/* Milestone Info */}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-white font-semibold">{milestone.name}</h4>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(milestone.difficulty)}`}>
                                    {milestone.difficulty}
                                  </div>
                                </div>
                                <p className="text-white/70 text-sm mb-2">{milestone.description}</p>
                                
                                {/* Rewards & Time */}
                                <div className="flex items-center space-x-4 text-xs">
                                  <div className="flex items-center space-x-1">
                                    <Clock size={10} className="text-white/60" />
                                    <span className="text-white/60">{milestone.estimatedTime}m</span>
                                  </div>
                                  {milestone.xpReward && (
                                    <div className="flex items-center space-x-1">
                                      <Star size={10} className="text-orange-400" />
                                      <span className="text-orange-400">+{milestone.xpReward} XP</span>
                                    </div>
                                  )}
                                  {milestone.tokenReward && (
                                    <div className="flex items-center space-x-1">
                                      <Gift size={10} className="text-yellow-400" />
                                      <span className="text-yellow-400">+{milestone.tokenReward}</span>
                                    </div>
                                  )}
                                  {milestone.badgeReward && (
                                    <div className="flex items-center space-x-1">
                                      <Award size={10} className="text-purple-400" />
                                      <span className="text-purple-400">{milestone.badgeReward}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Indicator */}
                              {milestone.unlocked && !milestone.completed && (
                                <div className="flex-shrink-0">
                                  {isActive ? (
                                    <div className="px-3 py-1 bg-orange-500/30 border border-orange-500/50 rounded-full text-orange-400 text-xs font-bold">
                                      START
                                    </div>
                                  ) : (
                                    <ChevronRight size={16} className="text-white/40 group-hover:text-white/70" />
                                  )}
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Chapter Connection Line */}
              {chapterIndex < journeyChapters.length - 1 && (
                <div className="flex justify-center my-6">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-white/40 via-white/20 to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Journey Summary Cards */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/20 text-center">
          <div className="text-orange-400 text-2xl font-bold mb-1">
            {journeyChapters.reduce((sum, chapter) => 
              sum + chapter.milestones.filter(m => m.completed).reduce((xpSum, m) => xpSum + (m.xpReward || 0), 0), 0
            )}
          </div>
          <div className="text-white/60 text-xs">Journey XP</div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20 text-center">
          <div className="text-yellow-400 text-2xl font-bold mb-1">
            {journeyChapters.reduce((sum, chapter) => 
              sum + chapter.milestones.filter(m => m.completed).reduce((tokenSum, m) => tokenSum + (m.tokenReward || 0), 0), 0
            )}
          </div>
          <div className="text-white/60 text-xs">Tokens Earned</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
          <div className="text-purple-400 text-2xl font-bold mb-1">
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
          
          <div className="relative bg-black/95 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-md w-full">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full ${
                selectedMilestone.completed
                  ? 'bg-green-500/20 border border-green-500/40'
                  : selectedMilestone.active
                  ? 'bg-orange-500/20 border border-orange-500/40'
                  : 'bg-teal-500/20 border border-teal-500/40'
              } flex items-center justify-center mx-auto mb-4`}>
                <selectedMilestone.icon size={32} className={`${
                  selectedMilestone.completed ? 'text-green-400' :
                  selectedMilestone.active ? 'text-orange-400' :
                  'text-teal-400'
                }`} />
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
                <h4 className="text-white font-medium mb-3">Completion Rewards</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {selectedMilestone.xpReward && (
                    <div className="bg-black/20 rounded-lg p-2">
                      <Star size={14} className="text-orange-400 mx-auto mb-1" />
                      <div className="text-orange-400 font-bold text-sm">+{selectedMilestone.xpReward}</div>
                      <div className="text-white/60 text-xs">XP</div>
                    </div>
                  )}
                  {selectedMilestone.tokenReward && (
                    <div className="bg-black/20 rounded-lg p-2">
                      <Gift size={14} className="text-yellow-400 mx-auto mb-1" />
                      <div className="text-yellow-400 font-bold text-sm">+{selectedMilestone.tokenReward}</div>
                      <div className="text-white/60 text-xs">Tokens</div>
                    </div>
                  )}
                  {selectedMilestone.badgeReward && (
                    <div className="bg-black/20 rounded-lg p-2">
                      <Award size={14} className="text-purple-400 mx-auto mb-1" />
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
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all duration-300"
              >
                Close
              </button>
              {!selectedMilestone.completed && selectedMilestone.unlocked && (
                <button
                  onClick={() => handleStartMilestone(selectedMilestone)}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform duration-200 shadow-lg ${
                    selectedMilestone.active
                      ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-black shadow-orange-400/30'
                      : 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black shadow-teal-400/30'
                  }`}
                >
                  {selectedMilestone.active ? 'Begin Journey' : 'Start Milestone'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}