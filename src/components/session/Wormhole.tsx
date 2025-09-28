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
  varying vec3 vNormal;
  varying float vDistance;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vDistance = length(position);
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for epic waterslide/rollercoaster effect
const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform float intensity;
  uniform float speed;
  uniform float tunnelScale;
  uniform float breathingPulse;
  uniform float audioLevel;
  uniform float turbulence;
  uniform float spiralIntensity;
  uniform float cameraZ;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDistance;
  varying vec3 vWorldPosition;
  
  // Noise function for turbulence
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  // Fractal noise for organic turbulence
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    vec3 worldPos = vWorldPosition;
    
    // Calculate center and radial distance for tunnel effect
    vec2 center = vec2(0.5, 0.5);
    float radialDist = length(uv - center);
    
    // Epic waterslide spiral motion
    float flowTime = time * speed * 2.0;
    float spiralAngle = atan(uv.y - 0.5, uv.x - 0.5);
    float spiralRadius = radialDist;
    
    // Create massive spiral waterslide effect with multiple layers
    float spiral1 = sin(spiralAngle * 8.0 + flowTime * 3.0 + worldPos.z * 0.1) * 0.5 + 0.5;
    float spiral2 = sin(spiralAngle * 12.0 - flowTime * 2.0 + worldPos.z * 0.15) * 0.5 + 0.5;
    float spiral3 = sin(spiralAngle * 16.0 + flowTime * 4.0 + worldPos.z * 0.08) * 0.5 + 0.5;
    
    // Rollercoaster banking/tilting effect
    float banking = sin(flowTime * 0.5 + worldPos.z * 0.05) * 0.3;
    float tiltedAngle = spiralAngle + banking;
    
    // Waterslide ridges and channels - like being inside a massive tube
    float ridgePattern = sin(tiltedAngle * 24.0 + flowTime * 1.5) * 0.5 + 0.5;
    ridgePattern *= sin(spiralRadius * 20.0 + flowTime * 2.0) * 0.5 + 0.5;
    
    // Turbulent water flow effect
    vec3 turbulentPos = worldPos + vec3(
      sin(flowTime * 1.2 + worldPos.z * 0.1) * turbulence,
      cos(flowTime * 0.8 + worldPos.z * 0.12) * turbulence,
      sin(flowTime * 1.5 + worldPos.x * 0.1) * turbulence * 0.5
    );
    float turbulentNoise = fbm(turbulentPos * 0.1 + vec3(flowTime * 0.3, 0.0, 0.0));
    
    // Epic rushing water streams - 8 major streams flowing down
    float streamPattern = 0.0;
    for(int i = 0; i < 8; i++) {
      float streamAngle = float(i) * 0.785398; // 45 degrees apart
      float streamFlow = sin(spiralAngle - streamAngle + flowTime * 4.0 + worldPos.z * 0.2);
      float streamWidth = 1.0 - smoothstep(0.0, 0.15, abs(streamFlow));
      streamPattern += streamWidth * (0.8 + 0.2 * sin(flowTime * 6.0 + float(i)));
    }
    
    // Massive spiral flow like water going down a drain
    float spiralFlow = sin(spiralAngle * 6.0 + flowTime * 5.0 + spiralRadius * 15.0) * 0.5 + 0.5;
    spiralFlow *= (1.0 - spiralRadius) * 2.0; // Stronger in center
    
    // Black hole event horizon rings
    float ringPattern = 0.0;
    for(int i = 0; i < 5; i++) {
      float ringZ = worldPos.z + float(i) * 20.0 + flowTime * 30.0;
      float ringIntensity = sin(ringZ * 0.2) * 0.5 + 0.5;
      float ringFade = 1.0 - smoothstep(0.3, 0.8, radialDist);
      ringPattern += ringIntensity * ringFade * 0.3;
    }
    
    // Create rollercoaster track-like guides
    float trackPattern = 0.0;
    for(int i = 0; i < 4; i++) {
      float trackAngle = float(i) * 1.570796; // 90 degrees apart
      vec2 trackPos = center + vec2(cos(trackAngle), sin(trackAngle)) * 0.4;
      float trackDist = length(uv - trackPos);
      float trackLine = 1.0 - smoothstep(0.02, 0.06, trackDist);
      trackPattern += trackLine;
    }
    
    // Tunnel depth effect for infinite feeling
    float tunnelDepth = 1.0 - smoothstep(0.0, 1.0, radialDist);
    tunnelDepth = pow(tunnelDepth, 0.5); // Softer falloff
    
    // Combine all patterns for epic waterslide effect
    float finalPattern = streamPattern * 0.4 + 
                        spiralFlow * 0.3 + 
                        ringPattern * 0.2 + 
                        trackPattern * 0.1 + 
                        turbulentNoise * 0.2;
    
    // Enhanced breathing pulse for immersion
    float breathingIntensity = sin(time * 2.0 + breathingPulse * 6.28318) * 0.4 + 0.8;
    
    // Audio reactivity for dynamic response
    float audioReactive = 1.0 + audioLevel * 0.8 + sin(time * 15.0) * audioLevel * 0.3;
    
    // Create intense tunnel glow like being inside energy
    float tunnelGlow = pow(1.0 - radialDist, 2.0) * 0.6;
    float edgeGlow = pow(radialDist, 3.0) * 0.4;
    
    // Combine everything for final waterslide/rollercoaster effect
    vec3 finalColor = color * finalPattern * tunnelDepth * intensity * breathingIntensity * audioReactive;
    
    // Add glowing tunnel walls
    finalColor += color * (tunnelGlow + edgeGlow) * intensity * 0.8;
    
    // Add speed streaks for rollercoaster feeling
    float speedStreak = smoothstep(0.7, 1.0, finalPattern) * audioReactive;
    finalColor += vec3(1.0, 0.8, 0.6) * speedStreak * 0.3;
    
    // Final alpha with depth and pattern
    float alpha = (finalPattern + tunnelGlow) * tunnelDepth * intensity * 0.9;
    
    gl_FragColor = vec4(finalColor, alpha);
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
      25, // radiusTop - wider for waterslide feeling
      25, // radiusBottom  
      400, // height (much longer tunnel)
      64, // radialSegments - more detail
      40, // heightSegments - more segments for smooth flow
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
        tunnelScale: { value: 12.0 },
        breathingPulse: { value: 0 },
        audioLevel: { value: 0 },
        cameraZ: { value: 0 },
        turbulence: { value: 0.5 },
        spiralIntensity: { value: 1.0 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide, // Render inside of cylinder
      blending: THREE.AdditiveBlending
    });

    // Create tunnel mesh
    const tunnelMesh = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnelMesh.position.z = -200; // Position tunnel further ahead
    tunnelMeshRef.current = tunnelMesh;
    scene.add(tunnelMesh);

    // Add ambient lighting for depth
    const ambientLight = new THREE.AmbientLight(color, 0.2);
    scene.add(ambientLight);

    // Add multiple tunnel segments for infinite effect
    for (let i = 1; i < 4; i++) {
      const segmentMesh = tunnelMesh.clone();
      segmentMesh.position.z = -200 - (i * 400);
      scene.add(segmentMesh);
    }

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
    animState.tunnelSpeed = 2.5 + (depth / 5) * 4.0; // Much faster for rollercoaster feel

    // Audio-reactive effects
    const audioReactiveSpeed = isSpeaking ? 1.0 + (audioLevel / 100) * 0.8 : 1.0;
    const finalSpeed = animState.tunnelSpeed * audioReactiveSpeed;

    // Animate camera moving through tunnel with epic speed
    animState.cameraZ -= finalSpeed * 0.5;
    if (animState.cameraZ < -1200) {
      animState.cameraZ = 50; // Reset position for infinite tunnel effect
    }
    
    if (cameraRef.current) {
      cameraRef.current.position.z = animState.cameraZ;
      
      // Epic camera sway for waterslide immersion
      const swayIntensity = 2.5 + (audioLevel / 100) * 3.0;
      cameraRef.current.position.x = Math.sin(animState.time * 1.2) * swayIntensity;
      cameraRef.current.position.y = Math.cos(animState.time * 0.8) * (swayIntensity * 0.8);
      
      // Add intense roll for rollercoaster banking effect
      cameraRef.current.rotation.z = Math.sin(animState.time * 0.6) * 0.2 + Math.cos(animState.time * 0.4) * 0.15;
      
      // Look ahead into the tunnel with slight offset for realism
      const lookAheadX = Math.sin(animState.time * 0.3) * 5;
      const lookAheadY = Math.cos(animState.time * 0.25) * 3;
      cameraRef.current.lookAt(lookAheadX, lookAheadY, animState.cameraZ - 50);
    }

    // Update shader uniforms for all tunnel segments
    if (tunnelMeshRef.current) {
      const material = tunnelMeshRef.current.material as THREE.ShaderMaterial;
      
      // Update ego state color
      const egoColorInfo = getEgoColor(egoState);
      const colorValue = egoColorInfo?.accent || '#00ffff';
      const newColor = new THREE.Color(colorValue);
      material.uniforms.color.value = newColor;
      
      // Update animation uniforms
      material.uniforms.time.value = animState.time;
      material.uniforms.speed.value = finalSpeed;
      material.uniforms.intensity.value = 1.5 + (isSpeaking ? (audioLevel / 100) * 0.8 : 0);
      material.uniforms.breathingPulse.value = animState.breathingPulse;
      material.uniforms.audioLevel.value = audioLevel / 100;
      material.uniforms.cameraZ.value = animState.cameraZ;
      material.uniforms.turbulence.value = 0.4 + (audioLevel / 100) * 0.6;
      material.uniforms.spiralIntensity.value = 1.0 + (audioLevel / 100) * 0.5;
      
      // Breathing-reactive tunnel scale for dynamic flow
      const breathingScale = 10.0 + Math.sin(animState.breathingPulse * Math.PI * 2) * 6.0;
      const audioScale = 1.0 + (audioLevel / 100) * 0.7;
      material.uniforms.tunnelScale.value = breathingScale * audioScale;
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

  // CSS Fallback Component for epic waterslide effect
  const CSSWormholeFallback = () => {
    const egoColor = getEgoColor(egoState);
    
    return (
      <div 
        className={`relative flex items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size }}
        onClick={onTap}
      >
        {/* Epic tunnel rings - multiple layers for depth */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border-4 animate-pulse-slow"
            style={{
              width: `${10 + i * 12}%`,
              height: `${10 + i * 12}%`,
              borderColor: `${egoColor.accent}${Math.floor((1.0 - i * 0.08) * 255).toString(16)}`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.8 + i * 0.1}s`,
              borderStyle: i % 3 === 0 ? 'solid' : i % 3 === 1 ? 'dashed' : 'dotted',
              borderWidth: `${Math.max(1, 4 - i * 0.3)}px`
            }}
          />
        ))}
        
        {/* Spiral waterslide streams */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`stream-${i}`}
            className="absolute animate-spin-fast"
            style={{
              width: `${60 + i * 8}%`,
              height: `${60 + i * 8}%`,
              background: `conic-gradient(from ${i * 45}deg, ${egoColor.accent}60, transparent 10%, ${egoColor.accent}40, transparent 20%, ${egoColor.accent}60)`,
              borderRadius: '50%',
              animationDuration: `${0.5 + i * 0.2}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse'
            }}
          />
        ))}
        
        {/* Central rushing vortex - black hole effect */}
        <div
          className="absolute w-32 h-32 rounded-full animate-spin-fastest"
          style={{
            background: `radial-gradient(circle, ${egoColor.accent} 0%, ${egoColor.accent}80 20%, transparent 40%), 
                        conic-gradient(from 0deg, ${egoColor.accent}, transparent, ${egoColor.accent}, transparent, ${egoColor.accent})`,
            animationDuration: `${isSpeaking ? '0.2s' : '0.6s'}`
          }}
        />
        
        {/* Intense energy pulse overlay - breathing reactive */}
        <div
          className="absolute w-full h-full rounded-full animate-pulse-intense"
          style={{
            background: `radial-gradient(circle, ${egoColor.accent}60 0%, ${egoColor.accent}30 25%, ${egoColor.accent}15 50%, transparent 75%)`,
            animationDuration: breathingPhase === 'inhale' ? '2s' : 
                             breathingPhase === 'exhale' ? '1.5s' : '2.2s'
          }}
        />
        
        {/* Speed streaks for rollercoaster effect */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={`streak-${i}`}
            className="absolute animate-pulse-fast"
            style={{
              width: '2px',
              height: `${20 + i * 5}%`,
              background: `linear-gradient(to bottom, transparent, ${egoColor.accent}80, transparent)`,
              left: '50%',
              top: '50%',
              transformOrigin: 'center bottom',
              transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.3 + (i % 4) * 0.1}s`
            }}
          />
        ))}
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

Wormhole.displayName = 'Wormhole';

export default Wormhole;