import React from 'react';
import { X, Star, TrendingUp, Check, Lock, Zap, Sparkles } from 'lucide-react';
import { egoStates, useAppStore, EgoStateId } from '../../state/appStore';
import { useGameState } from '../GameStateManager';

export default function EgoStatesModal() {
  const { isEgoModalOpen, closeEgoModal, activeEgoState, setActiveEgoState } = useAppStore();
  const { user } = useGameState();
  const [tempSelectedEgoState, setTempSelectedEgoState] = React.useState<EgoStateId>(activeEgoState);

  // Use real usage data from GameStateManager
  const egoStateUsage = user.egoStateUsage;
  const totalSessions = Object.values(egoStateUsage).reduce((sum, count) => sum + count, 0);

  const getUsagePercentage = (stateId: EgoStateId) => {
    const count = egoStateUsage[stateId] || 0;
    return totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
  };

  const getUsageCount = (stateId: EgoStateId) => {
    return egoStateUsage[stateId] || 0;
  };

  // Check if state is unlocked
  const isStateUnlocked = (stateId: EgoStateId) => {
    const unlockRequirements: { [key: string]: number } = {
      guardian: 0, rebel: 0, healer: 0, explorer: 0, // Core states always unlocked
      mystic: 5, sage: 8, child: 3, performer: 6, shadow: 15, // Unlock requirements
      builder: 10, seeker: 7, lover: 12, trickster: 20, warrior: 18, visionary: 25
    };
    
    const required = unlockRequirements[stateId] || 0;
    return totalSessions >= required;
  };

  const getUnlockProgress = (stateId: EgoStateId) => {
    const unlockRequirements: { [key: string]: number } = {
      mystic: 5, sage: 8, child: 3, performer: 6, shadow: 15,
      builder: 10, seeker: 7, lover: 12, trickster: 20, warrior: 18, visionary: 25
    };
    
    const required = unlockRequirements[stateId] || 0;
    return { current: totalSessions, required };
  };

  const handleChannelState = () => {
    setActiveEgoState(tempSelectedEgoState);
    closeEgoModal();
  };

  const handleCancel = () => {
    setTempSelectedEgoState(activeEgoState);
    closeEgoModal();
  };

  // Get the currently selected state
  const currentState = egoStates.find(state => state.id === tempSelectedEgoState);
  
  // Get most used state for analytics
  const maxUsage = Math.max(...Object.values(egoStateUsage));
  const mostUsedId = Object.entries(egoStateUsage).find(([_, count]) => count === maxUsage)?.[0];
  const mostUsedState = mostUsedId ? egoStates.find(s => s.id === mostUsedId) : null;
  
  // Calculate exploration progress
  const unlockedCount = egoStates.filter(state => isStateUnlocked(state.id)).length;
  const exploredCount = Object.keys(egoStateUsage).filter(id => egoStateUsage[id] > 0).length;

  // Get other available states (exclude current, show up to 8 unlocked)
  const otherStates = egoStates
    .filter(state => state.id !== tempSelectedEgoState && isStateUnlocked(state.id))
    .slice(0, 8);

  // Get user badges based on session counts
  const getUserBadges = () => {
    const badges = [];
    const currentUsage = getUsageCount(tempSelectedEgoState);
    
    if (currentUsage >= 20) {
      badges.push(`${currentState?.name} Mastery`);
    }
    if (exploredCount >= 8) {
      badges.push('Archetypal Explorer');
    }
    if (unlockedCount >= 12) {
      badges.push('Consciousness Pioneer');
    }
    
    return badges;
  };

  // Get polarity insights
  const getPolarityInsight = () => {
    const usage = Object.entries(egoStateUsage)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a);
    
    if (usage.length >= 2) {
      const [first, second] = usage;
      const firstName = egoStates.find(s => s.id === first[0])?.name;
      const secondName = egoStates.find(s => s.id === second[0])?.name;
      return `${firstName} ↔ ${secondName}`;
    }
    
    return null;
  };
  // Update temp selection when modal opens
  React.useEffect(() => {
    if (isEgoModalOpen) {
      setTempSelectedEgoState(activeEgoState);
    }
  }, [isEgoModalOpen, activeEgoState]);

  if (!isEgoModalOpen) return null;

  const userBadges = getUserBadges();
  const polarityInsight = getPolarityInsight();
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ maxHeight: '100svh' }}>
      {/* Enhanced Backdrop with Dynamic Orb Glow */}
      <div 
        className="absolute inset-0 backdrop-blur-xl transition-all duration-1000" 
        style={{
          background: currentState ? 
            `radial-gradient(ellipse at center, rgba(${currentState.color.includes('blue') ? '59, 130, 246' : 
                                                          currentState.color.includes('red') ? '239, 68, 68' : 
                                                          currentState.color.includes('green') ? '34, 197, 94' : 
                                                          currentState.color.includes('yellow') ? '234, 179, 8' : 
                                                          currentState.color.includes('purple') ? '168, 85, 247' : 
                                                          currentState.color.includes('gray') ? '156, 163, 175' : 
                                                          currentState.color.includes('orange') ? '249, 115, 22' : 
                                                          currentState.color.includes('pink') ? '236, 72, 153' : '99, 102, 241'}, 0.15) 0%, rgba(0, 0, 0, 0.95) 60%)`
            : 'rgba(0, 0, 0, 0.9)'
        }}
        onClick={handleCancel} 
      />

      {/* Compact Modal - No Scrolling */}
      <div className="relative w-full max-w-2xl bg-black/95 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-white text-2xl font-bold mb-1">Who Will You Become Today?</h2>
            <p className="text-white/70 text-sm">Libero adapts your sessions to match the archetype you channel</p>
          </div>
          <button 
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            <X size={24} className="text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Hero Card - Current Selected State */}
          {currentState && (
            <div>
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentState.color} p-8 border-2 border-white/30 shadow-2xl group`}
                   style={{
                     boxShadow: `0 0 60px rgba(${currentState.color.includes('blue') ? '59, 130, 246' : 
                                                  currentState.color.includes('red') ? '239, 68, 68' : 
                                                  currentState.color.includes('green') ? '34, 197, 94' : 
                                                  currentState.color.includes('yellow') ? '234, 179, 8' : 
                                                  currentState.color.includes('purple') ? '168, 85, 247' : 
                                                  currentState.color.includes('gray') ? '156, 163, 175' : 
                                                  currentState.color.includes('orange') ? '249, 115, 22' : 
                                                  currentState.color.includes('pink') ? '236, 72, 153' : '99, 102, 241'}, 0.4), inset 0 0 30px rgba(255, 255, 255, 0.1)`
                   }}>
                {/* Animated Aura Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-gradient-x" />
                
                <div className="relative z-10 text-center">
                  {/* Living Orb - Libero's Avatar */}
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent animate-spin-slow" />
                      <span className="text-4xl relative z-10 group-hover:scale-110 transition-transform duration-500">{currentState.icon}</span>
                    </div>
                    
                    {/* Breathing Aura Effect */}
                    <div className="absolute -inset-4">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-white/60 rounded-full animate-ping"
                          style={{
                            top: `${20 + (i * 10)}%`,
                            left: `${15 + (i * 15)}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: '3s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-white text-2xl font-bold mb-1">{currentState.name}</h3>
                  <p className="text-white/90 text-lg font-medium mb-3">{currentState.role}</p>
                  
                  {/* Trait Pills */}
                  <div className="flex items-center justify-center space-x-3">
                    {currentState.usedFor.slice(0, 3).map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-black/30 backdrop-blur-sm border border-white/30 text-white/90 rounded-full text-xs font-medium hover:bg-black/40 transition-colors"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explore Other States - Compact Horizontal Cards */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-3">Explore Other States</h3>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {otherStates.map((state) => (
                <button
                  key={state.id}
                  onClick={() => setTempSelectedEgoState(state.id)}
                  className={`relative p-3 rounded-lg border transition-all duration-300 text-left group hover:scale-105 bg-gradient-to-br ${state.color} border-white/20 hover:border-white/40 opacity-70 hover:opacity-100`}
                  style={{
                    boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-sm">{state.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm">{state.name}</h4>
                      <p className="text-white/70 text-xs">{state.role.split(',')[0]}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-white/50">
                    {getUsageCount(state.id)} sessions
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Patterns in Your Transformation */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center">
              <Sparkles size={18} className="mr-2 text-purple-400" />
              Patterns in Your Transformation
            </h3>
            
            <div className="space-y-3 text-sm">
              {mostUsedState && (
                <div>
                  <span className="text-purple-300">Your subconscious returns most often to: </span>
                  <span className="text-white font-semibold">{mostUsedState.name} ({getUsagePercentage(mostUsedState.id as EgoStateId)}%)</span>
                </div>
              )}
              
              <div>
                <span className="text-purple-300">You've unlocked </span>
                <span className="text-white font-semibold">{unlockedCount} of {egoStates.length} archetypes</span>
              </div>
              
              {polarityInsight && (
                <div>
                  <span className="text-purple-300">Your strongest polarity is between: </span>
                  <span className="text-white font-semibold">{polarityInsight}</span>
                </div>
              )}
            </div>
            
            {/* Badges */}
            {userBadges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {userBadges.map((badge, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 rounded-full text-xs font-medium flex items-center"
                  >
                    <Crown size={12} className="mr-1" />
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/80 font-medium transition-all duration-300 hover:text-white"
            >
              Cancel
            </button>
            
            <div className="text-center">
              <button
                onClick={handleChannelState}
                className="px-8 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold hover:scale-105 transition-all duration-300 shadow-2xl"
                style={{
                  boxShadow: '0 0 30px rgba(20, 184, 166, 0.5)',
                  filter: 'drop-shadow(0 0 15px rgba(20, 184, 166, 0.4))'
                }}
              >
                ✨ Channel This State
              </button>
              <p className="text-white/50 text-xs mt-2 italic">
                This choice shapes your Orb and sessions today
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}