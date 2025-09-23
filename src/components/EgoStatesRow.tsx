import React from 'react';
import { EGO_STATES, EgoState } from '../types/EgoState';

interface EgoStatesRowProps {
  selectedEgoState: string;
  onEgoStateChange: (egoStateId: string) => void;
}

export default function EgoStatesRow({ selectedEgoState, onEgoStateChange }: EgoStatesRowProps) {
  return (
    <div className="relative overflow-hidden w-full flex justify-center items-center py-0.5 sm:py-1">
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container - continuous animation */}
      <div className="flex items-center justify-start space-x-1 sm:space-x-1.5 px-2 sm:px-3 animate-scroll-x hover:brightness-125 transition-all duration-300">
        {/* Triple the states for seamless infinite scroll */}
        {[...EGO_STATES, ...EGO_STATES, ...EGO_STATES].map((state, index) => {
          const isSelected = selectedEgoState === state.id;
          return (
          <div key={`${state.id}-${index}`} className="flex-shrink-0 flex justify-center items-center">
            <div className="flex flex-col items-center justify-between space-y-0.5 sm:space-y-1">
              <button
                onClick={() => onEgoStateChange(state.id)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${state.color} p-1 cursor-pointer transition-all duration-300 ${state.glowColor} shadow-lg border-2 flex items-center justify-center hover:brightness-110 hover:scale-105 ${
                  isSelected ? 'border-white/60 scale-110 opacity-100 brightness-110' : 'border-white/20 opacity-50 hover:opacity-85'
                }`}
                style={{
                  boxShadow: isSelected
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
                  <span className="text-sm sm:text-base">{state.icon}</span>
                </div>
              </button>
              
              {/* Ego state name */}
              <span className={`text-xs font-light tracking-wide transition-all duration-300 text-center flex items-center justify-center hidden sm:block ${
                isSelected ? 'text-white opacity-100' : 'text-white/40 opacity-60'
              }`}>
                {state.name}
              </span>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}