import React, { forwardRef, useImperativeHandle } from 'react';
import WebGLOrb, { WebGLOrbRef } from './WebGLOrb';

interface EnhancedWebGLOrbProps {
  onTap?: () => void;
  egoState?: string;
  afterglow?: boolean;
  size?: number;
  selectedGoal?: string;
  breathPhase?: 'inhale' | 'exhale' | 'hold';
  className?: string;
  enhanced?: boolean;
}

const EnhancedWebGLOrb = forwardRef<WebGLOrbRef, EnhancedWebGLOrbProps>((props, ref) => {
  const orbRef = React.useRef<WebGLOrbRef>(null);

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      orbRef.current?.updateState(state);
    }
  }));

  return (
    <div className="relative">
      <WebGLOrb
        ref={orbRef}
        {...props}
      />
      {props.enhanced && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
});

EnhancedWebGLOrb.displayName = 'EnhancedWebGLOrb';

export default EnhancedWebGLOrb;