import React, { useState, useRef } from 'react';
import { Heart, Play, Clock, Trash2, Star, Filter, TrendingUp, Award, Flame, Crown, ChevronDown, Pin, Share2, Target, Sparkles, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Enhanced mock data with badges and streaks
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
    id: '4',
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
    id: '5',
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
    id: '6',
    name: 'Sage Wisdom',
    egoState: 'sage',
    action: 'clarity',
    duration: 20,
    completedCount: 11,
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 4,
    streak: 0,
    isPinned: false,
    badges: []
  },
  {
    id: '7',
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
  },
  {
    id: '8',
    name: 'Rebel Freedom',
    egoState: 'rebel',
    action: 'liberation',
    duration: 14,
    completedCount: 6,
    lastCompleted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    rating: 4,
    streak: 0,
    isPinned: false,
    badges: []
  },
  {
    id: '9',
    name: 'Shadow Integration',
    egoState: 'shadow',
    action: 'shadow-work',
    duration: 25,
    completedCount: 4,
    lastCompleted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    rating: 5,
    streak: 0,
    isPinned: false,
    badges: []
  },
  {
    id: '10',
    name: 'Mystic Transcendence',
    egoState: 'mystic',
    action: 'spirituality',
    duration: 18,
    completedCount: 18,
    lastCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    rating: 5,
    streak: 0,
    isPinned: false,
    badges: ['mystic-adept']
  }
];

type SortOption = 'recent' | 'popular' | 'rating' | 'state';

interface FavoritesScreenProps {
  onSessionSelect: (session: FavoriteSession) => void;
}

