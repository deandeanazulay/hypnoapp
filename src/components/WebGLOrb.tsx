import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

const WebGLOrb = forwardRef<WebGLOrbRef, WebGLOrbProps>(({
  onTap,
  size = 280,
  egoState = 'guardian',
  className = '',
  afterglow = false
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbMeshRef = useRef<THREE.LineSegments | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const [webglSupported, setWebglSupported] = React.useState<boolean | null>(null);
  const [contextLost, setContextLost] = React.useState(false);

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

  // Check WebGL support on mount
  useEffect(() => {
    setWebglSupported(supportsWebGL());
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (webglSupported === false || !containerRef.current) return;

    const container = containerRef.current;
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
      setContextLost(true);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    });

    canvas.addEventListener('webglcontextrestored', () => {
      setContextLost(false);
      // Reinitialize scene
      initializeOrb();
    });

    // Style canvas
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.style.cursor = 'pointer';
    canvas.style.position = 'relative';
    canvas.style.zIndex = '10';
    canvas.style.pointerEvents = 'auto';
    canvas.className = 'orb-canvas';

    // Add click handler
    canvas.addEventListener('click', onTap);

    container.appendChild(canvas);

    // Initialize orb geometry
    initializeOrb();

    return () => {
      isActiveRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      canvas.removeEventListener('click', onTap);
      canvas.removeEventListener('webglcontextlost', () => {});
      canvas.removeEventListener('webglcontextrestored', () => {});
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
      renderer.dispose();
    };
  }, [webglSupported, size, onTap]);

  const initializeOrb = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    // Clear existing orb
    if (orbMeshRef.current) {
      scene.remove(orbMeshRef.current);
    }

    // Get ego state colors
    const egoColorInfo = getEgoColor(egoState);
    const color = new THREE.Color(egoColorInfo.accent);

    // Create wireframe sphere geometry
    const sphereGeometry = new THREE.SphereGeometry(10, 64, 64);
    const wireframeGeometry = new THREE.WireframeGeometry(sphereGeometry);
    
    // Create material with ego state color
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: afterglow ? 0.95 : 0.8
    });

    // Create mesh
    const orbMesh = new THREE.LineSegments(wireframeGeometry, material);
    orbMeshRef.current = orbMesh;
    scene.add(orbMesh);

    // Add inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(9.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: afterglow ? 0.2 : 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);

    // Start animation loop
    animate();
  };

  const animate = () => {
    if (!isActiveRef.current || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    if (contextLost) return;

    const time = Date.now() * 0.001;

    // Breathing animation
    const breathingScale = 0.95 + 0.05 * Math.sin(time * 0.8);
    
    // Rotation based on ego state
    const rotationSpeed = afterglow ? 0.3 : 0.2;
    
    if (orbMeshRef.current) {
      orbMeshRef.current.scale.setScalar(breathingScale);
      orbMeshRef.current.rotation.y = time * rotationSpeed;
      orbMeshRef.current.rotation.x = time * rotationSpeed * 0.5;

      // Speaking indicator - faster breathing
      if (isSpeaking) {
        const speakingScale = 0.9 + 0.1 * Math.sin(time * 3);
        orbMeshRef.current.scale.setScalar(speakingScale);
      }

      // Listening indicator - pulsing color
      if (isListening) {
        const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + 0.4 * Math.sin(time * 4);
      }
    }

    // Gentle camera movement
    if (cameraRef.current) {
      cameraRef.current.position.x = 2 * Math.sin(time * 0.1);
      cameraRef.current.position.y = 1 * Math.cos(time * 0.15);
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Update orb color when ego state changes
  useEffect(() => {
    if (orbMeshRef.current && sceneRef.current) {
      const egoColorInfo = getEgoColor(egoState);
      const color = new THREE.Color(egoColorInfo.accent);
      const material = orbMeshRef.current.material as THREE.LineBasicMaterial;
      material.color = color;
    }
  }, [egoState]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const { w, h } = safeSize(size, size);
      
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  // Don't render anything if WebGL check is pending
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

  // Show error if WebGL is not supported
  if (!webglSupported) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-500/20 border border-red-500/40 rounded-full ${className}`}
        style={{ width: size, height: size }}
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
      className={`orb-container ${className}`}
      style={{ width: size, height: size }}
    />
  );
});

WebGLOrb.displayName = 'WebGLOrb';

export default WebGLOrb;