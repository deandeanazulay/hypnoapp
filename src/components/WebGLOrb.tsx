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
  const orbMeshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);
  const contextLostRef = useRef(false);
  
  // State for animations
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);

  useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      // Handle state updates if needed
    },
    setSpeaking: (speaking: boolean) => {
      setIsSpeaking(speaking);
    },
    setListening: (listening: boolean) => {
      setIsListening(listening);
    }
  }));

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

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
    const MAX_DPR = 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const canvas = renderer.domElement;

    // Fixed event listener cleanup
    const onLost = (e: Event) => {
      e.preventDefault();
      contextLostRef.current = true;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };

    const onRestored = () => {
      contextLostRef.current = false;
      initializeOrb();
    };

    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);

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
    initializeOrb();

    return () => {
      isActiveRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      canvas.removeEventListener('click', onTap);
      canvas.removeEventListener('webglcontextlost', onLost, false);
      canvas.removeEventListener('webglcontextrestored', onRestored, false);
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
      renderer.dispose();
    };
  }, [size, onTap]);

  const initializeOrb = () => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const scene = sceneRef.current;

    // Clear existing orb
    if (orbMeshRef.current) {
      scene.remove(orbMeshRef.current);
    }

    // Get ego state colors
    const egoColorInfo = getEgoColor(egoState);
    const color = new THREE.Color(egoColorInfo.accent);

    // 1) Base sphere geometry (created once)
    const sphere = new THREE.SphereGeometry(10, 96, 96);

    // 2) GPU-based shader material with wireframe
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeak: { value: 0 },
        uListen: { value: 0 },
        uAfterglow: { value: afterglow ? 1 : 0 },
        uColor: { value: color }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSpeak;
        uniform float uListen;

        // Classic noise function
        float noise3(vec3 p) {
          return sin(p.x * 0.8 + uTime) * cos(p.y * 1.2 + uTime * 0.7) * sin(p.z * 0.6 + uTime * 1.3);
        }

        void main() {
          vec3 p = position;

          // Spherical coordinate variations
          float phi = atan(normal.y, normal.x);
          float theta = acos(normal.z);

          // Multiple fractal layers
          float f1 = sin(phi * 3.0 + uTime * 0.8) * cos(theta * 2.0 + uTime * 0.5) * 0.4;
          float f2 = sin(phi * 7.0 + uTime * 1.2) * cos(theta * 5.0 + uTime * 0.9) * 0.2;
          float f3 = sin(phi * 11.0 + uTime * 0.6) * cos(theta * 8.0 + uTime * 1.1) * 0.15;

          // Chaotic noise
          float chaos = noise3(position) * 0.3;

          // Alien pulse
          float pulse = sin(uTime * 1.3) * 0.3 + sin(uTime * 2.7) * 0.2 + sin(uTime * 4.1) * 0.1;
          
          // Speaking/listening modulation
          float speakMod = mix(1.0, 1.4, uSpeak) * (1.0 + 0.2 * sin(uTime * 8.0 + phi * 5.0));
          float listenMod = mix(1.0, 1.2, uListen) * (1.0 + 0.2 * sin(uTime * 12.0 + phi * 7.0));

          // Combine all deformations
          float deform = 1.0 + (f1 + f2 + f3 + chaos + pulse) * 0.12;
          deform *= speakMod * listenMod;

          p *= deform;

          // Push out slightly along normal for better wireframe visibility
          p += normal * 0.02;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uAfterglow;
        
        void main() {
          gl_FragColor = vec4(uColor, mix(0.4, 0.6, uAfterglow));
        }
      `,
      wireframe: true,
      transparent: true
    });

    // 3) Create mesh
    const orb = new THREE.Mesh(sphere, material);
    orbMeshRef.current = orb;
    scene.add(orb);

    // 4) Create glow shells once
    const glow1 = new THREE.Mesh(
      new THREE.SphereGeometry(9.5, 32, 32),
      new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: afterglow ? 0.12 : 0.06, 
        side: THREE.BackSide 
      })
    );
    
    const glow2 = new THREE.Mesh(
      new THREE.SphereGeometry(8.0, 32, 32),
      new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.04, 
        side: THREE.BackSide 
      })
    );
    
    scene.add(glow1, glow2);

    // Store references for animation
    orb.userData = { glow1, glow2, material };

    // Start animation loop
    animate();
  };

  const animate = () => {
    if (!isActiveRef.current || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    if (contextLostRef.current) return;

    const time = performance.now() * 0.001;
    const orb = orbMeshRef.current as THREE.Mesh & { userData: any };
    
    if (orb && orb.userData.material) {
      const uniforms = orb.userData.material.uniforms;
      
      // Update shader uniforms (GPU-side)
      uniforms.uTime.value = time;
      uniforms.uSpeak.value = isSpeaking ? 1 : 0;
      uniforms.uListen.value = isListening ? 1 : 0;

      // Breathing and rotation (CPU-side transforms)
      const primaryPulse = 0.85 + 0.15 * Math.sin(time * 0.6);
      const alienPulse = Math.sin(time * 1.3) * 0.3 + Math.sin(time * 2.7) * 0.2 + Math.sin(time * 4.1) * 0.1;
      const breathingScale = primaryPulse * (1 + alienPulse * 0.08);
      
      orb.scale.setScalar(breathingScale);

      // Alien rotation
      const baseRotationSpeed = afterglow ? 0.4 : 0.25;
      orb.rotation.x = time * baseRotationSpeed + Math.sin(time * 0.3) * 0.1;
      orb.rotation.y = time * baseRotationSpeed * 0.7 + Math.cos(time * 0.4) * 0.15;
      orb.rotation.z = Math.sin(time * 0.2) * 0.05;

      // Organic movement
      orb.position.x = Math.sin(time * 0.3) * 0.5;
      orb.position.y = Math.cos(time * 0.4) * 0.3;
      orb.position.z = Math.sin(time * 0.2) * 0.2;

      // Animate glow layers
      const { glow1, glow2 } = orb.userData;
      if (glow1) {
        glow1.scale.setScalar(0.9 + Math.sin(time * 1.1) * 0.1);
        glow1.rotation.x = -orb.rotation.x * 0.5;
        glow1.rotation.y = -orb.rotation.y * 0.3;
        
        const glowMat = glow1.material as THREE.MeshBasicMaterial;
        glowMat.opacity = (afterglow ? 0.12 : 0.06) * (1 + Math.sin(time * 1.3) * 0.5);
      }
      
      if (glow2) {
        const pulseScale = 0.7 + Math.abs(Math.sin(time * 2.0)) * 0.4;
        glow2.scale.setScalar(pulseScale);
        glow2.rotation.z = time * 0.5;
        
        const pulseMat = glow2.material as THREE.MeshBasicMaterial;
        pulseMat.opacity = 0.04 + Math.abs(Math.sin(time * 2.0)) * 0.08;
      }
    }

    // Dynamic camera movement
    if (cameraRef.current) {
      cameraRef.current.position.x = 3 * Math.sin(time * 0.12) + Math.sin(time * 0.8) * 0.5;
      cameraRef.current.position.y = 2 * Math.cos(time * 0.18) + Math.cos(time * 1.1) * 0.3;
      cameraRef.current.position.z = 30 + Math.sin(time * 0.05) * 2;
      cameraRef.current.lookAt(0, 0, 0);
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Update orb color when ego state changes
  useEffect(() => {
    if (orbMeshRef.current && orbMeshRef.current.userData.material) {
      const egoColorInfo = getEgoColor(egoState);
      const color = new THREE.Color(egoColorInfo.accent);
      
      const uniforms = orbMeshRef.current.userData.material.uniforms;
      uniforms.uColor.value.copy(color);
      
      // Update glow layers
      const { glow1, glow2 } = orbMeshRef.current.userData;
      if (glow1) {
        (glow1.material as THREE.MeshBasicMaterial).color.copy(color);
      }
      if (glow2) {
        (glow2.material as THREE.MeshBasicMaterial).color.copy(color);
      }
    }
  }, [egoState]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
      
      const { w, h } = safeSize(size, size);
      
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

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