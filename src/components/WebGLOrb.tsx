import React, { forwardRef, useImperativeHandle } from 'react';

export interface WebGLOrbRef {
  updateRotation: (x: number, y: number) => void;
}

interface WebGLOrbProps {
  size?: number;
  onTap?: () => void;
  egoState?: string;
  energy?: number;
  breathing?: string;
}

export const WebGLOrb = forwardRef<WebGLOrbRef, WebGLOrbProps>(({
  size = 200,
  onTap,
  egoState = 'guardian',
  energy = 0.3,
  breathing = 'rest'
}, ref) => {
  useImperativeHandle(ref, () => ({
    updateRotation: (x: number, y: number) => {
      // WebGL orb rotation logic would go here
      // For now, this is a placeholder since WebGL was replaced by CSSOrb
    }
  }));

  return (
    <div 
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onTap}
    >
      <div className="w-full h-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full border border-white/20 flex items-center justify-center">
        <div className="text-white/60 text-sm">WebGL Orb</div>
      </div>
    </div>
  );
});

WebGLOrb.displayName = 'WebGLOrb';

export default WebGLOrb;