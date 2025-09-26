import React, { useState, useEffect } from 'react';
import { Heart, Play, Clock, Star, Trash2, Calendar, Trophy, TrendingUp } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { supabase } from '../../lib/supabase';

interface Session {
  id: string;
  user_id: string;
  ego_state: string;
  action: string;
  duration: number;
  experience_gained: number;
  completed_at: string;
}

interface FavoriteSession {
  id: string;
  name: string;
  egoState: string;
  action: string;
  duration: number;
  rating: number;
  completedCount: number;
  lastCompleted: Date;
  badges: string[];
}

interface FavoritesModalProps {
  onSessionSelect: (session: FavoriteSession) => void;
}

export default function FavoritesModal({ onSessionSelect }: FavoritesModalProps) {
  const { modals, closeModal, showToast } = useAppStore();
  const { user } = useGameState();
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'best'>('all');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Fetch sessions when modal opens
  useEffect(() => {
    const fetchSessions = async () => {
      if (!isAuthenticated || !user?.id || !modals.favorites) return;
      
      setSessionsLoading(true);
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching sessions:', error);
          showToast({ type: 'error', message: 'Failed to load sessions' });
          setSessions([]);
        } else {
          setSessions(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setSessions([]);
        showToast({ type: 'error', message: 'Failed to load sessions' });
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessions();
  }, [isAuthenticated, user?.id, modals.favorites, showToast]);

  const handleSessionDelete = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id); // Additional security check

      if (error) {
        console.error('Error deleting session:', error);
        showToast({ type: 'error', message: 'Failed to delete session' });
      } else {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        showToast({ type: 'success', message: 'Session removed from favorites' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to delete session' });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleSessionStart = (session: Session) => {
    const favoriteSession: FavoriteSession = {
      id: session.id,
      name: session.action,
      egoState: session.ego_state,
      action: session.action,
      duration: session.duration,
      rating: session.experience_gained / 10,
      completedCount: 1,
      lastCompleted: new Date(session.completed_at),
      badges: []
    };
    
    onSessionSelect(favoriteSession);
    closeModal('favorites');
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
      builder: '🛠️',
      seeker: '🔭',
      lover: '💞',
      trickster: '🃏',
      warrior: '⚔️',
      visionary: '🌌'
    };
    return iconMap[egoState] || '⭐';
  };

  const getFilteredSessions = () => {
    let filtered = sessions;
    
    switch (selectedFilter) {
      case 'recent':
        filtered = sessions.slice(0, 10);
        break;
      case 'best':
        filtered = sessions
          .filter(s => s.experience_gained >= 8) // High XP sessions
          .sort((a, b) => b.experience_gained - a.experience_gained);
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const formatLastCompleted = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredSessions = getFilteredSessions();

  return (
    <ModalShell
      isOpen={modals.favorites}
      onClose={() => closeModal('favorites')}
      title="Mind Vault"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 rounded-xl p-4 border border-rose-500/20">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 border-2 border-rose-500/40 flex items-center justify-center">
              <Heart size={20} className="text-black" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Your Transformation Treasures</h3>
              <p className="text-white/70 text-sm">Sessions that shaped your journey</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-black/20 rounded-lg p-3 border border-white/10">
              <div className="text-rose-400 text-xl font-bold">{sessions.length}</div>
              <div className="text-white/60 text-xs">Total Sessions</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 border border-white/10">
              <div className="text-orange-400 text-xl font-bold">
                {sessions.length > 0 ? (sessions.reduce((sum, s) => sum + s.experience_gained, 0) / sessions.length).toFixed(1) : '0.0'}
              </div>
              <div className="text-white/60 text-xs">Avg XP</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 border border-white/10">
              <div className="text-purple-400 text-xl font-bold">
                {sessions.length > 0 ? Math.max(...sessions.map(s => s.experience_gained)) : 0}
              </div>
              <div className="text-white/60 text-xs">Best XP</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {[
            { id: 'all', name: 'All Sessions', icon: Calendar },
            { id: 'recent', name: 'Recent', icon: Clock },
            { id: 'best', name: 'Best Rated', icon: Trophy }
          ].map((filter) => {
            const IconComponent = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 ${
                  selectedFilter === filter.id
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-400'
                    : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                }`}
              >
                <IconComponent size={16} />
                <span className="text-sm font-medium">{filter.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sessions List */}
        {sessionsLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-rose-400/20 border-t-rose-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Loading your sessions...</p>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400/20 to-purple-400/20 border border-white/20 flex items-center justify-center">
                      <span className="text-lg">{getEgoStateIcon(session.ego_state)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-medium">{session.action}</h4>
                        <div className="flex items-center space-x-1">
                          <Star size={12} className="text-yellow-400 fill-current" />
                          <span className="text-yellow-400 text-xs font-medium">{(session.experience_gained / 10).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-white/60 text-xs">
                        <span className="capitalize">{session.ego_state}</span>
                        <div className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{session.duration}m</span>
                        </div>
                        <span>{formatLastCompleted(session.completed_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSessionStart(session)}
                      className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center hover:bg-teal-500/30 hover:scale-110 transition-all"
                    >
                      <Play size={14} className="text-teal-400 ml-0.5" />
                    </button>
                    <button
                      onClick={() => handleSessionDelete(session.id)}
                      disabled={deletingSessionId === session.id}
                      className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/30 hover:scale-110 transition-all disabled:opacity-50"
                    >
                      {deletingSessionId === session.id ? (
                        <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} className="text-red-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <Heart size={28} className="text-rose-400" />
            </div>
            <h3 className="text-white text-xl font-medium mb-2">Your Mind Vault Awaits</h3>
            <p className="text-white/70 mb-6">Complete sessions to create your collection of transformative experiences</p>
            <button 
              onClick={() => closeModal('favorites')}
              className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
            >
              Start Your First Session
            </button>
          </div>
        )}

        {/* Session Insights */}
        {sessions.length > 0 && (
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
            <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
              <TrendingUp size={16} className="text-teal-400" />
              <span>Session Insights</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                <div className="text-white font-bold text-lg">{sessions.length}</div>
                <div className="text-white/60 text-xs">Total Completed</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                <div className="text-white font-bold text-lg">
                  {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60) : 0}h
                </div>
                <div className="text-white/60 text-xs">Time Invested</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-white/10 text-center">
                <div className="text-white font-bold text-lg">
                  {sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.experience_gained, 0) : 0}
                </div>
                <div className="text-white/60 text-xs">Total XP Earned</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}