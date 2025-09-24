import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { EGO_STATES as egoStates, useAppStore, EgoStateId } from '../../store';
import { useGameState } from '../GameStateManager';

export default function EgoStatesModal() {
  const { modals, closeEgoModal, activeEgoState, setActiveEgoState } = useAppStore();
  const isEgoModalOpen = modals.egoStates;
  const { user } = useGameState();
  const [tempSelectedEgoState, setTempSelectedEgoState] = React.useState<EgoStateId>(activeEgoState);

  // Use real usage data from GameStateManager
  const egoStateUsage = user.egoStateUsage;
  const totalSessions = Object.values(egoStateUsage).reduce((sum, count) => sum + count, 0);

  const getUsageCount = (stateId: EgoStateId) => {
    return egoStateUsage[stateId] || 0;
  };

  const getUsagePercentage = (stateId: EgoStateId) => {
    const count = egoStateUsage[stateId] || 0;
    return totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
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
  const unlockedCount = egoStates.filter(state => getUsageCount(state.id) >= 0).length;

  // Get other available states (exclude current)
  const otherStates = (egoStates || [])
    .filter(state => state.id !== tempSelectedEgoState)
    .slice(0, 6); // Show 6 states in 2x3 grid

  // Update temp selection when modal opens
  React.useEffect(() => {
    if (isEgoModalOpen) {
      setTempSelectedEgoState(activeEgoState);
    }
  }, [isEgoModalOpen, activeEgoState]);

  if (!isEgoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ maxHeight: '100dvh' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={handleCancel} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-black/95 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white text-lg font-semibold">Choose Your Guide</h2>
          <button 
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            <X size={20} className="text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Current Selected State - Hero Card */}
          {currentState && (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentState.color} p-6 border border-white/30 text-center`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              
              <div className="relative z-10">
                <div className="text-4xl mb-3">{currentState.icon}</div>
                <h3 className="text-white font-bold text-xl mb-2">{currentState.name}</h3>
                <p className="text-white/90 text-sm mb-4">{currentState.role}</p>
                
                {/* Trait Pills */}
                <div className="flex items-center justify-center flex-wrap gap-2">
                  {(currentState.usedFor || []).slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-black/20 backdrop-blur-sm border border-white/20 text-white/90 rounded-full text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Explore Other States */}
          <div>
            <h3 className="text-white text-base font-semibold mb-3">Explore Other States</h3>
            <div className="grid grid-cols-2 gap-3">
              {otherStates.map((state) => (
                <button
                  key={state.id}
                  onClick={() => setTempSelectedEgoState(state.id)}
                  className={`relative p-4 rounded-xl border transition-all duration-300 text-left group hover:scale-105 bg-gradient-to-br ${state.color} border-white/20 hover:border-white/40 min-h-[100px]`}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{state.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm">{state.name}</h4>
                        <p className="text-white/70 text-xs">{state.role.split(',')[0]}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-white/60">
                      {getUsageCount(state.id)} sessions
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Patterns in Your Transformation */}
          <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-white font-semibold mb-3 flex items-center text-sm">
              <Sparkles size={16} className="mr-2 text-purple-400" />
              Patterns in Your Transformation
            </h3>
            
            <div className="space-y-2 text-xs text-white/80">
              {mostUsedState && (
                <div>
                  <span className="text-purple-300">Your subconscious returns most often to: </span>
                  <span className="text-white font-medium">{mostUsedState.name} ({getUsagePercentage(mostUsedState.id as EgoStateId)}%)</span>
                </div>
              )}
              
              <div>
                <span className="text-purple-300">You've unlocked </span>
                <span className="text-white font-medium">{unlockedCount} of {egoStates.length} archetypes</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleChannelState}
            className="w-full py-4 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Channel This State
          </button>
        </div>
      </div>
    </div>
  );
}