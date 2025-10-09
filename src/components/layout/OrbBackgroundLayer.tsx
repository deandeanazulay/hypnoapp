import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Orb from '../Orb';
import { getResponsiveOrbSize } from '../../hooks/useOrbSize';

type OrbVariant = 'webgl' | 'css' | 'auto';

interface OrbBackgroundContextValue {
  orbSize: number;
  setOrbSize: React.Dispatch<React.SetStateAction<number>>;
  setOrbTapHandler: (handler: (() => void) | null) => void;
}

const noop = () => {};

const defaultContextValue: OrbBackgroundContextValue = {
  orbSize: 480,
  setOrbSize: noop as unknown as React.Dispatch<React.SetStateAction<number>>,
  setOrbTapHandler: noop as (handler: (() => void) | null) => void,
};

const OrbBackgroundContext = createContext<OrbBackgroundContextValue | undefined>(undefined);

export function useOrbBackground(): OrbBackgroundContextValue {
  return useContext(OrbBackgroundContext) ?? defaultContextValue;
}

interface OrbBackgroundLayerProps {
  children: React.ReactNode;
  onOrbTap?: () => void;
  egoState?: string;
  variant?: OrbVariant;
  afterglow?: boolean;
  className?: string;
}

export default function OrbBackgroundLayer({
  children,
  onOrbTap,
  egoState,
  variant = 'webgl',
  afterglow = false,
  className = '',
}: OrbBackgroundLayerProps) {
  const [orbSize, setOrbSize] = useState<number>(() => getResponsiveOrbSize({ fallbackSize: defaultContextValue.orbSize }));
  const [overrideTap, setOverrideTap] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setOrbSize(getResponsiveOrbSize({ fallbackSize: defaultContextValue.orbSize }));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const setOrbTapHandler = useCallback((handler: (() => void) | null) => {
    setOverrideTap(handler);
  }, []);

  const handleOrbTap = useCallback(() => {
    if (overrideTap) {
      overrideTap();
      return;
    }

    if (onOrbTap) {
      onOrbTap();
    }
  }, [overrideTap, onOrbTap]);

  const contextValue = useMemo<OrbBackgroundContextValue>(
    () => ({
      orbSize,
      setOrbSize,
      setOrbTapHandler,
    }),
    [orbSize, setOrbTapHandler]
  );

  return (
    <OrbBackgroundContext.Provider value={contextValue}>
      <div className={`relative flex-1 min-h-full ${className}`}>
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute left-1/2 top-[18vh] -translate-x-1/2 -translate-y-1/2">
            <div
              className="relative pointer-events-auto"
              style={{ width: orbSize, height: orbSize }}
            >
              <div className="absolute inset-0 rounded-full bg-teal-400/10 blur-3xl" />
              <Orb
                onTap={handleOrbTap}
                egoState={egoState}
                size={orbSize}
                variant={variant}
                afterglow={afterglow}
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 h-full">
          {children}
        </div>
      </div>
    </OrbBackgroundContext.Provider>
  );
}

export { OrbBackgroundContext };
