import React from 'react';
import { Heart, Play, Clock, Trash2, Star } from 'lucide-react';
import { useGameState } from '../components/GameStateManager';

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
  },
  {
    id: '4',
    name: 'Healer Sleep Prep',
    egoState: 'healer',
    action: 'sleep-prep',
    duration: 12,
    completedCount: 6,
    lastCompleted: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    rating: 4
  }
];

interface FavoritesProps {
  onSessionSelect: (session: FavoriteSession) => void;
}

export default function Favorites({ onSessionSelect }: FavoritesProps) {
  const { user } = useGameState();

  const formatLastCompleted = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Now';
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d';
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return '1w+';
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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-white text-xl font-light truncate">Favorites</h1>
          <p className="text-white/60 text-xs truncate">Your most effective sessions</p>
        </div>
        <Heart size={20} className="text-pink-400" />
      </div>

      {/* Stats Overview */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
            <div className="text-teal-400 text-lg font-semibold">{user.level}</div>
            <div className="text-white/60 text-xs">Level</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
            <div className="text-orange-400 text-lg font-semibold">{user.sessionStreak}</div>
            <div className="text-white/60 text-xs">Streak</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/10 text-center">
            <div className="text-purple-400 text-lg font-semibold">{mockFavorites.length}</div>
            <div className="text-white/60 text-xs">Saved</div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-3">
        <div className="grid h-full grid-rows-[1fr_auto] gap-3">
          {/* Cards grid - fixed 2 rows max */}
          <div className="grid gap-3 grid-rows-2 grid-flow-col auto-cols-[minmax(280px,1fr)] overflow-hidden">
            {mockFavorites.slice(0, 4).map((session) => (
              <div
                key={session.id}
                className={`bg-gradient-to-br ${getEgoStateColor(session.egoState)} backdrop-blur-md rounded-xl p-3 border border-white/10 h-full flex flex-col justify-between`}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{getEgoStateIcon(session.egoState)}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{session.name}</h3>
                        
                        <div className="flex items-center space-x-3 text-white/50 text-xs mb-1">
                          <div className="flex items-center space-x-1">
                            <Clock size={10} />
                            <span>{session.duration}m</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart size={10} />
                            <span>{session.completedCount}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={10}
                                className={star <= session.rating ? 'text-yellow-400 fill-current' : 'text-white/20'}
                              />
                            ))}
                          </div>
                          <span className="text-white/40 text-xs">
                            {formatLastCompleted(session.lastCompleted)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => onSessionSelect(session)}
                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                      >
                        <Play size={12} className="text-white ml-0.5" />
                      </button>
                      
                      <button className="w-8 h-8 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all duration-300">
                        <Trash2 size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((session.completedCount / 20) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer row */}
          {mockFavorites.length > 4 && (
            <div className="flex items-center justify-center pt-2 flex-shrink-0">
              <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm">
                View All Favorites
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}