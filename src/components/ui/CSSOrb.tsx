// Lightweight CSS-only Orb (replaces heavy WebGL version)
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
}

const CSSOrb = forwardRef<OrbRef, OrbProps>(({
  onTap,
  size = 280,
  egoState = 'guardian',
  afterglow = false,
  className = '',
  evolutionLevel = 'basic'
}, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);

  useImperativeHandle(ref, () => ({
    updateState: () => {},
    setSpeaking: setIsSpeaking,
    setListening: setIsListening
  }));

  const egoColor = getEgoColor(egoState);
  
  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp = () => {
    setIsPressed(false);
    if (import.meta.env.DEV) {
      console.log('[CSS-ORB] Tap detected, calling onTap');
    }
    onTap();
  };
  const handlePointerEnter = () => setIsHovering(true);
  const handlePointerLeave = () => {
    setIsHovering(false);
    setIsPressed(false);
  };

  // Enhanced tap handling for mobile compatibility
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (import.meta.env.DEV) {
      console.log('[CSS-ORB] Click event triggered, calling onTap');
    }
    onTap();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (import.meta.env.DEV) {
      console.log('[CSS-ORB] Touch end event triggered, calling onTap');
    }
    onTap();
  };
  // Calculate responsive sizing
  const orbSize = Math.min(size, 400);
  
  // Evolution affects number of rings and complexity
  const ringCount = evolutionLevel === 'basic' ? 2 : evolutionLevel === 'enhanced' ? 3 : evolutionLevel === 'advanced' ? 4 : 5;
  const rings = Array.from({ length: ringCount }, (_, i) => ({
    size: orbSize * (0.9 - i * 0.15),
    opacity: 0.6 - i * 0.1,
    speed: 8 + i * 4
  }));
  
  const coreSize = orbSize * 0.4;

  return (
    <div className={`flex justify-center items-center ${className}`} style={{ width: orbSize, height: orbSize }}>
      <div
        className={`relative cursor-pointer select-none transition-all duration-300 ${
          isPressed ? 'scale-95' : isHovering ? 'scale-105' : 'scale-100'
        }`}
        style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Orb Core */}
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 shadow-2xl relative overflow-hidden ${
            evolutionLevel === 'master' ? 'animate-level-up' : ''
          }`}
          style={{
            width: `${coreSize}px`,
            height: `${coreSize}px`,
           background: `radial-gradient(circle at 30% 30%, ${egoColor.accent}, ${egoColor.accent}aa, ${egoColor.accent}66)`,
            boxShadow: afterglow 
              ? `0 0 ${orbSize * 0.3 * (evolutionLevel === 'master' ? 1.5 : 1)}px ${egoColor.accent}70, 0 0 ${orbSize * 0.6}px ${egoColor.accent}40, inset 0 0 ${orbSize * 0.1}px rgba(255,255,255,0.3)`
              : `0 0 ${orbSize * 0.2 * (evolutionLevel === 'master' ? 1.2 : 1)}px ${egoColor.accent}60, inset 0 0 ${orbSize * 0.05}px rgba(255,255,255,0.2)`,
            filter: isHovering ? 'brightness(1.1)' : 'none'
          }}
        >
          {/* Inner Glow */}
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full ${
              evolutionLevel === 'master' ? 'animate-spin-slow' : 'animate-pulse'
            }`}
            style={{
              width: `${coreSize * 0.7}px`,
              height: `${coreSize * 0.7}px`,
             background: `radial-gradient(circle, ${egoColor.accent}80 0%, transparent 70%)`
            }}
          />
        </div>
        
        {/* Evolution-based Ring System */}
        {rings.map((ring, index) => (
          <div 
            key={index}
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border ${
              index % 2 === 0 ? 'animate-spin-slow' : 'animate-spin-slower'
            }`}
            style={{ 
              width: `${ring.size}px`,
              height: `${ring.size}px`,
              borderColor: `rgba(255, 255, 255, ${ring.opacity})`,
              animationDuration: `${ring.speed}s`
            }} 
          />
        ))}
        
        {/* Breathing Effect Ring */}
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            evolutionLevel === 'master' ? 'border-white/25' : 'border-white/15'
          }`}
          style={{
            width: `${orbSize * 0.9}px`,
            height: `${orbSize * 0.9}px`,
            animation: `breathe ${evolutionLevel === 'master' ? 4 : 6}s ease-in-out infinite`
          }}
        />
        
        {/* Master level additional effects */}
        {evolutionLevel === 'master' && (
          <>
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-400/30 animate-spin-slower"
              style={{
                width: `${orbSize * 1.1}px`,
                height: `${orbSize * 1.1}px`
              }} 
            />
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: `${orbSize * 1.2}px`,
                height: `${orbSize * 1.2}px`,
                background: `conic-gradient(from 0deg, ${egoColor.accent}20, transparent, ${egoColor.accent}20)`,
                animation: 'spin 20s linear infinite'
              }} 
            />
          </>
        )}
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-400 ${
              evolutionLevel === 'master' ? 'animate-ping' : 'animate-pulse'
            }`}
            style={{
              width: `${orbSize}px`,
              height: `${orbSize}px`
            }}
          />
        )}
        
        {/* Listening Indicator */}
        {isListening && (
          <div 
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-400 ${
              evolutionLevel === 'master' ? 'animate-spin' : 'animate-ping'
            }`}
            style={{
              width: `${orbSize}px`,
              height: `${orbSize}px`
            }}
          />
        )}
      </div>
      
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.02); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
      `}</style>
    </div>
  );
});

CSSOrb.displayName = 'CSSOrb';
export default CSSOrb;