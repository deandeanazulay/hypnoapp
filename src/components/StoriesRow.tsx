import React from 'react';
import { useState } from 'react';

import { EGO_STATES } from '../types/EgoState';

interface StoriesRowProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
}

export default function StoriesRow({ selectedEgoState, onEgoStateChange }: StoriesRowProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="relative overflow-hidden py-4"
         onMouseLeave={() => setHoveredId(null)}>
      {/* Auto-scrolling container */}
      <div className="flex animate-scroll space-x-4 px-4" style={{ 
        animation: 'scroll 30s linear infinite',
        width: 'calc(100% + 400px)'
      }}>
        {/* Duplicate the states for seamless loop */}
        {[...EGO_STATES, ...EGO_STATES].map((state, index) => (
          <div key={`${state.id}-${index}`} className="flex-shrink-0">
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => onEgoStateChange(state.id)}
                onMouseEnter={() => setHoveredId(state.id)}
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${state.color} p-1 cursor-pointer transition-all duration-300 ${state.glowColor} shadow-lg border-2 ${
                  selectedEgoState === state.id ? 'border-white/60 scale-110 opacity-100' : 
                  hoveredId === state.id ? 'border-white/40 scale-105 opacity-100' :
                  'border-white/20 opacity-50 hover:opacity-75'
              }`}
              style={{
                boxShadow: selectedEgoState === state.id || hoveredId === state.id
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
                <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <span className="text-lg">{state.icon}</span>
                </div>
              </button>
              
              {/* Ego state name */}
              <span className={`text-xs font-light tracking-wide transition-all duration-300 ${
                selectedEgoState === state.id ? 'text-white opacity-100' :
                hoveredId === state.id ? 'text-white/90 opacity-100' :
                'text-white/40 opacity-60'
              }`}>
                {state.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient overlay for fading edges */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/80 via-transparent via-transparent to-black/80" />

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}