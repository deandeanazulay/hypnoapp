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
    evolutionLevel = 'basic'
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
    currentShape: 0
  });

  // Store sphere radius for animation access
  const sphereRadiusRef = useRef<number>(10);

  // State for animations
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [currentState, setCurrentState] = React.useState<any>({});

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      setCurrentState(state);
    },
    setSpeaking: (speaking: boolean) => {
      setIsSpeaking(speaking);
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

    // Add contained glow layers that stay within bounds
    const glowLayers = evolutionLevel === 'basic' ? 1 : evolutionLevel === 'enhanced' ? 2 : evolutionLevel === 'advanced' ? 3 : 4;
    
    for (let layer = 0; layer < glowLayers; layer++) {
      const layerScale = 0.9 - (layer * 0.08); // Keep layers smaller
      const layerOpacity = (afterglow ? 0.2 : 0.12) / (layer + 1);
      
      const glowGeometry = new THREE.SphereGeometry(sphereRadius * layerScale, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: layerOpacity,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      scene.add(glowMesh);
      
      // Store reference for animation
      if (!orbMesh.userData.glowMeshes) orbMesh.userData.glowMeshes = [];
      orbMesh.userData.glowMeshes.push(glowMesh);
    }
    
    // Legacy single glow layer for backward compatibility
    const glowGeometry = new THREE.SphereGeometry(sphereRadius * 0.85, 32, 32);
    const glowMaterial1 = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: afterglow ? 0.2 : 0.12,
      side: THREE.BackSide
    });
    const glowMesh1 = new THREE.Mesh(glowGeometry, glowMaterial1);
    scene.add(glowMesh1);
    
    // Second pulsing layer
    const pulseGeometry = new THREE.SphereGeometry(sphereRadius * 0.7, 32, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide
    });
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    scene.add(pulseMesh);
    
    // Store references for animation
    orbMesh.userData = { glowMesh1, pulseMesh, glowMeshes: orbMesh.userData.glowMeshes || [] };

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

    // Update alien state with smooth animation
    alienState.pulse = Math.sin(time * 0.8) * 0.5 + Math.cos(time * 0.3) * 0.3;
    alienState.intensity = 0.8 + 0.2 * Math.sin(time * 0.5);
    alienState.colorShift = time * 0.1;
    alienState.organicOffset = time * 0.2;
    alienState.fractalPhase = time * 0.15;
    
    // Geometric shape transformation (changes every 3 seconds)
    alienState.geometryPhase = time * 0.33; // Slower transformation
    alienState.currentShape = Math.floor(alienState.geometryPhase) % 9;

    // Alien breathing - more dramatic and irregular
    const evolutionComplexity = evolutionLevel === 'basic' ? 1 : evolutionLevel === 'enhanced' ? 1.5 : evolutionLevel === 'advanced' ? 2 : 3;
    const primaryPulse = 0.9 + 0.1 * Math.sin(time * 0.6 * evolutionComplexity);  // Gentler heartbeat
    const secondaryPulse = 1 + alienState.pulse * (0.05 * evolutionComplexity);       // Subtle alien pulse
    const breathingScale = primaryPulse * secondaryPulse;
    
    // Geometric shape transformation instead of rotation
    const shapeTransition = (alienState.geometryPhase % 1); // 0-1 transition between shapes
    const smoothTransition = 0.5 * (1 + Math.sin((shapeTransition - 0.5) * Math.PI)); // Smooth S-curve
    
    if (orbMeshRef.current) {
      // Apply geometric transformation to vertices
      applyGeometricShape(orbMeshRef.current, alienState.currentShape, smoothTransition, sphereRadiusRef.current);
      // Keep orb within bounds with subtle breathing
      orbMeshRef.current.scale.setScalar(0.95 + alienState.pulse * 0.03); 
      
      // Minimal rotation for visual interest, not spinning
      orbMeshRef.current.rotation.x = Math.sin(time * 0.1) * 0.05;
      orbMeshRef.current.rotation.y = Math.cos(time * 0.08) * 0.03;
      orbMeshRef.current.rotation.z = Math.sin(time * 0.06) * 0.02;
      
      // Subtle organic movement that stays centered
      orbMeshRef.current.position.x = Math.sin(time * 0.3) * 0.2;
      orbMeshRef.current.position.y = Math.cos(time * 0.4) * 0.15;
      orbMeshRef.current.position.z = Math.sin(time * 0.2) * 0.1;
      
      // Update material opacity for alien intensity
      const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
      material.opacity = (afterglow ? 0.8 : 0.6) * alienState.intensity * (evolutionLevel === 'master' ? 1.3 : 1);
      
      // Animate all glow layers
      const userData = orbMeshRef.current.userData;
      if (userData.glowMeshes) {
        userData.glowMeshes.forEach((glowMesh: any, index: number) => {
          const layerOffset = index * 0.2;
          glowMesh.scale.setScalar(0.95 + alienState.pulse * (0.03 + layerOffset * 0.01));
          glowMesh.rotation.x = Math.sin(time * 0.05) * (0.02 + layerOffset * 0.01);
          glowMesh.rotation.y = Math.cos(time * 0.04) * (0.01 + layerOffset * 0.005);
          
          const glowMat = glowMesh.material as THREE.MeshBasicMaterial;
          glowMat.opacity = ((afterglow ? 0.15 : 0.08) / (index + 1)) * (1 + alienState.pulse * 0.08);
        });
      }
      
      // Legacy glow layer
      if (userData.glowMesh1) {
        userData.glowMesh1.scale.setScalar(0.95 + alienState.pulse * 0.03);
        userData.glowMesh1.rotation.x = Math.sin(time * 0.05) * 0.02;
        userData.glowMesh1.rotation.y = Math.cos(time * 0.04) * 0.01;
        
        const glowMat = userData.glowMesh1.material as THREE.MeshBasicMaterial;
        glowMat.opacity = (afterglow ? 0.15 : 0.08) * (1 + alienState.pulse * 0.08);
      }
      
      if (userData.pulseMesh) {
        const pulseScale = 0.85 + Math.abs(alienState.pulse) * 0.08;
        userData.pulseMesh.scale.setScalar(pulseScale);
        userData.pulseMesh.rotation.z = Math.sin(time * 0.2) * 0.1;
        
        const pulseMat = userData.pulseMesh.material as THREE.MeshBasicMaterial;
        pulseMat.opacity = 0.04 + Math.abs(alienState.pulse) * 0.02;
      }

      // Speaking indicator - alien excitement
      if (isSpeaking) {
        material.opacity = 0.4 + 0.15 * Math.sin(time * 8);
      }

      // Listening indicator - alien attention mode
      if (isListening) {
        material.opacity = 0.3 + 0.25 * Math.sin(time * 10);
      }
    }

    // Subtle camera movement that stays centered
    if (cameraRef.current) {
      cameraRef.current.position.x = 1 * Math.sin(time * 0.12) + Math.sin(time * 0.8) * 0.2;
      cameraRef.current.position.y = 0.8 * Math.cos(time * 0.18) + Math.cos(time * 1.1) * 0.15;
      cameraRef.current.position.z = 30 + Math.sin(time * 0.05) * 1;
      cameraRef.current.lookAt(0, 0, 0);
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

  // Apply geometric shape transformations to the orb
  const applyGeometricShape = (mesh: THREE.LineSegments, shapeIndex: number, transition: number, baseRadius: number) => {
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
      
      // Define 9 different organic shapes that stay within bounds
      let newRadius = radius;
      
      switch (shapeIndex) {
        case 0: // Sphere (original)
          newRadius = baseRadius;
          break;
        case 1: // Organic blob 1
          newRadius = baseRadius * (0.8 + 0.2 * Math.sin(3 * theta) * Math.sin(2 * phi));
          break;
        case 2: // Flowing form
          newRadius = baseRadius * (0.85 + 0.15 * Math.cos(4 * theta + phi));
          break;
        case 3: // Pulsing organic
          newRadius = baseRadius * (0.9 + 0.1 * Math.sin(5 * theta) * Math.cos(3 * phi));
          break;
        case 4: // Twisted organic
          newRadius = baseRadius * (0.88 + 0.12 * Math.sin(theta + phi * 1.5));
          break;
        case 5: // Flowing waves
          newRadius = baseRadius * (0.82 + 0.18 * Math.sin(6 * theta) * Math.sin(phi));
          break;
        case 6: // Gentle star
          newRadius = baseRadius * (0.85 + 0.15 * Math.sin(6 * theta));
          break;
        case 7: // Organic twist
          newRadius = baseRadius * (0.87 + 0.13 * Math.sin(theta + phi * 1.8));
          break;
        case 8: // Complex organic
          newRadius = baseRadius * (0.83 + 0.17 * Math.sin(7 * theta) * Math.cos(4 * phi));
          break;
      }
      
      // Smooth transition between shapes
      const currentRadius = radius + (newRadius - radius) * transition;
      
      // Apply new position based on shape transformation
      const scale = currentRadius / radius;
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
      if (userData.glowMesh1) {
        userData.glowMesh1.geometry?.dispose();
        userData.glowMesh1.material?.dispose();
      }
      if (userData.pulseMesh) {
        userData.pulseMesh.geometry?.dispose();
        userData.pulseMesh.material?.dispose();
      }
      if (userData.glowMeshes) {
        userData.glowMeshes.forEach((glowMesh: any) => {
          glowMesh.geometry?.dispose();
          glowMesh.material?.dispose();
        });
      }
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