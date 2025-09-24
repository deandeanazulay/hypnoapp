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
  const [useWebGL, setUseWebGL] = useState<boolean>(false); // Default to CSS to prevent flashing
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run once on mount to prevent re-renders
    if (!isInitialized) {
      const detectWebGL = () => {
        if (variant === 'css') {
          setUseWebGL(false);
        } else if (variant === 'webgl') {
          setUseWebGL(supportsWebGL());
        } else {
          // Auto-detect but prefer CSS for stability
          setUseWebGL(supportsWebGL() && window.innerWidth > 768);
        }
        setIsInitialized(true);
      };

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(detectWebGL, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [variant, isInitialized]);

  // Show CSS orb immediately, upgrade to WebGL if supported
  if (!isInitialized) {
    return <CSSOrb {...props} />;
  }

  return useWebGL ? <WebGLOrb {...props} /> : <CSSOrb {...props} />;
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };