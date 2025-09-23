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
    geometry: THREE.SphereGeometry;
    basePos: Float32Array;
    wire: THREE.LineSegments;
    dots: THREE.Points;
    halo: THREE.Sprite;
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
        const wireMat = sceneRef.current.wire.material as THREE.LineBasicMaterial;
        wireMat.opacity = speaking ? 0.8 : 0.55;
      }
    },
    setListening: (listening: boolean) => {
      // Visual feedback for listening state  
      if (sceneRef.current && listening) {
        const dotsMat = sceneRef.current.dots.material as THREE.PointsMaterial;
        dotsMat.opacity = listening ? 1.0 : 0.75;
      }
    }
  }));

  // Get ego state colors
  const getEgoStateColors = (stateId: string) => {
    const state = egoStates.find(s => s.id === stateId) || egoStates[0];
    
    const colorMap: { [key: string]: { wireframe: THREE.Color; points: THREE.Color; halo: THREE.Color } } = {
      guardian: { wireframe: new THREE.Color('#3B82F6'), points: new THREE.Color('#93C5FD'), halo: new THREE.Color('#3B82F6') },
      rebel: { wireframe: new THREE.Color('#EF4444'), points: new THREE.Color('#FCA5A5'), halo: new THREE.Color('#EF4444') },
      healer: { wireframe: new THREE.Color('#22C55E'), points: new THREE.Color('#86EFAC'), halo: new THREE.Color('#22C55E') },
      explorer: { wireframe: new THREE.Color('#EAB308'), points: new THREE.Color('#FDE047'), halo: new THREE.Color('#EAB308') },
      mystic: { wireframe: new THREE.Color('#A855F7'), points: new THREE.Color('#C4B5FD'), halo: new THREE.Color('#A855F7') },
      sage: { wireframe: new THREE.Color('#D1D5DB'), points: new THREE.Color('#F3F4F6'), halo: new THREE.Color('#D1D5DB') },
      child: { wireframe: new THREE.Color('#F97316'), points: new THREE.Color('#FDBA74'), halo: new THREE.Color('#F97316') },
      performer: { wireframe: new THREE.Color('#EC4899'), points: new THREE.Color('#F9A8D4'), halo: new THREE.Color('#EC4899') },
      shadow: { wireframe: new THREE.Color('#4F46E5'), points: new THREE.Color('#A5B4FC'), halo: new THREE.Color('#4F46E5') },
      builder: { wireframe: new THREE.Color('#6B7280'), points: new THREE.Color('#F97316'), halo: new THREE.Color('#F97316') },
      seeker: { wireframe: new THREE.Color('#4F46E5'), points: new THREE.Color('#14B8A6'), halo: new THREE.Color('#14B8A6') },
      lover: { wireframe: new THREE.Color('#E11D48'), points: new THREE.Color('#F472B6'), halo: new THREE.Color('#F472B6') },
      trickster: { wireframe: new THREE.Color('#22C55E'), points: new THREE.Color('#A855F7'), halo: new THREE.Color('#A855F7') },
      warrior: { wireframe: new THREE.Color('#B91C1C'), points: new THREE.Color('#000000'), halo: new THREE.Color('#B91C1C') },
      visionary: { wireframe: new THREE.Color('#8B5CF6'), points: new THREE.Color('#60A5FA'), halo: new THREE.Color('#60A5FA') }
    };
    
    return colorMap[stateId] || colorMap.guardian;
  };

  const makeHalo = (radius: number, colors: any) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    gradient.addColorStop(0, `rgba(${colors.halo.r * 255}, ${colors.halo.g * 255}, ${colors.halo.b * 255}, 0.35)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      depthWrite: false 
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(radius * 2.6);
    return sprite;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 35);

    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);

    // Build the geometry once
    const geometry = new THREE.SphereGeometry(10, 64, 64);
    
    // Keep an immutable copy of the original vertex positions
    const basePos = geometry.attributes.position.array.slice();

    // Get ego state colors
    const colors = getEgoStateColors(egoState);

    // Wireframe
    const wireMaterial = new THREE.LineBasicMaterial({
      color: colors.wireframe,
      transparent: true,
      opacity: 0.55
    });
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wireMaterial);

    // Points on the surface
    const dots = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: colors.points,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );

    scene.add(wire, dots);

    // Add soft halo
    const halo = makeHalo(10, colors);
    scene.add(halo);

    const clock = new THREE.Clock();

    // Store scene references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      geometry,
      basePos,
      wire,
      dots,
      halo,
      clock,
      animationId: null
    };

    // Animation loop with isotropic breathing
    function animate() {
      if (!sceneRef.current) return;

      const t = clock.getElapsedTime();
      const TAU = Math.PI * 2;

      // Very gentle breathing (same in all directions)
      const scale = 1.0 + 0.02 * Math.sin(t * TAU / 7.0);

      // Optional tiny organic surface (no axis alignment)
      const a = 0.015;
      const b = 0.8;
      const pos = geometry.attributes.position;
      
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        const x = basePos[ix], y = basePos[ix + 1], z = basePos[ix + 2];

        // Normalize once
        const len = Math.max(Math.hypot(x, y, z), 1e-6);
        const nx = x / len, ny = y / len, nz = z / len;

        // Smooth spherical "pulses" (no rays)
        const theta = Math.atan2(ny, nx);
        const phi = Math.acos(nz);
        const bump = a * Math.sin(2.0 * theta + t * b) * Math.sin(2.0 * phi + t * 0.6);

        const r = len * (scale * (1.0 + bump));

        pos.array[ix] = nx * r;
        pos.array[ix + 1] = ny * r;
        pos.array[ix + 2] = nz * r;
      }
      pos.needsUpdate = true;

      // Refresh the wireframe to match updated vertices
      wire.geometry.dispose();
      wire.geometry = new THREE.WireframeGeometry(geometry);

      // Smooth rotation follow (gentle parallax)
      wire.rotation.x += (targetRotation.current.x - wire.rotation.x) * 0.06;
      wire.rotation.y += (targetRotation.current.y - wire.rotation.y) * 0.06;
      dots.rotation.x = wire.rotation.x;
      dots.rotation.y = wire.rotation.y;

      // Keep halo centered
      halo.position.set(0, 0, 0);

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
    
    // Update wireframe color
    const wireMat = sceneRef.current.wire.material as THREE.LineBasicMaterial;
    wireMat.color = colors.wireframe;
    
    // Update points color
    const dotsMat = sceneRef.current.dots.material as THREE.PointsMaterial;
    dotsMat.color = colors.points;
    
    // Update halo
    sceneRef.current.halo.material.dispose();
    sceneRef.current.scene.remove(sceneRef.current.halo);
    
    const newHalo = makeHalo(10, colors);
    sceneRef.current.halo = newHalo;
    sceneRef.current.scene.add(newHalo);
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