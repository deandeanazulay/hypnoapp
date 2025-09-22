import React from 'react';

interface EgoState {
  id: string;
  label: string;
  color: string;
  glowColor: string;
  description: string;
  voiceTone: string;
}

const egoStates: EgoState[] = [
  { 
    id: 'protector', 
    label: 'Calm', 
    color: 'from-teal-400 to-cyan-400', 
    glowColor: 'shadow-teal-400/50',
    description: 'Safe, supported, steady',
    voiceTone: 'parasympathetic'
  },
  { 
    id: 'performer', 
    label: 'Focus', 
    color: 'from-cyan-400 to-blue-400', 
    glowColor: 'shadow-cyan-400/50',
    description: 'Sharp, precise, on command',
    voiceTone: 'crisp'
  },
  { 
    id: 'nurturer', 
    label: 'Stress', 
    color: 'from-amber-400 to-orange-400', 
    glowColor: 'shadow-amber-400/50',
    description: 'Gentle, softening, unwinding',
    voiceTone: 'gentle'
  },
  { 
    id: 'sage', 
    label: 'Joy', 
    color: 'from-yellow-400 to-amber-400', 
    glowColor: 'shadow-yellow-400/50',
    description: 'Expansive, grateful, clear',
    voiceTone: 'upbeat'
  },
  { 
    id: 'explorer', 
    label: 'Curiosity', 
    color: 'from-cyan-400 to-teal-400', 
    glowColor: 'shadow-cyan-400/50',
    description: 'Curious, playful, flexible',
    voiceTone: 'playful'
  }
];

interface StoriesRowProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
}

export default function StoriesRow({ selectedEgoState, onEgoStateChange }: StoriesRowProps) {
  return (
    <div className="px-4 py-2">
      <div className="flex justify-center items-center space-x-3 sm:space-x-4">
        {egoStates.map((state) => (
          <div key={state.id} className="flex flex-col items-center space-y-1">
            <button
              onClick={() => onEgoStateChange(state.id)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${state.color} p-1 cursor-pointer transition-all duration-300 hover:scale-105 ${state.glowColor} shadow-lg border-2 ${
                selectedEgoState === state.id ? 'border-white/60 scale-110' : 'border-white/20'
              }`}
              style={{
                boxShadow: selectedEgoState === state.id 
                  ? `0 0 20px ${state.glowColor.includes('teal') ? '#14b8a6' : state.glowColor.includes('cyan') ? '#06b6d4' : state.glowColor.includes('amber') ? '#f59e0b' : state.glowColor.includes('yellow') ? '#eab308' : '#14b8a6'}80, inset 0 0 10px rgba(255,255,255,0.2)`
                  : `0 0 15px ${state.glowColor.includes('teal') ? '#14b8a6' : state.glowColor.includes('cyan') ? '#06b6d4' : state.glowColor.includes('amber') ? '#f59e0b' : state.glowColor.includes('yellow') ? '#eab308' : '#14b8a6'}60, inset 0 0 10px rgba(255,255,255,0.1)`
              }}
            >
              <div className="w-full h-full rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${state.color} opacity-80 ${
                  selectedEgoState === state.id ? 'animate-pulse' : ''
                }`} />
              </div>
            </button>
            <span className={`text-xs sm:text-xs font-semibold tracking-wide transition-colors duration-300 ${
              selectedEgoState === state.id ? 'text-white' : 'text-white/70'
            }`}>
              {state.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Selected state description */}
      <div className="text-center mt-2">
        <p className="text-white/60 text-xs">
          {egoStates.find(s => s.id === selectedEgoState)?.description || 'Select your current state'}
        </p>
      </div>
    </div>
  );
}