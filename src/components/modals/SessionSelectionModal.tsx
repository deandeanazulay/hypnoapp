import React, { useState } from 'react';
import { Play, Clock, Star, Trophy, Zap, Target, Crown, Flame, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { getEgoColor } from '../../config/theme';
import { getEgoState } from '../../store';
import { useAppStore } from '../../store';
import { useSessionStore } from '../../store/sessionStore';
import { startSession } from '../../services/session';
import { useGameState } from '../GameStateManager';

interface SessionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSelect: (session: any) => void;
  user: any;
  activeEgoState: string;
}

export default function SessionSelectionModal({ 
  isOpen, 
  onClose, 
  onSessionSelect, 
  user, 
  activeEgoState 
}: SessionSelectionModalProps) {
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const { showToast } = useAppStore();
  const { updateUser } = useGameState();
  const { startNewSession } = useSessionStore();

  // Calculate dynamic milestone status
  const getTotalSessions = () => {
    return Object.values(user?.ego_state_usage || {}).reduce((sum, count) => sum + count, 0);
  };

  const getUniqueEgoStatesUsed = () => {
    return Object.keys(user?.ego_state_usage || {}).length;
  };

  // Generate available sessions from milestones
  const getAvailableSessions = () => {
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
          description: 'Gentle introduction to hypnotherapy using progressive muscle relaxation'
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
          description: 'Quick and effective stress relief for busy moments'
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
          description: 'Explore different archetypal energies and find your guides'
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
          description: 'Build unshakeable confidence and inner strength'
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
          description: 'Deep consciousness work for experienced practitioners'
        }
      }
    ];

    return milestones.filter(m => m.unlocked);
  };

  const availableSessions = getAvailableSessions();
  const egoColor = getEgoColor(activeEgoState);
  const currentState = getEgoState(activeEgoState);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const handleSessionStart = async (session: any) => {
    try {
      console.log('[SESSION-MODAL] Starting session:', session);
      
      showToast({
        type: 'info',
        message: `Starting ${session.protocol.name}...`
      });

      // Close the modal first
      onClose();

      // Start the actual session using the session store
      await startNewSession({
        egoState: activeEgoState,
        userId: user?.id,
        protocol: session.protocol,
        goal: {
          id: session.id,
          name: session.protocol.name
        },
        action: {
          name: session.protocol.name,
          id: session.protocol.id
        },
        method: {
          name: 'guided relaxation',
          id: 'guided'
        },
        lengthSec: session.protocol.duration * 60,
        userPrefs: {
          level: user?.level || 1,
          experience: user?.experience || 0
        }
      });

      console.log('[SESSION-MODAL] Session started via store');

      // Track session start
      showToast({
        type: 'success',
        message: `${session.protocol.name} session started!`
      });

      // Call the original callback for any additional handling
      onSessionSelect(session);

    } catch (error) {
      console.error('Error starting session:', error);
      showToast({
        type: 'error',
        message: 'Failed to start session. Please try again.'
      });
    }
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
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Session"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Current Ego State */}
        <div 
          className="bg-gradient-to-br rounded-xl p-4 border"
          style={{ 
            background: `linear-gradient(135deg, ${egoColor.accent}20, ${egoColor.accent}10)`,
            borderColor: `${egoColor.accent}40`
          }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
                borderColor: `${egoColor.accent}80`
              }}
            >
              <span className="text-lg">{currentState.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Channeling {currentState.name} Energy</h3>
              <p className="text-white/70 text-sm">{currentState.role} • {currentState.description}</p>
            </div>
          </div>
        </div>

        {/* Available Sessions */}
        <div>
          <h4 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Target size={16} className="text-teal-400" />
            <span>Available Sessions from Your Roadmap</span>
          </h4>
          
          {availableSessions.length > 0 ? (
            <div className="space-y-3">
              {availableSessions.map((session) => {
                const IconComponent = session.icon;
                const isCompleted = session.completed;
                const isActive = session.active;
                
                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionStart(session)}
                    className={`w-full bg-gradient-to-br rounded-xl p-4 border transition-all duration-200 hover:scale-105 text-left ${
                      isCompleted
                        ? 'from-green-500/10 to-emerald-500/10 border-green-500/30'
                        : isActive
                        ? 'from-orange-500/10 to-amber-500/10 border-orange-500/30 animate-pulse'
                        : 'from-teal-500/10 to-cyan-500/10 border-teal-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative ${
                          isCompleted
                            ? 'bg-green-500/20 border-green-500/40'
                            : isActive
                            ? 'bg-orange-500/20 border-orange-500/40'
                            : 'bg-teal-500/20 border-teal-500/40'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={20} className="text-green-400" />
                          ) : (
                            <IconComponent size={20} className={`${
                              isActive ? 'text-orange-400' : 'text-teal-400'
                            }`} />
                          )}
                          
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center border border-black">
                              <CheckCircle size={12} className="text-black" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-white font-semibold">{session.protocol.name}</h4>
                            {isActive && (
                              <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-full text-xs font-medium">
                                Next Up
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 text-green-400 rounded-full text-xs font-medium">
                                Completed
                              </span>
                            )}
                          </div>
                          <p className="text-white/70 text-sm mb-2">{session.protocol.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-white/60">
                            <div className="flex items-center space-x-1">
                              <Clock size={10} />
                              <span>{session.protocol.duration}m</span>
                            </div>
                            <span className={`px-2 py-1 rounded border ${getDifficultyColor(session.difficulty)}`}>
                              {session.difficulty}
                            </span>
                            <div className="flex items-center space-x-1">
                              <Star size={10} className="text-orange-400" />
                              <span>+{session.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <ArrowRight size={16} className="text-white/40" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center mx-auto mb-4 border border-gray-500/30">
                <Lock size={24} className="text-gray-400" />
              </div>
              <h4 className="text-white font-medium mb-2">No Sessions Available</h4>
              <p className="text-white/60 text-sm mb-4">Complete your first session to unlock more milestones</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-all hover:scale-105"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Roadmap Progress */}
        {availableSessions.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <Trophy size={16} className="text-purple-400" />
              <span>Your Progress</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-green-400 text-lg font-bold">
                  {availableSessions.filter(s => s.completed).length}
                </div>
                <div className="text-white/60 text-xs">Completed</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-orange-400 text-lg font-bold">
                  {availableSessions.filter(s => s.active).length}
                </div>
                <div className="text-white/60 text-xs">Active</div>
              </div>
              <div className="bg-black/20 rounded-lg p-2">
                <div className="text-white text-lg font-bold">
                  {availableSessions.reduce((sum, s) => sum + (s.xpReward || 0), 0)}
                </div>
                <div className="text-white/60 text-xs">Total XP</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}