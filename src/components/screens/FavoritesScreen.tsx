import React, { useState } from 'react';
import { Heart, Play, Clock, Star, Trash2, Share2, Pin, Award, TrendingUp, BarChart3, Crown } from 'lucide-react';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';

interface FavoriteSession {
  id: string;
  name: string;
  egoState: string;
  action: string;
  duration: number;
  completedCount: number;
  lastCompleted: Date;
  rating: number;
  streak: number;
  isPinned: boolean;
  badges: string[];
}

// Mock data
const mockFavorites: FavoriteSession[] = [
  {
    id: '1',
    name: 'Guardian Stress Relief',
    egoState: 'guardian',
    action: 'stress-relief',
    duration: 10,
    completedCount: 12,
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 5,
    streak: 3,
    isPinned: true,
    badges: ['guardian-adept']
  },
  {
    id: '2',
    name: 'Healer Recovery',
    egoState: 'healer',
    action: 'healing',
    duration: 12,
    completedCount: 22,
    lastCompleted: new Date(Date.now() - 5 * 60 * 60 * 1000),
    rating: 4,
    streak: 0,
    isPinned: false,
    badges: ['healer-master']
  },
  {
    id: '3',
    name: 'Explorer Adventure',
    egoState: 'explorer',
    action: 'creativity',
    duration: 8,
    completedCount: 7,
    lastCompleted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    rating: 5,
    streak: 2,
    isPinned: false,
    badges: []
  },
  {
    id: '4',
    name: 'Child Joy',
    egoState: 'child',
    action: 'happiness',
    duration: 6,
    completedCount: 18,
    lastCompleted: new Date(Date.now() - 30 * 60 * 1000),
    rating: 5,
    streak: 5,
    isPinned: false,
    badges: ['child-enthusiast']
  }
];

interface FavoritesScreenProps {
  onSessionSelect: (session: FavoriteSession) => void;
}

