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
  const [webglFailed, setWebglFailed] = useState(false);

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

  // Listen for WebGL failures and fallback to CSS
  const handleWebGLError = () => {
    setWebglFailed(true);
    setUseWebGL(false);
  };
  // Loading state to avoid hydration flashes
  if (useWebGL === null) {
    return (
      <div 
        className={`flex items-center justify-center ${props.className || ''}`}
        style={{ width: props.size || 280, height: props.size || 280 }}
      >
        <CSSOrb {...props} />
      </div>
    );
  }

  // Use CSS if WebGL failed, variant is CSS, or WebGL is unsupported
  const shouldUseWebGL = variant === 'css' ? false : (useWebGL && !webglFailed);

  return shouldUseWebGL ? (
    <WebGLOrb {...props} onError={handleWebGLError} />
  ) : (
    <CSSOrb {...props} />
  );
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };