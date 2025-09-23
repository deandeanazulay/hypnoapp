import React from 'react';
import { Heart, Play, Clock, Trash2, Star } from 'lucide-react';
import { useGameState } from '../GameStateManager';
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
  const [selectedSession, setSelectedSession] = React.useState<FavoriteSession | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Mobile: show 1 card, Desktop: show 3 cards
  const cardsPerView = window.innerWidth < 768 ? 1 : 3;
  const totalPages = Math.ceil(mockFavorites.length / cardsPerView);

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.scrollWidth / totalPages;
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
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
      guardian: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      rebel: 'from-red-500/20 to-red-600/20 border-red-500/30',
      healer: 'from-green-500/20 to-green-600/20 border-green-500/30',
      explorer: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      mystic: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      sage: 'from-gray-400/20 to-gray-500/20 border-gray-400/30',
      child: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      performer: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
      shadow: 'from-indigo-500/20 to-indigo-900/20 border-indigo-500/30'
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

  const renderSessionCard = (session: FavoriteSession) => (
    <div className={`bg-gradient-to-br ${getEgoStateColor(session.egoState)} backdrop-blur-md rounded-xl p-4 border transition-all duration-300 hover:border-white/40 hover:scale-105 hover:shadow-xl flex flex-col justify-between h-full w-full group relative overflow-hidden cursor-pointer`}
    >
      {/* Recent Activity Indicator */}
      {formatLastCompleted(session.lastCompleted).includes('ago') && !formatLastCompleted(session.lastCompleted).includes('week') && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full border-2 border-black animate-pulse" />
      )}
      
      {/* Header with ego state and buttons */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="text-base">{getEgoStateIcon(session.egoState)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSelectedSession(session)}
            className="w-8 h-8 rounded-full bg-teal-500/20 backdrop-blur-sm border border-teal-500/40 flex items-center justify-center hover:bg-teal-500/30 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-teal-500/25 z-10"
          >
            <Play size={14} className="text-teal-400 ml-0.5" />
          </button>
          <button className="w-8 h-8 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all duration-300 hover:scale-110 z-10">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-sm lg:text-base mb-3 line-clamp-2 flex-1 min-h-0 group-hover:text-white/90 transition-colors">{session.name}</h3>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-white/50 text-xs mb-2 flex-shrink-0">
        <div className="flex items-center space-x-1">
          <Clock size={12} />
          <span>{session.duration}m</span>
        </div>
        <div className="flex items-center space-x-1">
          <Heart size={12} />
          <span>{session.completedCount}</span>
        </div>
      </div>
      
      {/* Rating and last completed */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center space-x-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={12}
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
          className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500 relative overflow-hidden"
          style={{ width: `${Math.min((session.completedCount / 20) * 100, 100)}%` }}
        >
          {/* Progress shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-pulse" />
        </div>
      </div>
    </div>
  );

  // Calculate responsive layout
  const getResponsiveLayout = () => {
    const screenWidth = window.innerWidth;
    
    if (screenWidth >= 1280) { // xl
      return { cols: 4, rows: 2, itemsPerPage: 8 };
    } else if (screenWidth >= 1024) { // lg 
      return { cols: 3, rows: 2, itemsPerPage: 6 };
    } else if (screenWidth >= 768) { // md
      return { cols: 2, rows: 3, itemsPerPage: 6 };
    } else { // mobile
      return { cols: 1, rows: 1, itemsPerPage: 1 };
    }
  };

  const layout = getResponsiveLayout();
  const mobileCardsPerView = 1;
  const mobileTotalPages = Math.ceil(mockFavorites.length / mobileCardsPerView);

  const header = (
    <div className="bg-black/60 backdrop-blur-xl">
      <div className="px-4 pt-2 pb-3">
        <h1 className="text-white text-lg font-light mb-2">Favorites</h1>
        <p className="text-white/60 text-sm">Your most effective sessions</p>
      </div>
      
      {/* Stats Overview */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-teal-500/30 transition-all duration-300">
            <div className="text-teal-400 text-xl font-semibold">{user.level}</div>
            <div className="text-white/60 text-xs">Level</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-orange-500/30 transition-all duration-300">
            <div className="text-orange-400 text-xl font-semibold">{user.sessionStreak}</div>
            <div className="text-white/60 text-xs">Streak</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center hover:border-purple-500/30 transition-all duration-300">
            <div className="text-purple-400 text-xl font-semibold">{mockFavorites.length}</div>
            <div className="text-white/60 text-xs">Saved</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Update calculations for mobile pagination
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      const newTotalPages = Math.ceil(mockFavorites.length / mobileCardsPerView);
      if (currentIndex >= newTotalPages) {
        setCurrentIndex(0);
      }
    }
  }, [mockFavorites.length, currentIndex]);

  // Update scroll handler for proper mobile pagination
  const handleScroll = () => {
    if (scrollContainerRef.current && window.innerWidth < 1024) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = scrollContainerRef.current.scrollWidth / mobileTotalPages;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

  const body = (
    <div className="bg-black relative h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-950/20 via-black to-purple-950/20" />
      <div className="relative z-10 h-full flex flex-col overflow-hidden px-4 py-4">
        {mockFavorites.length > 0 ? (
          <>
            {/* Desktop Grid Layout */}
            <div className="hidden lg:block flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {mockFavorites.map((session) => (
                  <div key={session.id} className="h-[280px]">
                    {renderSessionCard(session)}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet Horizontal Scrolling */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="lg:hidden flex gap-4 h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  overscrollBehavior: 'contain'
                }}
              >
                {mockFavorites.map((session, index) => (
                  <div
                    key={session.id}
                    className="flex-shrink-0 snap-center"
                    style={{ 
                      width: window.innerWidth < 768 ? 'calc(100vw - 3rem)' : 'calc(50% - 1rem)',
                      maxWidth: window.innerWidth < 768 ? '280px' : '300px',
                      height: '240px'
                    }}
                  >
                    {renderSessionCard(session)}
                  </div>
                ))}
              </div>
            </div>

            {/* Horizontal Scroll Indicators */}
            <div className="lg:hidden flex items-center justify-center space-x-2 mt-4 mb-2 flex-shrink-0">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                    index === currentIndex ? 'bg-teal-400 scale-125' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Heart size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-white/60 text-xl font-medium mb-2">No favorites yet</h3>
              <p className="text-white/40">Complete sessions to add them to favorites</p>
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

      {/* Session Details Modal */}
      <ModalShell
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.name || ''}
        footer={
          <button
            onClick={() => {
              if (selectedSession) {
                onSessionSelect(selectedSession);
                setSelectedSession(null);
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
          >
            Start Session
          </button>
        }
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className={`bg-gradient-to-br ${getEgoStateColor(selectedSession.egoState)} rounded-xl p-4 border border-white/20`}>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">{getEgoStateIcon(selectedSession.egoState)}</span>
                <div>
                  <h3 className="text-white font-semibold text-lg">{selectedSession.name}</h3>
                  <p className="text-white/70 text-sm capitalize">{selectedSession.egoState} • {selectedSession.action}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-white text-xl font-semibold">{selectedSession.duration}m</div>
                  <div className="text-white/60 text-sm">Duration</div>
                </div>
                <div>
                  <div className="text-white text-xl font-semibold">{selectedSession.completedCount}</div>
                  <div className="text-white/60 text-sm">Completed</div>
                </div>
                <div>
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= selectedSession.rating ? 'text-yellow-400 fill-current' : 'text-white/20'}
                      />
                    ))}
                  </div>
                  <div className="text-white/60 text-sm">Rating</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-2">Last Completed</h4>
              <p className="text-white/70 text-sm">{formatLastCompleted(selectedSession.lastCompleted)}</p>
            </div>
          </div>
        )}
      </ModalShell>
    </>
  );
}