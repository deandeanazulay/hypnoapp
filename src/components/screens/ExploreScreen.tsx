import React, { useState } from 'react';
import { Play, Clock, Star, Filter, Plus, Zap, Waves, Eye, Wind, Book, ChevronRight, ChevronDown, Search, X, Heart, Users, TrendingUp, Award, Target, HelpCircle, BookOpen, Shield, Sparkles, Brain, Moon, Mic, Volume2 } from 'lucide-react';
import { DEFAULT_PROTOCOLS, Protocol } from '../../types/Navigation';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

interface FilterState {
  duration: string[];
  goal: string[];
  technique: string[];
  level: string[];
  style: string[];
}

const quickCollections = [
  { id: 'quick-wins', name: 'Quick Wins', icon: '⚡', filter: { duration: ['≤5m'] }, color: 'from-yellow-500/20 to-amber-500/20' },
  { id: 'complete', name: 'Complete Journeys', icon: '🌊', filter: { type: ['complete'] }, color: 'from-teal-500/20 to-cyan-500/20' },
  { id: 'sleep', name: 'For Sleep', icon: '🌙', filter: { goal: ['sleep'] }, color: 'from-purple-500/20 to-indigo-500/20' },
  { id: 'focus', name: 'For Focus', icon: '🎯', filter: { goal: ['focus'] }, color: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'confidence', name: 'Confidence', icon: '⭐', filter: { goal: ['confidence'] }, color: 'from-orange-500/20 to-amber-500/20' },
  { id: 'stress', name: 'Stress Relief', icon: '🛡️', filter: { goal: ['stress'] }, color: 'from-green-500/20 to-teal-500/20' }
];

const filterOptions = {
  duration: ['≤5m', '5-10m', '10-15m', '15m+'],
  goal: ['stress', 'sleep', 'focus', 'confidence', 'creativity', 'healing', 'energy'],
  technique: ['induction', 'deepener', 'complete'],
  level: ['beginner', 'intermediate', 'advanced'],
  style: ['body-based', 'visualization', 'fractionation', 'breath-work', 'counting']
};

