import React, { useState } from 'react';
import { Play, Clock, Star, Filter } from 'lucide-react';
import { DEFAULT_PROTOCOLS, Protocol } from '../types/Navigation';

interface ExploreProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

export default function Explore({ onProtocolSelect }: ExploreProps) {
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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <div>
          <h1 className="text-white text-xl font-light truncate">Explore Protocols</h1>
          <p className="text-white/60 text-xs truncate">Discover hypnosis journeys</p>
        </div>
        <Filter size={20} className="text-white/60" />
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex gap-2 mb-2 overflow-hidden">
          {['all', 'induction', 'deepener', 'complete'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                  : 'bg-white/10 text-white/60 border border-white/20'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 overflow-hidden">
          {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setSelectedDifficulty(difficulty as any)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                selectedDifficulty === difficulty
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-white/10 text-white/60 border border-white/20'
              }`}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-3">
        <div className="grid h-full grid-rows-[1fr_auto] gap-3">
          {/* Cards grid - fixed 2 rows max */}
          <div className="grid gap-3 grid-rows-2 grid-flow-col auto-cols-[minmax(240px,1fr)] overflow-hidden">
            {filteredProtocols.slice(0, 6).map((protocol) => (
              <div
                key={protocol.id}
                className={`bg-gradient-to-br ${getTypeColor(protocol.type)} backdrop-blur-md rounded-xl p-3 border border-white/10 h-full flex flex-col justify-between`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm truncate">{protocol.name}</h3>
                    <span className={`text-xs font-medium ${getDifficultyColor(protocol.difficulty)}`}>
                      {protocol.difficulty}
                    </span>
                  </div>
                  <p className="text-white/70 text-xs line-clamp-2 mb-2">{protocol.description}</p>
                  
                  <div className="flex items-center space-x-3 text-white/50 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock size={10} />
                      <span>{protocol.duration}m</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star size={10} />
                      <span>{protocol.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-wrap gap-1">
                    {protocol.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1 py-0.5 bg-white/10 text-white/60 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => onProtocolSelect(protocol)}
                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
                  >
                    <Play size={12} className="text-white ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer row */}
          {filteredProtocols.length > 6 && (
            <div className="flex items-center justify-center pt-2 flex-shrink-0">
              <button className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 text-sm">
                View All ({filteredProtocols.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}