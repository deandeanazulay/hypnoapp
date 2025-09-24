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
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragRotation, setDragRotation] = React.useState(0);
  const [lastMousePos, setLastMousePos] = React.useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = React.useState(0);
  const [dragDistance, setDragDistance] = React.useState(0);

  useImperativeHandle(ref, () => ({
    updateState: () => {},
    setSpeaking: setIsSpeaking,
    setListening: setIsListening
  }));

  const egoColor = getEgoColor(egoState);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    console.log('[CSS-ORB] Pointer down');
    setIsPressed(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setDragStartTime(Date.now());
    setDragDistance(0);
    e.currentTarget.style.cursor = 'grabbing';
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    const currentTime = Date.now();
    const timeSinceStart = currentTime - dragStartTime;
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    const currentDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Update total drag distance
    setDragDistance(prev => prev + currentDistance);
    
    // If we've moved enough distance or held for enough time, consider it a drag
    if (dragDistance > 10 || timeSinceStart > 200) {
      if (!isDragging) {
        console.log('[CSS-ORB] Starting drag mode');
        setIsDragging(true);
      }
      
      const rotationSpeed = 2; // Degrees per pixel - increased sensitivity
      const newRotation = dragRotation + deltaX * rotationSpeed;
      
      console.log('[CSS-ORB] Dragging, rotation:', newRotation);
      setDragRotation(newRotation);
    }
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    const currentTime = Date.now();
    const totalTime = currentTime - dragStartTime;
    const wasDragging = isDragging || dragDistance > 5 || totalTime > 300;
    
    console.log('[CSS-ORB] Pointer up, was dragging:', wasDragging, 'distance:', dragDistance, 'time:', totalTime);
    
    if (!wasDragging) {
      // This was a tap
      e.preventDefault();
      e.stopPropagation();
      console.log('[CSS-ORB] Tap detected, calling onTap');
      onTap();
    } else {
      console.log('[CSS-ORB] Drag detected, NOT calling onTap');
    }
    
    setIsPressed(false);
    setIsDragging(false);
    setDragDistance(0);
    e.currentTarget.style.cursor = 'grab';
  };
  
  const handlePointerEnter = () => setIsHovering(true);
  const handlePointerLeave = () => {
    setIsHovering(false);
    setIsPressed(false);
    setIsDragging(false);
  };

  // Enhanced tap handling for mobile compatibility
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[CSS-ORB] Click event triggered, calling onTap');
    onTap();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[CSS-ORB] Touch end event triggered, calling onTap');
    onTap();
  };
  // Calculate responsive sizing
  const orbSize = Math.min(size, 400);
  const ringSize1 = orbSize * 0.8;
  const ringSize2 = orbSize * 0.6;
  const coreSize = orbSize * 0.4;

  return (
    <div className={`flex justify-center items-center ${className}`} style={{ width: orbSize, height: orbSize }}>
      <div
        className={`relative cursor-pointer select-none transition-all duration-300 ${
          isPressed ? 'scale-95' : isHovering ? 'scale-105' : 'scale-100'
        }`}
        style={{ 
          width: `${orbSize}px`, 
          height: `${orbSize}px`,
          transform: `${isPressed && !isDragging ? 'scale(0.95)' : isHovering ? 'scale(1.05)' : 'scale(1.0)'} rotateY(${dragRotation}deg)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main Orb Core */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 shadow-2xl relative overflow-hidden"
          style={{
            width: `${coreSize}px`,
            height: `${coreSize}px`,
           background: `radial-gradient(circle at 30% 30%, ${egoColor.accent}, ${egoColor.accent}aa, ${egoColor.accent}66)`,
            boxShadow: afterglow 
              ? `0 0 ${orbSize * 0.3}px ${egoColor.accent}70, 0 0 ${orbSize * 0.6}px ${egoColor.accent}40, inset 0 0 ${orbSize * 0.1}px rgba(255,255,255,0.3)`
              : `0 0 ${orbSize * 0.2}px ${egoColor.accent}60, inset 0 0 ${orbSize * 0.05}px rgba(255,255,255,0.2)`,
            filter: isHovering ? 'brightness(1.1)' : 'none',
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
        >
          {/* Inner Glow */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
            style={{
              width: `${coreSize * 0.7}px`,
              height: `${coreSize * 0.7}px`,
             background: `radial-gradient(circle, ${egoColor.accent}80 0%, transparent 70%)`
            }}
          />
        </div>
        
        {/* Outer Ring 1 */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 animate-spin-slow" 
          style={{ 
            width: `${ringSize1}px`,
            height: `${ringSize1}px`
          }} 
        />
        
        {/* Outer Ring 2 */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-spin-slower" 
          style={{ 
            width: `${ringSize2}px`,
            height: `${ringSize2}px`
          }} 
        />
        
        {/* Breathing Effect Ring */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15"
          style={{
            width: `${orbSize * 0.9}px`,
            height: `${orbSize * 0.9}px`,
            animation: 'breathe 6s ease-in-out infinite'
          }}
        />
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-400 animate-pulse" 
            style={{
              width: `${orbSize}px`,
              height: `${orbSize}px`
            }}
          />
        )}
        
        {/* Listening Indicator */}
        {isListening && (
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-400 animate-ping" 
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