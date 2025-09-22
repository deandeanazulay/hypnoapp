import React from 'react';
import { Heart, Play, Clock, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
    id: '4',
    name: 'Healer Recovery',
    egoState: 'healer',
    action: 'healing',
    duration: 12,
    completedCount: 9,
    lastCompleted: new Date(Date.now() - 5 * 60 * 60 * 1000),
    rating: 4
  },
  {
    id: '5',
    name: 'Explorer Adventure',
    egoState: 'explorer',
    action: 'creativity',
    duration: 8,
    completedCount: 7,
    lastCompleted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    rating: 5
  },
  {
    id: '6',
    name: 'Sage Wisdom',
    egoState: 'sage',
    action: 'clarity',
    duration: 20,
    completedCount: 11,
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 4
  },
  {
    id: '7',
    name: 'Child Joy',
    egoState: 'child',
    action: 'happiness',
    duration: 6,
    completedCount: 18,
    lastCompleted: new Date(Date.now() - 30 * 60 * 1000),
    rating: 5
  },
  {
    id: '8',
    name: 'Rebel Freedom',
    egoState: 'rebel',
    action: 'liberation',
    duration: 14,
    completedCount: 6,
    lastCompleted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    rating: 4
  },
  {
    id: '9',
    name: 'Shadow Integration',
    egoState: 'shadow',
    action: 'shadow-work',
    duration: 25,
    completedCount: 4,
    lastCompleted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    rating: 5
  },
  {
    id: '10',
    name: 'Guardian Protection',
    egoState: 'guardian',
    action: 'safety',
    duration: 11,
    completedCount: 13,
    lastCompleted: new Date(Date.now() - 4 * 60 * 60 * 1000),
    rating: 4
  },
  {
    id: '11',
    name: 'Mystic Transcendence',
    egoState: 'mystic',
    action: 'spirituality',
    duration: 18,
    completedCount: 5,
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 5
  },
  {
    id: '12',
    name: 'Performer Charisma',
    egoState: 'performer',
    action: 'magnetism',
    duration: 9,
    completedCount: 16,
    lastCompleted: new Date(Date.now() - 1 * 60 * 60 * 1000),
    rating: 4
  },
  {
    id: '13',
    name: 'Healer Compassion',
    egoState: 'healer',
    action: 'love',
    duration: 13,
    completedCount: 8,
    lastCompleted: new Date(Date.now() - 6 * 60 * 60 * 1000),
    rating: 5
  },
  {
    id: '14',
    name: 'Explorer Discovery',
    egoState: 'explorer',
    action: 'curiosity',
    duration: 7,
    completedCount: 10,
    lastCompleted: new Date(Date.now() - 8 * 60 * 60 * 1000),
    rating: 4
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
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 9; // 3 columns × 3 rows
  
  const totalPages = Math.ceil(mockFavorites.length / itemsPerPage);
  const currentPageFavorites = mockFavorites.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

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
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pt-4 pb-3 px-6">
          <h1 className="text-white text-3xl font-light mb-2">Favorites</h1>
          <p className="text-white/60 text-lg">Your most effective sessions</p>
        </div>

        {/* Stats Overview */}
        <div className="flex-shrink-0 px-6 mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-teal-500/30 transition-all duration-300">
              <div className="text-teal-400 text-2xl font-semibold">{user.level}</div>
              <div className="text-white/60 text-sm">Level</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-orange-500/30 transition-all duration-300">
              <div className="text-orange-400 text-2xl font-semibold">{user.sessionStreak}</div>
              <div className="text-white/60 text-sm">Streak</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center hover:border-purple-500/30 transition-all duration-300">
              <div className="text-purple-400 text-2xl font-semibold">{mockFavorites.length}</div>
              <div className="text-white/60 text-sm">Saved</div>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        <div className="flex-1 px-6 min-h-0 flex flex-col">
          {mockFavorites.length > 0 ? (
            <>
              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 grid-rows-3 gap-4 flex-1 min-h-0">
                {currentPageFavorites.map((session) => (
                  <div
                    key={session.id}
                    className={`bg-gradient-to-br ${getEgoStateColor(session.egoState)} backdrop-blur-md rounded-xl p-4 border border-white/20 transition-all duration-300 hover:border-white/40 hover:scale-105 hover:shadow-xl flex flex-col justify-between min-h-0`}
                  >
                    {/* Header with ego state and buttons */}
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <span className="text-lg">{getEgoStateIcon(session.egoState)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSessionSelect(session)}
                          className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20"
                        >
                          <Play size={12} className="text-white ml-0.5" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all duration-300 hover:scale-110">
                          <Trash2 size={12} className="text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 flex-1 min-h-0">{session.name}</h3>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-white/50 text-sm mb-2 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <Clock size={12} />
                        <span>{session.duration}m</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart size={12} />
                        <span>{session.completedCount}</span>
                      </div>
                    </div>
                    
                    {/* Rating and last completed */}
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={10}
                            className={star <= session.rating ? 'text-yellow-400 fill-current' : 'text-white/20'}
                          />
                        ))}
                      </div>
                      <span className="text-white/40 text-xs truncate ml-2">
                        {formatLastCompleted(session.lastCompleted)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((session.completedCount / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Navigation arrows and page dots */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 mt-6 pb-4 flex-shrink-0">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/10"
                  >
                    <ChevronLeft size={16} className="text-white" />
                  </button>
                  
                  {/* Page dots */}
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentPage ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/10"
                  >
                    <ChevronRight size={16} className="text-white" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Heart size={48} className="text-white/20 mx-auto mb-4" />
                <h3 className="text-white/60 text-xl font-medium mb-2">No favorites yet</h3>
                <p className="text-white/40 text-lg">Complete sessions to add them to favorites</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}