export default function FavoritesScreen({ onSessionSelect }: FavoritesScreenProps) {
  const { user, isLoading } = useGameState();
  const { activeEgoState, showToast } = useAppStore();
  const [selectedSession, setSelectedSession] = useState<FavoriteSession | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const formatLastCompleted = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getEgoStateIcon = (egoState: string) => {
    const iconMap: { [key: string]: string } = {
      guardian: '🛡️',
      rebel: '🔥',
      healer: '🌿',
      explorer: '🌍',
      mystic: '✨',
      sage: '📜',
      child: '🎈',
      performer: '🎭',
      shadow: '🌑',
      builder: '🛠️'
    };
    return iconMap[egoState] || '⭐';
  };

  const getBadgeInfo = (badge: string) => {
    const badges: { [key: string]: { name: string; icon: string; color: string } } = {
      'guardian-adept': { name: 'Guardian Adept', icon: '🛡️', color: 'text-blue-400' },
      'healer-master': { name: 'Healing Master', icon: '🌿', color: 'text-green-400' },
      'child-enthusiast': { name: 'Joy Keeper', icon: '🎈', color: 'text-orange-400' },
      'mystic-adept': { name: 'Mystic Adept', icon: '✨', color: 'text-purple-400' }
    };
    return badges[badge] || { name: badge, icon: '🏆', color: 'text-yellow-400' };
  };

  // Calculate stats
  const totalSessions = mockFavorites.reduce((sum, s) => sum + s.completedCount, 0);
  const avgRating = mockFavorites.reduce((sum, s) => sum + s.rating, 0) / mockFavorites.length;
  const treasuresCount = mockFavorites.length;
  const pinnedCount = mockFavorites.filter(s => s.isPinned).length;

  if (isLoading || !user) {
    return (
      <PageShell
        body={
          <div className="h-full bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-rose-400/20 border-t-rose-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60 text-sm">Loading your treasures...</p>
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
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-rose-500/10 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
            <div className="px-4 space-y-6">
              
              {/* Favorites Header */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 border-2 border-rose-500/40 flex items-center justify-center">
                    <Heart size={24} className="text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white text-2xl font-light mb-1">Mind Vault</h2>
                    <p className="text-white/70">Your most transformative sessions</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-rose-400 text-xl font-bold">{treasuresCount}</div>
                    <div className="text-white/60 text-xs">Treasures</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-orange-400 text-xl font-bold">{totalSessions}</div>
                    <div className="text-white/60 text-xs">Sessions</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-yellow-400 text-xl font-bold">{avgRating.toFixed(1)}</div>
                    <div className="text-white/60 text-xs">Avg Rating</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-purple-400 text-xl font-bold">{pinnedCount}</div>
                    <div className="text-white/60 text-xs">Pinned</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <BarChart3 size={20} className="text-purple-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Analytics</h4>
                  <p className="text-white/70 text-sm">View insights</p>
                </button>

                <button
                  className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/30 hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Crown size={20} className="text-yellow-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Premium</h4>
                  <p className="text-white/70 text-sm">Unlock more</p>
                </button>
              </div>

              {/* Favorite Sessions */}
              {mockFavorites.length > 0 ? (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Heart size={20} className="text-rose-400" />
                    <span>Your Treasures</span>
                  </h3>
                  <div className="space-y-3">
                    {mockFavorites.map((session) => (
                      <div key={session.id} className="bg-black/20 rounded-lg p-4 border border-white/10 hover:border-white/20 hover:bg-black/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400/20 to-purple-400/20 border border-white/20 flex items-center justify-center">
                              <span className="text-sm">{getEgoStateIcon(session.egoState)}</span>
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm flex items-center space-x-2">
                                <span>{session.name}</span>
                                {session.isPinned && <Pin size={12} className="text-yellow-400" />}
                              </div>
                              <div className="text-white/60 text-xs">
                                {session.duration}m • {formatLastCompleted(session.lastCompleted)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Star size={12} className="text-yellow-400 fill-current" />
                              <span className="text-white/70 text-xs">{session.rating}</span>
                            </div>
                            <button
                              onClick={() => onSessionSelect(session)}
                              className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center hover:bg-teal-500/30 hover:scale-110 transition-all"
                            >
                              <Play size={12} className="text-teal-400 ml-0.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                    <Heart size={28} className="text-rose-400" />
                  </div>
                  <h3 className="text-white text-xl font-medium mb-2">Your Mind Vault Awaits</h3>
                  <p className="text-white/70 mb-6">Complete sessions to create your collection of transformative experiences</p>
                  <button className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200">
                    Start Your First Session
                  </button>
                </div>
              )}

              {/* Session Insights */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                  <TrendingUp size={20} className="text-teal-400" />
                  <span>Session Insights</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/10">
                    <span className="text-white/70">Most Completed</span>
                    <span className="text-white font-medium">Healer Recovery (22x)</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/10">
                    <span className="text-white/70">Longest Streak</span>
                    <span className="text-white font-medium">Child Joy (5 days)</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/10">
                    <span className="text-white/70">Favorite Ego State</span>
                    <span className="text-white font-medium">Healer 🌿</span>
                  </div>
                </div>
              </div>

              {/* Achievements from Favorites */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                    <Award size={20} className="text-yellow-400" />
                    <span>Earned Badges</span>
                  </h3>
                  <span className="text-white/60 text-sm">3/25</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {['guardian-adept', 'healer-master', 'child-enthusiast'].map(badge => {
                    const badgeInfo = getBadgeInfo(badge);
                    return (
                      <div key={badge} className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                        <div className="text-2xl mb-2">{badgeInfo.icon}</div>
                        <div className={`text-xs font-medium ${badgeInfo.color}`}>{badgeInfo.name.split(' ')[0]}</div>
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-white/70 text-sm mt-4">Complete more sessions to unlock rare badges and titles</p>
              </div>
            </div>
          </div>
        }
      />

      {/* Analytics Modal */}
      {showAnalytics && (
        <ModalShell
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          title="Favorites Analytics"
          className="max-w-lg"
        >
          <div className="space-y-6">
            {/* Top Performing Sessions */}
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
              <h3 className="text-white font-medium mb-3">Top Performers</h3>
              <div className="space-y-2">
                {mockFavorites.slice(0, 3).map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-teal-400 font-bold text-sm">#{index + 1}</span>
                      <span className="text-white/80 text-sm">{session.name}</span>
                    </div>
                    <span className="text-white/60 text-sm">{session.completedCount} sessions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ego State Breakdown */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
              <h3 className="text-white font-medium mb-3">Ego State Breakdown</h3>
              <div className="space-y-2">
                {['healer', 'guardian', 'child', 'explorer'].map((state, index) => {
                  const count = mockFavorites.filter(s => s.egoState === state).length;
                  const percentage = Math.round((count / mockFavorites.length) * 100);
                  
                  return (
                    <div key={state} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getEgoStateIcon(state)}</span>
                        <span className="text-white/80 text-sm capitalize">{state}</span>
                      </div>
                      <span className="text-white/60 text-sm">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <ModalShell
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={selectedSession.name}
          className="max-w-lg"
          footer={
            <div className="flex space-x-3">
              <button className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105">
                Share Session
              </button>
              <button
                onClick={() => {
                  onSessionSelect(selectedSession);
                  setSelectedSession(null);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-teal-400/30"
              >
                Begin Journey
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Session Overview */}
            <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl p-4 border border-rose-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-black/30 border border-white/20 flex items-center justify-center">
                  <span className="text-lg">{getEgoStateIcon(selectedSession.egoState)}</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Session Details</h4>
                  <p className="text-white/70 text-sm capitalize">{selectedSession.egoState} • {selectedSession.action}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedSession.duration}m</div>
                  <div className="text-white/60 text-xs">Duration</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedSession.completedCount}</div>
                  <div className="text-white/60 text-xs">Times</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedSession.rating}</div>
                  <div className="text-white/60 text-xs">Rating</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedSession.streak}</div>
                  <div className="text-white/60 text-xs">Streak</div>
                </div>
              </div>
            </div>
            
            {/* Badges */}
            {selectedSession.badges.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20">
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Award size={16} className="text-yellow-400" />
                  <span>Earned Badges</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.badges.map(badge => {
                    const badgeInfo = getBadgeInfo(badge);
                    return (
                      <div key={badge} className="flex items-center space-x-2 bg-black/30 rounded-lg px-3 py-2 border border-yellow-500/30">
                        <span className="text-sm">{badgeInfo.icon}</span>
                        <span className={`text-sm font-medium ${badgeInfo.color}`}>{badgeInfo.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}