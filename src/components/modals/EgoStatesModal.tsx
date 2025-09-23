import React from 'react';
import { X, Star } from 'lucide-react';
import { egoStates, useAppStore, EgoStateId } from '../../state/appStore';

export default function EgoStatesModal() {
  const { isEgoModalOpen, closeEgoModal, activeEgoState, setActiveEgoState } = useAppStore();

  if (!isEgoModalOpen) return null;

  const handleStateSelect = (id: EgoStateId) => {
    setActiveEgoState(id);
    closeEgoModal();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={closeEgoModal} 
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-4xl sm:rounded-2xl bg-black/95 backdrop-blur-xl border border-white/20 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-xl">Choose your Ego State</h3>
            <p className="text-white/60 text-sm">This personalizes your orb and recommendations</p>
          </div>
          <button 
            className="p-2 rounded-lg hover:bg-white/10 transition-colors" 
            onClick={closeEgoModal}
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {egoStates.map((state) => (
            <button
              key={state.id}
              onClick={() => handleStateSelect(state.id)}
              className={`group relative rounded-xl border p-4 text-left transition-all duration-300 hover:scale-105 ${
                activeEgoState === state.id 
                  ? 'border-white/60 ring-2 ring-white/20 shadow-xl' 
                  : 'border-white/10 hover:border-white/30'
              } bg-gradient-to-br ${state.color} backdrop-blur-sm`}
            >
              {/* Icon and Name */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <span className="text-lg">{state.icon}</span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{state.name}</div>
                  <div className="text-white/70 text-xs">{state.role}</div>
                </div>
              </div>

              {/* Description */}
              <div className="text-white/60 text-xs mb-3 line-clamp-2">
                {state.description}
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

        {/* Footer tip */}
        <div className="text-xs text-white/50 text-center">
          💡 Tip: You can switch states anytime from <span className="text-white/70 font-medium">Settings → Ego States</span>
        </div>
      </div>
    </div>
  );
}