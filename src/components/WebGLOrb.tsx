import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as THREE from 'three';
import { getEgoColor } from '../config/theme';

export interface WebGLOrbRef {
  updateState: (state: any) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

interface WebGLOrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  className?: string;
  afterglow?: boolean;
  evolutionLevel?: 'basic' | 'enhanced' | 'advanced' | 'master';
  isSpeaking?: boolean;
  audioLevel?: number;
  audioFrequency?: number;
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function safeSize(width: number, height: number) {
  // Stay under common 4096*4096 limits on mobile
  const MAX = 4096;
  const scale = Math.min(1, MAX / Math.max(width, height));
  return { w: Math.floor(width * scale), h: Math.floor(height * scale) };
}

const WebGLOrb = React.forwardRef<WebGLOrbRef, WebGLOrbProps>((props, ref) => {
  const {
    onTap,
    size = 280,
    egoState = 'guardian',
    className = '',
    afterglow = false,
    evolutionLevel = 'basic',
    isSpeaking = false,
    audioLevel = 0,
    audioFrequency = 0
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbMeshRef = useRef<THREE.LineSegments | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const initializedRef = useRef(false);
  const [webglSupported, setWebglSupported] = React.useState<boolean | null>(null);
  const [contextLost, setContextLost] = React.useState(false);
  
  // Alien state for fractal mathematics
  const alienStateRef = useRef({
    pulse: 0,
    intensity: 1,
    colorShift: 0,
    organicOffset: 0,
    fractalPhase: 0,
    geometryPhase: 0,
    currentShape: 0,
    shapeBlend: 0,
    nextShape: 1,
    morphSpeed: 0.8,
    randomOffset: Math.random() * 1000,
    chaosLevel: 0.5,
    tunnelMode: false,
    tunnelDepth: 0,
    cameraMovement: { x: 0, y: 0, z: 0 },
    tunnelSpeed: 1.0
  });

  // Store sphere radius for animation access
  const sphereRadiusRef = useRef<number>(10);

  // State for animations
  const [internalSpeaking, setInternalSpeaking] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [currentState, setCurrentState] = React.useState<any>({});
  const [tunnelMode, setTunnelMode] = React.useState(false);

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      setCurrentState(state);
      // Activate tunnel mode when session is playing
      if (state.playState === 'playing') {
        setTunnelMode(true);
        animationStateRef.current.tunnelMode = true;
      } else {
        setTunnelMode(false);
        animationStateRef.current.tunnelMode = false;
      }
    },
    setSpeaking: (speaking: boolean) => {
      setInternalSpeaking(speaking);
    },
    setListening: (listening: boolean) => {
      setIsListening(listening);
    }
  }));

  // Stable tap handler - no re-init on function change
  const handleTap = useCallback(() => {
    console.log('[WEBGL-ORB] Tap detected, calling onTap');
    onTap?.();
  }, [onTap]);

  // Check WebGL support once on mount
  useEffect(() => {
    console.log('[ORB] Checking WebGL support');
    setWebglSupported(supportsWebGL());
  }, []);

  // Initialize once with guard - StrictMode proof
  useEffect(() => {
    if (webglSupported === false || !containerRef.current || initializedRef.current || contextLost) {
      return;
    }
    
    console.log('[ORB] Initializing WebGL scene');
    initializedRef.current = true;
    initializeOrb();
    
    return () => {
      if (import.meta.env.DEV) {
        console.log('[ORB] Component unmounting - cleaning up');
      }
      disposeScene();
    };
  }, [webglSupported]); // Only depend on WebGL support

  // Robust tap handler for mobile + desktop - no scene re-init
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;
    
    if (import.meta.env.DEV) {
      console.log('[ORB] Attaching event handlers to canvas, canvas pointer events:', canvas.style.pointerEvents);
    }
    
    // Ensure canvas can receive events
    canvas.style.pointerEvents = 'auto';
    canvas.style.zIndex = '100';
    canvas.style.position = 'relative';
    
    // Robust event handling for mobile + desktop
    const handleEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[WEBGL-ORB] Event triggered:', e.type);
      console.log('[WEBGL-ORB] Calling handleTap function');
      handleTap();
    };
    
    // Multiple event types for maximum compatibility
    canvas.addEventListener('click', handleEvent, { passive: false });
    canvas.addEventListener('touchend', handleEvent, { passive: false });
    canvas.addEventListener('pointerup', handleEvent, { passive: false });
    
    return () => {
      canvas.removeEventListener('click', handleEvent as any);
      canvas.removeEventListener('touchend', handleEvent as any);
      canvas.removeEventListener('pointerup', handleEvent as any);
    };
  }, [handleTap]);

  // Handle resize separately - no scene re-init
  useEffect(() => {
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      const { w, h } = safeSize(size, size);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
      
      // Update canvas display size
      const canvas = rendererRef.current.domElement;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };

    handleResize(); // Apply current size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  const initializeOrb = () => {
    if (!containerRef.current) {
      console.error('[ORB] No container ref available');
      return;
    }

    const container = containerRef.current;
    
    // Clear any existing content first
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    const { w, h } = safeSize(size, size);

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;

    // Renderer setup with iOS Safari optimizations
    const MAX_DPR = 1.5; // Avoid huge textures on iOS
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0); // Transparent background
    rendererRef.current = renderer;

    // WebGL context loss handling
    const canvas = renderer.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (import.meta.env.DEV) {
        console.log('[ORB] WebGL context lost');
      }
      setContextLost(true);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    });

    canvas.addEventListener('webglcontextrestored', () => {
      if (import.meta.env.DEV) {
        console.log('[ORB] WebGL context restored');
      }
      setContextLost(false);
      // Reinitialize scene
      setTimeout(() => {
        if (isActiveRef.current) {
          initializeGeometry();
          animate();
        }
      }, 100);
    });

    // Style canvas - predictable stacking
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.cursor = 'pointer';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '10';
    canvas.style.pointerEvents = 'auto';
    canvas.className = 'orb-canvas';

    try {
      container.appendChild(canvas);
      if (import.meta.env.DEV) {
        console.log('[ORB] Canvas appended to container');
      }
    } catch (error) {
      console.error('[ORB] Error appending canvas:', error);
      return;
    }

    // Initialize geometry and start animation
    initializeGeometry();
    
    // Start animation with delay to ensure everything is ready
    setTimeout(() => {
      if (isActiveRef.current && !contextLost) {
        if (import.meta.env.DEV) {
          console.log('[ORB] Starting animation loop');
        }
        animate();
      }
    }, 50);
  };

  const initializeGeometry = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current || contextLost) {
      console.error('[ORB] Cannot initialize geometry - missing references');
      return;
    }

    const scene = sceneRef.current;

    // Clear existing orb
    if (orbMeshRef.current) {
      scene.remove(orbMeshRef.current);
      if (orbMeshRef.current.userData.glowMesh1) {
        scene.remove(orbMeshRef.current.userData.glowMesh1);
      }
      if (orbMeshRef.current.userData.pulseMesh) {
        scene.remove(orbMeshRef.current.userData.pulseMesh);
      }
    }

    // Get ego state colors
    const egoColorInfo = getEgoColor(egoState);
    const color = new THREE.Color(egoColorInfo.accent);

    // Calculate scale based on size prop (base size is 280px)
    const baseSize = 280;
    // Validate size prop to prevent NaN values in geometry
    const validSize = (typeof size === 'number' && !isNaN(size) && size > 0) ? size : 280;
    const scaleMultiplier = validSize / baseSize;
    const sphereRadius = 8 * scaleMultiplier; // Slightly smaller to fit within bounds
    
    // Store radius for animation access
    sphereRadiusRef.current = sphereRadius;
    
    // Create sphere geometry optimized for shape morphing
    const baseDetail = evolutionLevel === 'basic' ? 32 : evolutionLevel === 'enhanced' ? 48 : evolutionLevel === 'advanced' ? 64 : 96;
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, baseDetail, baseDetail);
    
    // Create wireframe geometry
    const wireframeGeometry = new THREE.WireframeGeometry(sphereGeometry);
    
    // Create material with ego state color and evolution effects
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: (afterglow ? 0.8 : 0.6) * (evolutionLevel === 'master' ? 1.2 : evolutionLevel === 'advanced' ? 1.1 : 1),
      linewidth: 2
    });

    // Create mesh
    const orbMesh = new THREE.LineSegments(wireframeGeometry, material);
    orbMeshRef.current = orbMesh;
    scene.add(orbMesh);

    // Store references for animation (no glow layers)
    orbMesh.userData = {};

    if (import.meta.env.DEV) {
      console.log('[ORB] Geometry initialized successfully');
    }
  };

  const animate = () => {
    if (!isActiveRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current || contextLost) {
      return;
    }

    const time = Date.now() * 0.001; // Time in seconds
    const alienState = alienStateRef.current;

    // Update alien state with chaotic, unpredictable animation
    const randomTime = time + alienState.randomOffset;
    alienState.pulse = Math.sin(randomTime * 1.3) * 0.6 + Math.cos(randomTime * 0.7) * 0.4 + Math.sin(randomTime * 2.1) * 0.2;
    alienState.intensity = 0.7 + 0.3 * Math.sin(randomTime * 0.9) + 0.1 * Math.cos(randomTime * 1.7);
    alienState.colorShift = randomTime * 0.15 + Math.sin(randomTime * 0.4) * 0.05;
    alienState.organicOffset = randomTime * 0.3 + Math.cos(randomTime * 0.6) * 0.1;
    alienState.fractalPhase = randomTime * 0.2 + Math.sin(randomTime * 1.1) * 0.08;
    
    // Continuous shape morphing - never stops, always blending between shapes
    alienState.morphSpeed = 0.6 + 0.4 * Math.sin(randomTime * 0.3); // Variable morph speed
    alienState.geometryPhase += alienState.morphSpeed * 0.016; // Continuous increment
    
    // Constantly changing shapes with smooth blending
    const shapeIndex = alienState.geometryPhase;
    alienState.currentShape = Math.floor(shapeIndex) % 12; // Increased to 12 shapes
    alienState.nextShape = (alienState.currentShape + 1) % 12;
    alienState.shapeBlend = shapeIndex % 1; // 0-1 blend between current and next shape
    
    // Add chaos level that varies over time
    alienState.chaosLevel = 0.3 + 0.7 * Math.sin(randomTime * 0.2) + 0.2 * Math.cos(randomTime * 0.8);

    // Tunnel mode transformations
    if (alienState.tunnelMode) {
      // Increase tunnel speed and depth over time
      alienState.tunnelSpeed = 2.0 + Math.sin(randomTime * 0.1) * 0.5;
      alienState.tunnelDepth += alienState.tunnelSpeed * 0.016; // ~60fps
      
      // Epic camera movement through tunnel
      alienState.cameraMovement.x = Math.sin(randomTime * 0.8) * 3.0 + Math.cos(randomTime * 1.2) * 1.5;
      alienState.cameraMovement.y = Math.cos(randomTime * 0.6) * 2.5 + Math.sin(randomTime * 1.4) * 1.2;
      alienState.cameraMovement.z = -alienState.tunnelDepth * 0.5;
      
      // Increase chaos and morphing for tunnel effect
      alienState.chaosLevel = Math.min(1.0, alienState.chaosLevel + 0.01);
      alienState.morphSpeed = 1.5 + Math.sin(randomTime * 0.4) * 0.8;
    }

    // Alien breathing - chaotic and unpredictable
    const evolutionComplexity = evolutionLevel === 'basic' ? 1 : evolutionLevel === 'enhanced' ? 1.5 : evolutionLevel === 'advanced' ? 2 : 3;
    const primaryPulse = 0.85 + 0.15 * Math.sin(randomTime * 0.9 * evolutionComplexity);
    const secondaryPulse = 1 + alienState.pulse * (0.08 * evolutionComplexity);
    const chaosPulse = 1 + Math.sin(randomTime * 1.4) * 0.06 * alienState.chaosLevel;
    const breathingScale = primaryPulse * secondaryPulse * chaosPulse;
    
    // Smooth shape blending with alien unpredictability
    const smoothTransition = 0.5 * (1 + Math.sin((alienState.shapeBlend - 0.5) * Math.PI));
    
    // Audio-reactive scaling and movement
    const isCurrentlySpeaking = isSpeaking || internalSpeaking;
    const audioReactiveScale = isCurrentlySpeaking ? 
      1.0 + (audioLevel / 100) * 0.15 + Math.sin(time * 12) * 0.05 : 1.0;
    const audioReactiveIntensity = isCurrentlySpeaking ? 
      1.0 + (audioLevel / 100) * 0.3 + Math.sin(time * 8) * 0.1 : 1.0;
    
    if (orbMeshRef.current) {
      // Apply geometric transformation to vertices
      if (alienState.tunnelMode) {
        applyTunnelTransformation(orbMeshRef.current, alienState, sphereRadiusRef.current, time);
      } else {
        applyAlienShapeBlending(orbMeshRef.current, alienState.currentShape, alienState.nextShape, smoothTransition, sphereRadiusRef.current, alienState.chaosLevel);
      }
      
      // Audio-reactive scaling combined with breathing
      const baseScale = alienState.tunnelMode ? 1.2 : 0.92;
      const alienBreathingScale = baseScale + alienState.pulse * 0.08 + Math.sin(randomTime * 1.6) * 0.03;
      orbMeshRef.current.scale.setScalar(alienBreathingScale * audioReactiveScale);
      
      // Alien rotation - chaotic and unpredictable
      const rotationMultiplier = (isCurrentlySpeaking ? 2.5 + (audioLevel / 100) : 1.2) * (alienState.tunnelMode ? 2.0 : 1.0);
      const chaosRotation = alienState.chaosLevel * 0.1;
      orbMeshRef.current.rotation.x = Math.sin(randomTime * 0.13 * rotationMultiplier) * (0.08 + chaosRotation) + Math.cos(randomTime * 0.31) * 0.03;
      orbMeshRef.current.rotation.y = Math.cos(randomTime * 0.11 * rotationMultiplier) * (0.06 + chaosRotation) + Math.sin(randomTime * 0.27) * 0.04;
      orbMeshRef.current.rotation.z = Math.sin(randomTime * 0.09 * rotationMultiplier) * (0.04 + chaosRotation) + Math.cos(randomTime * 0.23) * 0.02;
      
      // Alien movement - erratic and organic
      const movementMultiplier = (isCurrentlySpeaking ? 2.0 + (audioLevel / 100) * 0.8 : 1.3) * (alienState.tunnelMode ? 0.5 : 1.0);
      const chaosMovement = alienState.chaosLevel * 0.3;
      orbMeshRef.current.position.x = Math.sin(randomTime * 0.37) * (0.4 + chaosMovement) * movementMultiplier + Math.cos(randomTime * 0.71) * 0.15;
      orbMeshRef.current.position.y = Math.cos(randomTime * 0.43) * (0.3 + chaosMovement) * movementMultiplier + Math.sin(randomTime * 0.83) * 0.12;
      orbMeshRef.current.position.z = Math.sin(randomTime * 0.29) * (0.2 + chaosMovement) * movementMultiplier + Math.cos(randomTime * 0.67) * 0.08;
      
      // Update material opacity for alien intensity
      const baseOpacity = (afterglow ? 0.8 : 0.6) * alienState.intensity * (evolutionLevel === 'master' ? 1.3 : 1) * (alienState.tunnelMode ? 1.5 : 1.0);
      const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
      
      if (isCurrentlySpeaking) {
        // Audio-reactive opacity pulsing
        const audioReactivePulse = 0.5 + 0.5 * (audioLevel / 100) + Math.sin(randomTime * 12) * 0.25 + Math.cos(randomTime * 8.3) * 0.15;
        material.opacity = baseOpacity * audioReactivePulse;
      } else {
        material.opacity = baseOpacity * (0.9 + 0.1 * Math.sin(randomTime * 0.6));
      }

      // Listening indicator - alien attention mode
      if (isListening) {
        material.opacity = 0.2 + 0.4 * Math.sin(randomTime * 15) + 0.2 * Math.cos(randomTime * 11.7);
      }
    }

    // Camera movement - tunnel mode vs normal mode
    if (cameraRef.current) {
      if (alienState.tunnelMode) {
        // Epic rollercoaster camera movement through tunnel
        const tunnelCameraMultiplier = isCurrentlySpeaking ? 2.0 + (audioLevel / 100) : 1.5;
        cameraRef.current.position.x = alienState.cameraMovement.x * tunnelCameraMultiplier;
        cameraRef.current.position.y = alienState.cameraMovement.y * tunnelCameraMultiplier;
        cameraRef.current.position.z = Math.max(15, 30 + alienState.cameraMovement.z);
        
        // Banking and tilting like a rollercoaster
        const banking = Math.sin(randomTime * 0.3) * 0.3;
        const tilting = Math.cos(randomTime * 0.4) * 0.2;
        cameraRef.current.rotation.z = banking + tilting;
        
        // Look ahead into the tunnel with dynamic offset
        const lookAheadX = Math.sin(randomTime * 0.5) * 8;
        const lookAheadY = Math.cos(randomTime * 0.3) * 6;
        cameraRef.current.lookAt(lookAheadX, lookAheadY, -50);
      } else {
        // Normal alien camera movement - subtle but unpredictable
        const cameraMovementMultiplier = isCurrentlySpeaking ? 1.4 + (audioLevel / 100) * 0.5 : 1.1;
        const cameraChaosFactor = alienState.chaosLevel * 0.2;
        cameraRef.current.position.x = (1 + cameraChaosFactor) * Math.sin(randomTime * 0.14 * cameraMovementMultiplier) + Math.sin(randomTime * 0.9) * 0.25;
        cameraRef.current.position.y = (0.8 + cameraChaosFactor) * Math.cos(randomTime * 0.19 * cameraMovementMultiplier) + Math.cos(randomTime * 1.3) * 0.18;
        cameraRef.current.position.z = 30 + Math.sin(randomTime * 0.07) * (1.2 + cameraChaosFactor) * cameraMovementMultiplier;
        cameraRef.current.rotation.z = 0;
        cameraRef.current.lookAt(0, 0, 0);
      }
    }

    try {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Only continue animation if still active
      if (isActiveRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    } catch (error) {
      console.error('[ORB] WebGL render error:', error);
      // Continue trying unless context is lost
      if (isActiveRef.current && !contextLost) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    }
  };

  // Apply alien shape blending with continuous morphing
  const applyAlienShapeBlending = (mesh: THREE.LineSegments, currentShape: number, nextShape: number, blend: number, baseRadius: number, chaosLevel: number) => {
    const geometry = mesh.geometry as THREE.WireframeGeometry;
    const positionAttribute = geometry.attributes.position;
    
    if (!positionAttribute) return;
    
    const positions = positionAttribute.array as Float32Array;
    const vertexCount = positions.length / 3;
    
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1]; 
      const z = positions[i * 3 + 2];
      
      // Calculate original spherical coordinates
      const radius = Math.sqrt(x * x + y * y + z * z);
      const theta = Math.atan2(y, x);
      const phi = Math.acos(z / radius);
      
      // Define 12 different alien organic shapes
      const getAlienRadius = (shapeIndex: number, theta: number, phi: number, chaos: number) => {
        const chaosNoise = Math.sin(theta * 7 + time * 2) * Math.cos(phi * 5 + time * 1.5) * chaos * 0.15;
        
        switch (shapeIndex % 12) {
          case 0: // Pulsing blob
            return baseRadius * (0.8 + 0.2 * Math.sin(3 * theta + time * 2) * Math.sin(2 * phi + time * 1.5) + chaosNoise);
          case 1: // Flowing organic
            return baseRadius * (0.85 + 0.15 * Math.cos(4 * theta + phi + time) + chaosNoise);
          case 2: // Twisted alien
            return baseRadius * (0.9 + 0.1 * Math.sin(5 * theta + time * 1.2) * Math.cos(3 * phi + time * 0.8) + chaosNoise);
          case 3: // Spiral organism
            return baseRadius * (0.88 + 0.12 * Math.sin(theta + phi * 1.5 + time * 1.8) + chaosNoise);
          case 4: // Undulating creature
            return baseRadius * (0.82 + 0.18 * Math.sin(6 * theta + time * 0.7) * Math.sin(phi + time * 1.1) + chaosNoise);
          case 5: // Star-like alien
            return baseRadius * (0.85 + 0.15 * Math.sin(8 * theta + time * 1.3) + chaosNoise);
          case 6: // Organic twist
            return baseRadius * (0.87 + 0.13 * Math.sin(theta * 2 + phi * 1.8 + time * 0.9) + chaosNoise);
          case 7: // Complex organism
            return baseRadius * (0.83 + 0.17 * Math.sin(7 * theta + time * 1.6) * Math.cos(4 * phi + time * 0.6) + chaosNoise);
          case 8: // Flowing tentacle-like
            return baseRadius * (0.86 + 0.14 * Math.cos(3 * theta + time * 2.1) * Math.sin(5 * phi + time * 1.4) + chaosNoise);
          case 9: // Alien pod
            return baseRadius * (0.84 + 0.16 * Math.sin(theta * 4 + time * 1.7) * Math.cos(phi * 2 + time * 1.2) + chaosNoise);
          case 10: // Morphing creature
            return baseRadius * (0.81 + 0.19 * Math.cos(theta * 6 + time * 0.5) * Math.sin(phi * 3 + time * 2.2) + chaosNoise);
          case 11: // Chaotic alien
            return baseRadius * (0.79 + 0.21 * Math.sin(theta * 9 + time * 1.9) * Math.cos(phi * 7 + time * 0.4) + chaosNoise);
          default:
            return baseRadius * (0.85 + chaosNoise);
        }
      };
      
      // Get current and next shape radii
      const currentRadius = getAlienRadius(currentShape, theta, phi, chaosLevel);
      const nextRadius = getAlienRadius(nextShape, theta, phi, chaosLevel);
      
      // Blend between current and next shape
      const blendedRadius = currentRadius + (nextRadius - currentRadius) * blend;
      
      // Add per-vertex chaos for alien-like irregularity
      const vertexChaos = Math.sin(i * 0.1 + time * 3) * Math.cos(i * 0.07 + time * 2.3) * chaosLevel * 0.05;
      const finalRadius = blendedRadius + vertexChaos * baseRadius;
      
      // Apply new position based on shape transformation
      const scale = finalRadius / radius;
      positions[i * 3] = x * scale;
      positions[i * 3 + 1] = y * scale;
      positions[i * 3 + 2] = z * scale;
    }
    
    positionAttribute.needsUpdate = true;
  };

  // Apply tunnel transformation for immersive wormhole effect
  const applyTunnelTransformation = (mesh: THREE.LineSegments, alienState: any, baseRadius: number, time: number) => {
    const geometry = mesh.geometry as THREE.WireframeGeometry;
    const positionAttribute = geometry.attributes.position;
    
    if (!positionAttribute) return;
    
    const positions = positionAttribute.array as Float32Array;
    const vertexCount = positions.length / 3;
    
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1]; 
      const z = positions[i * 3 + 2];
      
      // Calculate original spherical coordinates
      const radius = Math.sqrt(x * x + y * y + z * z);
      const theta = Math.atan2(y, x);
      const phi = Math.acos(z / radius);
      
      // Create tunnel effect - expand outward like being inside a tube
      const tunnelRadius = baseRadius * (2.0 + Math.sin(phi * 4 + time * 2) * 0.3);
      
      // Add flowing tunnel ridges like a waterslide
      const ridgePattern = Math.sin(theta * 8 + time * 3 + z * 0.1) * 0.2;
      const flowPattern = Math.sin(theta * 12 - time * 4 + phi * 6) * 0.15;
      
      // Spiral flow effect
      const spiralFlow = Math.sin(theta * 6 + time * 5 + radius * 0.2) * 0.25;
      
      // Combine all tunnel effects
      const finalRadius = tunnelRadius + (ridgePattern + flowPattern + spiralFlow) * baseRadius;
      
      // Add depth-based scaling for infinite tunnel feeling
      const depthScale = 1.0 + Math.sin(z * 0.1 + time * 2) * 0.1;
      
      // Apply transformation
      const scale = (finalRadius / radius) * depthScale;
      positions[i * 3] = x * scale;
      positions[i * 3 + 1] = y * scale;
      positions[i * 3 + 2] = z * scale;
    }
    
    positionAttribute.needsUpdate = true;
  };

  // Update orb color when ego state changes
  useEffect(() => {
    if (orbMeshRef.current && sceneRef.current) {
      const egoColorInfo = getEgoColor(egoState);
      const color = new THREE.Color(egoColorInfo.accent);
      const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
      material.color = color;
      
      // Update glow layers too
      const userData = orbMeshRef.current.userData;
      if (userData.glowMeshes) {
        userData.glowMeshes.forEach((glowMesh: any) => {
          const glowMat = glowMesh.material as THREE.MeshBasicMaterial;
          glowMat.color = color;
        });
      }
    }
  }, [egoState]);

  const disposeScene = () => {
    if (import.meta.env.DEV) {
      console.log('[ORB] Disposing scene');
    }
    
    // Stop animation
    isActiveRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Clean up Three.js objects
    if (orbMeshRef.current) {
      const userData = orbMeshRef.current.userData;
      orbMeshRef.current.geometry?.dispose();
      orbMeshRef.current.material?.dispose();
    }

    if (rendererRef.current) {
      try {
        rendererRef.current.dispose();
      } catch (error) {
        console.error('[ORB] Error disposing renderer:', error);
      }
    }

    // Clear references
    sceneRef.current = null;
    rendererRef.current = null;
    cameraRef.current = null;
    orbMeshRef.current = null;
    initializedRef.current = false;
  };

  // Don't render anything if WebGL check is pending
  if (webglSupported === null) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size, zIndex: 10, pointerEvents: 'auto', overflow: 'visible' }}
      >
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Show error if WebGL is not supported
  if (!webglSupported) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-500/20 border border-red-500/40 rounded-full ${className}`}
        style={{ width: size, height: size, zIndex: 10, pointerEvents: 'auto', overflow: 'visible' }}
      >
        <div className="text-center p-4">
          <div className="text-red-400 text-sm font-medium mb-2">WebGL Required</div>
          <div className="text-red-300/80 text-xs">Please enable hardware acceleration</div>
        </div>
      </div>
    );
  }

  // Show context lost indicator
  if (contextLost) {
    return (
      <div 
        className={`flex items-center justify-center bg-yellow-500/20 border border-yellow-500/40 rounded-full ${className}`}
        style={{ width: size, height: size, zIndex: 10, pointerEvents: 'auto', overflow: 'visible' }}
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
      className={`orb-container relative ${className}`}
      style={{ 
        width: size, 
        height: size, 
        zIndex: 10, 
        pointerEvents: 'auto', 
        overflow: 'visible'
      }}
    />
  );
});

WebGLOrb.displayName = 'WebGLOrb';

export default WebGLOrb;