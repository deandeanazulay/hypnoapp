import React from 'react';
import { X, Star, TrendingUp, Check, Lock, Zap } from 'lucide-react';
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

  const handleStepIntoState = () => {
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

  // Update temp selection when modal opens
  React.useEffect(() => {
    if (isEgoModalOpen) {
      setTempSelectedEgoState(activeEgoState);
    }
  }, [isEgoModalOpen, activeEgoState]);

  if (!isEgoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ maxHeight: '100svh' }}>
      {/* Enhanced Backdrop with Orb Glow */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        style={{
          background: currentState ? 
            `radial-gradient(circle at center, rgba(${currentState.color.includes('blue') ? '59, 130, 246' : 
                                                          currentState.color.includes('red') ? '239, 68, 68' : 
                                                          currentState.color.includes('green') ? '34, 197, 94' : 
                                                          currentState.color.includes('yellow') ? '234, 179, 8' : 
                                                          currentState.color.includes('purple') ? '168, 85, 247' : 
                                                          currentState.color.includes('gray') ? '156, 163, 175' : 
                                                          currentState.color.includes('orange') ? '249, 115, 22' : 
                                                          currentState.color.includes('pink') ? '236, 72, 153' : '99, 102, 241'}, 0.1) 0%, rgba(0, 0, 0, 0.9) 70%)`
            : 'rgba(0, 0, 0, 0.8)'
        }}
        onClick={handleCancel} 
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-5xl sm:rounded-3xl bg-black/95 backdrop-blur-xl border border-white/20 max-h-[90vh] flex flex-col shadow-2xl">
        {/* 🔹 SECTION 1: Current Identity (Top Highlight) */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-2xl font-light">Who Will You Become Today?</h2>
              <p className="text-white/60 text-sm">Libero adapts your sessions to match the archetype you channel</p>
            </div>
            <button 
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              onClick={handleCancel}
              aria-label="Close modal"
            >
              <X size={24} className="text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Current State Hero Card */}
          {currentState && (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentState.color} p-6 border-2 border-white/20 shadow-xl`}
                 style={{
                   boxShadow: `0 0 40px rgba(${currentState.color.includes('blue') ? '59, 130, 246' : 
                                                currentState.color.includes('red') ? '239, 68, 68' : 
                                                currentState.color.includes('green') ? '34, 197, 94' : 
                                                currentState.color.includes('yellow') ? '234, 179, 8' : 
                                                currentState.color.includes('purple') ? '168, 85, 247' : 
                                                currentState.color.includes('gray') ? '156, 163, 175' : 
                                                currentState.color.includes('orange') ? '249, 115, 22' : 
                                                currentState.color.includes('pink') ? '236, 72, 153' : '99, 102, 241'}, 0.3)`
                 }}>
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse" />
              
              <div className="relative z-10 flex items-center space-x-6">
                {/* Animated Orb */}
                <div className="relative w-20 h-20 rounded-full bg-black/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center animate-pulse">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent animate-spin-slow" />
                  <span className="text-4xl relative z-10">{currentState.icon}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white text-3xl font-bold mb-2">{currentState.name}</h3>
                  <p className="text-white/90 text-lg font-medium mb-3">{currentState.role}</p>
                  <p className="text-white/80 text-sm italic">{currentState.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔹 SECTION 2: Choose Your Ego State (Horizontal Grid) */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-white text-xl font-semibold mb-2">Explore Other States</h3>
            <p className="text-white/60 text-sm">Swipe to discover different archetypes that resonate with your journey</p>
          </div>

          {/* Horizontal Scrolling Grid */}
          <div className="overflow-x-auto scrollbar-hide pb-4">
            <div className="flex space-x-4" style={{ width: 'max-content' }}>
              {/* First Row */}
              <div className="flex flex-col space-y-4">
                {egoStates.slice(0, Math.ceil(egoStates.length / 2)).map((state) => {
                  const isSelected = tempSelectedEgoState === state.id;
                  const isUnlocked = isStateUnlocked(state.id);
                  const progress = getUnlockProgress(state.id);
                  
                  return (
                    <div
                      key={`row1-${state.id}`}
                      className="relative w-72 min-w-[18rem]"
                    >
                      <button
                        onClick={() => isUnlocked && setTempSelectedEgoState(state.id)}
                        disabled={!isUnlocked}
                        className={`relative w-full p-4 rounded-xl border transition-all duration-300 text-left group ${
                          isSelected 
                            ? `border-white/60 ring-2 ring-white/20 shadow-xl bg-gradient-to-br ${state.color}` 
                            : isUnlocked 
                              ? `border-white/20 hover:border-white/40 hover:scale-105 bg-gradient-to-br ${state.color} opacity-70 hover:opacity-100`
                              : 'border-white/10 bg-gradient-to-br from-gray-500/20 to-gray-700/20 opacity-40 cursor-not-allowed'
                        }`}
                        style={{
                          boxShadow: isSelected 
                            ? `0 0 30px rgba(${state.color.includes('blue') ? '59, 130, 246' : 
                                              state.color.includes('red') ? '239, 68, 68' : 
                                              state.color.includes('green') ? '34, 197, 94' : 
                                              state.color.includes('yellow') ? '234, 179, 8' : 
                                              state.color.includes('purple') ? '168, 85, 247' : 
                                              state.color.includes('gray') ? '156, 163, 175' : 
                                              state.color.includes('orange') ? '249, 115, 22' : 
                                              state.color.includes('pink') ? '236, 72, 153' : '99, 102, 241'}, 0.4)`
                            : 'none'
                        }}
                      >
                        {/* Lock overlay for locked states */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <Lock size={24} className="text-white/60 mx-auto mb-2" />
                              <div className="text-white/80 text-sm font-medium mb-1">
                                {progress.current}/{progress.required} sessions
                              </div>
                              <div className="w-32 h-1 bg-white/20 rounded-full mx-auto">
                                <div 
                                  className="h-full bg-white/60 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((progress.current / progress.required) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-lg">{state.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-white font-semibold text-base">{state.name}</h4>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                                  <Check size={12} className="text-black" />
                                </div>
                              )}
                            </div>
                            <p className="text-white/70 text-sm">{state.role}</p>
                          </div>
                        </div>

                        {/* Usage indicator for unlocked states */}
                        {isUnlocked && (
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>{getUsageCount(state.id)} sessions</span>
                            <span>{getUsagePercentage(state.id)}%</span>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Second Row */}
              <div className="flex flex-col space-y-4">
                {egoStates.slice(Math.ceil(egoStates.length / 2)).map((state) => {
                  const isSelected = tempSelectedEgoState === state.id;
                  const isUnlocked = isStateUnlocked(state.id);
                  const progress = getUnlockProgress(state.id);
                  
                  return (
                    <div
                      key={`row2-${state.id}`}
                      className="relative w-72 min-w-[18rem]"
                    >
                      <button
                        onClick={() => isUnlocked && setTempSelectedEgoState(state.id)}
                        disabled={!isUnlocked}
                        className={`relative w-full p-4 rounded-xl border transition-all duration-300 text-left group ${
                          isSelected 
                            ? `border-white/60 ring-2 ring-white/20 shadow-xl bg-gradient-to-br ${state.color}` 
                            : isUnlocked 
                              ? `border-white/20 hover:border-white/40 hover:scale-105 bg-gradient-to-br ${state.color} opacity-70 hover:opacity-100`
                              : 'border-white/10 bg-gradient-to-br from-gray-500/20 to-gray-700/20 opacity-40 cursor-not-allowed'
                        }`}
                        style={{
                          boxShadow: isSelected 
                            ? `0 0 30px rgba(${state.color.includes('blue') ? '59, 130, 246' : 
                                              state.color.includes('red') ? '239, 68, 68' : 
                                              state.color.includes('green') ? '34, 197, 94' : 
                                              state.color.includes('yellow') ? '234, 179, 8' : 
                                              state.color.includes('purple') ? '168, 85, 247' : 
                                              state.color.includes('gray') ? '156, 163, 175' : 
                                              state.color.includes('orange') ? '249, 115, 22' : 
                                              state.color.includes('pink') ? '236, 72, 153' : '99, 102, 241'}, 0.4)`
                            : 'none'
                        }}
                      >
                        {/* Lock overlay for locked states */}
                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                              <Lock size={24} className="text-white/60 mx-auto mb-2" />
                              <div className="text-white/80 text-sm font-medium mb-1">
                                {progress.current}/{progress.required} sessions
                              </div>
                              <div className="w-32 h-1 bg-white/20 rounded-full mx-auto">
                                <div 
                                  className="h-full bg-white/60 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((progress.current / progress.required) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-lg">{state.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-white font-semibold text-base">{state.name}</h4>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                                  <Check size={12} className="text-black" />
                                </div>
                              )}
                            </div>
                            <p className="text-white/70 text-sm">{state.role}</p>
                          </div>
                        </div>

                        {/* Usage indicator for unlocked states */}
                        {isUnlocked && (
                          <div className="flex items-center justify-between text-xs text-white/50">
                            <span>{getUsageCount(state.id)} sessions</span>
                            <span>{getUsagePercentage(state.id)}%</span>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 SECTION 3: Analytics & Insights (Bottom) */}
        <div className="flex-shrink-0 p-6 border-t border-white/10 bg-gradient-to-br from-black/50 to-gray-900/30">
          <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
            <TrendingUp size={24} className="mr-3 text-teal-400" />
            Patterns in Your Transformation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Used State */}
            {mostUsedState && (
              <div className={`p-4 rounded-xl bg-gradient-to-br ${mostUsedState.color} border border-white/20 shadow-lg`}>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <span className="text-lg">{mostUsedState.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-lg">Your Subconscious Returns Most Often to:</h4>
                    <p className="text-white/90 font-bold text-xl">{mostUsedState.name}</p>
                    <p className="text-white/70 text-sm">{getUsagePercentage(mostUsedState.id as EgoStateId)}% of sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress & Insights */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
              <div className="flex items-center space-x-3 mb-3">
                <Zap size={20} className="text-purple-400" />
                <div>
                  <h4 className="text-white font-medium">Mind Explorer</h4>
                  <p className="text-purple-300 text-sm">You've unlocked {unlockedCount} of {egoStates.length} states</p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-white/60 mb-2">
                  <span>Exploration Progress</span>
                  <span>{exploredCount}/{unlockedCount} experienced</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${unlockedCount > 0 ? (exploredCount / unlockedCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
              
              <p className="text-white/70 text-sm italic">
                {exploredCount < unlockedCount / 2 
                  ? "Your journey of self-discovery is just beginning..."
                  : exploredCount < unlockedCount * 0.8
                    ? "You're becoming a balanced explorer of consciousness."
                    : "You've mastered the art of archetypal transformation."}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-gradient-to-r from-black/80 to-gray-900/80">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
          >
            Cancel
          </button>
          
          <button
            onClick={handleStepIntoState}
            className="px-8 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg"
            style={{
              boxShadow: '0 0 20px rgba(20, 184, 166, 0.4)',
              filter: 'drop-shadow(0 0 10px rgba(20, 184, 166, 0.3))'
            }}
          >
            ✨ Step Into This State
          </button>
        </div>
      </div>
    </div>
  );
}