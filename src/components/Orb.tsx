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
  const [useWebGL, setUseWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    // Defer until client to avoid SSR mismatches
    if (variant === 'auto') {
      setUseWebGL(supportsWebGL());
    } else if (variant === 'webgl') {
      setUseWebGL(supportsWebGL());
    } else {
      setUseWebGL(false);
    }
  }, [variant]);

  // Loading state to avoid hydration flashes
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

  // Force WebGL unless explicitly unsupported or CSS variant requested
  const shouldUseWebGL = variant === 'css' ? false : useWebGL;

  return shouldUseWebGL ? <WebGLOrb {...props} /> : <CSSOrb {...props} />;
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };