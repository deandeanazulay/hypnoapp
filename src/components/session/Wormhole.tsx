import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { getEgoColor } from '../../config/theme';
import { EffectComposer } from '../../lib/three-extensions/EffectComposer';
import { RenderPass } from '../../lib/three-extensions/RenderPass';
import { UnrealBloomPass } from '../../lib/three-extensions/UnrealBloomPass';

export interface WormholeRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

interface WormholeProps {
  onTap?: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  breathingPhase?: 'rest' | 'exhale' | 'hold-exhale' | 'inhale' | 'hold-inhale';
  depth?: number;
  isSpeaking?: boolean;
  audioLevel?: number;
  audioFrequency?: number;
}

// Vertex shader for the wormhole tunnel
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for animated grid lines and depth
const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float intensity;
  uniform float speed;
  uniform float gridScale;
  uniform float breathingPulse;
  uniform float audioLevel;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vec2 uv = vUv;
    
    // Create moving grid pattern
    float gridX = sin((uv.x + time * speed) * gridScale * 3.14159) * 0.5 + 0.5;
    float gridY = sin((uv.y + time * speed * 0.7) * gridScale * 3.14159) * 0.5 + 0.5;
    
    // Create depth-based fade
    float depth = length(vPosition) / 20.0;
    float depthFade = 1.0 - smoothstep(0.0, 1.0, depth);
    
    // Combine grid lines
    float grid = max(
      smoothstep(0.85, 0.95, gridX),
      smoothstep(0.85, 0.95, gridY)
    );
    
    // Add breathing pulse effect
    float pulse = sin(time * 2.0 + breathingPulse * 6.28318) * 0.3 + 0.7;
    
    // Add audio reactivity
    float audioReactive = 1.0 + audioLevel * 0.5;
    
    // Final color with all effects
    vec3 finalColor = color * grid * depthFade * intensity * pulse * audioReactive;
    
    // Add tunnel glow effect
    float tunnelGlow = 1.0 - smoothstep(0.0, 0.8, length(uv - 0.5));
    finalColor += color * tunnelGlow * 0.3 * intensity;
    
    gl_FragColor = vec4(finalColor, grid * depthFade * intensity);
  }
`;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

const Wormhole = forwardRef<WormholeRef, WormholeProps>(({
  onTap,
  size = 480,
  egoState = 'guardian',
  className = '',
  breathingPhase = 'rest',
  depth = 1,
  isSpeaking = false,
  audioLevel = 0,
  audioFrequency = 0
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const tunnelMeshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const initializedRef = useRef(false);
  const [webglSupported, setWebglSupported] = React.useState<boolean | null>(null);
  const [contextLost, setContextLost] = React.useState(false);
  
  // Animation state
  const animationStateRef = useRef({
    time: 0,
    cameraZ: 0,
    breathingPulse: 0,
    tunnelSpeed: 1.0
  });

  useImperativeHandle(ref, () => ({
    updateState: () => {},
    setSpeaking: () => {},
    setListening: () => {}
  }));

  // Check WebGL support
  useEffect(() => {
    setWebglSupported(supportsWebGL());
  }, []);

  // Initialize wormhole scene
  useEffect(() => {
    if (webglSupported === false || !containerRef.current || initializedRef.current || contextLost) {
      return;
    }
    
    console.log('[WORMHOLE] Initializing WebGL wormhole scene');
    initializedRef.current = true;
    initializeWormhole();
    
    return () => {
      console.log('[WORMHOLE] Component unmounting - cleaning up');
      disposeScene();
    };
  }, [webglSupported]);

  // Handle tap events
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas || !onTap) return;
    
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'pointer';
    
    const handleEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      onTap();
    };
    
    canvas.addEventListener('click', handleEvent, { passive: false });
    canvas.addEventListener('touchend', handleEvent, { passive: false });
    
    return () => {
      canvas.removeEventListener('click', handleEvent as any);
      canvas.removeEventListener('touchend', handleEvent as any);
    };
  }, [onTap]);

  const initializeWormhole = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Clear existing content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1, 100);
    sceneRef.current = scene;

    // Camera setup - positioned to look down the tunnel
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -50);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Post-processing setup
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size, size), // Resolution
      1.5, // Strength
      0.4, // Radius
      0.85 // Threshold
    );
    composer.addPass(bloomPass);
    composer.setSize(size, size);
    composerRef.current = composer;

    // WebGL context loss handling
    const canvas = renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      setContextLost(true);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    });

    canvas.addEventListener('webglcontextrestored', () => {
      setContextLost(false);
      setTimeout(() => {
        if (isActiveRef.current) {
          disposeScene();
          initializeWormhole();
        }
      }, 100);
    });

    // Style canvas
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.position = 'relative';
    canvas.style.zIndex = '10';
    canvas.style.pointerEvents = onTap ? 'auto' : 'none';

    container.appendChild(canvas);

    // Initialize geometry and start animation
    initializeGeometry();
    animate();
  };

  const initializeGeometry = () => {
    if (!sceneRef.current || !rendererRef.current || contextLost) return;

    const scene = sceneRef.current;

    // Clear existing tunnel
    if (tunnelMeshRef.current) {
      scene.remove(tunnelMeshRef.current);
      tunnelMeshRef.current.geometry?.dispose();
      tunnelMeshRef.current.material?.dispose();
    }

    // Get ego state color
    const egoColorInfo = getEgoColor(egoState);
    const color = new THREE.Color(egoColorInfo.accent);

    // Create tunnel geometry - long cylinder to simulate infinite tunnel
    const tunnelGeometry = new THREE.CylinderGeometry(
      15, // radiusTop
      15, // radiusBottom  
      200, // height (long tunnel)
      32, // radialSegments
      20, // heightSegments
      true // openEnded
    );

    // Rotate to align with camera view
    tunnelGeometry.rotateX(Math.PI / 2);

    // Create shader material for animated grid effect
    const tunnelMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        color: { value: color },
        intensity: { value: 1.0 },
        speed: { value: 1.0 },
        gridScale: { value: 8.0 },
        breathingPulse: { value: 0 },
        audioLevel: { value: 0 }
      },
      transparent: true,
      side: THREE.BackSide, // Render inside of cylinder
      blending: THREE.AdditiveBlending
    });

    // Create tunnel mesh
    const tunnelMesh = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnelMesh.position.z = -100; // Position tunnel ahead of camera
    tunnelMeshRef.current = tunnelMesh;
    scene.add(tunnelMesh);

    // Add ambient lighting for depth
    const ambientLight = new THREE.AmbientLight(color, 0.2);
    scene.add(ambientLight);

    console.log('[WORMHOLE] Geometry initialized successfully');
  };

  const animate = () => {
    if (!isActiveRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current || contextLost) {
      return;
    }

    const animState = animationStateRef.current;
    animState.time += 0.016; // ~60fps

    // Calculate breathing pulse based on phase
    const breathingPulseMap = {
      'rest': 0,
      'exhale': 0.25,
      'hold-exhale': 0.5,
      'inhale': 0.75,
      'hold-inhale': 1.0
    };
    animState.breathingPulse = breathingPulseMap[breathingPhase] || 0;

    // Calculate tunnel speed based on depth (deeper = faster)
    animState.tunnelSpeed = 0.5 + (depth / 5) * 1.5;

    // Audio-reactive effects
    const audioReactiveSpeed = isSpeaking ? 1.0 + (audioLevel / 100) * 0.5 : 1.0;
    const finalSpeed = animState.tunnelSpeed * audioReactiveSpeed;

    // Animate camera moving through tunnel
    animState.cameraZ -= finalSpeed * 0.3;
    if (animState.cameraZ < -180) {
      animState.cameraZ = 20; // Reset position for infinite tunnel effect
    }
    
    if (cameraRef.current) {
      cameraRef.current.position.z = animState.cameraZ;
      
      // Subtle camera sway for immersion
      cameraRef.current.position.x = Math.sin(animState.time * 0.5) * 0.5;
      cameraRef.current.position.y = Math.cos(animState.time * 0.3) * 0.3;
      
      // Look ahead into the tunnel
      cameraRef.current.lookAt(0, 0, animState.cameraZ - 50);
    }

    // Update shader uniforms
    if (tunnelMeshRef.current) {
      const material = tunnelMeshRef.current.material as THREE.ShaderMaterial;
      
      // Update ego state color
      const egoColorInfo = getEgoColor(egoState);
      
      // Defensive check for valid color value
      const colorValue = egoColorInfo?.accent;
      const fallbackColor = '#00ffff'; // Cyan fallback
      
      // Always assign a new THREE.Color instance to avoid internal Three.js errors
      material.uniforms.color.value = new THREE.Color(colorValue && typeof colorValue === 'string' ? colorValue : fallbackColor);
      
      // Update animation uniforms
      material.uniforms.time.value = animState.time;
      material.uniforms.speed.value = finalSpeed;
      material.uniforms.intensity.value = 0.8 + (isSpeaking ? (audioLevel / 100) * 0.4 : 0);
      material.uniforms.breathingPulse.value = animState.breathingPulse;
      material.uniforms.audioLevel.value = audioLevel / 100;
      
      // Breathing-reactive grid scale
      const breathingScale = 6.0 + Math.sin(animState.breathingPulse * Math.PI * 2) * 2.0;
      material.uniforms.gridScale.value = breathingScale;
    }

    try {
      composerRef.current?.render(); // Use composer to render with effects
      
      if (isActiveRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    } catch (error) {
      console.error('[WORMHOLE] Render error:', error);
      if (isActiveRef.current && !contextLost) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    }
  };

  const disposeScene = () => {
    console.log('[WORMHOLE] Disposing scene');
    
    isActiveRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    if (tunnelMeshRef.current) {
      tunnelMeshRef.current.geometry?.dispose();
      tunnelMeshRef.current.material?.dispose();
    }

    if (composerRef.current) {
      // Dispose of render targets and passes
      composerRef.current.passes.forEach(pass => {
        if (pass.dispose) {
          pass.dispose();
        }
      });
      composerRef.current.dispose();
    }

    if (rendererRef.current) {
      try {
        rendererRef.current.dispose();
      } catch (error) {
        console.error('[WORMHOLE] Error disposing renderer:', error);
      }
    }

    sceneRef.current = null;
    rendererRef.current = null;
    cameraRef.current = null;
    composerRef.current = null;
    tunnelMeshRef.current = null;
    initializedRef.current = false;
  };

  // CSS Fallback Component
  const CSSWormholeFallback = () => {
    const egoColor = getEgoColor(egoState);
    
    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        onClick={onTap}
      >
        {/* Tunnel rings */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 animate-pulse-slow"
            style={{
              width: `${20 + i * 12}%`,
              height: `${20 + i * 12}%`,
              borderColor: `${egoColor.accent}${Math.floor((0.8 - i * 0.1) * 255).toString(16)}`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
        
        {/* Central vortex */}
        <div
          className="absolute w-16 h-16 rounded-full animate-spin-fast"
          style={{
            background: `conic-gradient(from 0deg, ${egoColor.accent}, transparent, ${egoColor.accent})`,
            animationDuration: `${isSpeaking ? '0.5s' : '2s'}`
          }}
        />
        
        {/* Breathing pulse overlay */}
        <div
          className="absolute w-full h-full rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${egoColor.accent}20 0%, transparent 70%)`,
            animationDuration: breathingPhase === 'inhale' ? '6s' : 
                             breathingPhase === 'exhale' ? '4s' : '5s'
          }}
        />
      </div>
    );
  };

  // Show loading while detecting WebGL
  if (webglSupported === null) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Show CSS fallback if WebGL not supported
  if (!webglSupported) {
    return <CSSWormholeFallback />;
  }

  // Show context lost indicator
  if (contextLost) {
    return (
      <div 
        className={`flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center p-4">
          <div className="text-yellow-400 text-sm font-medium mb-2">Reconnecting...</div>
          <div className="w-6 h-6 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size, 
        zIndex: 10, 
        overflow: 'visible'
      }}
    />
  );
});



export default Wormhole


export default Wormhole