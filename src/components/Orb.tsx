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
  const [useWebGL, setUseWebGL] = useState<boolean>(true); // Default to WebGL

  useEffect(() => {
    if (variant === 'auto') {
      setUseWebGL(supportsWebGL());
    } else if (variant === 'webgl') {
      setUseWebGL(supportsWebGL());
    } else {
      setUseWebGL(false);
    }
  }, [variant]);

  // Always try WebGL first, fallback to CSS only if explicitly unsupported
  return useWebGL ? <WebGLOrb {...props} /> : <CSSOrb {...props} />;
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };