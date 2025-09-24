import React, { useEffect, useState } from 'react';
import { getEgoColor } from '../../config/theme';

interface CssOrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  afterglow?: boolean;
}

export default function CSSOrb({ 
  onTap, 
  size = 280, 
  egoState = 'guardian', 
  className = '',
  afterglow = false 
}: CssOrbProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  
  const egoColor = getEgoColor(egoState);

  useEffect(() => {
    setIsLoaded(true);
    
    // Dynamic pulse based on ego state
    const pulseTimer = setInterval(() => {
      setPulseIntensity(prev => {
        const base = 0.8;
        const variation = 0.4;
        return base + Math.sin(Date.now() / 1000) * variation;
      });
    }, 100);

    return () => clearInterval(pulseTimer);
  }, [egoState]);

  return (
    <div 
      className={`orb-container cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        onClick={onTap}
        className={`relative w-full h-full rounded-full transition-all duration-500 hover:scale-105 active:scale-95 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, ${egoColor.accent}80 0%, ${egoColor.accent}40 25%, transparent 50%),
            radial-gradient(circle at 70% 70%, ${egoColor.accent}60 0%, ${egoColor.accent}30 25%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${egoColor.accent}20 0%, transparent 70%)
          `,
          boxShadow: `
            0 0 60px ${egoColor.accent}40,
            0 0 120px ${egoColor.accent}20,
            inset 0 0 60px ${egoColor.accent}20
          `,
          filter: afterglow ? 'brightness(1.3) saturate(1.2)' : 'brightness(1)',
          animation: 'orbPulse 4s ease-in-out infinite, orbRotate 20s linear infinite'
        }}
      >
        {/* Core Center */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
          style={{
            background: egoColor.accent,
            boxShadow: `0 0 20px ${egoColor.accent}cc, 0 0 40px ${egoColor.accent}80`,
            opacity: pulseIntensity
          }}
        />

        {/* Orbital Rings */}
        {[0.3, 0.5, 0.7].map((scale, index) => (
          <div
            key={index}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-30"
            style={{
              width: `${scale * size}px`,
              height: `${scale * size}px`,
              borderColor: egoColor.accent,
              borderWidth: '1px',
              animation: `orbRing ${3 + index}s ease-in-out infinite ${index * 0.5}s`
            }}
          />
        ))}

        {/* Energy Particles */}
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={`particle-${index}`}
            className="absolute w-2 h-2 rounded-full opacity-60"
            style={{
              background: egoColor.accent,
              left: `${50 + Math.cos((index * Math.PI) / 4) * 35}%`,
              top: `${50 + Math.sin((index * Math.PI) / 4) * 35}%`,
              transform: 'translate(-50%, -50%)',
              animation: `orbParticle ${2 + index * 0.2}s ease-in-out infinite ${index * 0.1}s`,
              boxShadow: `0 0 10px ${egoColor.accent}80`
            }}
          />
        ))}

        {/* Hover Effects */}
        <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes orbPulse {
          0%, 100% { 
            transform: scale(1);
            filter: brightness(1) saturate(1);
          }
          50% { 
            transform: scale(1.02);
            filter: brightness(1.1) saturate(1.1);
          }
        }
        
        @keyframes orbRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes orbRing {
          0%, 100% { 
            opacity: 0.2;
            transform: translate(-50%, -50%) scale(0.9);
          }
          50% { 
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        
        @keyframes orbParticle {
          0%, 100% { 
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% { 
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}