// Lightweight CSS-only Orb (tight layout: no vertical dead space)
import React, { forwardRef, useImperativeHandle } from 'react';
import { THEME, getEgoColor } from '../../config/theme';

export interface OrbRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

interface OrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  afterglow?: boolean;
  className?: string;
  evolutionLevel?: 'basic' | 'enhanced' | 'advanced' | 'master';
  /** When true (default), keeps all visuals inside the frame (no overflow halos). */
  compact?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  audioFrequency?: number;
}

const CSSOrb = forwardRef<OrbRef, OrbProps>(({
  onTap,
  size = 280,
  egoState = 'guardian',
  afterglow = false,
  className = '',
  evolutionLevel = 'basic',
  compact = true,
  isSpeaking = false,
  audioLevel = 0,
  audioFrequency = 0
}, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [internalSpeaking, setInternalSpeaking] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);

  useImperativeHandle(ref, () => ({
    updateState: () => {},
    setSpeaking: setInternalSpeaking,
    setListening: setIsListening
  }));

  const egoColor = getEgoColor(egoState);

  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp = () => {
    setIsPressed(false);
    if (import.meta.env.DEV) console.log('[CSS-ORB] Tap detected, calling onTap');
    onTap();
  };
  const handlePointerEnter = () => setIsHovering(true);
  const handlePointerLeave = () => { setIsHovering(false); setIsPressed(false); };

  // Enhanced tap handling for mobile compatibility
  const handleClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onTap(); };
  const handleTouchEnd = (e: React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); onTap(); };

  // Audio-reactive calculations
  const isCurrentlySpeaking = isSpeaking || internalSpeaking;
  const audioReactiveScale = isCurrentlySpeaking ? 
    1.0 + (audioLevel / 100) * 0.1 + Math.sin(Date.now() * 0.01) * 0.03 : 1.0;
  const audioReactivePulse = isCurrentlySpeaking ?
    0.8 + (audioLevel / 100) * 0.4 + Math.sin(Date.now() * 0.008) * 0.2 : 1.0;

  // Visual frame size (tight)
  const orbSize = Math.min(size, 400);
  // Keep the **outermost ring at 100%** of the frame to avoid inner “dead margins”
  const outerRingSize = orbSize;            // 100% frame
  const coreSize = orbSize * 0.42 * audioReactiveScale;          // Audio-reactive core size
  const midRingSize = orbSize * 0.82;       // inner animated ring
  const innerGlowSize = coreSize * 0.72;    // glow inside core

  // Evolution affects the number of subtle rings *inside* the frame
  const ringCount = evolutionLevel === 'basic' ? 2
                   : evolutionLevel === 'enhanced' ? 3
                   : evolutionLevel === 'advanced' ? 4 : 5;

  // Keep all ring sizes ≤ outerRingSize to prevent overflow & phantom space
  const rings = Array.from({ length: ringCount }, (_, i) => ({
    size: Math.max(outerRingSize * (0.86 - i * 0.12), coreSize * 1.1),
    opacity: 0.55 - i * 0.09,
    speed: 8 + i * 3
  }));

  return (
    <div
      className={`inline-flex justify-center items-center relative ${className}`}
      style={{
        width: orbSize,
        height: orbSize,
        lineHeight: 0,        // removes typographic gap
        overflow: 'visible',  // allow orb effects to extend beyond frame
        zIndex: 10
      }}
    >
      <div
        className={`relative cursor-pointer select-none transition-transform duration-300 ${
          isPressed ? 'scale-95' : isHovering ? 'scale-105' : 'scale-100'
        } ${isCurrentlySpeaking ? 'animate-pulse' : ''}`}
        style={{ width: orbSize, height: orbSize }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
      >
        {/* OUTER BREATHING RING — exactly frame-sized to eliminate perceived top/bottom “dead space” */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200 ${
            isCurrentlySpeaking ? 'animate-pulse' : ''
          }`}
          style={{
            width: outerRingSize,
            height: outerRingSize * audioReactiveScale,
            borderColor: `rgba(255,255,255,${0.15 * audioReactivePulse})`,
            transform: `translate(-50%, -50%) scale(${audioReactiveScale})`
          }}
        />

        {/* MID RING (subtle motion) */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            isCurrentlySpeaking ? 'animate-spin' : 'animate-spin-slower'
          }`}
          style={{
            width: midRingSize,
            height: midRingSize * audioReactiveScale,
            borderColor: `rgba(255,255,255,${0.18 * audioReactivePulse})`,
            animationDuration: isCurrentlySpeaking ? '2s' : '18s',
            transform: `translate(-50%, -50%) scale(${audioReactiveScale})`
          }}
        />

        {/* CORE */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 shadow-2xl overflow-hidden"
          style={{
            width: coreSize,
            height: coreSize,
            background: 'transparent',
            // Keep glow contained (tight) — avoid huge spread that looks like empty halo
            boxShadow: afterglow
              ? `0 0 ${orbSize * 0.22 * audioReactivePulse}px ${egoColor.accent}70, inset 0 0 ${orbSize * 0.08}px rgba(255,255,255,0.28)`
              : `0 0 ${orbSize * 0.15 * audioReactivePulse}px ${egoColor.accent}60, inset 0 0 ${orbSize * 0.05}px rgba(255,255,255,0.2)`,
            filter: isHovering ? 'brightness(1.08)' : isCurrentlySpeaking ? `brightness(${1.0 + (audioLevel / 100) * 0.3})` : 'none',
            transform: `translate(-50%, -50%) scale(${audioReactiveScale})`
          }}
        >
          {/* INNER GLOW */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isCurrentlySpeaking ? 'animate-spin' : evolutionLevel === 'master' ? 'animate-spin-slow' : 'animate-pulse'
            }`}
            style={{
              width: innerGlowSize,
              height: innerGlowSize,
              background: `radial-gradient(circle, ${egoColor.accent}${Math.floor(80 * audioReactivePulse).toString(16)} 0%, transparent 70%)`,
              animationDuration: isCurrentlySpeaking ? '1s' : undefined
            }}
          />
        </div>

        {/* EVOLUTION-BASED SUBTLE RINGS (kept inside frame) */}
        {rings.map((ring, idx) => (
          <div
            key={idx}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
              idx % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-slower'
            }`}
            style={{
              width: ring.size,
              height: ring.size,
              borderColor: `rgba(255,255,255,${ring.opacity})`,
              animationDuration: `${ring.speed}s`
            }}
          />
        ))}

        {/* MASTER-LEVEL EXTRAS — only if NOT compact (avoid visual overflow that reads as “empty space”) */}
        {!compact && evolutionLevel === 'master' && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border animate-spin-slower"
              style={{
                width: orbSize * 1.06,
                height: orbSize * 1.06,
                borderColor: 'rgba(255,255,255,0.22)',
                animationDuration: '24s'
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: orbSize * 1.08,
                height: orbSize * 1.08,
                background: `conic-gradient(from 0deg, ${egoColor.accent}18, transparent, ${egoColor.accent}18)`,
                animation: 'spin 20s linear infinite'
              }}
            />
          </>
        )}

        {/* SPEAKING/LISTENING INDICATORS — clipped to frame so they don’t add outside space */}
        {isCurrentlySpeaking && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-400 animate-ping"
            style={{ 
              width: outerRingSize * (1.1 + (audioLevel / 100) * 0.2), 
              height: outerRingSize * (1.1 + (audioLevel / 100) * 0.2),
              borderColor: `rgba(20, 184, 166, ${0.6 + (audioLevel / 100) * 0.4})`
            }}
          />
        )}
        {isListening && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-400 animate-ping"
            style={{ width: outerRingSize, height: outerRingSize }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50%      { transform: scale(1.015); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to   { transform: translate(-50%, -50%) rotate(0deg); }
        }
      `}</style>
    </div>
  );
});

CSSOrb.displayName = 'CSSOrb';
export default CSSOrb;
