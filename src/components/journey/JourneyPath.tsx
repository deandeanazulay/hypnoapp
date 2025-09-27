import React, { useState } from 'react';
import { Lock, Star, CheckCircle, Play, Gift, Trophy, Zap, Target, Crown, ArrowDown, ArrowRight } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore } from '../../store';

interface Milestone {
  id: string;
  name: string;
  unlocked: boolean;
  completed?: boolean;
  xpReward?: number;
  tokenReward?: number;
  protocol?: any;
}

interface Stage {
  id: string;
  name: string;
  level: number;
  milestones: Milestone[];
  unlocked?: boolean;
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
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Generate or use existing journey stages
  const stages: Stage[] = journeyData?.stages || [
    {
      id: 'foundation',
      name: 'Foundation',
      level: 1,
      unlocked: true,
      milestones: [
        { 
          id: 'first-session', 
          name: 'First Transformation', 
          unlocked: true, 
          completed: (user?.session_streak || 0) > 0,
          xpReward: 50,
          tokenReward: 10
        },
        { 
          id: 'week-streak', 
          name: '7-Day Momentum', 
          unlocked: (user?.session_streak || 0) >= 3,
          completed: (user?.session_streak || 0) >= 7,
          xpReward: 100,
          tokenReward: 25
        },
        { 
          id: 'depth-master', 
          name: 'Trance Depth Mastery', 
          unlocked: (user?.level || 1) >= 2,
          completed: false,
          xpReward: 75,
          tokenReward: 20
        }
      ]
    },
    {
      id: 'development',
      name: 'Development',
      level: 5,
      unlocked: currentLevel >= 5,
      milestones: [
        { 
          id: 'ego-explorer', 
          name: 'Ego State Explorer', 
          unlocked: currentLevel >= 5,
          completed: false,
          xpReward: 150,
          tokenReward: 40
        },
        { 
          id: 'custom-protocols', 
          name: 'Protocol Creator', 
          unlocked: currentLevel >= 7,
          completed: false,
          xpReward: 200,
          tokenReward: 50
        }
      ]
    },
    {
      id: 'mastery',
      name: 'Mastery',
      level: 10,
      unlocked: currentLevel >= 10,
      milestones: [
        { 
          id: 'advanced-phenomena', 
          name: 'Advanced Phenomena', 
          unlocked: currentLevel >= 10,
          completed: false,
          xpReward: 300,
          tokenReward: 75
        },
        { 
          id: 'consciousness-guide', 
          name: 'Consciousness Guide', 
          unlocked: currentLevel >= 15,
          completed: false,
          xpReward: 500,
          tokenReward: 100
        }
      ]
    },
    {
      id: 'transcendence',
      name: 'Transcendence',
      level: 20,
      unlocked: currentLevel >= 20,
      milestones: [
        { 
          id: 'libero-master', 
          name: 'Libero Master', 
          unlocked: currentLevel >= 20,
          completed: false,
          xpReward: 1000,
          tokenReward: 200
        }
      ]
    }
  ];

  const handleMilestoneClick = (milestone: Milestone, stage: Stage) => {
    if (!milestone.unlocked) {
      showToast({
        type: 'info',
        message: `Reach level ${stage.level} to unlock this milestone`
      });
      return;
    }

    if (milestone.completed) {
      showToast({
        type: 'success',
        message: 'Milestone already completed! Try a new challenge.'
      });
      return;
    }

    // Generate a protocol for this milestone
    const milestoneProtocol = {
      id: milestone.id,
      name: milestone.name,
      description: `Complete the ${milestone.name} milestone`,
      duration: 15,
      category: 'journey',
      rewards: {
        xp: milestone.xpReward,
        tokens: milestone.tokenReward
      }
    };

    onMilestoneSelect({ ...milestone, protocol: milestoneProtocol });
  };

  const getStageIcon = (stageId: string) => {
    const iconMap = {
      foundation: Target,
      development: Zap,
      mastery: Trophy,
      transcendence: Crown
    };
    return iconMap[stageId as keyof typeof iconMap] || Target;
  };

