import React from 'react';
import { EGO_STATES, EgoState } from '../types/EgoState';

interface EgoStatesRowProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function EgoStatesRow({ selectedEgoState, onEgoStateChange }: EgoStatesRowProps) {
  return (
    <div className="px-4 py-3">
      {/* Title */}
      <div className="text-center mb-4">
        <h2 className="text-white/80 text-sm font-medium tracking-wide">THE 9 EGO STATES</h2>
        <p className="text-white/50 text-xs mt-1">Choose your inner guide</p>
      </div>

      {/* Ego States Grid - Responsive */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 justify-items-center">
        {EGO_STATES.map((state) => (
          <div key={state.id} className="flex flex-col items-center space-y-2">
            <button
              onClick={() => onEgoStateChange(state.id)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${state.color} p-1 cursor-pointer transition-all duration-300 hover:scale-105 ${state.glowColor} shadow-lg border-2 ${
                selectedEgoState === state.id ? 'border-white/80 scale-110 ring-2 ring-white/30' : 'border-white/20'
              }`}
              style={{
                boxShadow: selectedEgoState === state.id 
                  ? `0 0 25px ${state.glowColor.includes('blue') ? '#3b82f6' : 
                                state.glowColor.includes('red') ? '#ef4444' : 
                                state.glowColor.includes('green') ? '#22c55e' : 
                                state.glowColor.includes('yellow') ? '#eab308' : 
                                state.glowColor.includes('purple') ? '#a855f7' : 
                                state.glowColor.includes('gray') ? '#9ca3af' : 
                                state.glowColor.includes('orange') ? '#f97316' : 
                                state.glowColor.includes('pink') ? '#ec4899' : '#6366f1'}80, inset 0 0 15px rgba(255,255,255,0.2)`
                  : `0 0 15px ${state.glowColor.includes('blue') ? '#3b82f6' : 
                                state.glowColor.includes('red') ? '#ef4444' : 
                                state.glowColor.includes('green') ? '#22c55e' : 
                                state.glowColor.includes('yellow') ? '#eab308' : 
                                state.glowColor.includes('purple') ? '#a855f7' : 
                                state.glowColor.includes('gray') ? '#9ca3af' : 
                                state.glowColor.includes('orange') ? '#f97316' : 
                                state.glowColor.includes('pink') ? '#ec4899' : '#6366f1'}60, inset 0 0 10px rgba(255,255,255,0.1)`
              }}
            >
              <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-lg">{state.icon}</span>
              </div>
            </button>
            
            <div className="text-center">
              <span className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                selectedEgoState === state.id ? 'text-white' : 'text-white/70'
              }`}>
                {state.name}
              </span>
              {selectedEgoState === state.id && (
                <p className="text-white/60 text-xs mt-1 max-w-20 leading-tight">
                  {state.role.split(',')[0]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected State Description */}
      <div className="text-center mt-4 min-h-[3rem] flex items-center justify-center">
        {/* Description space reserved for future content */}
      </div>
    </div>
  );
}