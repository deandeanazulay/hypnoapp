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
}

const CSSOrb = forwardRef<OrbRef, OrbProps>(({
  onTap,
  size = 280,
  egoState = 'guardian',
  afterglow = false,
  className = ''
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
    console.log('[CSS-ORB] Tap detected, calling onTap');
    onTap();
  };
  const handlePointerEnter = () => setIsHovering(true);
  const handlePointerLeave = () => {
    setIsHovering(false);
    setIsPressed(false);
  };

  return (
    <div className={`flex justify-center items-center ${className}`} style={{ width: size, height: size }}>
      <div
        className={`relative cursor-pointer select-none transition-all duration-300 ${
          isPressed ? 'scale-95' : isHovering ? 'scale-105' : 'scale-100'
        }`}
        style={{ width: `${size}px`, height: `${size}px` }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {/* Main Orb */}
        <div 
          className={`rounded-full border-2 border-white/30 shadow-2xl relative overflow-hidden`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `linear-gradient(135deg, ${egoColor.accent}40, ${egoColor.accent}80)`,
            boxShadow: afterglow 
              ? `0 0 60px ${egoColor.accent}90, inset 0 0 30px rgba(255,255,255,0.2)`
              : `0 0 30px ${egoColor.accent}70, inset 0 0 15px rgba(255,255,255,0.15)`,
            filter: isHovering ? 'brightness(1.1)' : 'none'
          }}
        >
          {/* Animated Rings */}
          <div 
            className="absolute rounded-full border border-white/20 animate-spin-slow" 
            style={{ 
              top: `${size * 0.1}px`, 
              left: `${size * 0.1}px`, 
              right: `${size * 0.1}px`, 
              bottom: `${size * 0.1}px` 
            }} 
          />
          <div 
            className="absolute rounded-full border border-white/10 animate-spin-slower" 
            style={{ 
              top: `${size * 0.2}px`, 
              left: `${size * 0.2}px`, 
              right: `${size * 0.2}px`, 
              bottom: `${size * 0.2}px` 
            }} 
          />
          
          {/* Center Glow */}
          <div 
            className="absolute rounded-full"
            style={{
              top: `${size * 0.25}px`,
              left: `${size * 0.25}px`,
              right: `${size * 0.25}px`,
              bottom: `${size * 0.25}px`,
              background: `radial-gradient(circle, ${egoColor.accent}40 0%, transparent 70%)`,
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
          
          {/* Breathing Effect */}
          <div 
            className="absolute rounded-full border border-white/10"
            style={{
              top: `${size * 0.1}px`,
              left: `${size * 0.1}px`,
              right: `${size * 0.1}px`,
              bottom: `${size * 0.1}px`,
              animation: 'breathe 6s ease-in-out infinite'
            }}
          />
          
          {/* Speaking Indicator */}
          {isSpeaking && (
            <div 
              className="absolute rounded-full border-2 border-teal-400 animate-pulse" 
              style={{
                top: 0,
                left: 0,
                width: `${size}px`,
                height: `${size}px`
              }}
            />
          )}
          
          {/* Listening Indicator */}
          {isListening && (
            <div 
              className="absolute rounded-full border-2 border-red-400 animate-ping" 
              style={{
                top: 0,
                left: 0,
                width: `${size}px`,
                height: `${size}px`
              }}
            />
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.02); opacity: 1; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slower {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
});

CSSOrb.displayName = 'CSSOrb';
export default CSSOrb;