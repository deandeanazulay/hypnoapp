import React from 'react';
import { X, Star, TrendingUp, Check } from 'lucide-react';
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

  const handleSaveAndApply = () => {
    setActiveEgoState(tempSelectedEgoState);
    closeEgoModal();
  };

  const handleCancel = () => {
    setTempSelectedEgoState(activeEgoState); // Reset to current active state
    closeEgoModal();
  };

  // Update temp selection when modal opens
  React.useEffect(() => {
    if (isEgoModalOpen) {
      setTempSelectedEgoState(activeEgoState);
    }
  }, [isEgoModalOpen, activeEgoState]);

  if (!isEgoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" style={{ maxHeight: '100svh' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={handleCancel} 
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-4xl sm:rounded-2xl bg-black/95 backdrop-blur-xl border border-white/20 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 border-b border-white/10 flex-shrink-0 sticky top-0 bg-black/60 backdrop-blur-xl">
          <div>
            <h3 className="text-white font-semibold text-xl">Choose your Ego State</h3>
            <p className="text-white/60 text-sm">This personalizes your orb & recommendations</p>
          </div>
          <button 
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={handleCancel}
            aria-label="Close ego state modal"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Ego State Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {egoStates.map((state) => {
              const isSelected = tempSelectedEgoState === state.id;
              return (
                <button
                  key={state.id}
                  onClick={() => setTempSelectedEgoState(state.id)}
                  className={`group relative rounded-xl border p-4 text-left transition-all duration-300 hover:scale-105 ${
                    isSelected 
                      ? 'border-white/60 ring-2 ring-white/20 shadow-xl' 
                      : 'border-white/10 hover:border-white/30'
                  } bg-gradient-to-br ${state.color} backdrop-blur-sm`}
                  aria-label={`Select ${state.name} ego state`}
                >
                  {/* Icon and Name */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <span className="text-lg">{state.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">{state.name}</div>
                      <div className="text-white/70 text-xs">{state.role}</div>
                    </div>
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                        <Check size={12} className="text-black" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-white/60 text-xs mb-3 line-clamp-2">
                    {state.description}
                  </div>

                  {/* Usage Analytics */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <TrendingUp size={10} className="text-white/50" />
                      <span className="text-white/70 text-xs font-medium">
                        {getUsageCount(state.id)} sessions
                      </span>
                    </div>
                    <span className="text-white/50 text-xs">
                      {getUsagePercentage(state.id)}%
                    </span>
                  </div>

                  {/* Usage Progress Bar */}
                  <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-white/60 rounded-full transition-all duration-500"
                      style={{ width: `${getUsagePercentage(state.id)}%` }}
                    />
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {state.usedFor.slice(0, 2).map((tag) => (
                      <span 
                        key={tag} 
                        className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-white/70 border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_60%)] transition-opacity duration-300" />
                </button>
              );
            })}
          </div>

          {/* Analytics Section */}
          <div className="space-y-4">
            {/* Most Used State */}
            {(() => {
              const maxUsage = Math.max(...Object.values(egoStateUsage));
              const mostUsedId = Object.entries(egoStateUsage).find(([_, count]) => count === maxUsage)?.[0];
              const mostUsedState = mostUsedId ? egoStates.find(s => s.id === mostUsedId) : null;
              
              if (mostUsedState) {
                return (
                  <div className={`bg-gradient-to-br ${mostUsedState.color} rounded-xl p-4 border border-white/30`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{mostUsedState.icon}</span>
                      <div>
                        <h4 className="text-white font-medium">Most Used: {mostUsedState.name}</h4>
                        <p className="text-white/70 text-sm">{getUsagePercentage(mostUsedState.id as EgoStateId)}% of sessions</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Usage Breakdown */}
            <div className="bg-gradient-to-br from-gray-500/5 to-slate-500/5 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <h4 className="text-white font-medium mb-3">Usage Analytics</h4>
              <div className="grid grid-cols-5 gap-2">
                {egoStates.slice(0, 10).map((state) => {
                  const percentage = getUsagePercentage(state.id);
                  const usage = getUsageCount(state.id);
                  
                  return (
                    <div key={state.id} className={`bg-gradient-to-br ${state.color} rounded-lg p-2 border border-white/20 flex flex-col justify-between h-full`}>
                      <div className="flex flex-col items-center mb-1">
                        <span className="text-sm mb-1">{state.icon}</span>
                        <span className="text-white text-xs font-medium text-center leading-tight">{state.name}</span>
                      </div>
                      
                      <div className="flex flex-col items-center mb-1">
                        <span className="text-white/70 text-xs font-medium">{usage}</span>
                        <span className="text-white/60 text-xs">{percentage}%</span>
                      </div>
                      
                      <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white/80 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 pt-3 border-t border-white/10 flex-shrink-0 sticky bottom-0 bg-black/60 backdrop-blur-xl">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-300"
            aria-label="Cancel ego state selection"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSaveAndApply}
            className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
            aria-label="Save and apply ego state selection"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
                </div>
              </div>

              {/* Description */}
              <div className="text-white/60 text-xs mb-3 line-clamp-2">
                {state.description}
              </div>

              {/* Usage Analytics */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <TrendingUp size={10} className="text-white/50" />
                  <span className="text-white/70 text-xs font-medium">
                    {getUsageCount(state.id)} sessions
                  </span>
                </div>
                <span className="text-white/50 text-xs">
                  {getUsagePercentage(state.id)}%
                </span>
              </div>

              {/* Usage Progress Bar */}
              <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-white/60 rounded-full transition-all duration-500"
                  style={{ width: `${getUsagePercentage(state.id)}%` }}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {state.usedFor.slice(0, 2).map((tag) => (
                  <span 
                    key={tag} 
                    className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 text-white/70 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Active indicator */}
              {activeEgoState === state.id && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-teal-400 rounded-full border-2 border-black" />
              )}

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_60%)] transition-opacity duration-300" />
            </button>
          ))}
        </div>

        {/* Footer with analytics summary */}
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>
            💡 Tip: You can switch states anytime from <span className="text-white/70 font-medium">Settings</span>
          </span>
          <span className="text-white/60">
            Total: {totalSessions} sessions
          </span>
        </div>
      </div>
    </div>
  );
}