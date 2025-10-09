import { useEffect, useState } from 'react';

const DEFAULT_MIN_SIZE = 320;
const DEFAULT_MAX_SIZE = 640;
const DEFAULT_BASE_MULTIPLIER = 0.75;
const DEFAULT_FALLBACK = 480;

export interface OrbSizeOptions {
  minSize?: number;
  maxSize?: number;
  baseMultiplier?: number;
  fallbackSize?: number;
}

export function getResponsiveOrbSize({
  minSize = DEFAULT_MIN_SIZE,
  maxSize = DEFAULT_MAX_SIZE,
  baseMultiplier = DEFAULT_BASE_MULTIPLIER,
  fallbackSize = DEFAULT_FALLBACK,
}: OrbSizeOptions = {}): number {
  if (typeof window === 'undefined') {
    return fallbackSize;
  }

  const { innerWidth, innerHeight } = window;
  const minDimension = Math.min(innerWidth, innerHeight);
  const base = minDimension * baseMultiplier;

  return Math.max(minSize, Math.min(maxSize, Math.round(base)));
}

export function useOrbSize(options?: OrbSizeOptions): number {
  const [orbSize, setOrbSize] = useState(() => getResponsiveOrbSize(options));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setOrbSize(getResponsiveOrbSize(options));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [options?.baseMultiplier, options?.fallbackSize, options?.maxSize, options?.minSize]);

  return orbSize;
}