  const getStageColor = (stageId: string, unlocked: boolean) => {
    const colorMap = {
      foundation: unlocked ? 'from-teal-500/20 to-cyan-500/20 border-teal-500/40' : 'from-white/5 to-white/10 border-white/20',
      development: unlocked ? 'from-blue-500/20 to-purple-500/20 border-blue-500/40' : 'from-white/5 to-white/10 border-white/20',
      mastery: unlocked ? 'from-orange-500/20 to-amber-500/20 border-orange-500/40' : 'from-white/5 to-white/10 border-white/20',
      transcendence: unlocked ? 'from-purple-500/20 to-pink-500/20 border-purple-500/40' : 'from-white/5 to-white/10 border-white/20'
    };
    return colorMap[stageId as keyof typeof colorMap] || 'from-white/5 to-white/10 border-white/20';
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-semibold text-xl flex items-center space-x-2">
          <Star size={24} className="text-yellow-400" />
          <span>Transformation Journey</span>
        </h2>
        <div className="text-white/60 text-sm">Level {currentLevel}</div>
      </div>

      <div className="space-y-6">
        {stages.map((stage, stageIndex) => {
          const StageIcon = getStageIcon(stage.id);
          const isExpanded = selectedStage === stage.id;
          const completedMilestones = stage.milestones.filter(m => m.completed).length;
          const totalMilestones = stage.milestones.length;

          return (
            <div key={stage.id} className="relative">
              {/* Stage Header */}
              <button
                onClick={() => setSelectedStage(isExpanded ? null : stage.id)}
                className={`w-full bg-gradient-to-br ${getStageColor(stage.id, stage.unlocked !== false)} backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:scale-105 text-left ${
                  stage.unlocked === false ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full ${
                      stage.unlocked === false 
                        ? 'bg-white/10 border border-white/20' 
                        : 'bg-black/20 border border-white/20'
                    } flex items-center justify-center`}>
                      {stage.unlocked === false ? (
                        <Lock size={20} className="text-white/40" />
                      ) : (
                        <StageIcon size={20} className="text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{stage.name}</h3>
                      <p className="text-white/70 text-sm">
                        {stage.unlocked === false ? `Unlock at Level ${stage.level}` : `${completedMilestones}/${totalMilestones} completed`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {stage.unlocked !== false && (
                      <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500"
                          style={{ width: `${(completedMilestones / totalMilestones) * 100}%` }}
                        />
                      </div>
                    )}
                    <ArrowDown 
                      size={16} 
                      className={`text-white/60 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </div>
              </button>

              {/* Stage Milestones */}
              {isExpanded && stage.unlocked !== false && (
                <div className="mt-4 ml-8 space-y-3 animate-slide-up">
                  {stage.milestones.map((milestone, milestoneIndex) => (
                    <button
                      key={milestone.id}
                      onClick={() => handleMilestoneClick(milestone, stage)}
                      className={`w-full bg-gradient-to-br rounded-xl p-4 border transition-all duration-200 hover:scale-105 text-left ${
                        milestone.completed
                          ? 'from-green-500/10 to-emerald-500/10 border-green-500/30'
                          : milestone.unlocked
                          ? 'from-white/10 to-gray-500/10 border-white/20 hover:border-white/30'
                          : 'from-white/5 to-white/5 border-white/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                            milestone.completed
                              ? 'bg-green-500/20 border-green-500/40'
                              : milestone.unlocked
                              ? 'bg-teal-500/20 border-teal-500/40'
                              : 'bg-white/10 border-white/20'
                          }`}>
                            {milestone.completed ? (
                              <CheckCircle size={16} className="text-green-400" />
                            ) : milestone.unlocked ? (
                              <Play size={16} className="text-teal-400" />
                            ) : (
                              <Lock size={16} className="text-white/40" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{milestone.name}</h4>
                            <div className="flex items-center space-x-4 text-xs text-white/60">
                              {milestone.xpReward && (
                                <span className="flex items-center space-x-1">
                                  <Star size={10} className="text-orange-400" />
                                  <span>+{milestone.xpReward} XP</span>
                                </span>
                              )}
                              {milestone.tokenReward && (
                                <span className="flex items-center space-x-1">
                                  <Gift size={10} className="text-yellow-400" />
                                  <span>+{milestone.tokenReward} tokens</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {milestone.unlocked && !milestone.completed && (
                          <ArrowRight size={16} className="text-white/40" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Connection Line to Next Stage */}
              {stageIndex < stages.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-white/40 to-white/20" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Journey Stats */}
      <div className="mt-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
        <h4 className="text-white font-medium mb-3">Journey Progress</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-teal-400 font-bold text-lg">
              {stages.reduce((total, stage) => total + stage.milestones.filter(m => m.completed).length, 0)}
            </div>
            <div className="text-white/60 text-xs">Milestones</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-orange-400 font-bold text-lg">
              {stages.reduce((total, stage) => total + stage.milestones.filter(m => m.completed).reduce((sum, m) => sum + (m.xpReward || 0), 0), 0)}
            </div>
            <div className="text-white/60 text-xs">XP Earned</div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-yellow-400 font-bold text-lg">
              {stages.reduce((total, stage) => total + stage.milestones.filter(m => m.completed).reduce((sum, m) => sum + (m.tokenReward || 0), 0), 0)}
            </div>
            <div className="text-white/60 text-xs">Tokens Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
}