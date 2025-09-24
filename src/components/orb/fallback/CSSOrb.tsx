import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { getEgoColor } from '../../../config/theme';

export type OrbHandle = {
  updateState: (s: any) => void;
  setSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
};

interface CSSOrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  afterglow?: boolean;
  className?: string;
}

const CSSOrb = forwardRef<OrbHandle, CSSOrbProps>(({
  onTap, 
  size = 280, 
  egoState = 'guardian', 
  afterglow = false, 
  className = ''
}, ref) => {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  
  useImperativeHandle(ref, () => ({
    updateState: () => {},
    setSpeaking: setSpeaking,
    setListening: setListening
  }));
  
  const egoColor = getEgoColor(egoState);

  return (
    <div
      className={`relative rounded-full overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-105 ${className}`}
      style={{ 
        width: size, 
        height: size, 
        boxShadow: afterglow ? `0 0 60px ${egoColor.accent}90` : `0 0 30px ${egoColor.accent}70` 
      }}
      onClick={onTap}
    >
      {/* Core orb */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(60% 60% at 50% 40%, ${egoColor.accent}33 0%, transparent 70%)`
        }} 
      />
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${egoColor.bg}`}
      />
      
      {/* Animated rings */}
      <div className="absolute inset-3 rounded-full border border-white/15 animate-[spin_20s_linear_infinite]" />
      <div className="absolute inset-7 rounded-full border border-white/10 animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute inset-1 rounded-full border border-white/10 animate-[pulse_6s_ease-in-out_infinite]" />
      
      {/* Speaking indicator */}
      {speaking && (
        <div className="absolute inset-0 rounded-full border-2 border-teal-400 animate-pulse" />
      )}
      
      {/* Listening indicator */}
      {listening && (
        <div className="absolute inset-0 rounded-full border-2 border-fuchsia-400 animate-ping" />
      )}
      
      <style jsx>{`
        @keyframes pulse { 
          0%, 100% { transform: scale(1); opacity: 0.8; } 
          50% { transform: scale(1.03); opacity: 1; } 
        }
      `}</style>
    </div>
  );
});

CSSOrb.displayName = 'CSSOrb';
export default CSSOrb;