import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';

interface LivingOrbProps {
  onTap?: () => void;
  size?: number;
  className?: string;
}

export interface LivingOrbRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

const LivingOrb = forwardRef<LivingOrbRef, LivingOrbProps>(({
  onTap,
  size = 200,
  className = ''
}, ref) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      if (state.pulseIntensity !== undefined) {
        setPulseIntensity(state.pulseIntensity);
      }
    },
    setSpeaking: (speaking: boolean) => {
      setIsSpeaking(speaking);
    },
    setListening: (listening: boolean) => {
      setIsListening(listening);
    }
  }));

  useEffect(() => {
    // Animate pulse based on speaking/listening state
    if (isSpeaking || isListening) {
      const interval = setInterval(() => {
        setPulseIntensity(prev => prev === 1 ? 1.2 : 1);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isSpeaking, isListening]);

  const getOrbColor = () => {
    if (isSpeaking) return 'from-blue-400 to-blue-600';
    if (isListening) return 'from-green-400 to-green-600';
    return 'from-purple-400 to-purple-600';
  };

  return (
    <div
      className={`relative cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={onTap}
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${getOrbColor()} transition-all duration-300`}
        style={{
          transform: `scale(${pulseIntensity})`,
          filter: 'blur(0.5px)'
        }}
      />
      
      {/* Inner glow */}
      <div
        className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent"
        style={{
          transform: `scale(${pulseIntensity * 0.9})`
        }}
      />
      
      {/* Activity indicators */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full animate-ping" />
        </div>
      )}
      
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-1 bg-white rounded-full animate-pulse" />
          <div className="w-4 h-1 bg-white rounded-full animate-pulse mx-1" />
          <div className="w-6 h-1 bg-white rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
});

LivingOrb.displayName = 'LivingOrb';

export default LivingOrb;