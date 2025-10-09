import React from 'react';
import OrbBackgroundLayer from './OrbBackgroundLayer';

type OrbVariant = 'webgl' | 'css' | 'auto';

interface AppFrameProps {
  children: React.ReactNode;
  onOrbTap?: () => void;
  egoState?: string;
  variant?: OrbVariant;
  afterglow?: boolean;
  className?: string;
}

export default function AppFrame({
  children,
  onOrbTap,
  egoState,
  variant = 'webgl',
  afterglow = false,
  className = '',
}: AppFrameProps) {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-black text-white ${className}`}>
      <OrbBackgroundLayer
        onOrbTap={onOrbTap}
        egoState={egoState}
        variant={variant}
        afterglow={afterglow}
        className="flex flex-col"
      >
        <div className="relative z-10 flex min-h-screen flex-col">
          {children}
        </div>
      </OrbBackgroundLayer>
    </div>
  );
}
