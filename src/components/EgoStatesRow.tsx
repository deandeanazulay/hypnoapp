import React from 'react';
import { EGO_STATES, EgoState } from '../types/EgoState';

interface EgoStatesRowProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function EgoStatesRow({ selectedEgoState, onEgoStateChange }: EgoStatesRowProps) {
  const [animationPaused, setAnimationPaused] = React.useState(false);

  return (
    <div 
      className="relative overflow-hidden w-full flex justify-center items-center py-2"
      onMouseEnter={() => setAnimationPaused(true)}
      onMouseLeave={() => setAnimationPaused(false)}
    >
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container with pause on hover */}
      <div className={`flex items-center justify-start space-x-3 px-4 ${animationPaused ? '' : 'animate-scroll-x'}`}>
        {/* Triple the states for seamless infinite scroll */}
        {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => (
          <div key={`${state.id}-${index}`} className="flex-shrink-0 flex justify-center items-center">
            <div className="flex flex-col items-center justify-between space-y-2">
              <button
                onClick={() => onEgoStateChange(state.id)}
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${state.color} p-1 cursor-pointer transition-all duration-300 ${state.glowColor} shadow-lg border-2 flex items-center justify-center ${
                  selectedEgoState === state.id ? 'border-white/60 scale-110 opacity-100' : 'border-white/20 opacity-50 hover:opacity-75'
                }`}
                style={{
                  boxShadow: selectedEgoState === state.id
                    ? `0 0 20px ${state.glowColor.includes('blue') ? '#3b82f6' : 
                                  state.glowColor.includes('red') ? '#ef4444' : 
                                  state.glowColor.includes('green') ? '#22c55e' : 
                                  state.glowColor.includes('yellow') ? '#eab308' : 
                                  state.glowColor.includes('purple') ? '#a855f7' : 
                                  state.glowColor.includes('gray') ? '#9ca3af' : 
                                  state.glowColor.includes('orange') ? '#f97316' : 
                                  state.glowColor.includes('pink') ? '#ec4899' : '#6366f1'}80, inset 0 0 10px rgba(255,255,255,0.2)`
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
                <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-base">{state.icon}</span>
                </div>
              </button>
              
              {/* Ego state name */}
              <span className={`text-xs font-light tracking-wide transition-all duration-300 text-center flex items-center justify-center ${
                selectedEgoState === state.id ? 'text-white opacity-100' : 'text-white/40 opacity-60'
              }`}>
                {state.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}