export default function FavoritesScreen({ onSessionSelect }: FavoritesScreenProps) {
  const { user, isLoading } = useGameState();
  const { activeEgoState } = useAppStore();
  const [selectedSession, setSelectedSession] = useState<FavoriteSession | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <PageShell
        header={
          <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
            <div className="px-4 pt-2 pb-4">
              <h1 className="text-white text-xl font-light mb-2 bg-gradient-to-r from-white to-rose-400 bg-clip-text text-transparent">Mind Vault</h1>
              <p className="text-white/70 text-sm mb-4">Loading your transformative sessions...</p>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center animate-pulse">
                    <div className="bg-white/20 h-6 w-8 rounded mx-auto mb-2"></div>
                    <div className="bg-white/10 h-3 w-12 rounded mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        body={
          <div className="bg-black relative min-h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-rose-500/30 animate-pulse">
                <Heart size={32} className="text-rose-400" />
              </div>
              <h3 className="text-white/80 text-xl font-medium mb-4">Loading Your Mind Vault...</h3>
              <p className="text-white/50 mb-6 max-w-sm">Preparing your collection of transformative experiences</p>
            </div>
          </div>
        }
      />
    );
  }

  // Sort sessions
  const sortedFavorites = [...mockFavorites].sort((a, b) => {
    // Pinned sessions always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch (sortBy) {
      case 'recent':
        return b.lastCompleted.getTime() - a.lastCompleted.getTime();
      case 'popular':
        return b.completedCount - a.completedCount;
      case 'rating':
        return b.rating - a.rating;
      case 'state':
        return a.egoState.localeCompare(b.egoState);
      default:
        return 0;
    }
  });

  const cardsPerView = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : window.innerWidth < 1280 ? 3 : 4;
  const totalPages = Math.ceil(sortedFavorites.length / cardsPerView);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const cardWidth = window.innerWidth < 768 ? 320 : 300;
      scrollContainerRef.current.scrollBy({
        left: -cardWidth - 16, // card width + gap
        behavior: 'smooth'
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const cardWidth = window.innerWidth < 768 ? 320 : 300;
      scrollContainerRef.current.scrollBy({
        left: cardWidth + 16, // card width + gap
        behavior: 'smooth'
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.scrollWidth / totalPages;
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
    }
    setTimeout(updateScrollButtons, 300);
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
      guardian: 'from-blue-500/20 via-blue-600/15 to-blue-700/20 border-blue-500/30',
      rebel: 'from-red-500/20 via-red-600/15 to-red-700/20 border-red-500/30',
      healer: 'from-green-500/20 via-green-600/15 to-green-700/20 border-green-500/30',
      explorer: 'from-yellow-500/20 via-yellow-600/15 to-yellow-700/20 border-yellow-500/30',
      mystic: 'from-purple-500/20 via-purple-600/15 to-purple-700/20 border-purple-500/30',
      sage: 'from-gray-400/20 via-gray-500/15 to-gray-600/20 border-gray-400/30',
      child: 'from-orange-500/20 via-orange-600/15 to-orange-700/20 border-orange-500/30',
      performer: 'from-pink-500/20 via-pink-600/15 to-pink-700/20 border-pink-500/30',
      shadow: 'from-indigo-500/20 via-indigo-700/15 to-indigo-900/20 border-indigo-500/30',
      builder: 'from-gray-600/20 via-orange-500/15 to-orange-600/20 border-orange-500/30'
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

  const getPersonalInsights = () => {
    const totalSessions = mockFavorites.reduce((sum, s) => sum + s.completedCount, 0);
    const avgRating = mockFavorites.reduce((sum, s) => sum + s.rating, 0) / mockFavorites.length;
    const topState = mockFavorites.reduce((prev, current) => 
      prev.completedCount > current.completedCount ? prev : current
    );
    const masteredStates = new Set(mockFavorites.filter(s => s.completedCount >= 10).map(s => s.egoState)).size;
    
    return { totalSessions, avgRating, topState, masteredStates };
  };

  const insights = getPersonalInsights();

  const renderSessionCard = (session: FavoriteSession) => (
    <div 
      className={`relative bg-gradient-to-br ${getEgoStateColor(session.egoState)} backdrop-blur-md rounded-2xl p-4 border transition-all duration-500 hover:border-white/50 hover:scale-[1.02] hover:shadow-2xl hover:shadow-current/20 flex flex-col justify-between h-full w-full group cursor-pointer overflow-hidden`}
      onClick={() => setSelectedSession(session)}
      style={{ 
        minHeight: '280px',
        background: `
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
          ${getEgoStateColor(session.egoState).includes('from-') ? 
            `linear-gradient(135deg, ${getEgoStateColor(session.egoState).replace('from-', '').replace(' via-', ', ').replace(' to-', ', ').replace(' border-', '')})`
            : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'}
        `
      }}
    >
      {/* Orb Glow Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
        <div className={`absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${
          session.egoState === 'guardian' ? 'bg-blue-400' :
          session.egoState === 'rebel' ? 'bg-red-400' :
          session.egoState === 'healer' ? 'bg-green-400' :
          session.egoState === 'explorer' ? 'bg-yellow-400' :
          session.egoState === 'mystic' ? 'bg-purple-400' :
          session.egoState === 'child' ? 'bg-orange-400' :
          session.egoState === 'builder' ? 'bg-orange-400' :
          'bg-white'
        } animate-pulse`} />
      </div>

      {/* Pinned Indicator */}
      {session.isPinned && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full border-2 border-black flex items-center justify-center animate-pulse z-20">
          <Pin size={12} className="text-black" />
        </div>
      )}

      {/* Streak Fire */}
      {session.streak >= 3 && (
        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 border border-orange-500/40 z-20">
          <Flame size={12} className="text-orange-400" />
          <span className="text-orange-400 text-xs font-bold">{session.streak}</span>
        </div>
      )}

      {/* Badge */}
      {session.badges.length > 0 && (
        <div className="absolute top-2 right-2 z-20">
          {session.badges.slice(0, 1).map(badge => {
            const badgeInfo = getBadgeInfo(badge);
            return (
              <div key={badge} className="w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full border border-yellow-500/40 flex items-center justify-center">
                <span className="text-xs">{badgeInfo.icon}</span>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Header with ego state and buttons */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 relative z-10">
        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 group-hover:border-white/50 transition-all duration-300 shadow-lg">
          <span className="text-lg">{getEgoStateIcon(session.egoState)}</span>
        </div>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSessionSelect(session);
            }}
            className="w-10 h-10 rounded-full bg-teal-500/30 backdrop-blur-sm border border-teal-400/50 flex items-center justify-center hover:bg-teal-500/50 hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-teal-400/30"
          >
            <Play size={16} className="text-teal-300 ml-0.5" />
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-purple-500/30 backdrop-blur-sm border border-purple-400/50 flex items-center justify-center hover:bg-purple-500/50 hover:scale-110 transition-all duration-300"
          >
            <Share2 size={16} className="text-purple-300" />
          </button>
          <button 
            onClick={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-full bg-red-500/30 backdrop-blur-sm border border-red-400/50 flex items-center justify-center hover:bg-red-500/50 hover:scale-110 transition-all duration-300"
          >
            <Trash2 size={16} className="text-red-300" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white font-bold text-base lg:text-lg mb-4 line-clamp-2 flex-1 min-h-0 group-hover:text-white/95 transition-colors leading-tight">{session.name}</h3>
      
      {/* Stats Row */}
      <div className="flex items-center justify-between text-white/60 text-xs mb-3 flex-shrink-0">
        <div className="flex items-center space-x-1">
          <Clock size={14} className="text-current" />
          <span className="font-medium">{session.duration}m</span>
        </div>
        <div className="flex items-center space-x-1">
          <Target size={14} className="text-current" />
          <span className="font-medium">{session.completedCount}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Heart size={14} className="text-rose-400" />
          <span className="font-medium text-rose-400">{session.rating}.0</span>
        </div>
      </div>
      
      {/* Rating Stars */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={`transition-all duration-300 ${
                star <= session.rating 
                  ? 'text-yellow-400 fill-current drop-shadow-sm' 
                  : 'text-white/20'
              }`}
            />
          ))}
        </div>
        <span className="text-white/50 text-xs font-medium">
          {formatLastCompleted(session.lastCompleted)}
        </span>
      </div>

      {/* Enhanced Progress Bar */}
      <div className="w-full flex-shrink-0">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-white/40">Progress</span>
          <span className="text-white/60 font-medium">{Math.min((session.completedCount / 20) * 100, 100).toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-purple-400 rounded-full transition-all duration-700 relative overflow-hidden"
            style={{ width: `${Math.min((session.completedCount / 20) * 100, 100)}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-pulse" style={{ animation: 'shimmer 2s infinite' }} />
          </div>
        </div>
      </div>
    </div>
  );

  // Get mastered states
  const getMasteredStates = () => {
    const stateGroups: { [key: string]: FavoriteSession[] } = {};
    mockFavorites.forEach(session => {
      if (!stateGroups[session.egoState]) stateGroups[session.egoState] = [];
      stateGroups[session.egoState].push(session);
    });
    return Object.keys(stateGroups).length;
  };

  const treasuresCount = mockFavorites.length;
  const masteredStates = getMasteredStates();

  // Update scroll buttons on mount and resize
  React.useEffect(() => {
    updateScrollButtons();
    
    const handleResize = () => {
      updateScrollButtons();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sortedFavorites]);

  const header = (
    <div className="bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-white text-xl font-light mb-2 bg-gradient-to-r from-white to-rose-400 bg-clip-text text-transparent">Mind Vault</h1>
        <p className="text-white/70 text-sm mb-4">Your most transformative sessions</p>
        
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-md rounded-xl p-3 border border-teal-500/30 text-center hover:border-teal-400/50 transition-all duration-300 hover:scale-105 group">
            <div className="text-teal-400 text-xl font-bold group-hover:scale-110 transition-transform">{user.level}</div>
            <div className="text-teal-300/80 text-xs font-medium">Level</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-md rounded-xl p-3 border border-orange-500/30 text-center hover:border-orange-400/50 transition-all duration-300 hover:scale-105 group">
            <div className="text-orange-400 text-xl font-bold group-hover:scale-110 transition-transform">{user.session_streak}</div>
            <div className="text-orange-300/80 text-xs font-medium">Streak</div>
          </div>
          <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-md rounded-xl p-3 border border-rose-500/30 text-center hover:border-rose-400/50 transition-all duration-300 hover:scale-105 group">
            <div className="text-rose-400 text-xl font-bold group-hover:scale-110 transition-transform">{treasuresCount}</div>
            <div className="text-rose-300/80 text-xs font-medium">Treasures</div>
          </div>
        </div>
      </div>
      
      {/* Sort Controls */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white/60 text-sm font-medium">Sort by:</span>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white/80 hover:text-white transition-all duration-300 hover:scale-105"
              >
                <span className="text-sm font-medium capitalize">
                  {sortBy === 'recent' ? 'Most Recent' :
                   sortBy === 'popular' ? 'Most Played' :
                   sortBy === 'rating' ? 'Highest Rated' :
                   'Ego State'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl shadow-black/40 z-50">
                  {[
                    { id: 'recent', label: 'Most Recent', icon: Clock },
                    { id: 'popular', label: 'Most Played', icon: TrendingUp },
                    { id: 'rating', label: 'Highest Rated', icon: Star },
                    { id: 'state', label: 'Ego State', icon: Target }
                  ].map(option => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id as SortOption);
                          setShowSortMenu(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                          sortBy === option.id ? 'text-teal-400 bg-teal-500/10' : 'text-white/80'
                        }`}
                      >
                        <IconComponent size={16} />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-white/50 text-sm">
            {sortedFavorites.length} session{sortedFavorites.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="bg-black relative min-h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950/20 via-black to-purple-950/20" />
      <div className="relative z-10 min-h-full flex flex-col">
        
        {mockFavorites.length > 0 ? (
          <>
            {/* Desktop Grid Layout */}
            <div className="hidden lg:block flex-1 px-4 pb-4">
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 py-4">
                {sortedFavorites.map((session) => (
                  <div key={session.id} className="h-[300px]">
                    {renderSessionCard(session)}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet Horizontal Scrolling */}
            <div className="lg:hidden flex-1 px-4 relative">
              {/* Left Arrow */}
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-black/90 hover:border-white/40 shadow-lg ${
                  canScrollLeft ? 'opacity-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'
                }`}
                style={{ 
                  boxShadow: canScrollLeft ? '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                }}
              >
                <ChevronLeft size={20} className="text-white ml-0.5" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-black/90 hover:border-white/40 shadow-lg ${
                  canScrollRight ? 'opacity-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'
                }`}
                style={{ 
                  boxShadow: canScrollRight ? '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)' : 'none'
                }}
              >
                <ChevronRight size={20} className="text-white mr-0.5" />
              </button>

              <div 
                ref={scrollContainerRef}
                className="flex gap-4 h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory py-4"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  overscrollBehavior: 'contain'
                }}
                onScroll={updateScrollButtons}
              >
                {sortedFavorites.map((session) => (
                  <div
                    key={session.id}
                    className="flex-shrink-0 snap-center"
                    style={{ 
                      width: window.innerWidth < 768 ? 'calc(100vw - 3rem)' : 'calc(50% - 1rem)',
                      maxWidth: window.innerWidth < 768 ? '320px' : '300px',
                      height: '280px'
                    }}
                  >
                    {renderSessionCard(session)}
                  </div>
                ))}
              </div>
              
              {/* Mobile Pagination Dots */}
              <div className="flex items-center justify-center space-x-2 py-3">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                      index === currentIndex ? 'bg-teal-400 scale-125 shadow-lg shadow-teal-400/50' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Insights Section - Hidden on Small Screens */}
            <div className="hidden lg:block bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-t border-violet-500/20 p-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 size={20} className="text-violet-400" />
                  <h3 className="text-white font-semibold">Patterns in Your Mind Vault</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-2xl font-bold text-violet-400 mb-1">{insights.totalSessions}</div>
                    <div className="text-white/70 text-sm">Total Sessions</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-2xl font-bold text-amber-400 mb-1">{insights.avgRating.toFixed(1)}</div>
                    <div className="text-white/70 text-sm">Avg Rating</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-2xl font-bold text-emerald-400 mb-1">{masteredStates}</div>
                    <div className="text-white/70 text-sm">States Mastered</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="text-lg">{getEgoStateIcon(insights.topState.egoState)}</div>
                    <div className="text-white/70 text-sm">Favorite State</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                <Heart size={32} className="text-rose-400" />
              </div>
              <h3 className="text-white/80 text-xl font-medium mb-4">Your Mind Vault Awaits</h3>
              <p className="text-white/50 mb-6 max-w-sm">Complete sessions to create your collection of transformative experiences</p>
              <button className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200">
                Start Your First Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <PageShell
        header={header}
        body={body}
      />

      {/* Sort Menu Backdrop */}
      {showSortMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSortMenu(false)}
        />
      )}

      {/* Enhanced Session Details Modal */}
      <ModalShell
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.name || ''}
        className="max-w-lg overflow-y-auto"
        footer={
          <div className="flex space-x-3">
            <button className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105">
              Share Session
            </button>
            <button
              onClick={() => {
                if (selectedSession) {
                  onSessionSelect(selectedSession);
                  setSelectedSession(null);
                }
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-teal-400/30"
            >
              Begin Journey
            </button>
          </div>
        }
      >
        {selectedSession && (
          <div className="space-y-6 overflow-y-auto">
            {/* Session Overview */}
            <div className={`bg-gradient-to-br ${getEgoStateColor(selectedSession.egoState)} rounded-2xl p-6 border border-white/30 relative overflow-hidden`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">{getEgoStateIcon(selectedSession.egoState)}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-1">{selectedSession.name}</h3>
                  <p className="text-white/80 text-sm capitalize">{selectedSession.egoState} • {selectedSession.action}</p>
                </div>
              </div>
              
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                  <div className="text-white text-lg font-bold">{selectedSession.duration}m</div>
                  <div className="text-white/60 text-xs">Duration</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                  <div className="text-white text-lg font-bold">{selectedSession.completedCount}</div>
                  <div className="text-white/60 text-xs">Completed</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= selectedSession.rating ? 'text-yellow-400 fill-current' : 'text-white/20'}
                      />
                    ))}
                  </div>
                  <div className="text-white/60 text-xs">Rating</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                  <div className="text-white text-lg font-bold">{selectedSession.streak || 0}</div>
                  <div className="text-white/60 text-xs">Streak</div>
                </div>
              </div>
            </div>
            
            {/* Badges Section */}
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
                        <span className="text-lg">{badgeInfo.icon}</span>
                        <span className={`text-sm font-medium ${badgeInfo.color}`}>{badgeInfo.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Session History */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Session History</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Last Completed</span>
                  <span className="text-white font-medium">{formatLastCompleted(selectedSession.lastCompleted)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Success Rate</span>
                  <span className="text-green-400 font-medium">95%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Average Depth</span>
                  <span className="text-purple-400 font-medium">Level 4.2</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </>
  );
}