import React, { useEffect, useState } from 'react';
import WebGLOrb, { WebGLOrbRef } from './WebGLOrb';
import CSSOrb from './ui/CSSOrb';

interface OrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  afterglow?: boolean;
  variant?: 'webgl' | 'css' | 'auto';
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export default function Orb({ variant = 'auto', ...props }: OrbProps) {
  const [useWebGL, setUseWebGL] = useState<boolean>(() => {
    // Synchronous detection on first render to prevent switching
    if (variant === 'css') return false;
    if (variant === 'webgl') return supportsWebGL();
    // Auto: prefer WebGL if supported
    return supportsWebGL();
  });

  // Only detect once on mount, never change after that
  useEffect(() => {
    if (variant !== 'auto') return; // Don't change if explicitly set
    
    // Only run if we haven't already decided
    const hasWebGL = supportsWebGL();
    setUseWebGL(hasWebGL);
  }, []); // Empty dependency array - only run once

  // Always return the same component type to prevent remounting
  return useWebGL ? <WebGLOrb {...props} /> : <CSSOrb {...props} />;
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };