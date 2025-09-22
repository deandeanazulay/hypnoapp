import React, { useState } from 'react';
import { Play, Clock, Star, Filter } from 'lucide-react';
import { DEFAULT_PROTOCOLS, Protocol } from '../../types/Navigation';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'induction' | 'deepener' | 'complete'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

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

  return (
    <div className="flex-1 bg-black relative overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between pb-20">
        {/* Header */}
        <div className="flex-shrink-0 flex flex-col justify-start items-start pt-12 pb-6 px-6">
          <h1 className="text-white text-2xl font-light mb-2">Explore Protocols</h1>
          <p className="text-white/60 text-sm">Discover hypnosis journeys and techniques</p>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 flex flex-col justify-start items-stretch px-6 mb-6 space-y-4">
          <div className="flex justify-start items-center space-x-4">
            <div className="flex items-center justify-start space-x-2">
              {['all', 'induction', 'deepener', 'complete'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center ${
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

          <div className="flex justify-start items-center space-x-2">
            {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
              <button
                key={difficulty}
                onClick={() => setSelectedDifficulty(difficulty as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center ${
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

        {/* Protocol List - Fixed height grid */}
        <div className="flex-1 px-6 min-h-0">
          <div className="h-full grid grid-rows-2 grid-flow-col auto-cols-[minmax(280px,1fr)] gap-3 overflow-x-auto overflow-y-hidden">
          {filteredProtocols.map((protocol) => (
            <div
              key={protocol.id}
              className={`bg-gradient-to-br ${getTypeColor(protocol.type)} backdrop-blur-md rounded-xl p-3 border border-white/10 transition-all duration-300 hover:border-white/20 hover:scale-[1.02] flex flex-col justify-between min-w-0`}
            >
              <div className="flex items-start justify-between space-x-3 mb-2">
                <div className="flex-1 flex flex-col justify-start min-w-0">
                  <div className="flex items-center justify-start space-x-2 mb-1">
                    <h3 className="text-white font-semibold text-base truncate">{protocol.name}</h3>
                    <span className={`text-xs font-medium flex-shrink-0 ${getDifficultyColor(protocol.difficulty)}`}>
                      {protocol.difficulty}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mb-2 line-clamp-2">{protocol.description}</p>
                  
                  <div className="flex items-center justify-start space-x-3 text-white/50 text-xs">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock size={12} />
                      <span>{protocol.duration} min</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <Star size={12} />
                      <span>{protocol.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-center">
                  <button
                    onClick={() => onProtocolSelect(protocol)}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    <Play size={14} className="text-white ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap justify-start items-center gap-1 overflow-hidden">
                {protocol.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredProtocols.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Filter size={48} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-white/60 text-lg font-medium mb-2">No protocols found</h3>
              <p className="text-white/40 text-sm">Try adjusting your filters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}