import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

interface WebGLOrbProps {
  onTap?: () => void;
  egoState?: string;
  afterglow?: boolean;
  size?: number;
  selectedGoal?: string;
  breathPhase?: 'inhale' | 'exhale' | 'hold';
  className?: string;
}

export interface WebGLOrbRef {
  updateState: (state: any) => void;
}

const WebGLOrb = forwardRef<WebGLOrbRef, WebGLOrbProps>(({
  onTap,
  egoState = 'guardian',
  afterglow = false,
  size = 200,
  selectedGoal,
  breathPhase = 'inhale',
  className = ''
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      // Update orb visual state based on provided state
      console.log('Updating orb state:', state);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw orb based on current state
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = size / 2;
      
      // Create gradient based on ego state
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      
      switch (egoState) {
        case 'guardian':
          gradient.addColorStop(0, afterglow ? '#4ade80' : '#22c55e');
          gradient.addColorStop(1, afterglow ? '#16a34a' : '#15803d');
          break;
        case 'explorer':
          gradient.addColorStop(0, afterglow ? '#60a5fa' : '#3b82f6');
          gradient.addColorStop(1, afterglow ? '#2563eb' : '#1d4ed8');
          break;
        case 'creator':
          gradient.addColorStop(0, afterglow ? '#a78bfa' : '#8b5cf6');
          gradient.addColorStop(1, afterglow ? '#7c3aed' : '#6d28d9');
          break;
        default:
          gradient.addColorStop(0, afterglow ? '#fbbf24' : '#f59e0b');
          gradient.addColorStop(1, afterglow ? '#d97706' : '#b45309');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add breathing effect
      if (breathPhase) {
        const breathScale = breathPhase === 'inhale' ? 1.1 : breathPhase === 'exhale' ? 0.9 : 1.0;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * breathScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [egoState, afterglow, size, breathPhase]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={onTap}
    />
  );
});

WebGLOrb.displayName = 'WebGLOrb';

export default WebGLOrb;