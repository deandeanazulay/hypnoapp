import React, { useState, useEffect } from 'react';

interface OrbTransitionProps {
  onEnterWorld: () => void;
  className?: string;
  longPressMs?: number;
  height?: number;
}

export default function OrbTransition({
  onEnterWorld,
  className,
  longPressMs = 100,
  height = 320,
}: OrbTransitionProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const pressStartRef = React.useRef<number | null>(null);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 1) % 240); // 8 second cycle
    }, 33);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = () => {
    setIsPressed(true);
    pressStartRef.current = performance.now();
  };

  const finishAndEnter = () => {
    setIsPressed(false);
    onEnterWorld();
  };

  const handlePointerUp = () => {
    const d = performance.now() - (pressStartRef.current ?? 0);
    setIsPressed(false);
    if (d >= 0) {
      setTimeout(finishAndEnter, 100);
    }
    pressStartRef.current = null;
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
    pressStartRef.current = null;
  };

  const breathScale = 1 + Math.sin(breathPhase * 0.026) * 0.08; // 8 second cycle
  const breathOpacity = 0.7 + Math.sin(breathPhase * 0.026) * 0.2;
  const pulseScale = 1 + Math.sin(breathPhase * 0.052) * 0.05; // Faster pulse

  return (
    <div
      className={`orb-container ${className || ''}`}
      style={{
        position: "relative",
        height,
        borderRadius: 20,
        overflow: "hidden",
        background: "rgba(0,0,0,0.2)",
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s ease-out',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
    >
      {/* Background particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-teal-400/30 rounded-full animate-pulse"
            style={{
              left: `${20 + (i * 3) % 60}%`,
              top: `${30 + (i * 7) % 40}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + (i % 3)}s`,
              transform: `scale(${0.5 + (i % 3) * 0.3})`
            }}
          />
        ))}
      </div>

      {/* Main orb */}
      <div className="relative">
        {/* Outer glow rings */}
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)',
            transform: `scale(${breathScale * 1.8})`,
            opacity: breathOpacity * 0.6,
            filter: 'blur(20px)'
          }}
        />
        
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)',
            transform: `scale(${breathScale * 2.2})`,
            opacity: breathOpacity * 0.4,
            filter: 'blur(30px)',
            animationDelay: '1s'
          }}
        />

        {/* Main orb body */}
        <div 
          className="relative w-48 h-48 rounded-full"
          style={{
            transform: `scale(${breathScale})`,
            background: `
              radial-gradient(circle at 30% 30%, 
                rgba(255, 255, 255, 0.3) 0%, 
                rgba(20, 184, 166, 0.8) 20%, 
                rgba(59, 130, 246, 0.6) 50%, 
                rgba(251, 146, 60, 0.4) 80%, 
                rgba(0, 0, 0, 0.8) 100%
              )
            `,
            boxShadow: `
              0 0 60px rgba(20, 184, 166, ${breathOpacity * 0.6}),
              0 0 120px rgba(59, 130, 246, ${breathOpacity * 0.4}),
              0 0 180px rgba(251, 146, 60, ${breathOpacity * 0.3}),
              inset 0 0 60px rgba(255, 255, 255, 0.1),
              inset 0 0 120px rgba(0, 0, 0, 0.3)
            `,
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Inner neural network pattern */}
          <div className="absolute inset-8 rounded-full overflow-hidden">
            <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
              <defs>
                <radialGradient id="neuralGrad" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="30%" stopColor="#14b8a6" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                </radialGradient>
              </defs>
              <g fill="none" stroke="url(#neuralGrad)" strokeWidth="0.5">
                {/* Neural nodes */}
                <circle cx="50" cy="25" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                <circle cx="25" cy="50" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                <circle cx="75" cy="50" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                <circle cx="50" cy="75" r="1.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                <circle cx="50" cy="50" r="2.5" fill="url(#neuralGrad)" opacity={breathOpacity} />
                
                {/* Neural connections */}
                <path d="M 50 25 L 50 50 L 25 50 M 50 50 L 75 50 M 50 50 L 50 75" 
                      opacity={breathOpacity * 0.8} 
                      strokeWidth="0.8" />
                <path d="M 25 25 Q 50 35 75 25 M 25 75 Q 50 65 75 75" 
                      opacity={breathOpacity * 0.6} 
                      strokeWidth="0.6" />
                
                {/* Pulsing center */}
                <circle cx="50" cy="50" r="3" fill="none" stroke="url(#neuralGrad)" 
                        strokeWidth="1" opacity={pulseScale * breathOpacity} />
              </g>
            </svg>
          </div>

          {/* Highlight reflection */}
          <div 
            className="absolute top-8 left-12 w-16 h-16 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
              filter: 'blur(8px)',
              opacity: breathOpacity * 0.8
            }}
          />

          {/* Energy particles inside orb */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/60 rounded-full"
                style={{
                  left: `${30 + (i * 5) % 40}%`,
                  top: `${35 + (i * 7) % 30}%`,
                  animation: `float ${3 + (i % 2)}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: breathOpacity
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.6; }
          50% { transform: translateY(-8px) translateX(4px) scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}