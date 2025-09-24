import React, { forwardRef } from 'react';
import CSSOrb from '../ui/CSSOrb';

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
  return <CSSOrb ref={ref} {...props} />;
});

Orb.displayName = 'Orb';
export default Orb;