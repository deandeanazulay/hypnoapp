import React, { useState } from 'react';
import { Play, Clock, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_PROTOCOLS, Protocol } from '../../types/Navigation';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'induction' | 'deepener' | 'complete'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const protocolsPerPage = 6; // 2 rows × 3 columns

  const filteredProtocols = DEFAULT_PROTOCOLS.filter(protocol => {
    const typeMatch = selectedFilter === 'all' || protocol.type === selectedFilter;
    const difficultyMatch = selectedDifficulty === 'all' || protocol.difficulty === selectedDifficulty;
    return typeMatch && difficultyMatch;
  });

  const totalPages = Math.ceil(filteredProtocols.length / protocolsPerPage);
  const currentProtocols = filteredProtocols.slice(
    currentPage * protocolsPerPage,
    (currentPage + 1) * protocolsPerPage
  );

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

  return (
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 pt-4 pb-3 px-4">
          <h1 className="text-white text-2xl font-light mb-2">Explore Protocols</h1>
          <p className="text-white/60 text-sm">Discover hypnosis journeys and techniques</p>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 px-4 mb-4">
          <div className="flex space-x-3 mb-3">
              {['all', 'induction', 'deepener', 'complete'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    selectedFilter === filter
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-lg shadow-teal-500/20'
                      : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
          </div>

          <div className="flex space-x-3">
            {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  selectedDifficulty === difficulty
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-lg shadow-orange-500/20'
                    : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10'
                }`}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Grid - 2 rows × 3 columns */}
        <div className="flex-1 px-4 min-h-0 flex flex-col">
          <div className="grid grid-cols-3 grid-rows-2 gap-4 flex-1 min-h-0">
          {currentProtocols.map((protocol) => (
            <div
              key={protocol.id}
              className={`bg-gradient-to-br ${getTypeColor(protocol.type)} backdrop-blur-md rounded-xl p-4 border border-white/10 transition-all duration-300 hover:border-white/30 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col justify-between min-h-0`}
            >
              <div className="flex items-start justify-between space-x-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg truncate">{protocol.name}</h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full bg-black/20 ${getDifficultyColor(protocol.difficulty)}`}>
                      {protocol.difficulty}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">{protocol.description}</p>
                  
                  <div className="flex items-center justify-start space-x-4 text-white/50 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{protocol.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star size={14} />
                      <span>{protocol.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => onProtocolSelect(protocol)}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-white/20"
                  >
                    <Play size={16} className="text-white ml-1" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {protocol.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded-full border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-4 pb-4">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/10"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentPage ? 'bg-teal-400 shadow-lg shadow-teal-400/50' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-white/10"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredProtocols.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Filter size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-white/60 text-xl font-medium mb-2">No protocols found</h3>
              <p className="text-white/40 text-lg">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}