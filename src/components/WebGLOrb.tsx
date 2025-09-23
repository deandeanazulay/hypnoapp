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

    // Core sphere geometry (high quality, very smooth)
    const geometry = new THREE.SphereGeometry(1, 128, 128);

    // Get ego state colors
    const colors = getEgoStateColors(egoState);

    // Drop-in shader material from article - no spokes, no wires
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        colorA: { value: colors.primary },
        colorB: { value: colors.secondary },
        haloPow: { value: 2.0 },    // fresnel power (1.5–3.0)
        breatheA: { value: 0.02 },  // 2% breathing amplitude
        breatheT: { value: 7.0 }    // seconds per full breath
      },
      
      // Vertex: isotropic breathing (no ribs/bands)
      vertexShader: /* glsl */`
        uniform float time;
        uniform float breatheA;
        uniform float breatheT;

        varying vec3 vPos;      // model-space position
        varying vec3 vNormal;   // view-space normal for rim

        void main(){
          // radial "breathing" — same in every direction (no axis bands)
          float s = 1.0 + breatheA * sin( (time / breatheT) * 6.28318530718 );
          vec3 pos = position * s;

          vPos = pos;

          // send a view-space normal for fresnel-like rim
          vec3 n = normalize(normalMatrix * normal);
          vNormal = n;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      
      // Fragment: inner gradient + soft fresnel rim
      fragmentShader: /* glsl */`
        uniform vec3  colorA;
        uniform vec3  colorB;
        uniform float haloPow;

        varying vec3 vPos;
        varying vec3 vNormal;

        void main(){
          // inner radial gradient (r ~ distance from center in model units)
          float r = clamp(length(vPos), 0.0, 1.0);
          vec3 base = mix(colorA, colorB, smoothstep(0.0, 1.0, r));

          // fresnel-ish rim using the view-facing normal (z≈toward camera)
          float fres = pow(1.0 - abs(vNormal.z), haloPow);
          vec3 col = base * (0.85 + 0.15 * fres) + vec3(fres) * 0.12;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
      
      transparent: false,
      wireframe: false  // <- important: no wires
    });

    const core = new THREE.Mesh(geometry, coreMaterial);
    scene.add(core);

    const clock = new THREE.Clock();

    // Store scene references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      core,
      halo: core, // Use core as halo reference for compatibility
      clock,
      animationId: null
    };

    // Animation loop
    function animate() {
      if (!sceneRef.current) return;

      const t = clock.getElapsedTime();
      
      // Update time uniform for shader breathing animation
      coreMaterial.uniforms.time.value = t;

      // Smooth rotation follow (gentle parallax)
      core.rotation.x += (targetRotation.current.x - core.rotation.x) * 0.06;
      core.rotation.y += (targetRotation.current.y - core.rotation.y) * 0.06;

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
    coreMat.uniforms.colorA.value = colors.primary;
    coreMat.uniforms.colorB.value = colors.secondary;
  }, [egoState]);


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