import React, { useState } from 'react';
import { Play, Clock, Star, Filter, Plus } from 'lucide-react';
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
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'induction': return 'from-blue-500/20 to-cyan-500/20';
      case 'deepener': return 'from-purple-500/20 to-indigo-500/20';
      case 'complete': return 'from-teal-500/20 to-green-500/20';
      default: return 'from-white/10 to-gray-500/10';
    }
  };

  const renderProtocolCard = (protocol: Protocol) => (
    <button
      key={protocol.id}
      onClick={() => setSelectedProtocol(protocol)}
      className={`card-premium bg-gradient-to-br ${getTypeColor(protocol.type)} p-4 transition-all duration-300 hover:border-white/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col justify-between h-full w-full text-left opacity-80 hover:opacity-100 relative z-10 hover:z-20`}
      style={{ minHeight: '160px', willChange: 'transform, opacity' }}
    >
      <div className="flex items-start justify-between space-x-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[var(--ink-1)] font-semibold text-sm truncate text-shadow-premium">{protocol.name}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-black/20 ${getDifficultyColor(protocol.difficulty)}`}>
              {protocol.difficulty}
            </span>
          </div>
          <p className="text-[var(--ink-2)] text-xs mb-2 line-clamp-2">{protocol.description}</p>
          
          <div className="flex items-center justify-start space-x-3 text-[var(--ink-dim)] text-xs">
            <div className="flex items-center space-x-1">
              <Clock size={10} />
              <span>{protocol.duration} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star size={10} />
              <span>{protocol.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {protocol.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-white/10 text-[var(--ink-dim)] text-xs rounded-full border border-white/10"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full w-full">
          <div className="max-w-[1200px] w-full mx-auto">
            
            {/* Background */}
            <div className="min-h-full bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative">
              <div className="absolute inset-0">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
              </div>

              {/* Header */}
              <div className="relative z-10 px-4 pt-4 pb-4 sticky top-0 bg-gradient-to-b from-black/95 to-transparent backdrop-blur-sm">
                <h1 className="text-[var(--ink-1)] text-xl font-bold mb-1 text-shadow-premium">Explore Protocols</h1>
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
              <div className="relative z-10 px-4 pb-20">
                
                {/* Protocol Grid - Scrollable */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProtocols.length > 0 ? (
                    displayedProtocols.map((protocol) => renderProtocolCard(protocol))
                  ) : (
                    <div className="col-span-full flex items-center justify-center py-20">
                      <div className="text-center">
                        <Filter size={48} className="text-white/20 mx-auto mb-4" />
                        <h3 className="text-[var(--ink-2)] text-xl font-medium mb-2">No protocols found</h3>
                        <p className="text-[var(--ink-dim)]">Try adjusting your filters</p>
                      </div>
                    </div>
                  )}
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
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
              style={{ minHeight: '44px' }}
            >
              Start Session
            </button>
          }
        >
          <div className="space-y-4">
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