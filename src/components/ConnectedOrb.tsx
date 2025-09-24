import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import WebGLOrb, { WebGLOrbRef } from './WebGLOrb';
import { useGameState } from './GameStateManager';

interface ConnectedOrbProps {
  onTap: () => void;
  className?: string;
  size?: number;
  showHint?: boolean;
}

export interface ConnectedOrbRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

const ConnectedOrb = forwardRef<ConnectedOrbRef, ConnectedOrbProps>(({ 
  onTap, 
  className = '', 
  size = 320,
  showHint = true 
}, ref) => {
  const { user, getOrbState } = useGameState();
  const orbRef = useRef<WebGLOrbRef>(null);

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      orbRef.current?.updateState(state);
    },
    setSpeaking: (speaking: boolean) => {
      orbRef.current?.setSpeaking(speaking);
    },
    setListening: (listening: boolean) => {
      orbRef.current?.setListening(listening);
    }
  }));

  const orbState = getOrbState();

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Level indicator */}
      <div className="mb-4 text-center">
        <div className="text-teal-400 text-sm font-medium mb-1">
          Level {user.level}
        </div>
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${(user.experience % 100)}%` }}
          />
        </div>
      </div>

      {/* The Orb */}
      <WebGLOrb
        ref={orbRef}
        onTap={onTap}
        size={size}
      />

      {/* State display */}
      {showHint && (
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm mb-1">
            {user.currentState === 'calm' && 'Centered & Peaceful'}
            {user.currentState === 'focused' && 'Sharp & Alert'}
            {user.currentState === 'stressed' && 'Tension Present'}
            {user.currentState === 'deep' && 'Deeply Relaxed'}
            {user.currentState === 'transcendent' && 'Beyond Ordinary'}
          </p>
          <p className="text-white/40 text-xs">
            {user.sessionStreak > 0 ? `${user.sessionStreak} day streak` : 'Tap to begin'}
          </p>
        </div>
      )}

      {/* Achievement notifications */}
      {user.achievements.length > 0 && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
          {user.achievements[user.achievements.length - 1]}
        </div>
      )}
    </div>
  );
});

ConnectedOrb.displayName = 'ConnectedOrb';

export default ConnectedOrb;