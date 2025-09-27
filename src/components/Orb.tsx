import React, { useRef } from 'react';
import CSSOrb from './ui/CSSOrb';
import WebGLOrb from './WebGLOrb';
import type { WebGLOrbRef } from './WebGLOrb';

interface OrbProps {
  onTap: () => void;
  size?: number;
  egoState: string;
  variant?: 'webgl' | 'css' | 'auto';
  className?: string;
}

export default function Orb({ 
  onTap, 
  size = 200, 
  egoState, 
  variant = 'auto',
  className 
}: OrbProps) {
  const orbRef = useRef<WebGLOrbRef>(null);

  // Detect WebGL support for auto variant
  const hasWebGLSupport = () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  };

  const useWebGL = variant === 'webgl' || (variant === 'auto' && hasWebGLSupport());
  
  // Calculate evolution level based on ego state
  const evolutionLevel = egoState === 'guardian' ? 1 : 
                        egoState === 'mystic' ? 2 : 
                        egoState === 'warrior' ? 3 : 1;

  const debugOnTap = () => {
    console.log('Orb tapped:', { egoState, size, variant, useWebGL });
    onTap();
  };

  return useWebGL ? (
    <WebGLOrb 
      ref={orbRef}
      onTap={debugOnTap} 
      size={size} 
      evolutionLevel={evolutionLevel}
      className={className}
    />
  ) : (
    <CSSOrb 
      onTap={debugOnTap} 
      size={size} 
      egoState={egoState}
      className={className}
    />
  );
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };