import React, { useState } from 'react';
import { Settings, BarChart3, Award, TrendingUp, Crown, Zap, Target, Heart, Users, Shield, Star, ChevronRight, Sparkles, Brain, Coins } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState, EGO_STATES } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import PageShell from '../layout/PageShell';
import { getEgoColor } from '../../config/theme';

interface ProfileScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function ProfileScreen({ selectedEgoState, onEgoStateChange }: ProfileScreenProps) {
  const { user, isLoading, error } = useGameState();
  const { activeEgoState, openModal, openEgoModal, showToast } = useAppStore();
  const { isAuthenticated, signOut, user: authUser } = useAuth();
  const [showAnalytics, setShowAnalytics] = useState(false);

  const currentEgoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  // Calculate progress to next level
  const xpForNextLevel = 100;
  const currentLevelXP = user?.experience ? user.experience % 100 : 0;
  const progressToNext = currentLevelXP / xpForNextLevel;

  // Get achievements info
  const achievements = user?.achievements || [];
  const totalAchievements = 25; // Example total available

  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      showToast({ type: 'error', message: 'Error signing out' });
    } else {
      showToast({ type: 'success', message: 'Signed out successfully' });
    }
  };

  const handleOpenSettings = () => {
    openModal('settings');
  };

  const handleOpenEgoStates = () => {
    openEgoModal();
  };

  const handleOpenPlan = () => {
    openModal('plan');
  };

  const handleOpenTokens = () => {
    openModal('tokens');
  };

  if (!isAuthenticated) {
    return (
      <PageShell
        body={
          <div className="h-full bg-black flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                <Users size={32} className="text-purple-400" />
              </div>
              <h3 className="text-white text-xl font-light mb-4">Sign in to view your profile</h3>
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
    );
  }

  if (isLoading || !user) {
    return (
      <PageShell
        body={
          <div className="h-full bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60 text-sm">Loading your profile...</p>
            </div>
          </div>
        }
      />
    );
  }
  // Show error state if there's an error loading profile
  if (error) {
    return (
      <PageShell
        body={
          <div className="h-full bg-black flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <Users size={32} className="text-red-400" />
              </div>
              <h3 className="text-white text-xl font-light mb-4">Error loading profile</h3>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
            <div className="px-4 space-y-6">
              
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={handleOpenEgoStates}
                    className="w-16 h-16 rounded-full bg-gradient-to-br border-2 flex items-center justify-center hover:scale-110 transition-all"
                    style={{ 
                      background: `linear-gradient(135deg, ${egoColor.accent}60, ${egoColor.accent}40)`,
                      borderColor: egoColor.accent + '80',
                      boxShadow: `0 0 20px ${egoColor.accent}40`
                    }}
                  >
                    <span className="text-2xl">{currentEgoState.icon}</span>
                  </button>
                  <div className="flex-1">
                    <button
                      onClick={handleOpenEgoStates}
                      className="text-left hover:scale-105 transition-transform"
                    >
                      <h2 className="text-white text-2xl font-light mb-1">Level {user.level} {currentEgoState.name}</h2>
                      <p className="text-white/70">{currentEgoState.description}</p>
                    </button>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Progress to Level {user.level + 1}</span>
                    <span className="text-orange-400 font-medium text-sm">{currentLevelXP}/100 XP</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${progressToNext * 100}%` }}
                    />
                  </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-yellow-400 text-xl font-bold">{user.session_streak}</div>
                    <div className="text-white/60 text-xs">Day Streak</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-teal-400 text-xl font-bold">{achievements.length}</div>
                    <div className="text-white/60 text-xs">Badges</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-purple-400 text-xl font-bold">{user.tokens}</div>
                    <div className="text-white/60 text-xs">Tokens</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-blue-400 text-xl font-bold">{user.daily_sessions_used}</div>
                    <div className="text-white/60 text-xs">Today</div>
                  </div>
                </div>
              </div>

              {/* Current Ego State Card */}
              <button
                onClick={handleOpenEgoStates}
                className="w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 hover:scale-105 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{currentEgoState.icon}</div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Current Guide: {currentEgoState.name}</h3>
                      <p className="text-white/70 text-sm">{currentEgoState.role} • Tap to change</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/40" />
                </div>
              </button>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleOpenPlan}
                  className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Crown size={20} className="text-yellow-400" />
                    <ChevronRight size={16} className="text-white/40" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Premium</h4>
                  <p className="text-white/70 text-sm">Plan: {user.plan}</p>
                </button>

                <button
                  onClick={handleOpenTokens}
                  className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Coins size={20} className="text-cyan-400" />
                    <ChevronRight size={16} className="text-white/40" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Tokens</h4>
                  <p className="text-white/70 text-sm">Balance: {user.tokens}</p>
                </button>

                <button
                  onClick={() => setShowAnalytics(true)}
                  className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 size={20} className="text-purple-400" />
                    <ChevronRight size={16} className="text-white/40" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Analytics</h4>
                  <p className="text-white/70 text-sm">View insights</p>
                </button>

                <button
                  onClick={() => openModal('favorites')}
                  className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 backdrop-blur-xl rounded-xl p-4 border border-rose-500/20 hover:border-rose-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Heart size={20} className="text-rose-400" />
                    <ChevronRight size={16} className="text-white/40" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Favorites</h4>
                  <p className="text-white/70 text-sm">Mind vault</p>
                </button>
                <button
                  onClick={handleOpenSettings}
                  className="bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-xl rounded-xl p-4 border border-gray-500/20 hover:border-gray-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Settings size={20} className="text-gray-400" />
                    <ChevronRight size={16} className="text-white/40" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Settings</h4>
                  <p className="text-white/70 text-sm">Preferences</p>
                </button>
              </div>

              {/* Recent Sessions */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                  <Brain size={20} className="text-teal-400" />
                  <span>Recent Sessions</span>
                </h3>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/10">
                        <div>
                          <div className="text-white font-medium text-sm">{session.name}</div>
                          <div className="text-white/60 text-xs">{session.ago}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star size={14} className="text-orange-400" />
                          <span className="text-orange-400 font-medium text-sm">+{session.xp} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center mx-auto mb-4 border border-gray-500/30">
                      <Brain size={24} className="text-gray-400" />
                    </div>
                    <h4 className="text-white font-medium mb-2">No Recent Sessions</h4>
                    <p className="text-white/60 text-sm">Complete a session to see your history here</p>
                  </div>
                )}
              </div>

              {/* Achievements Preview */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                    <Award size={20} className="text-yellow-400" />
                    <span>Achievements</span>
                  </h3>
                  <span className="text-white/60 text-sm">{achievements.length}/{totalAchievements}</span>
                </div>
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex -space-x-2">
                    {achievements.slice(0, 3).map((achievement, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-400 border-2 border-black flex items-center justify-center">
                        <Award size={14} className="text-black" />
                      </div>
                    ))}
                    {achievements.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-black/40 border-2 border-white/20 flex items-center justify-center">
                        <span className="text-white/70 text-xs">+{achievements.length - 3}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${(achievements.length / totalAchievements) * 100}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-white/70 text-sm">Complete more sessions to unlock rare badges and titles</p>
              </div>

              {/* Sign Out */}
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
                <h3 className="text-white font-semibold text-lg mb-4">Account</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Email</span>
                    <span className="text-white font-medium">{authUser?.email || user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-red-400 font-medium transition-all hover:scale-105"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAnalytics(false)} />
          
          <div className="relative bg-black/95 backdrop-blur-xl rounded-3xl p-6 border border-white/20 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl font-light">Your Analytics</h2>
              <button onClick={() => setShowAnalytics(false)} className="text-white/60 hover:text-white">
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Ego State Usage */}
              <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
                <h3 className="text-white font-medium mb-3">Ego State Usage</h3>
                <div className="space-y-2">
                  {Object.entries(user.ego_state_usage || {}).slice(0, 5).map(([stateId, count]) => {
                    const state = EGO_STATES.find(s => s.id === stateId);
                    if (!state || count === 0) return null;
                    const totalSessions = Object.values(user.ego_state_usage || {}).reduce((sum, c) => sum + c, 0);
                    const percentage = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
                    
                    return (
                      <div key={stateId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{state.icon}</span>
                          <span className="text-white/80 text-sm">{state.name}</span>
                        </div>
                        <span className="text-white/60 text-sm">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
                <h3 className="text-white font-medium mb-3">This Week</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-teal-400 text-lg font-bold">5</div>
                    <div className="text-white/60 text-xs">Sessions</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-orange-400 text-lg font-bold">78</div>
                    <div className="text-white/60 text-xs">XP Gained</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}