import React, { useState } from 'react';
import { Play, Clock, Star, Search, X, Heart, Users, TrendingUp, Award, Target, HelpCircle, BookOpen, Shield, Sparkles, Brain, Moon, Zap, Waves, Eye, Wind, Book, ChevronRight } from 'lucide-react';
import { Protocol } from '../../types/Navigation';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore } from '../../store';
import PageShell from '../layout/PageShell';
import ModalShell from '../layout/ModalShell';

interface ExploreScreenProps {
  onProtocolSelect: (protocol: Protocol) => void;
}

export default function ExploreScreen({ onProtocolSelect }: ExploreScreenProps) {
  const { isAuthenticated } = useAuth();
  const { openModal, showToast } = useAppStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'induction' | 'deepener' | 'complete'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [protocols, setProtocols] = useState<Protocol[]>([]);

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

  const clearAllFilters = () => {
    setSelectedFilter('all');
    setSearchQuery('');
  };

  const filteredProtocols = protocols.filter(protocol => {
    const typeMatch = selectedFilter === 'all' || protocol.type === selectedFilter;
    const searchMatch = !searchQuery || 
      protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return typeMatch && searchMatch;
  });

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

              {/* Protocols Content */}
              {protocols.length > 0 ? (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                    <Star size={20} className="text-yellow-400" />
                    <span>Available Protocols</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProtocols.map((protocol) => (
                      <button
                        key={protocol.id}
                        onClick={() => setSelectedProtocol(protocol)}
                        className="group relative bg-gradient-to-br from-white/10 to-gray-500/10 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:border-white/30 hover:scale-105 rounded-xl p-4 text-left overflow-hidden w-full min-h-[120px] flex flex-col justify-between"
                      >
                        <div className="relative z-10">
                          <h3 className="text-white font-semibold mb-1 line-clamp-2 group-hover:text-white/95 transition-colors text-base">
                            {protocol.name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-bold px-2 py-1 rounded-full border text-green-400 bg-green-500/20 border-green-500/40 backdrop-blur-sm">
                              {protocol.difficulty}
                            </span>
                            <div className="flex items-center space-x-1 text-white/60 text-xs">
                              <Clock size={10} />
                              <span>{protocol.duration}m</span>
                            </div>
                          </div>
                          <p className="text-white/70 mb-3 line-clamp-2 leading-relaxed text-xs">
                            {protocol.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                    <BookOpen size={28} className="text-teal-400" />
                  </div>
                  <h3 className="text-white text-xl font-medium mb-2">No Protocols Available</h3>
                  <p className="text-white/70 mb-6">Protocols will be loaded from your content library</p>
                </div>
              )}

              {/* New to Hypnosis Guide */}
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-6 border border-teal-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <HelpCircle size={20} className="text-teal-400" />
                  <h3 className="text-white font-semibold text-lg">New to Hypnosis?</h3>
                </div>
                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  Start with gentle progressive relaxation techniques, or explore the available protocols to find the perfect match for your current need.
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
            <h3 className="text-white font-semibold mb-3">Hypnosis Protocol Guide</h3>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}