const sortOptions = [
  { id: 'effective', name: 'Most Effective for Me', icon: Target },
  { id: 'trending', name: 'Trending', icon: TrendingUp },
  { id: 'shortest', name: 'Shortest First', icon: Clock },
  { id: 'newest', name: 'Newest', icon: Star },
  { id: 'rating', name: 'Highest Rated', icon: Award }
];

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'induction' | 'deepener' | 'complete'>('all');
  const [filters, setFilters] = useState<FilterState>({
    duration: [],
    goal: [],
    technique: [],
    level: [],
    style: []
  });
  const [selectedSort, setSelectedSort] = useState('effective');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [expandedGuideSection, setExpandedGuideSection] = useState<string | null>(null);

  const applyQuickCollection = (collection: any) => {
    // Apply filter based on collection
    if (collection.filter.duration) {
      setFilters(prev => ({ ...prev, duration: collection.filter.duration }));
    }
    if (collection.filter.goal) {
      setFilters(prev => ({ ...prev, goal: collection.filter.goal }));
    }
    if (collection.filter.type) {
      setSelectedFilter(collection.filter.type[0] as any);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      duration: [],
      goal: [],
      technique: [],
      level: [],
      style: []
    });
    setSelectedFilter('all');
    setSearchQuery('');
  };

  const filteredProtocols = DEFAULT_PROTOCOLS.filter(protocol => {
    // Base filter
    const typeMatch = selectedFilter === 'all' || protocol.type === selectedFilter;
    
    // Search filter
    const searchMatch = !searchQuery || 
      protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Advanced filters
    const durationMatch = filters.duration.length === 0 || filters.duration.some(d => {
      if (d === '≤5m') return protocol.duration <= 5;
      if (d === '5-10m') return protocol.duration > 5 && protocol.duration <= 10;
      if (d === '10-15m') return protocol.duration > 10 && protocol.duration <= 15;
      if (d === '15m+') return protocol.duration > 15;
      return false;
    });
    
    const levelMatch = filters.level.length === 0 || filters.level.includes(protocol.difficulty);
    const techniqueMatch = filters.technique.length === 0 || filters.technique.includes(protocol.type);
    
    return typeMatch && searchMatch && durationMatch && levelMatch && techniqueMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'advanced': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-white/60';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'induction': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'deepener': return 'from-purple-500/20 to-indigo-500/20 border-purple-500/30';
      case 'complete': return 'from-teal-500/20 to-green-500/20 border-teal-500/30';
      default: return 'from-white/10 to-gray-500/10';
    }
  };

  const getProtocolIcon = (protocolId: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'rapid-induction': <Zap size={20} className="text-yellow-400" />,
      'progressive-relaxation': <Waves size={20} className="text-teal-400" />,
      'book-balloon': <Book size={20} className="text-purple-400" />,
      'spiral-staircase': <Eye size={20} className="text-cyan-400" />
    };
    return iconMap[protocolId] || <Star size={20} className="text-white/60" />;
  };

  const getMockStats = (protocolId: string) => {
    // Mock stats for demonstration
    const stats = {
      'rapid-induction': { rating: 4.2, saves: 2.1, completions: 1.5 },
      'progressive-relaxation': { rating: 4.8, saves: 5.2, completions: 4.2 },
      'book-balloon': { rating: 4.5, saves: 3.1, completions: 2.8 },
      'spiral-staircase': { rating: 4.6, saves: 1.8, completions: 2.1 }
    };
    return stats[protocolId as keyof typeof stats] || { rating: 4.0, saves: 1.0, completions: 1.0 };
  };

  const renderProtocolCard = (protocol: Protocol, isHero = false) => {
    const stats = getMockStats(protocol.id);
    
    return (
      <button
        key={protocol.id}
        onClick={() => setSelectedProtocol(protocol)}
        className={`group relative bg-gradient-to-br ${getTypeColor(protocol.type)} backdrop-blur-sm border transition-all duration-300 hover:border-white/30 hover:scale-105 hover:shadow-2xl flex flex-col justify-between text-left overflow-hidden w-full ${
          isHero ? 'rounded-2xl p-4 sm:p-6 min-h-[180px] sm:min-h-[200px]' : 'rounded-xl p-4 min-h-[160px]'
        }`}
        style={{ 
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = ''}
        onMouseLeave={(e) => e.currentTarget.style.transform = ''}
      >
        {/* Parallax effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between space-x-3 mb-3">
            <div className={`w-12 h-12 rounded-xl bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${isHero ? 'shadow-lg' : ''}`}>
              {getProtocolIcon(protocol.id)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-white font-semibold mb-1 line-clamp-2 group-hover:text-white/95 transition-colors ${isHero ? 'text-lg' : 'text-base'}`}>
                {protocol.name}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getDifficultyColor(protocol.difficulty)} backdrop-blur-sm`}>
                  {protocol.difficulty}
                </span>
                <div className="flex items-center space-x-1 text-white/60 text-xs">
                  <Clock size={10} />
                  <span>{protocol.duration}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className={`text-white/70 mb-3 line-clamp-2 leading-relaxed ${isHero ? 'text-sm' : 'text-xs'}`}>
            {protocol.description}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="relative z-10 mt-auto">
          {/* Micro-stats */}
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Star size={12} className="text-yellow-400 fill-current" />
                <span className="text-white/80 font-medium">{stats.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart size={12} className="text-rose-400" />
                <span className="text-white/80 font-medium">{stats.saves}k</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users size={12} className="text-teal-400" />
                <span className="text-white/80 font-medium">{stats.completions}k</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Play size={12} className="text-white/60" />
              <span className="text-white/60 uppercase font-medium">{protocol.type}</span>
            </div>
          </div>

          {/* Tag Rail */}
          <div className="flex flex-wrap gap-1">
            {protocol.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full border border-white/10 group-hover:bg-white/20 group-hover:text-white/90 transition-colors"
              >
                {tag}
              </span>
            ))}
            {protocol.tags.length > 3 && (
              <span className="px-2 py-1 bg-white/5 text-white/50 text-xs rounded-full border border-white/10">
                +{protocol.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
          </div>

          <PageShell
            header={
              <div className="flex-shrink-0 bg-black/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
                <div className="px-4 pt-2 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h1 className="text-white text-xl font-light mb-1">Explore Protocols</h1>
                      <p className="text-white/60 text-sm">Discover hypnosis journeys and techniques</p>
                    </div>
                    <button
                      onClick={() => setShowGuide(true)}
                      className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <HelpCircle size={16} />
                      <span>How to choose?</span>
                    </button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search protocols, techniques..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-white/15 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Filter Controls */}
                  <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
                    {/* Type Filters */}
                    {['all', 'induction', 'deepener', 'complete'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter as any)}
                        className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 min-h-[36px] ${
                          selectedFilter === filter
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                            : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                    
                    {/* Sort Dropdown */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setShowSort(!showSort)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:bg-white/20 transition-all hover:scale-105 min-h-[36px]"
                      >
                        <span className="text-xs font-medium whitespace-nowrap">
                          {sortOptions.find(s => s.id === selectedSort)?.name || 'Sort'}
                        </span>
                        <ChevronDown size={12} className={`transition-transform ${showSort ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showSort && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50">
                          {sortOptions.map(option => {
                            const IconComponent = option.icon;
                            return (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setSelectedSort(option.id);
                                  setShowSort(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                                  selectedSort === option.id ? 'text-teal-400 bg-teal-500/10' : 'text-white/80'
                                }`}
                              >
                                <IconComponent size={16} />
                                <span className="text-sm">{option.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* More Filters */}
                    <button
                      onClick={() => setShowFilters(true)}
                      className="flex-shrink-0 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:bg-white/20 transition-all hover:scale-105 flex items-center space-x-1 min-h-[36px]"
                    >
                      <Filter size={12} />
                      <span className="text-xs font-medium">Filters</span>
                      {(filters.duration.length + filters.goal.length + filters.technique.length + filters.level.length) > 0 && (
                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                      )}
                    </button>
                  </div>

                  {/* Active Filters */}
                  {(filters.duration.length + filters.goal.length + filters.technique.length + filters.level.length) > 0 && (
                    <div className="flex items-center space-x-2 mt-3 flex-wrap gap-2">
                      <span className="text-white/60 text-xs">Active:</span>
                      {[...filters.duration, ...filters.goal, ...filters.technique, ...filters.level].map((filter, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs rounded-full flex items-center space-x-1">
                          <span>{filter}</span>
                          <X size={10} className="cursor-pointer hover:text-orange-300" onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              duration: prev.duration.filter(f => f !== filter),
                              goal: prev.goal.filter(f => f !== filter),
                              technique: prev.technique.filter(f => f !== filter),
                              level: prev.level.filter(f => f !== filter)
                            }));
                          }} />
                        </span>
                      ))}
                      <button
                        onClick={clearAllFilters}
                        className="text-white/60 hover:text-white text-xs underline"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </div>
            }
            body={
              <div className="h-full overflow-y-auto pb-32" style={{ paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
                <div className="bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative min-h-full">
                  {/* Background Effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
                  </div>

                  <div className="relative z-10 space-y-8 px-4 pt-6">
                    
                    {/* Hero Cards - Mobile Responsive */}
                    <section>
                      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                        {filteredProtocols.slice(0, 4).map((protocol) => renderProtocolCard(protocol, true))}
                      </div>
                    </section>

                    {/* Quick Collections */}
                    <section className="mt-8">
                      <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                        <Sparkles size={16} className="text-teal-400" />
                        <span>Quick Collections</span>
                      </h3>
                      <div className="flex overflow-x-auto space-x-3 pb-3 scrollbar-hide">
                        {quickCollections.map((collection) => (
                          <button
                            key={collection.id}
                            onClick={() => applyQuickCollection(collection)}
                            className={`flex-shrink-0 bg-gradient-to-br ${collection.color} backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:border-white/30 hover:scale-105 transition-all duration-300 min-w-[140px] min-h-[44px]`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">{collection.icon}</div>
                              <div className="text-white font-medium text-sm">{collection.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Quick Wins Section - No Duplicates */}
                    <section className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium flex items-center space-x-2">
                          <Zap size={16} className="text-yellow-400" />
                          <span>Quick Wins</span>
                          <span className="text-white/40 text-sm">(≤5 min)</span>
                        </h3>
                      </div>
                      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProtocols.filter(p => p.duration <= 5).slice(0, 4).map((protocol) => renderProtocolCard(protocol))}
                      </div>
                    </section>

                    {/* Complete Journeys Section */}
                    <section className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium flex items-center space-x-2">
                          <BookOpen size={16} className="text-purple-400" />
                          <span>Complete Journeys</span>
                          <span className="text-white/40 text-sm">({filteredProtocols.filter(p => p.type === 'complete').length})</span>
                        </h3>
                      </div>
                      
                      {filteredProtocols.filter(p => p.type === 'complete').length > 0 ? (
                        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredProtocols.filter(p => p.type === 'complete').map((protocol) => renderProtocolCard(protocol))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="bg-white/5 rounded-xl p-6 border border-white/20 max-w-md mx-auto">
                            <BookOpen size={24} className="text-white/40 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">No complete journeys match your filters</p>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* All Other Protocols - Organized by Type */}
                    <section className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-medium flex items-center space-x-2">
                          <Target size={16} className="text-blue-400" />
                          <span>Inductions & Deepeners</span>
                          <span className="text-white/40 text-sm">({filteredProtocols.filter(p => p.type !== 'complete' && p.duration > 5).length})</span>
                        </h3>
                      </div>
                      
                      {filteredProtocols.filter(p => p.type !== 'complete' && p.duration > 5).length > 0 ? (
                        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredProtocols.filter(p => p.type !== 'complete' && p.duration > 5).map((protocol) => renderProtocolCard(protocol))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="bg-white/5 rounded-xl p-6 border border-white/20 max-w-md mx-auto">
                            <Target size={24} className="text-white/40 mx-auto mb-3" />
                            <p className="text-white/60 text-sm">No inductions or deepeners match your filters</p>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* New Here? Guide Card */}
                    <section className="mt-8 mb-8">
                      <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/20">
                        <div className="flex items-center space-x-3 mb-4">
                          <HelpCircle size={20} className="text-teal-400" />
                          <h3 className="text-white font-semibold">New to Hypnosis?</h3>
                        </div>
                        <p className="text-white/80 text-sm mb-4 leading-relaxed">
                          Start with <strong>Progressive Relaxation</strong> (98% success rate) or explore our Quick Collections above to find the perfect match for your current need.
                        </p>
                        <button
                          onClick={() => setShowGuide(true)}
                          className="px-4 py-3 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all hover:scale-105 flex items-center space-x-2 min-h-[44px]"
                        >
                          <BookOpen size={16} />
                          <span>Read the Complete Guide</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Sort Dropdown Backdrop */}
      {showSort && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
      )}

      {/* Filters Modal */}
      <ModalShell
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Protocols"
        footer={
          <div className="flex space-x-3">
            <button
              onClick={clearAllFilters}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
            >
              Apply Filters
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Duration */}
          <div>
            <h3 className="text-white font-medium mb-3">Duration</h3>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.duration.map((duration) => (
                <button
                  key={duration}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      duration: prev.duration.includes(duration)
                        ? prev.duration.filter(d => d !== duration)
                        : [...prev.duration, duration]
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filters.duration.includes(duration)
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {duration}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <h3 className="text-white font-medium mb-3">Goal</h3>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.goal.map((goal) => (
                <button
                  key={goal}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      goal: prev.goal.includes(goal)
                        ? prev.goal.filter(g => g !== goal)
                        : [...prev.goal, goal]
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    filters.goal.includes(goal)
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <h3 className="text-white font-medium mb-3">Experience Level</h3>
            <div className="grid grid-cols-3 gap-2">
              {filterOptions.level.map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      level: prev.level.includes(level)
                        ? prev.level.filter(l => l !== level)
                        : [...prev.level, level]
                    }));
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                    filters.level.includes(level)
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                      : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Explore Guide Modal */}
      <ModalShell
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="Hypnosis Protocol Guide"
        className="max-w-2xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* How to Pick */}
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
            <button
              onClick={() => setExpandedGuideSection(expandedGuideSection === 'pick' ? null : 'pick')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Target size={16} className="text-teal-400" />
                <span>How should I pick a protocol?</span>
              </h3>
              <ChevronDown size={16} className={`text-white/60 transition-transform ${expandedGuideSection === 'pick' ? 'rotate-180' : ''}`} />
            </button>
            {expandedGuideSection === 'pick' && (
              <div className="mt-3 text-white/80 text-sm leading-relaxed">
                <p className="mb-3">Start with your <strong>current need</strong> (e.g., 'calm down in 5 min'), choose a protocol that matches your <strong>Ego State</strong>, and aim for the <strong>shortest</strong> option you'll actually complete.</p>
                <p className="text-teal-400 font-medium">Consistency beats length every time.</p>
              </div>
            )}
          </div>

          {/* Protocol Types */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <button
              onClick={() => setExpandedGuideSection(expandedGuideSection === 'types' ? null : 'types')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <BookOpen size={16} className="text-purple-400" />
                <span>What's the difference between types?</span>
              </h3>
              <ChevronDown size={16} className={`text-white/60 transition-transform ${expandedGuideSection === 'types' ? 'rotate-180' : ''}`} />
            </button>
            {expandedGuideSection === 'types' && (
              <div className="mt-3 space-y-3">
                <div className="flex items-start space-x-3">
                  <Zap size={16} className="text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-blue-400 font-medium">Induction</div>
                    <div className="text-white/70 text-sm">Guides you into trance state</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Waves size={16} className="text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-purple-400 font-medium">Deepener</div>
                    <div className="text-white/70 text-sm">Takes you deeper once you're in</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star size={16} className="text-teal-400 mt-0.5" />
                  <div>
                    <div className="text-teal-400 font-medium">Complete</div>
                    <div className="text-white/70 text-sm">Full journey: induction → deepener → change-work → return</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Beginner Safe List */}
          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
            <button
              onClick={() => setExpandedGuideSection(expandedGuideSection === 'beginner' ? null : 'beginner')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Shield size={16} className="text-green-400" />
                <span>Beginner safe list</span>
              </h3>
              <ChevronDown size={16} className={`text-white/60 transition-transform ${expandedGuideSection === 'beginner' ? 'rotate-180' : ''}`} />
            </button>
            {expandedGuideSection === 'beginner' && (
              <div className="mt-3 space-y-2">
                {['Progressive Relaxation', 'Book & Balloon', 'Spiral Staircase'].map((name, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3 border border-white/20">
                    <div className="text-white font-medium text-sm">{name}</div>
                    <div className="text-white/70 text-xs mt-1">Perfect for first-time users</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety */}
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/20">
            <button
              onClick={() => setExpandedGuideSection(expandedGuideSection === 'safety' ? null : 'safety')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-white font-semibold flex items-center space-x-2">
                <Shield size={16} className="text-red-400" />
                <span>Safety & best practices</span>
              </h3>
              <ChevronDown size={16} className={`text-white/60 transition-transform ${expandedGuideSection === 'safety' ? 'rotate-180' : ''}`} />
            </button>
            {expandedGuideSection === 'safety' && (
              <div className="mt-3 space-y-2 text-white/80 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  <span>Sit or lie in a safe, comfortable place</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  <span>Never use while driving or operating machinery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  <span>It's normal to be semi-aware during sessions</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalShell>

      {/* Protocol Details Modal */}
      {selectedProtocol && (
        <ModalShell
          isOpen={true}
          onClose={() => setSelectedProtocol(null)}
          title={selectedProtocol.name}
          footer={
            <button
              onClick={() => {
                onProtocolSelect(selectedProtocol);
                setSelectedProtocol(null);
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-2xl shadow-teal-400/25"
            >
              Begin Journey
            </button>
          }
        >
          <div className="space-y-6">
            <div className={`bg-gradient-to-br ${getTypeColor(selectedProtocol.type)} rounded-xl p-6 border border-white/30`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedProtocol.difficulty)}`}>
                  {selectedProtocol.difficulty}
                </span>
                <div className="flex items-center space-x-4 text-white/60">
                  <div className="flex items-center space-x-1">
                    <Clock size={16} />
                    <span>{selectedProtocol.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star size={16} />
                    <span>{selectedProtocol.type}</span>
                  </div>
                </div>
              </div>
              <p className="text-white/90 leading-relaxed">{selectedProtocol.description}</p>
            </div>
            
            {/* Enhanced Stats */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Community Stats</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-yellow-400 font-bold text-lg">{getMockStats(selectedProtocol.id).rating}</div>
                  <div className="text-white/60 text-xs">Avg Rating</div>
                </div>
                <div>
                  <div className="text-rose-400 font-bold text-lg">{getMockStats(selectedProtocol.id).saves}k</div>
                  <div className="text-white/60 text-xs">Saves</div>
                </div>
                <div>
                  <div className="text-teal-400 font-bold text-lg">{getMockStats(selectedProtocol.id).completions}k</div>
                  <div className="text-white/60 text-xs">Completed</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProtocol.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}