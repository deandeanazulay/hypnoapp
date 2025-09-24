import React, { useState } from 'react';
import { Info, TrendingUp } from 'lucide-react';
import ModalShell from '../layout/ModalShell';
import { EGO_STATES, useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import { getEgoColor } from '../../config/theme';

export default function EgoStatesModal() {
  const { modals, closeModal, activeEgoState, setActiveEgoState } = useAppStore();
  const { user } = useGameState();
  const [selectedState, setSelectedState] = useState(activeEgoState);

  const handleSelectEgoState = (stateId: string) => {
    setSelectedState(stateId);
    setActiveEgoState(stateId);
    closeModal('egoStates');
  };

  // Safe access to ego state usage
  const getUsagePercentage = (stateId: string) => {
    if (!user?.ego_state_usage) return 0;
    const totalUsage = Object.values(user.ego_state_usage).reduce((sum, count) => sum + count, 0);
    if (totalUsage === 0) return 0;
    return Math.round(((user.ego_state_usage[stateId] || 0) / totalUsage) * 100);
  };

  const getMostUsedState = () => {
    if (!user?.ego_state_usage) return null;
    const entries = Object.entries(user.ego_state_usage);
    if (entries.length === 0) return null;
    const [stateId] = entries.reduce((max, current) => current[1] > max[1] ? current : max);
    return EGO_STATES.find(state => state.id === stateId);
  };

  const mostUsedState = getMostUsedState();

  return (
    <ModalShell
      isOpen={modals.egoStates}
      onClose={() => closeModal('egoStates')}
      title="Choose how Libero shows up for you"
      className="max-w-4xl overflow-y-auto"
    >
      <div className="space-y-6 overflow-y-auto">
        {/* Usage Insights */}
        {user && mostUsedState && (
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-teal-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp size={16} className="text-teal-400" />
              <h3 className="text-white font-medium">Your Journey Patterns</h3>
            </div>
            <p className="text-white/80 text-sm">
              You've used <strong>{mostUsedState.name}</strong> most often ({getUsagePercentage(mostUsedState.id)}% of sessions).
              Try different states to unlock new transformation pathways.
            </p>
          </div>
        )}

        {/* Ego States Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4">
          {EGO_STATES.map((state) => {
            const isSelected = selectedState === state.id;
            const isActive = activeEgoState === state.id;
            const egoColor = getEgoColor(state.id);
            const usagePercent = getUsagePercentage(state.id);
            
            return (
              <button
                key={state.id}
                onClick={() => handleSelectEgoState(state.id)}
                className={`group relative bg-gradient-to-br ${egoColor.bg} backdrop-blur-sm border transition-all duration-300 hover:border-white/40 hover:scale-105 rounded-2xl p-4 text-center overflow-hidden ${
                  isActive ? 'border-white/60 ring-2 ring-white/30' : 
                  isSelected ? 'border-white/40' : 
                  'border-white/20'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${egoColor.accent}20, ${egoColor.accent}10)`,
                  boxShadow: isActive ? `0 0 20px ${egoColor.accent}40` : undefined
                }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full border-2 border-black animate-pulse" />
                )}

                {/* Icon */}
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {state.icon}
                </div>
                
                {/* Name & Role */}
                <h3 className="text-white font-semibold text-lg mb-1">{state.name}</h3>
                <p className="text-white/80 text-sm mb-3">{state.role}</p>
                
                {/* Description */}
                <p className="text-white/60 text-xs leading-relaxed mb-4 line-clamp-2">
                  {state.description}
                </p>
                
                {/* Usage Stats */}
                {user && usagePercent > 0 && (
                  <div className="bg-black/20 rounded-lg p-2 border border-white/10">
                    <div className="text-white/80 text-xs font-medium mb-1">
                      {usagePercent}% of your sessions
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r transition-all duration-500"
                        style={{ 
                          width: `${usagePercent}%`,
                          background: `linear-gradient(90deg, ${egoColor.accent}, ${egoColor.accent}cc)`
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center space-x-2 mb-2">
            <Info size={16} className="text-purple-400" />
            <h3 className="text-white font-medium">Archetypal Guidance</h3>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Each ego state channels different energies and approaches. Guardian offers protection and grounding, 
            Rebel brings liberation, Healer provides restoration. Choose the guide that resonates with your current intention.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}