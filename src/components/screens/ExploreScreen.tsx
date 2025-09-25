import React, { useState, useEffect } from 'react';
import { Play, Clock, Star, Search, X, HelpCircle, BookOpen, ChevronRight, Filter } from 'lucide-react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';
import BeginnerGuide from '../BeginnerGuide';
import { 
  HYPNOSIS_PROTOCOLS, 
  PROTOCOL_CATEGORIES, 
  getProtocolsByCategory, 
  getProtocolsByDifficulty,
  getProtocolsByDuration,
  getRecommendedProtocols,
  getPopularProtocols,
  searchProtocols,
  HypnosisProtocol
} from '../../data/protocols';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: HypnosisProtocol) => void;
}

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const { isAuthenticated } = useAuth();
  const { openModal, showToast } = useAppStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<HypnosisProtocol | null>(null);

  const handleProtocolSelect = (protocol: HypnosisProtocol) => {
    if (!isAuthenticated) {
      openModal('auth');
      showToast({
        type: 'warning',
        message: 'Please sign in to start a session'
      });
      return;
    }
    onProtocolSelect(protocol);
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedDuration('all');
    setSearchQuery('');
  };

  const getFilteredProtocols = (): HypnosisProtocol[] => {
    let filtered = HYPNOSIS_PROTOCOLS;

    // Apply search
    if (searchQuery) {
      filtered = searchProtocols(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
    }

    // Apply duration filter
    if (selectedDuration !== 'all') {
      filtered = filtered.filter(p => p.duration === parseInt(selectedDuration));
    }

    return filtered;
  };

  const filteredProtocols = getFilteredProtocols();
  const hasActiveFilters = selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedDuration !== 'all' || searchQuery;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'advanced': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return PROTOCOL_CATEGORIES.find(c => c.id === categoryId) || PROTOCOL_CATEGORIES[0];
  };

  return (
    <div className="h-full bg-gradient-to-br from-black via-blue-950/20 to-purple-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto pb-32" style={{ paddingTop: '60px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)' }}>
            <div className="px-4 space-y-6">
              
              {/* Explore Header */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-white text-2xl font-light mb-1">Protocol Library</h1>
                    <p className="text-white/70">Professional hypnotherapy sessions for every need</p>
                  </div>
                  <button
                    onClick={() => setShowGuide(true)}
                    className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors flex items-center space-x-1"
                  >
                    <HelpCircle size={16} />
                    <span>Guide</span>
                  </button>
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search protocols, benefits, techniques..."
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
                
                {/* Quick Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${
                        showFilters
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      <Filter size={14} />
                      <span>Filters</span>
                    </button>
                    
                    {/* Popular */}
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedDifficulty('all');
                        setSelectedDuration('all');
                        setSearchQuery('');
                      }}
                      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:scale-105 transition-all"
                    >
                      ⭐ Popular
                    </button>
                    
                    {/* Beginner */}
                    <button
                      onClick={() => {
                        setSelectedDifficulty('beginner');
                        setSelectedCategory('all');
                        setSelectedDuration('all');
                      }}
                      className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/40 hover:scale-105 transition-all"
                    >
                      🌱 Beginner
                    </button>
                  </div>
                  
                  {/* Clear All */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="flex-shrink-0 px-3 py-2 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all hover:scale-105 rounded-lg text-sm font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/10 space-y-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Category</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 ${
                            selectedCategory === 'all'
                              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                              : 'bg-white/10 text-white/70 border border-white/20'
                          }`}
                        >
                          All
                        </button>
                        {PROTOCOL_CATEGORIES.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 ${
                              selectedCategory === category.id
                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                                : 'bg-white/10 text-white/70 border border-white/20'
                            }`}
                          >
                            {category.icon} {category.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Difficulty</label>
                        <div className="space-y-2">
                          {['all', 'beginner', 'intermediate', 'advanced'].map(diff => (
                            <button
                              key={diff}
                              onClick={() => setSelectedDifficulty(diff)}
                              className={`w-full px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 text-left ${
                                selectedDifficulty === diff
                                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                                  : 'bg-white/10 text-white/70 border border-white/20'
                              }`}
                            >
                              {diff.charAt(0).toUpperCase() + diff.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Duration</label>
                        <div className="space-y-2">
                          {['all', '10', '20', '30', '45'].map(duration => (
                            <button
                              key={duration}
                              onClick={() => setSelectedDuration(duration)}
                              className={`w-full px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 text-left ${
                                selectedDuration === duration
                                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                                  : 'bg-white/10 text-white/70 border border-white/20'
                              }`}
                            >
                              {duration === 'all' ? 'All Durations' : `${duration} minutes`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                    <BookOpen size={20} className="text-teal-400" />
                    <span>Available Protocols</span>
                  </h3>
                  <span className="text-white/60 text-sm">{filteredProtocols.length} found</span>
                </div>
                
                {filteredProtocols.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProtocols.map((protocol) => {
                      const categoryInfo = getCategoryInfo(protocol.category);
                      
                      return (
                        <button
                          key={protocol.id}
                          onClick={() => setSelectedProtocol(protocol)}
                          className="group relative bg-gradient-to-br from-white/10 to-gray-500/10 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:border-white/30 hover:scale-105 rounded-xl p-4 text-left overflow-hidden w-full min-h-[140px] flex flex-col justify-between"
                        >
                          {/* Popular/Recommended Badge */}
                          {(protocol.isPopular || protocol.isRecommended) && (
                            <div className="absolute top-3 right-3">
                              {protocol.isPopular && (
                                <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-full text-xs font-medium">
                                  Popular
                                </div>
                              )}
                              {protocol.isRecommended && !protocol.isPopular && (
                                <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-full text-xs font-medium">
                                  Recommended
                                </div>
                              )}
                            </div>
                          )}

                          <div className="relative z-10">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{categoryInfo.icon}</span>
                              <span className="text-white/60 text-xs uppercase tracking-wider">{categoryInfo.name}</span>
                            </div>
                            
                            <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-white/95 transition-colors text-base pr-16">
                              {protocol.name}
                            </h3>
                            
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getDifficultyColor(protocol.difficulty)}`}>
                                {protocol.difficulty}
                              </span>
                              <div className="flex items-center space-x-1 text-white/60 text-xs">
                                <Clock size={10} />
                                <span>{protocol.duration}m</span>
                              </div>
                            </div>
                            
                            <p className="text-white/70 mb-3 line-clamp-2 leading-relaxed text-sm">
                              {protocol.description}
                            </p>

                            {/* Benefits Preview */}
                            <div className="flex flex-wrap gap-1">
                              {protocol.benefits.slice(0, 2).map((benefit, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-black/30 text-white/60 rounded-full border border-white/10">
                                  {benefit}
                                </span>
                              ))}
                              {protocol.benefits.length > 2 && (
                                <span className="text-xs px-2 py-1 bg-black/30 text-white/60 rounded-full border border-white/10">
                                  +{protocol.benefits.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-500/20 to-slate-500/20 flex items-center justify-center mx-auto mb-4 border border-gray-500/30">
                      <Search size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-white text-xl font-medium mb-2">No Protocols Found</h3>
                    <p className="text-white/70 mb-6">Try adjusting your search or filters</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-all hover:scale-105"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Popular Protocols (if no filters active) */}
              {!hasActiveFilters && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Star size={20} className="text-yellow-400" />
                    <span>Most Popular</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getPopularProtocols().map(protocol => {
                      const categoryInfo = getCategoryInfo(protocol.category);
                      return (
                        <button
                          key={protocol.id}
                          onClick={() => handleProtocolSelect(protocol)}
                          className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-4 hover:scale-105 transition-all text-left"
                        >
                          <div className="text-center mb-3">
                            <span className="text-2xl">{categoryInfo.icon}</span>
                          </div>
                          <h4 className="text-white font-semibold text-sm mb-2">{protocol.name}</h4>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-yellow-400">{protocol.duration}m</span>
                            <span className={`px-2 py-1 rounded-full ${getDifficultyColor(protocol.difficulty)}`}>
                              {protocol.difficulty}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New to Hypnotherapy */}
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <HelpCircle size={20} className="text-teal-400" />
                  <h3 className="text-white font-semibold text-lg">New to Hypnotherapy?</h3>
                </div>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  Start with our beginner-friendly protocols or take the guided tour to understand how hypnotherapy works and find the perfect sessions for your goals.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowGuide(true)}
                    className="flex-1 px-4 py-3 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all hover:scale-105 flex items-center space-x-2"
                  >
                    <BookOpen size={16} />
                    <span>Beginner Guide</span>
                  </button>
                  <button
                    onClick={() => setSelectedDifficulty('beginner')}
                    className="flex-1 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 hover:bg-green-500/30 transition-all hover:scale-105 flex items-center space-x-2"
                  >
                    <Star size={16} />
                    <span>Beginner Protocols</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Beginner Guide Modal */}
      <BeginnerGuide 
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        onProtocolSelect={handleProtocolSelect}
      />

      {/* Protocol Details Modal */}
      {selectedProtocol && (
        <ModalShell
          isOpen={!!selectedProtocol}
          onClose={() => setSelectedProtocol(null)}
          title={selectedProtocol.name}
          className="max-w-2xl"
          footer={
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedProtocol(null)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleProtocolSelect(selectedProtocol);
                  setSelectedProtocol(null);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-teal-400/30"
              >
                Begin Session
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Protocol Overview */}
            <div className={`bg-gradient-to-br ${getCategoryInfo(selectedProtocol.category).color} rounded-xl p-4 border border-white/20`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-black/30 border border-white/20 flex items-center justify-center">
                  <span className="text-lg">{getCategoryInfo(selectedProtocol.category).icon}</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">{selectedProtocol.name}</h4>
                  <p className="text-white/70 text-sm">{getCategoryInfo(selectedProtocol.category).name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedProtocol.duration}m</div>
                  <div className="text-white/60 text-xs">Duration</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className={`text-sm font-bold px-2 py-1 rounded ${getDifficultyColor(selectedProtocol.difficulty)}`}>
                    {selectedProtocol.difficulty}
                  </div>
                  <div className="text-white/60 text-xs mt-1">Level</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedProtocol.benefits.length}</div>
                  <div className="text-white/60 text-xs">Benefits</div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h4 className="text-white font-medium mb-2">What This Protocol Does</h4>
              <p className="text-white/80 text-sm leading-relaxed">{selectedProtocol.description}</p>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="text-white font-medium mb-3">Benefits You'll Experience</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedProtocol.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0" />
                    <span className="text-white/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation */}
            <div>
              <h4 className="text-white font-medium mb-3">Before You Begin</h4>
              <div className="space-y-2">
                {selectedProtocol.preparationSteps.map((step, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400">
                      {i + 1}
                    </div>
                    <span className="text-white/80 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Session Tips */}
            <div>
              <h4 className="text-white font-medium mb-3">After Your Session</h4>
              <div className="space-y-2">
                {selectedProtocol.postSessionTips.map((tip, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0 mt-2" />
                    <span className="text-white/80 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}