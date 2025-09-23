import React, { useState } from 'react';
import { Play, Clock, Star, Filter } from 'lucide-react';
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
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxVisibleCards = Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) / 320);
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < filteredProtocols.length - maxVisibleCards;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(prev => Math.min(filteredProtocols.length - maxVisibleCards, prev + 1));
    }
  };

  const filteredProtocols = DEFAULT_PROTOCOLS.filter(protocol => {
    const typeMatch = selectedFilter === 'all' || protocol.type === selectedFilter;
    const difficultyMatch = selectedDifficulty === 'all' || protocol.difficulty === selectedDifficulty;
    return typeMatch && difficultyMatch;
  });

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
    <div
      key={protocol.id}
      className={`bg-gradient-to-br ${getTypeColor(protocol.type)} backdrop-blur-md rounded-xl p-4 border border-white/10 transition-all duration-300 hover:border-white/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col justify-between h-full flex-shrink-0 w-72 sm:w-80`}
    >
      <div className="flex items-start justify-between space-x-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-base truncate">{protocol.name}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-black/20 ${getDifficultyColor(protocol.difficulty)}`}>
              {protocol.difficulty}
            </span>
          </div>
          <p className="text-white/70 text-sm mb-3 line-clamp-2">{protocol.description}</p>
          
          <div className="flex items-center justify-start space-x-4 text-white/50 text-sm">
            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{protocol.duration} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star size={12} />
              <span>{protocol.type}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={() => setSelectedProtocol(protocol)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20"
          >
            <Play size={14} className="text-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-2">
        {protocol.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full border border-white/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  const header = (
    <div className="bg-black/60 backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-white text-2xl font-light mb-2">Explore Protocols</h1>
        <p className="text-white/60 text-sm">Discover hypnosis journeys and techniques</p>
      </div>
      
      {/* Quick Filters */}
      <div className="px-4 pb-3">
        <div className="flex space-x-2 mb-2">
          {['all', 'induction', 'deepener', 'complete'].slice(0, 3).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                selectedFilter === filter
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                  : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/60 border border-white/20 hover:bg-white/20 transition-all duration-200"
          >
            More Filters
          </button>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="bg-black relative h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20" />
      <div className="relative z-10 h-full px-4 py-4">
        {filteredProtocols.length > 0 ? (
          <div className="h-full flex flex-col relative">
            {/* Navigation Arrows */}
            {filteredProtocols.length > maxVisibleCards && (
              <>
                <button
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <polyline points="15,18 9,12 15,6"></polyline>
                  </svg>
                </button>
                <button
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
              </>
            )}
            
            <div className="flex-1 overflow-hidden px-8">
              <div 
                className="flex space-x-4 h-full pb-4 transition-transform duration-300 ease-out" 
                style={{ 
                  transform: `translateX(-${currentIndex * 336}px)`,
                  width: `${filteredProtocols.length * 336}px`
                }}
              >
                {filteredProtocols.map((protocol) => (
                  <div key={protocol.id} className="flex-shrink-0">
                    {renderProtocolCard(protocol)}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Page indicators */}
            {filteredProtocols.length > maxVisibleCards && (
              <div className="flex justify-center mt-4">
                <div className="flex space-x-2">
                  {Array.from({ length: Math.ceil(filteredProtocols.length / maxVisibleCards) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index * maxVisibleCards)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        Math.floor(currentIndex / maxVisibleCards) === index 
                          ? 'bg-teal-400 scale-125' 
                          : 'bg-white/40 hover:bg-white/60 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Simple indicators for smaller screens */}
            {filteredProtocols.length <= maxVisibleCards && (
              <div className="flex justify-center mt-2">
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(filteredProtocols.length, 5) }).map((_, index) => (
                    <div
                      key={index}
                      className="w-1.5 h-1.5 rounded-full bg-white/20"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Filter size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-white/60 text-xl font-medium mb-2">No protocols found</h3>
              <p className="text-white/40">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
                  <div
                    key={index}
                    className="w-1.5 h-1.5 rounded-full bg-white/20"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Filter size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-white/60 text-xl font-medium mb-2">No protocols found</h3>
              <p className="text-white/40">Try adjusting your filters</p>
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

      {/* Filters Modal */}
      <ModalShell
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Protocols"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-medium mb-3">Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {['all', 'induction', 'deepener', 'complete'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as any)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedFilter === filter
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                      : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-3">Difficulty</h3>
            <div className="grid grid-cols-2 gap-2">
              {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty as any)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedDifficulty === difficulty
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Protocol Details Modal */}
      <ModalShell
        isOpen={!!selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
        title={selectedProtocol?.name || ''}
        footer={
          <button
            onClick={() => {
              if (selectedProtocol) {
                onProtocolSelect(selectedProtocol);
                setSelectedProtocol(null);
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
          >
            Start Session
          </button>
        }
      >
        {selectedProtocol && (
          <div className="space-y-4">
            <div className={`bg-gradient-to-br ${getTypeColor(selectedProtocol.type)} rounded-xl p-4 border border-white/20`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedProtocol.difficulty)} bg-black/20`}>
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
              <p className="text-white/80">{selectedProtocol.description}</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedProtocol.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 text-white/60 text-sm rounded-full border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </ModalShell>
    </>
  );
}