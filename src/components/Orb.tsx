import React, { forwardRef } from 'react';
import CSSOrb from './ui/CSSOrb';

interface OrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  afterglow?: boolean;
  variant?: 'webgl' | 'css' | 'auto';
}

export interface OrbRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

const Orb = forwardRef<OrbRef, OrbProps>((props, ref) => {
  return <CSSOrb ref={ref} {...props} />;
});

Orb.displayName = 'Orb';

export default Orb;