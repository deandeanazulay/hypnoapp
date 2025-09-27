import React, { useEffect, useState } from 'react';
import WebGLOrb, { WebGLOrbRef } from './WebGLOrb';
import CSSOrb from './ui/CSSOrb';
import { useGameState } from './GameStateManager';

interface OrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  afterglow?: boolean;
  variant?: 'webgl' | 'css' | 'auto';
}

// Orb evolution based on user progress
function getOrbEvolutionLevel(userLevel: number): 'basic' | 'enhanced' | 'advanced' | 'master' {
  if (userLevel >= 15) return 'master';
  if (userLevel >= 10) return 'advanced';
  if (userLevel >= 5) return 'enhanced';
  return 'basic';
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export default function Orb({ variant = 'auto', size = 560, ...props }: OrbProps) {
  const { user } = useGameState();
  const [useWebGL, setUseWebGL] = useState<boolean | null>(null);
  const [evolutionLevel, setEvolutionLevel] = useState<'basic' | 'enhanced' | 'advanced' | 'master'>('basic');

  // Debug wrapper for onTap
  const debugOnTap = () => {
    if (import.meta.env.DEV) {
      console.log('[ORB-WRAPPER] Orb tapped, calling onTap function');
      console.log('[ORB-WRAPPER] onTap function exists:', typeof props.onTap);
    }
    props.onTap();
  };

  // Update orb evolution based on user level
  useEffect(() => {
    if (user?.level) {
      const newLevel = getOrbEvolutionLevel(user.level);
      if (newLevel !== evolutionLevel) {
        setEvolutionLevel(newLevel);
        // Show evolution notification
        if (user.level >= 5) {
          console.log('Orb evolved to:', newLevel);
        }
      }
    }
  }, [user?.level, evolutionLevel]);

  // Detect WebGL support once and never change
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[ORB-WRAPPER] Detecting WebGL support, variant:', variant);
    }
    
    if (variant === 'css') {
      if (import.meta.env.DEV) {
        console.log('[ORB-WRAPPER] Forced CSS mode');
      }
      setUseWebGL(false);
    } else if (variant === 'webgl') {
      const supported = supportsWebGL();
      if (import.meta.env.DEV) {
        console.log('[ORB-WRAPPER] Forced WebGL mode, supported:', supported);
      }
      setUseWebGL(supported);
    } else {
      // Auto: prefer WebGL if supported
      const supported = supportsWebGL();
      if (import.meta.env.DEV) {
        console.log('[ORB-WRAPPER] Auto mode, WebGL supported:', supported);
      }
      setUseWebGL(supported);
    }
  }, []); // No dependencies - detect once only

  // Show loading while detecting
  if (useWebGL === null) {
    return (
      <div 
        className={`flex items-center justify-center ${props.className || ''}`}
        style={{ width: props.size || 280, height: props.size || 280 }}
      >
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (import.meta.env.DEV) {
    console.log('[ORB-WRAPPER] Rendering orb, useWebGL:', useWebGL);
  }

  // Render the appropriate orb type - NEVER switch after initial render
  return useWebGL ? 
    <WebGLOrb {...props} onTap={debugOnTap} size={size} evolutionLevel={evolutionLevel} /> : 
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };