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
    afterglow = false
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
    fractalPhase: 0
  });

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
      console.log('[ORB] Component unmounting - cleaning up');
      disposeScene();
    };
  }, [webglSupported]); // Only depend on WebGL support

  // Robust tap handler for mobile + desktop - no scene re-init
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;
    
    console.log('[ORB] Attaching event handlers to canvas, canvas pointer events:', canvas.style.pointerEvents);
    
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
      console.log('[ORB] WebGL context lost');
      setContextLost(true);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('[ORB] WebGL context restored');
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
    canvas.style.overflow = 'visible';
    canvas.className = 'orb-canvas';

    try {
      container.appendChild(canvas);
      console.log('[ORB] Canvas appended to container');
    } catch (error) {
      console.error('[ORB] Error appending canvas:', error);
      return;
    }

    // Initialize geometry and start animation
    initializeGeometry();
    
    // Start animation with delay to ensure everything is ready
    setTimeout(() => {
      if (isActiveRef.current && !contextLost) {
        console.log('[ORB] Starting animation loop');
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
    const scaleMultiplier = size / baseSize;
    const sphereRadius = 10 * scaleMultiplier;
    // Create fractal sphere geometry - ONCE
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 64, 64);
    
    // Store original vertex positions for fractal deformation
    const originalPositions = sphereGeometry.attributes.position.array.slice();
    sphereGeometry.userData = { originalPositions };
    
    // Create wireframe ONCE - don't recreate every frame
    const wireframeGeometry = new THREE.WireframeGeometry(sphereGeometry);
    
    // Create material with ego state color
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: afterglow ? 0.9 : 0.7,
      linewidth: 2
    });

    // Create mesh
    const orbMesh = new THREE.LineSegments(wireframeGeometry, material);
    orbMeshRef.current = orbMesh;
    scene.add(orbMesh);

    // Add glow layers
    const glowGeometry = new THREE.SphereGeometry(sphereRadius * 0.95, 32, 32);
    const glowMaterial1 = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: afterglow ? 0.15 : 0.08,
      side: THREE.BackSide
    });
    const glowMesh1 = new THREE.Mesh(glowGeometry, glowMaterial1);
    scene.add(glowMesh1);
    
    // Second pulsing layer
    const pulseGeometry = new THREE.SphereGeometry(sphereRadius * 0.8, 32, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide
    });
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    scene.add(pulseMesh);
    
    // Store references for animation
    orbMesh.userData = { glowMesh1, pulseMesh, sphereGeometry, wireframeGeometry };

    console.log('[ORB] Geometry initialized successfully');
  };

  const animate = () => {
    // Guard against inactive state
    if (!isActiveRef.current) {
      console.log('[ORB] Animation stopped - component inactive');
      return;
    }
    
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || contextLost) {
      // Retry animation in next frame if components aren't ready
      animationIdRef.current = requestAnimationFrame(animate);
      return;
    }

    const time = Date.now() * 0.001;
    const alienState = alienStateRef.current;
    
    // Alien pulsing pattern - irregular, organic
    alienState.pulse = Math.sin(time * 1.3) * 0.3 + 
                      Math.sin(time * 2.7) * 0.2 + 
                      Math.sin(time * 4.1) * 0.1;
    
    // Color intensity shifts
    alienState.intensity = 1 + Math.sin(time * 0.7) * 0.3;
    
    // Organic offset for movement
    alienState.organicOffset = Math.sin(time * 0.5) * 0.02;
    
    // Fractal deformation phase
    alienState.fractalPhase = time * 0.6;

    // Apply fractal deformations to the sphere geometry - NO WIREFRAME RECREATION
    if (orbMeshRef.current && orbMeshRef.current.userData.sphereGeometry) {
      const geometry = orbMeshRef.current.userData.sphereGeometry;
      const originalPositions = geometry.userData.originalPositions;
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const origX = originalPositions[i];
        const origY = originalPositions[i + 1];
        const origZ = originalPositions[i + 2];
        
        // Mathematical fractal deformation
        const phi = Math.atan2(origY, origX);
        const theta = Math.acos(origZ / Math.sqrt(origX * origX + origY * origY + origZ * origZ));
        
        // Multiple fractal layers
        const fractal1 = Math.sin(phi * 3 + time * 0.8) * Math.cos(theta * 2 + time * 0.5) * 0.4;
        const fractal2 = Math.sin(phi * 7 + time * 1.2) * Math.cos(theta * 5 + time * 0.9) * 0.2;
        const fractal3 = Math.sin(phi * 11 + time * 0.6) * Math.cos(theta * 8 + time * 1.1) * 0.15;
        
        // Chaotic mathematical noise
        const chaos = Math.sin(origX * 0.8 + time) * Math.cos(origY * 1.2 + time * 0.7) * Math.sin(origZ * 0.6 + time * 1.3) * 0.3;
        
        // Combine all deformations
        const totalDeformation = fractal1 + fractal2 + fractal3 + chaos + alienState.pulse;
        const deformationFactor = 1 + totalDeformation * 0.12;
        
        // Apply speaking/listening effects
        let speakingMod = 1;
        if (isSpeaking) {
          speakingMod = 1 + 0.4 * Math.sin(time * 8 + phi * 5) * Math.cos(time * 6 + theta * 3);
        }
        if (isListening) {
          speakingMod = 1 + 0.2 * Math.sin(time * 12 + phi * 7) * Math.cos(time * 10 + theta * 4);
        }
        
        positions[i] = origX * deformationFactor * speakingMod;
        positions[i + 1] = origY * deformationFactor * speakingMod;
        positions[i + 2] = origZ * deformationFactor * speakingMod;
      }
      
      // Only flag positions as dirty - DON'T recreate wireframe
      geometry.attributes.position.needsUpdate = true;
      
      // Update wireframe efficiently
      const wireframe = orbMeshRef.current.userData.wireframeGeometry;
      if (wireframe) {
        // Dispose old wireframe and create new one
        wireframe.dispose();
        const newWireframe = new THREE.WireframeGeometry(geometry);
        orbMeshRef.current.geometry = newWireframe;
        orbMeshRef.current.userData.wireframeGeometry = newWireframe;
      }
    }

    // Alien breathing - more dramatic and irregular
    const primaryPulse = 0.85 + 0.15 * Math.sin(time * 0.6);  // Main heartbeat
    const secondaryPulse = 1 + alienState.pulse * 0.08;       // Irregular alien pulse
    const breathingScale = primaryPulse * secondaryPulse;
    
    // Alien rotation - multi-axis, unpredictable
    const baseRotationSpeed = afterglow ? 0.4 : 0.25;
    const alienRotationX = time * baseRotationSpeed + Math.sin(time * 0.3) * 0.1;
    const alienRotationY = time * baseRotationSpeed * 0.7 + Math.cos(time * 0.4) * 0.15;
    const alienRotationZ = Math.sin(time * 0.2) * 0.05;
    
    if (orbMeshRef.current) {
      orbMeshRef.current.scale.setScalar(breathingScale);
      orbMeshRef.current.rotation.x = alienRotationX;
      orbMeshRef.current.rotation.y = alienRotationY; 
      orbMeshRef.current.rotation.z = alienRotationZ;
      
      // Alien organic movement
      orbMeshRef.current.position.x = Math.sin(time * 0.3) * 0.5;
      orbMeshRef.current.position.y = Math.cos(time * 0.4) * 0.3;
      orbMeshRef.current.position.z = Math.sin(time * 0.2) * 0.2;
      
      // Update material opacity for alien intensity
      const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
      material.opacity = (afterglow ? 0.9 : 0.7) * alienState.intensity;
      
      // Animate glow layers with more subtlety
      const userData = orbMeshRef.current.userData;
      if (userData.glowMesh1) {
        userData.glowMesh1.scale.setScalar(0.98 + alienState.pulse * 0.02);
        userData.glowMesh1.rotation.x = -alienRotationX * 0.5;
        userData.glowMesh1.rotation.y = -alienRotationY * 0.3;
        
        const glowMat = userData.glowMesh1.material as THREE.MeshBasicMaterial;
        glowMat.opacity = (afterglow ? 0.15 : 0.08) * (1 + alienState.pulse * 0.05);
      }
      
      if (userData.pulseMesh) {
        const pulseScale = 0.9 + Math.abs(alienState.pulse) * 0.05;
        userData.pulseMesh.scale.setScalar(pulseScale);
        userData.pulseMesh.rotation.z = time * 0.5;
        
        const pulseMat = userData.pulseMesh.material as THREE.MeshBasicMaterial;
        pulseMat.opacity = 0.03 + Math.abs(alienState.pulse) * 0.02;
      }

      // Speaking indicator - alien excitement
      if (isSpeaking) {
        material.opacity = 0.4 + 0.2 * Math.sin(time * 8);
      }

      // Listening indicator - alien attention mode
      if (isListening) {
        material.opacity = 0.3 + 0.3 * Math.sin(time * 10);
      }
    }

    // Dynamic camera movement - alien perspective shifts
    if (cameraRef.current) {
      cameraRef.current.position.x = 3 * Math.sin(time * 0.12) + Math.sin(time * 0.8) * 0.5;
      cameraRef.current.position.y = 2 * Math.cos(time * 0.18) + Math.cos(time * 1.1) * 0.3;
      cameraRef.current.position.z = 30 + Math.sin(time * 0.05) * 2;
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

  // Update orb color when ego state changes
  useEffect(() => {
    if (orbMeshRef.current && sceneRef.current) {
      const egoColorInfo = getEgoColor(egoState);
      const color = new THREE.Color(egoColorInfo.accent);
      const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
      material.color = color;
      
      // Update glow layers too
      const userData = orbMeshRef.current.userData;
      if (userData.glowMesh1) {
        const glowMat = userData.glowMesh1.material as THREE.MeshBasicMaterial;
        glowMat.color = color;
      }
      if (userData.pulseMesh) {
        const pulseMat = userData.pulseMesh.material as THREE.MeshBasicMaterial;
        pulseMat.color = color;
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
      if (userData.sphereGeometry) {
        userData.sphereGeometry.dispose();
      }
      if (userData.wireframeGeometry) {
        userData.wireframeGeometry.dispose();
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