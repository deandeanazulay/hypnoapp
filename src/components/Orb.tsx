import React from 'react';
import CSSOrb from './ui/CSSOrb';

interface OrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  afterglow?: boolean;
}

export default function Orb({ ...props }: OrbProps) {
  return <CSSOrb {...props} />;
}