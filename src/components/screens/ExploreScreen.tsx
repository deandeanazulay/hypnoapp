import React, { useState } from 'react';
import { Play, Clock, Star, Filter, Plus, Zap, Waves, Eye, Wind, Book, ChevronRight } from 'lucide-react';
import { DEFAULT_PROTOCOLS, Protocol } from '../../types/Navigation';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'induction' | 'deepener' | 'complete'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  const filteredProtocols = DEFAULT_PROTOCOLS.filter(protocol => {
    const typeMatch = selectedFilter === 'all' || protocol.type === selectedFilter;
    const difficultyMatch = selectedDifficulty === 'all' || protocol.difficulty === selectedDifficulty;
    return typeMatch && difficultyMatch;
  });

  // Show all protocols in scrollable view
  const displayedProtocols = filteredProtocols;

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
      'eye-fixation': <Eye size={20} className="text-cyan-400" />,
      'breath-work': <Wind size={20} className="text-green-400" />
    };
    return iconMap[protocolId] || <Star size={20} className="text-white/60" />;
  };

  const renderProtocolCard = (protocol: Protocol) => (
    <button
      key={protocol.id}
      onClick={() => setSelectedProtocol(protocol)}
     className={`card-premium bg-gradient-to-br ${getTypeColor(protocol.type)} p-4 lg:p-6 transition-all duration-300 hover:border-white/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col justify-between h-full w-full text-left opacity-80 hover:opacity-100 relative z-10 hover:z-25 group`}
      style={{ minHeight: '160px', willChange: 'transform, opacity' }}
    >
      <div className="flex items-start justify-between space-x-2 mb-2">
        {/* Protocol Icon */}
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          {getProtocolIcon(protocol.id)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[var(--ink-1)] font-semibold text-sm lg:text-base truncate text-shadow-premium group-hover:text-white transition-colors">{protocol.name}</h3>
          </div>
          
          {/* Difficulty Badge */}
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs lg:text-sm font-bold px-2 lg:px-3 py-1 rounded-full border ${getDifficultyColor(protocol.difficulty)} backdrop-blur-sm`}>
              {protocol.difficulty}
            </span>
            <div className="flex items-center space-x-2 lg:space-x-3 text-[var(--ink-dim)] text-xs">
              <div className="flex items-center space-x-1">
                <Clock size={10} className="lg:w-3 lg:h-3" />
                <span>{protocol.duration}m</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star size={10} className="lg:w-3 lg:h-3" />
                <span className="capitalize">{protocol.type}</span>
              </div>
            </div>
          </div>
          
          <p className="text-[var(--ink-2)] text-xs lg:text-sm mb-2 lg:mb-3 line-clamp-2 leading-relaxed">{protocol.description}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {protocol.tags.slice(0, window.innerWidth >= 1024 ? 3 : 2).map((tag) => (
          <span
            key={tag}
            className="px-2 lg:px-3 py-1 bg-white/10 text-[var(--ink-dim)] text-xs lg:text-sm rounded-full border border-white/10 group-hover:bg-white/20 group-hover:text-white/90 transition-colors"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full w-full">
          <div className="w-full">
            
            {/* Background */}
            <div className="min-h-full bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative">
              <div className="absolute inset-0">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
              </div>

              {/* Header */}
              <div className="relative z-30 px-4 pt-2 pb-4 sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10">
                <h1 className="text-[var(--ink-1)] text-lg font-bold mb-1 text-shadow-premium">Explore Protocols</h1>
                <p className="text-[var(--ink-dim)] text-sm">Discover hypnosis journeys and techniques</p>
                
                {/* Filters Row */}
                <div className="flex space-x-2 mt-3">
                  {['all', 'induction', 'deepener', 'complete'].slice(0, 3).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter as any)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 opacity-80 hover:opacity-100 ${
                        selectedFilter === filter
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                          : 'bg-white/10 text-[var(--ink-dim)] border border-white/20 hover:bg-white/20'
                      }`}
                      style={{ minHeight: '32px' }}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="px-3 py-2 rounded-full text-xs font-medium bg-white/10 text-[var(--ink-dim)] border border-white/20 hover:bg-white/20 transition-all duration-200 opacity-80 hover:opacity-100"
                    style={{ minHeight: '32px' }}
                  >
                    More Filters
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="relative z-10 px-4 pt-4 pb-20">
                
                {/* Protocol Grid - Responsive */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {filteredProtocols.length > 0 ? (
                    displayedProtocols.map((protocol) => renderProtocolCard(protocol))
                  ) : (
                    <div className="col-span-full flex items-center justify-center py-12 lg:py-20">
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-white/5 to-gray-500/10 rounded-xl p-6 lg:p-8 border border-white/20 max-w-md mx-auto">
                          <div className="flex items-center space-x-3 mb-4">
                            <Filter size={20} className="text-white/20" />
                            <h3 className="text-[var(--ink-2)] text-xl font-medium">No protocols found</h3>
                          </div>
                          <p className="text-[var(--ink-dim)]">Try adjusting your filters</p>
                          <button 
                            onClick={() => {
                              setSelectedFilter('all');
                              setSelectedDifficulty('all');
                            }}
                            className="mt-4 px-4 py-2 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all text-sm hover:scale-105"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Desktop-only Featured Section */}
                <div className="hidden xl:block mt-12 pt-8 border-t border-white/10">
                  <div className="text-center mb-8 max-w-4xl mx-auto">
                    <h3 className="text-white text-2xl font-light mb-2 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                      Master the Art of Hypnosis
                    </h3>
                    <p className="text-white/70 max-w-2xl mx-auto">
                      Each protocol represents years of refined hypnotic technique, designed to work with specific archetypal energies for maximum transformation.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Quick Access */}
                    <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl p-6 border border-teal-500/20 hover:border-teal-500/30 transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mb-4">
                        <Zap size={24} className="text-teal-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-2">Quick Inductions</h4>
                      <p className="text-white/70 text-sm mb-4 leading-relaxed">Perfect for busy schedules. Rapid entry into trance states for immediate transformation.</p>
                      <button 
                        onClick={() => setSelectedFilter('induction')}
                        className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>Explore Inductions</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    
                    {/* Deep Work */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                        <Waves size={24} className="text-purple-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-2">Complete Journeys</h4>
                      <p className="text-white/70 text-sm mb-4 leading-relaxed">Full transformation experiences. Deep dive into your subconscious landscape.</p>
                      <button 
                        onClick={() => setSelectedFilter('complete')}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>Explore Complete Sessions</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    
                    {/* Advanced Techniques */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/30 transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                        <Star size={24} className="text-amber-400" />
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-2">Advanced Techniques</h4>
                      <p className="text-white/70 text-sm mb-4 leading-relaxed">Master-level protocols for experienced practitioners seeking deeper transformation.</p>
                      <button 
                        onClick={() => setSelectedDifficulty('advanced')}
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <span>Explore Advanced</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Filters Modal */}
      {showFilters && (
        <ModalShell
          isOpen={true}
          onClose={() => setShowFilters(false)}
          title="Filter Protocols"
          className="max-h-[86vh] overflow-auto"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-[var(--ink-1)] font-medium mb-3">Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'induction', 'deepener', 'complete'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter as any)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedFilter === filter
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                        : 'card-premium text-[var(--ink-2)] hover:bg-white/20'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          
            <div>
              <h3 className="text-[var(--ink-1)] font-medium mb-3">Difficulty</h3>
              <div className="grid grid-cols-2 gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty as any)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedDifficulty === difficulty
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'card-premium text-[var(--ink-2)] hover:bg-white/20'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Protocol Details Modal */}
      {selectedProtocol && (
        <ModalShell
          isOpen={true}
          onClose={() => setSelectedProtocol(null)}
          title={selectedProtocol.name}
          className="max-h-[86vh] overflow-auto z-50"
          footer={
            <button
              onClick={() => {
                onProtocolSelect(selectedProtocol);
                setSelectedProtocol(null);
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-2xl shadow-teal-400/25"
              style={{ minHeight: '44px' }}
            >
              Begin Journey
            </button>
          }
        >
          <div className="space-y-6">
            <div className={`card-premium bg-gradient-to-br ${getTypeColor(selectedProtocol.type)} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedProtocol.difficulty)} bg-black/20`}>
                  {selectedProtocol.difficulty}
                </span>
                <div className="flex items-center space-x-4 text-[var(--ink-dim)]">
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
              <p className="text-[var(--ink-2)] text-shadow-premium">{selectedProtocol.description}</p>
            </div>
            
            <div className="card-premium p-4" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <h4 className="text-[var(--ink-1)] font-medium mb-3 text-shadow-premium">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProtocol.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 text-[var(--ink-2)] text-sm rounded-full border border-white/20"
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