import React, { forwardRef } from 'react';
import WebGLOrb from './webgl/WebGLOrb';
import CSSOrb from './fallback/CSSOrb';

function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch { 
    return false; 
  }
}

export type OrbHandle = {
  updateState: (s: any) => void;
  setSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
};

export type OrbProps = {
  onTap: () => void;
  size?: number;
  egoState?: string;
  afterglow?: boolean;
  className?: string;
};

const Orb = forwardRef<OrbHandle, OrbProps>((props, ref) => {
  const webgl = typeof window !== 'undefined' && supportsWebGL();
  if (webgl) return <WebGLOrb ref={ref} {...props} />;
  return <CSSOrb ref={ref} {...props} />;
});

Orb.displayName = 'Orb';
export default Orb;