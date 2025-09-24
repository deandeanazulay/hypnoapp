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

  // Detect WebGL support once and never change
  useEffect(() => {
    console.log('[ORB-WRAPPER] Detecting WebGL support, variant:', variant);
    
    if (variant === 'css') {
      console.log('[ORB-WRAPPER] Forced CSS mode');
      setUseWebGL(false);
    } else if (variant === 'webgl') {
      const supported = supportsWebGL();
      console.log('[ORB-WRAPPER] Forced WebGL mode, supported:', supported);
      setUseWebGL(supported);
    } else {
      // Auto: prefer WebGL if supported
      const supported = supportsWebGL();
      console.log('[ORB-WRAPPER] Auto mode, WebGL supported:', supported);
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

  console.log('[ORB-WRAPPER] Rendering orb, useWebGL:', useWebGL);

  // Render the appropriate orb type - NEVER switch after initial render
  return useWebGL ? <WebGLOrb {...props} /> : <CSSOrb {...props} />;
}

// Re-export the ref type for convenience
export type { WebGLOrbRef };