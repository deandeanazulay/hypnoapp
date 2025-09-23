import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { egoStates, EgoStateId } from '../state/appStore';

export interface WebGLOrbRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

export interface WebGLOrbProps {
  onTap: () => void;
  afterglow?: boolean;
  className?: string;
  breathPhase?: 'inhale' | 'hold' | 'exhale' | 'rest';
  size?: number;
  egoState?: string;
  selectedGoal?: any;
}

const WebGLOrb = forwardRef<WebGLOrbRef, WebGLOrbProps>(({
  onTap,
  afterglow = false,
  className = '',
  breathPhase = 'rest',
  size = 280,
  egoState = 'guardian',
  selectedGoal
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    core: THREE.Mesh;
    halo: THREE.Mesh;
    clock: THREE.Clock;
    animationId: number | null;
  } | null>(null);
  
  const [isPressed, setIsPressed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const targetRotation = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      // Handle state updates if needed
    },
    setSpeaking: (speaking: boolean) => {
      // Visual feedback for speaking state
      if (sceneRef.current && speaking) {
        // Slightly increase halo intensity when speaking
        const haloMat = sceneRef.current.halo.material as THREE.ShaderMaterial;
        haloMat.uniforms.uOpacity.value = speaking ? 0.25 : 0.14;
      }
    },
    setListening: (listening: boolean) => {
      // Visual feedback for listening state  
      if (sceneRef.current && listening) {
        // Subtle pulsing when listening
        const coreMat = sceneRef.current.core.material as THREE.ShaderMaterial;
        // Add listening pulse effect if needed
      }
    }
  }));

  // Get ego state colors
  const getEgoStateColors = (stateId: string) => {
    const state = egoStates.find(s => s.id === stateId) || egoStates[0];
    
    const colorMap: { [key: string]: { primary: THREE.Color; secondary: THREE.Color } } = {
      guardian: { primary: new THREE.Color('#3B82F6'), secondary: new THREE.Color('#1E40AF') },
      rebel: { primary: new THREE.Color('#EF4444'), secondary: new THREE.Color('#B91C1C') },
      healer: { primary: new THREE.Color('#22C55E'), secondary: new THREE.Color('#15803D') },
      explorer: { primary: new THREE.Color('#EAB308'), secondary: new THREE.Color('#A16207') },
      mystic: { primary: new THREE.Color('#A855F7'), secondary: new THREE.Color('#7C3AED') },
      sage: { primary: new THREE.Color('#D1D5DB'), secondary: new THREE.Color('#9CA3AF') },
      child: { primary: new THREE.Color('#F97316'), secondary: new THREE.Color('#EA580C') },
      performer: { primary: new THREE.Color('#EC4899'), secondary: new THREE.Color('#DB2777') },
      shadow: { primary: new THREE.Color('#4F46E5'), secondary: new THREE.Color('#1E1B4B') },
      builder: { primary: new THREE.Color('#6B7280'), secondary: new THREE.Color('#F97316') },
      seeker: { primary: new THREE.Color('#4F46E5'), secondary: new THREE.Color('#14B8A6') },
      lover: { primary: new THREE.Color('#E11D48'), secondary: new THREE.Color('#F472B6') },
      trickster: { primary: new THREE.Color('#22C55E'), secondary: new THREE.Color('#A855F7') },
      warrior: { primary: new THREE.Color('#B91C1C'), secondary: new THREE.Color('#000000') },
      visionary: { primary: new THREE.Color('#8B5CF6'), secondary: new THREE.Color('#60A5FA') }
    };
    
    return colorMap[stateId] || colorMap.guardian;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.6);

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);

    // Subtle lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(2, 2, 3);
    const fillLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(keyLight, fillLight);

    // Core sphere geometry (high quality, smooth)
    const geometry = new THREE.SphereGeometry(1, 128, 128);

    // Get ego state colors
    const colors = getEgoStateColors(egoState);

    // Core sphere material with radial gradient
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColorA: { value: colors.primary },
        uColorB: { value: colors.secondary }
      },
      vertexShader: `
        varying vec3 vPos;
        void main(){
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        void main(){
          // Radial distance from center
          float r = clamp(length(vPos), 0.0, 1.0);
          // Smooth gradient from center to edge
          vec3 col = mix(uColorA, uColorB, smoothstep(0.0, 1.0, r));
          // Gentle vignette toward rim
          float vignette = smoothstep(1.0, 0.6, r);
          gl_FragColor = vec4(col * (0.7 + 0.3 * vignette), 1.0);
        }
      `,
      transparent: false
    });

    const core = new THREE.Mesh(geometry, coreMaterial);
    scene.add(core);

    // Halo shell (subtle glow)
    const haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: afterglow ? 0.15 : 0.08 },
        uSpread: { value: 0.25 }
      },
      vertexShader: `
        varying float vRim;
        void main(){
          vec3 n = normalize(normal);
          vec3 vNormal = normalize(normalMatrix * n);
          float rim = pow(1.0 - abs(vNormal.z), 2.0);
          vRim = rim;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vRim;
        uniform float uOpacity;
        uniform float uSpread;
        void main(){
          float glow = smoothstep(0.0, uSpread, vRim);
          gl_FragColor = vec4(vec3(0.8), glow * uOpacity);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    const halo = new THREE.Mesh(geometry, haloMaterial);
    halo.scale.setScalar(1.02);
    scene.add(halo);

    const clock = new THREE.Clock();

    // Store scene references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      core,
      halo,
      clock,
      animationId: null
    };

    // Animation parameters
    const params = {
      size: 0.95,
      breatheAmp: 0.02,
      breatheSec: 7.0
    };

    // Animation loop
    function animate() {
      if (!sceneRef.current) return;

      const t = clock.getElapsedTime();
      
      // Gentle breathing animation
      const breatheScale = params.size + Math.sin((t / params.breatheSec) * Math.PI * 2.0) * params.breatheAmp;
      
      // Apply breathing based on breathPhase prop
      let targetScale = breatheScale;
      switch (breathPhase) {
        case 'inhale':
          targetScale = params.size + params.breatheAmp * 2;
          break;
        case 'hold':
          targetScale = params.size + params.breatheAmp * 2;
          break;
        case 'exhale':
          targetScale = params.size - params.breatheAmp;
          break;
        case 'rest':
          targetScale = breatheScale;
          break;
      }

      core.scale.setScalar(targetScale);
      halo.scale.setScalar(1.02 * targetScale);

      // Smooth rotation follow (gentle parallax)
      core.rotation.x += (targetRotation.current.x - core.rotation.x) * 0.06;
      core.rotation.y += (targetRotation.current.y - core.rotation.y) * 0.06;
      halo.rotation.copy(core.rotation);

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup
    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      if (sceneRef.current) {
        sceneRef.current.scene.clear();
        sceneRef.current.renderer.dispose();
      }
    };
  }, [egoState, afterglow, breathPhase, size]);

  // Update colors when ego state changes
  useEffect(() => {
    if (!sceneRef.current) return;

    const colors = getEgoStateColors(egoState);
    const coreMat = sceneRef.current.core.material as THREE.ShaderMaterial;
    coreMat.uniforms.uColorA.value = colors.primary;
    coreMat.uniforms.uColorB.value = colors.secondary;
  }, [egoState]);

  // Update halo based on afterglow
  useEffect(() => {
    if (!sceneRef.current) return;

    const haloMat = sceneRef.current.halo.material as THREE.ShaderMaterial;
    haloMat.uniforms.uOpacity.value = afterglow ? 0.25 : 0.14;
  }, [afterglow]);

  // Mouse interaction
  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    // Gentle parallax (capped at ±0.15 radians)
    targetRotation.current.y = x * 0.15;
    targetRotation.current.x = -y * 0.12;
  };

  const handlePointerDown = () => {
    setIsPressed(true);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    onTap();
  };

  const handlePointerEnter = () => {
    setIsHovering(true);
  };

  const handlePointerLeave = () => {
    setIsHovering(false);
    setIsPressed(false);
    // Reset rotation gradually
    targetRotation.current = { x: 0, y: 0 };
  };

  return (
    <div className={`flex justify-center items-center ${className} relative`}>
      <div
        className={`relative cursor-pointer transition-transform duration-200 select-none ${
          isPressed ? 'scale-95' : isHovering ? 'scale-105' : 'scale-100'
        }`}
        style={{
          width: size,
          height: size,
          filter: afterglow 
            ? 'brightness(1.2) saturate(1.1) drop-shadow(0 0 20px rgba(20, 184, 166, 0.5))' 
            : isHovering 
            ? 'brightness(1.1) saturate(1.05) drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))'
            : 'none',
          transition: 'transform 0.2s ease, filter 0.3s ease'
        }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-full"
          style={{ 
            display: 'block',
            background: 'transparent'
          }}
        />
        
        {/* Goal Sigil Overlay */}
        {selectedGoal && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="text-white/30 text-4xl font-light transition-all duration-300"
              style={{
                textShadow: `0 0 20px rgba(20, 184, 166, 0.5)`,
                filter: isHovering ? 'blur(0px)' : 'blur(0.5px)'
              }}
            >
              {getGoalSigil(selectedGoal)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Helper function for goal sigils
function getGoalSigil(goal: any): string {
  if (!goal) return '';
  
  const sigils: { [key: string]: string } = {
    stress: '◈', // Shield
    focus: '◉', // Target
    confidence: '★', // Star
    sleep: '◐', // Moon
    cravings: '◆', // Diamond
    pain: '❅', // Snowflake
    creative: '◈' // Lightbulb-like
  };
  
  return sigils[goal.id] || '◉';
}

WebGLOrb.displayName = 'WebGLOrb';

export default WebGLOrb;