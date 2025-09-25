import React, { useState } from 'react';
import { Play, Clock, Star, Search, X, Heart, Users, TrendingUp, Award, Target, HelpCircle, BookOpen, Shield, Sparkles, Brain, Moon, Zap, Waves, Eye, Wind, Book, ChevronRight } from 'lucide-react';
import { DEFAULT_PROTOCOLS, Protocol } from '../../types/Navigation';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

const quickCollections = [
  { id: 'quick-wins', name: 'Quick Wins', icon: '⚡', type: '', color: 'from-yellow-500/20 to-amber-500/20' },
  { id: 'complete', name: 'Complete', icon: '🌊', type: 'complete', color: 'from-teal-500/20 to-cyan-500/20' },
  { id: 'sleep', name: 'Sleep', icon: '🌙', type: '', color: 'from-purple-500/20 to-indigo-500/20' },
  { id: 'focus', name: 'Focus', icon: '🎯', type: '', color: 'from-blue-500/20 to-cyan-500/20' },
  { id: 'confidence', name: 'Confidence', icon: '⭐', type: '', color: 'from-orange-500/20 to-amber-500/20' },
  { id: 'stress', name: 'Stress Relief', icon: '🛡️', type: '', color: 'from-green-500/20 to-teal-500/20' }
];

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const { isAuthenticated } = useAuth();
  const { openModal, showToast } = useAppStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'induction' | 'deepener' | 'complete'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  const handleProtocolSelect = (protocol: Protocol) => {
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

  const applyQuickCollection = (collection: any) => {
    if (collection.type) {
      setSelectedFilter(collection.type as any);
    } else {
      setSelectedFilter('all');
    }
  };

  const clearAllFilters = () => {
    setSelectedFilter('all');
    setSearchQuery('');
  };

  const filteredProtocols = DEFAULT_PROTOCOLS.filter(protocol => {
    const typeMatch = selectedFilter === 'all' || protocol.type === selectedFilter;
    const searchMatch = !searchQuery || 
      protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return typeMatch && searchMatch;
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
    const stats = {
      'rapid-induction': { rating: 4.2, saves: 2.1, completions: 1.5 },
      'progressive-relaxation': { rating: 4.8, saves: 5.2, completions: 4.2 },
      'book-balloon': { rating: 4.5, saves: 3.1, completions: 2.8 },
      'spiral-staircase': { rating: 4.6, saves: 1.8, completions: 2.1 }
    };
    return stats[protocolId as keyof typeof stats] || { rating: 4.0, saves: 1.0, completions: 1.0 };
  };

  const renderProtocolCard = (protocol: Protocol) => {
    const stats = getMockStats(protocol.id);
    
    return (
      <button
        key={protocol.id}
        onClick={() => setSelectedProtocol(protocol)}
        className={`group relative bg-gradient-to-br ${getTypeColor(protocol.type)} backdrop-blur-sm border border-white/20 transition-all duration-300 hover:border-white/30 hover:scale-105 rounded-xl p-4 text-left overflow-hidden w-full min-h-[160px] flex flex-col justify-between`}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between space-x-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              {getProtocolIcon(protocol.id)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1 line-clamp-2 group-hover:text-white/95 transition-colors text-base">
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

          <p className="text-white/70 mb-3 line-clamp-2 leading-relaxed text-xs">
            {protocol.description}
          </p>
        </div>

        <div className="relative z-10 mt-auto">
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
                    <h1 className="text-white text-2xl font-light mb-1">Explore Protocols</h1>
                    <p className="text-white/70">Discover hypnosis journeys and techniques</p>
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
                
                {/* Type Filters */}
                <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
                  {['all', 'induction', 'deepener', 'complete'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter as any)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        selectedFilter === filter
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                          : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                  
                  {/* Clear All Button */}
                  {(selectedFilter !== 'all' || searchQuery) && (
                    <button
                      onClick={clearAllFilters}
                      className="flex-shrink-0 px-3 py-2 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all hover:scale-105 rounded-lg text-sm font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Collections */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                  <Sparkles size={20} className="text-teal-400" />
                  <span>Quick Collections</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quickCollections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => applyQuickCollection(collection)}
                      className={`bg-gradient-to-br ${collection.color} backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:border-white/30 hover:scale-105 transition-all duration-300 text-center`}
                    >
                      <div className="text-3xl mb-2">{collection.icon}</div>
                      <div className="text-white font-medium text-sm">{collection.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Protocols */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                  <Star size={20} className="text-yellow-400" />
                  <span>Featured Protocols</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProtocols.slice(0, 4).map((protocol) => renderProtocolCard(protocol))}
                </div>
              </div>

              {/* Quick Wins Section */}
              {filteredProtocols.filter(p => p.duration <= 5).length > 0 && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Zap size={20} className="text-yellow-400" />
                    <span>Quick Wins</span>
                    <span className="text-white/40 text-sm">(≤5 min)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProtocols.filter(p => p.duration <= 5).map((protocol) => renderProtocolCard(protocol))}
                  </div>
                </div>
              )}

              {/* Complete Journeys Section */}
              {filteredProtocols.filter(p => p.type === 'complete').length > 0 && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <BookOpen size={20} className="text-purple-400" />
                    <span>Complete Journeys</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProtocols.filter(p => p.type === 'complete').map((protocol) => renderProtocolCard(protocol))}
                  </div>
                </div>
              )}

              {/* Inductions & Deepeners Section */}
              {filteredProtocols.filter(p => p.type !== 'complete' && p.duration > 5).length > 0 && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Target size={20} className="text-blue-400" />
                    <span>Inductions & Deepeners</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProtocols.filter(p => p.type !== 'complete' && p.duration > 5).map((protocol) => renderProtocolCard(protocol))}
                  </div>
                </div>
              )}

              {/* New to Hypnosis Guide */}
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <HelpCircle size={20} className="text-teal-400" />
                  <h3 className="text-white font-semibold text-lg">New to Hypnosis?</h3>
                </div>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  Start with <strong>Progressive Relaxation</strong> (98% success rate) or explore our Quick Collections above to find the perfect match for your current need.
                </p>
                <button
                  onClick={() => setShowGuide(true)}
                  className="px-4 py-3 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-400 hover:bg-teal-500/30 transition-all hover:scale-105 flex items-center space-x-2"
                >
                  <BookOpen size={16} />
                  <span>Read the Complete Guide</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        }
      />

      {/* Explore Guide Modal */}
      <ModalShell
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        title="Hypnosis Protocol Guide"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <Target size={16} className="text-teal-400" />
              <span>How should I pick a protocol?</span>
            </h3>
            <div className="text-white/80 text-sm leading-relaxed">
              <p className="mb-3">Start with your <strong>current need</strong> (e.g., 'calm down in 5 min'), choose a protocol that matches your <strong>Ego State</strong>, and aim for the <strong>shortest</strong> option you'll actually complete.</p>
              <p className="text-teal-400 font-medium">Consistency beats length every time.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <BookOpen size={16} className="text-purple-400" />
              <span>Protocol Types</span>
            </h3>
            <div className="space-y-3">
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
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
              <Shield size={16} className="text-green-400" />
              <span>Safety & Best Practices</span>
            </h3>
            <div className="space-y-2 text-white/80 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Sit or lie in a safe, comfortable place</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Never use while driving or operating machinery</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span>It's normal to be semi-aware during sessions</span>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Protocol Details Modal */}
      {selectedProtocol && (
        <ModalShell
          isOpen={true}
          onClose={() => setSelectedProtocol(null)}
          title={selectedProtocol.name}
          className="max-w-lg"
          footer={
            <button
              onClick={() => {
                handleProtocolSelect(selectedProtocol);
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