import React from 'react';
import { Heart, Play, Clock, Trash2, Star } from 'lucide-react';
import { useGameState } from '../GameStateManager';

interface FavoriteSession {
  id: string;
  name: string;
  egoState: string;
  action: string;
  duration: number;
  completedCount: number;
  lastCompleted: Date;
  rating: number;
}

// Mock data - in real app this would come from storage/API
const mockFavorites: FavoriteSession[] = [
  {
    id: '1',
    name: 'Guardian Stress Relief',
    egoState: 'guardian',
    action: 'stress-relief',
    duration: 10,
    completedCount: 12,
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 5
  },
  {
    id: '2',
    name: 'Mystic Deep Rest',
    egoState: 'mystic',
    action: 'deep-rest',
    duration: 15,
    completedCount: 8,
    lastCompleted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    rating: 4
  },
  {
    id: '3',
    name: 'Performer Confidence',
    egoState: 'performer',
    action: 'confidence-boost',
    duration: 10,
    completedCount: 15,
    lastCompleted: new Date(Date.now() - 3 * 60 * 60 * 1000),
    rating: 5
  }
];

interface FavoritesScreenProps {
  onSessionSelect: (session: FavoriteSession) => void;
}

export default function FavoritesScreen({ onSessionSelect }: FavoritesScreenProps) {
  const { user } = useGameState();

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

  const getEgoStateColor = (egoState: string) => {
    const colorMap: { [key: string]: string } = {
      guardian: 'from-blue-500/20 to-blue-600/20',
      rebel: 'from-red-500/20 to-red-600/20',
      healer: 'from-green-500/20 to-green-600/20',
      explorer: 'from-yellow-500/20 to-yellow-600/20',
      mystic: 'from-purple-500/20 to-purple-600/20',
      sage: 'from-gray-400/20 to-gray-500/20',
      child: 'from-orange-500/20 to-orange-600/20',
      performer: 'from-pink-500/20 to-pink-600/20',
      shadow: 'from-indigo-500/20 to-indigo-900/20'
    };
    return colorMap[egoState] || 'from-white/10 to-gray-500/10';
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
      shadow: '🌑'
    };
    return iconMap[egoState] || '⭐';
  };

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col pb-20">
        {/* Header */}
        <div className="flex-shrink-0 pt-12 pb-6 px-6">
          <h1 className="text-white text-2xl font-light mb-2">Favorites</h1>
          <p className="text-white/60 text-sm">Your most effective sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="flex-shrink-0 px-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-teal-400 text-lg font-semibold">{user.level}</div>
              <div className="text-white/60 text-xs">Level</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-orange-400 text-lg font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-xs">Streak</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
              <div className="text-purple-400 text-lg font-semibold">{mockFavorites.length}</div>
              <div className="text-white/60 text-xs">Saved</div>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {mockFavorites.length > 0 ? (
            mockFavorites.map((session) => (
              <div
                key={session.id}
                className={`bg-gradient-to-br ${getEgoStateColor(session.egoState)} backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-all duration-300 hover:border-white/20 hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <span className="text-lg">{getEgoStateIcon(session.egoState)}</span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-1">{session.name}</h3>
                      
                      <div className="flex items-center space-x-4 text-white/50 text-xs mb-2">
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{session.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart size={12} />
                          <span>{session.completedCount} times</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= session.rating ? 'text-yellow-400 fill-current' : 'text-white/20'}
                            />
                          ))}
                        </div>
                        <span className="text-white/40 text-xs">
                          Last: {formatLastCompleted(session.lastCompleted)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSessionSelect(session)}
                      className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
                    >
                      <Play size={14} className="text-white ml-0.5" />
                    </button>
                    
                    <button className="w-10 h-10 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all duration-300 hover:scale-105">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((session.completedCount / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Heart size={48} className="text-white/20 mx-auto mb-4" />
                <h3 className="text-white/60 text-lg font-medium mb-2">No favorites yet</h3>
                <p className="text-white/40 text-sm">Complete sessions to add them to favorites</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}