import React, { useState, useEffect } from 'react';
import { BookOpen, Play, Clock, Star, Trash2, Calendar, CreditCard as Edit, Copy, Search, Filter, Plus } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { supabase } from '../../lib/supabase';
import { CustomProtocol } from '../../lib/supabase';

interface PersonalLibraryModalProps {
  onProtocolSelect?: (protocol: CustomProtocol) => void;
}

export default function PersonalLibraryModal({ onProtocolSelect }: PersonalLibraryModalProps) {
  const { modals, closeModal, showToast, setActiveTab } = useAppStore();
  const { user } = useGameState();
  const { isAuthenticated } = useAuth();
  const [protocols, setProtocols] = useState<CustomProtocol[]>([]);
  const [protocolsLoading, setProtocolsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'favorites'>('all');
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<CustomProtocol | null>(null);

  // Fetch protocols when modal opens
  useEffect(() => {
    const fetchProtocols = async () => {
      if (!isAuthenticated || !user?.id || !modals.personalLibrary) return;
      
      setProtocolsLoading(true);
      try {
        const { data, error } = await supabase
          .from('custom_protocols')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching protocols:', error);
          showToast({ type: 'error', message: 'Failed to load your protocols' });
          setProtocols([]);
        } else {
          setProtocols(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setProtocols([]);
        showToast({ type: 'error', message: 'Failed to load protocols' });
      } finally {
        setProtocolsLoading(false);
      }
    };

    fetchProtocols();
  }, [isAuthenticated, user?.id, modals.personalLibrary, showToast]);

  const handleProtocolDelete = async (protocolId: string) => {
    setDeletingProtocolId(protocolId);
    try {
      const { error } = await supabase
        .from('custom_protocols')
        .delete()
        .eq('id', protocolId)
        .eq('user_id', user?.id); // Additional security check

      if (error) {
        console.error('Error deleting protocol:', error);
        showToast({ type: 'error', message: 'Failed to delete protocol' });
      } else {
        setProtocols(prev => prev.filter(p => p.id !== protocolId));
        showToast({ type: 'success', message: 'Protocol deleted from your library' });
      }
    } catch (error) {
      console.error('Error:', error);
      showToast({ type: 'error', message: 'Failed to delete protocol' });
    } finally {
      setDeletingProtocolId(null);
    }
  };

  const handleProtocolStart = (protocol: CustomProtocol) => {
    if (onProtocolSelect) {
      onProtocolSelect(protocol);
    }
    closeModal('personalLibrary');
    showToast({
      type: 'success',
      message: `Starting "${protocol.name}" session`
    });
  };

  const handleCopyProtocol = async (protocol: CustomProtocol) => {
    try {
      const protocolText = `Protocol: ${protocol.name}\n\nGoals: ${protocol.goals.join(', ')}\n\nInduction: ${protocol.induction}\n\nDeepener: ${protocol.deepener}\n\nDuration: ${protocol.duration} minutes`;
      await navigator.clipboard.writeText(protocolText);
      showToast({ type: 'success', message: 'Protocol copied to clipboard' });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to copy protocol' });
    }
  };

  const getFilteredProtocols = () => {
    let filtered = protocols;
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.goals.some(goal => goal.toLowerCase().includes(query)) ||
        p.induction.toLowerCase().includes(query) ||
        p.deepener.toLowerCase().includes(query)
      );
    }
    
    // Apply filter
    switch (selectedFilter) {
      case 'recent':
        filtered = filtered.slice(0, 10);
        break;
      case 'favorites':
        // TODO: Add favorites functionality
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const formatLastModified = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredProtocols = getFilteredProtocols();

  return (
    <>
      <ModalShell
        isOpen={modals.personalLibrary}
        onClose={() => closeModal('personalLibrary')}
        title="Personal Protocol Library"
        className="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 border-2 border-purple-500/40 flex items-center justify-center">
                <BookOpen size={20} className="text-black" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Your Custom Protocols</h3>
                <p className="text-white/70 text-sm">Personalized transformation sessions you've created</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                <div className="text-purple-400 text-xl font-bold">{protocols.length}</div>
                <div className="text-white/60 text-xs">Total Protocols</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                <div className="text-orange-400 text-xl font-bold">
                  {protocols.length > 0 ? Math.round(protocols.reduce((sum, p) => sum + p.duration, 0) / protocols.length) : 0}m
                </div>
                <div className="text-white/60 text-xs">Avg Duration</div>
              </div>
              <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                <div className="text-teal-400 text-xl font-bold">
                  {protocols.reduce((sum, p) => sum + p.goals.length, 0)}
                </div>
                <div className="text-white/60 text-xs">Total Goals</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your protocols..."
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              {[
                { id: 'all', name: 'All Protocols', icon: BookOpen },
                { id: 'recent', name: 'Recent', icon: Clock },
                { id: 'favorites', name: 'Favorites', icon: Star }
              ].map((filter) => {
                const IconComponent = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 ${
                      selectedFilter === filter.id
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                        : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span className="text-sm font-medium">{filter.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Protocols List */}
          {protocolsLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-400/20 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60 text-sm">Loading your protocol library...</p>
            </div>
          ) : filteredProtocols.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProtocols.map((protocol) => (
                <div key={protocol.id} className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/20 to-indigo-400/20 border border-white/20 flex items-center justify-center">
                        <BookOpen size={20} className="text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-white font-medium">{protocol.name}</h4>
                          <div className="flex items-center space-x-1">
                            <Clock size={12} className="text-white/60" />
                            <span className="text-white/60 text-xs">{protocol.duration}m</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-white/60 text-xs mb-2">
                          <span>Created {formatLastModified(protocol.created_at)}</span>
                          <span>{protocol.goals.length} goals</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {protocol.goals.slice(0, 3).map((goal, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                              {goal}
                            </span>
                          ))}
                          {protocol.goals.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-black/30 text-white/60 rounded-full border border-white/10">
                              +{protocol.goals.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedProtocol(protocol)}
                        className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center hover:bg-blue-500/30 hover:scale-110 transition-all"
                        title="View Details"
                      >
                        <Edit size={14} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleCopyProtocol(protocol)}
                        className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center hover:bg-green-500/30 hover:scale-110 transition-all"
                        title="Copy Protocol"
                      >
                        <Copy size={14} className="text-green-400" />
                      </button>
                      <button
                        onClick={() => handleProtocolStart(protocol)}
                        className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center hover:bg-purple-500/30 hover:scale-110 transition-all"
                        title="Start Session"
                      >
                        <Play size={14} className="text-purple-400 ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleProtocolDelete(protocol.id)}
                        disabled={deletingProtocolId === protocol.id}
                        className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/30 hover:scale-110 transition-all disabled:opacity-50"
                        title="Delete Protocol"
                      >
                        {deletingProtocolId === protocol.id ? (
                          <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={14} className="text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <BookOpen size={28} className="text-purple-400" />
              </div>
              <h3 className="text-white text-xl font-medium mb-2">Your Library Awaits</h3>
              <p className="text-white/70 mb-6">Create custom protocols to build your personal transformation library</p>
              <button 
                onClick={() => {
                  closeModal('personalLibrary');
                  setActiveTab('create');
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200 flex items-center space-x-2 mx-auto"
              >
                <Plus size={16} />
                <span>Create Your First Protocol</span>
              </button>
            </div>
          )}

          {/* Token Cost Info */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20">
            <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
              <Star size={16} className="text-yellow-400" />
              <span>Protocol Creation</span>
            </h4>
            <p className="text-white/80 text-sm">
              Creating custom protocols costs <strong>5 tokens</strong> each. Complete sessions and maintain streaks to earn more tokens for your library.
            </p>
          </div>
        </div>
      </ModalShell>

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
                onClick={() => handleCopyProtocol(selectedProtocol)}
                className="px-4 py-3 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 transition-all hover:scale-105"
              >
                Copy
              </button>
              <button
                onClick={() => handleProtocolStart(selectedProtocol)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-xl text-black font-bold hover:scale-105 transition-transform duration-200 shadow-lg shadow-purple-400/30"
              >
                Start Session
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Protocol Overview */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-white text-sm font-bold">{selectedProtocol.duration}m</div>
                  <div className="text-white/60 text-xs">Duration</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-purple-400 text-sm font-bold">{selectedProtocol.goals.length}</div>
                  <div className="text-white/60 text-xs">Goals</div>
                </div>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-teal-400 text-sm font-bold">{selectedProtocol.metaphors.length}</div>
                  <div className="text-white/60 text-xs">Metaphors</div>
                </div>
              </div>
              <p className="text-white/80 text-sm text-center">
                Created {formatLastModified(selectedProtocol.created_at)}
              </p>
            </div>
            
            {/* Goals */}
            <div>
              <h4 className="text-white font-medium mb-3">Transformation Goals</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedProtocol.goals.map((goal, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                    <span className="text-white/80">{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Induction Method */}
            <div>
              <h4 className="text-white font-medium mb-2">Induction Method</h4>
              <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                <p className="text-white/80 text-sm capitalize">{selectedProtocol.induction}</p>
              </div>
            </div>

            {/* Custom Notes */}
            {selectedProtocol.deepener && (
              <div>
                <h4 className="text-white font-medium mb-2">Custom Notes</h4>
                <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                  <p className="text-white/80 text-sm">{selectedProtocol.deepener}</p>
                </div>
              </div>
            )}

            {/* Metaphors */}
            {selectedProtocol.metaphors.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Metaphors & Imagery</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProtocol.metaphors.map((metaphor, i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30">
                      {metaphor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </>
  );
}