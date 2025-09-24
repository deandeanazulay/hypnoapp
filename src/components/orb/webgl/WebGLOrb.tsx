import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { getEgoColor } from '../../../config/theme';

export type OrbHandle = {
  updateState: (s: any) => void;
  setSpeaking: (v: boolean) => void;
  setListening: (v: boolean) => void;
};

interface WebGLOrbProps {
  onTap: () => void;
  size?: number;
  egoState?: string;
  afterglow?: boolean;
  className?: string;
}

const WebGLOrb = forwardRef<OrbHandle, WebGLOrbProps>(({
  onTap,
  size = 280,
  egoState = 'guardian',
  afterglow = false,
  className = ''
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbMeshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  
  const [contextLost, setContextLost] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useImperativeHandle(ref, () => ({
    updateState: () => {},
    setSpeaking: setIsSpeaking,
    setListening: setIsListening
  }));

  // WebGL context event handlers
  const handleContextLost = (e: Event) => {
    e.preventDefault();
    setContextLost(true);
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const handleContextRestored = () => {
    setContextLost(false);
    initializeOrb();
  };

  const initializeOrb = () => {
    if (!canvasRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(0, 0, 30);
      cameraRef.current = camera;

      // Renderer with clamped DPR for iOS performance
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current, 
        antialias: true, 
        alpha: true 
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Clamp DPR
      renderer.setSize(size, size, false);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      // Base sphere geometry (created once)
      const sphere = new THREE.SphereGeometry(10, 96, 96);

      // Custom shader material for GPU deformation
      const egoColor = getEgoColor(egoState);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSpeak: { value: 0 },
          uListen: { value: 0 },
          uAfterglow: { value: afterglow ? 1 : 0 },
          uColor: { value: new THREE.Color(egoColor.accent) }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uSpeak;
          uniform float uListen;
          uniform float uAfterglow;

          // Cheap noise function
          float n3(vec3 p) {
            return sin(p.x*0.8+uTime)*cos(p.y*1.2+uTime*0.7)*sin(p.z*0.6+uTime*1.3);
          }

          void main() {
            vec3 p = position;

            // Spherical coordinate-based variation
            float phi = atan(normal.y, normal.x);
            float theta = acos(normal.z);

            // Multi-harmonic deformation
            float f1 = sin(phi*3.0 + uTime*0.8)*cos(theta*2.0 + uTime*0.5)*0.4;
            float f2 = sin(phi*7.0 + uTime*1.2)*cos(theta*5.0 + uTime*0.9)*0.2;
            float f3 = sin(phi*11.0+ uTime*0.6)*cos(theta*8.0 + uTime*1.1)*0.15;

            float chaos = n3(position) * 0.3;
            float pulse = sin(uTime*1.3)*0.3 + sin(uTime*2.7)*0.2 + sin(uTime*4.1)*0.1;

            // Speaking/listening modulation
            float speakMod = mix(1.0, 1.4, uSpeak) * (1.0 + 0.2*sin(uTime*8.0 + phi*5.0));
            float listenMod = mix(1.0, 1.2, uListen) * (1.0 + 0.2*sin(uTime*12.0 + phi*7.0));

            // Final deformation (minimum 0.08 amplitude)
            float deform = 1.0 + (f1+f2+f3+chaos+pulse) * max(0.08, 0.12);
            deform *= speakMod * listenMod;

            p *= deform;
            p += normal * 0.02; // Push out slightly for wireframe visibility

            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uAfterglow;
          
          void main() {
            float intensity = mix(0.8, 1.2, uAfterglow);
            gl_FragColor = vec4(uColor * intensity, 1.0);
          }
        `,
        wireframe: true,
        transparent: true
      });

      // Main orb mesh
      const orb = new THREE.Mesh(sphere, material);
      orbMeshRef.current = orb;
      scene.add(orb);

      // Glow shells (created once)
      const glow1 = new THREE.Mesh(
        new THREE.SphereGeometry(9.5, 32, 32),
        new THREE.MeshBasicMaterial({ 
          color: new THREE.Color(egoColor.accent), 
          transparent: true, 
          opacity: afterglow ? 0.12 : 0.06, 
          side: THREE.BackSide 
        })
      );
      
      const glow2 = new THREE.Mesh(
        new THREE.SphereGeometry(8.0, 32, 32),
        new THREE.MeshBasicMaterial({ 
          color: new THREE.Color(egoColor.accent), 
          transparent: true, 
          opacity: 0.04, 
          side: THREE.BackSide 
        })
      );
      
      scene.add(glow1, glow2);
      orb.userData = { glow1, glow2, material };

      // Start animation
      animate();
    } catch (error) {
      console.error('WebGL orb initialization failed:', error);
      setContextLost(true);
    }
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || contextLost) return;

    const t = performance.now() * 0.001;
    const orb = orbMeshRef.current as THREE.Mesh & { userData: any };
    
    if (orb) {
      // Update shader uniforms only (no geometry rebuilding)
      const uniforms = orb.userData.material.uniforms;
      uniforms.uTime.value = t;
      uniforms.uSpeak.value = isSpeaking ? 1 : 0;
      uniforms.uListen.value = isListening ? 1 : 0;

      // Breathing and rotation
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.6);
      const irregular = 1 + (Math.sin(t*1.3)*0.3 + Math.sin(t*2.7)*0.2 + Math.sin(t*4.1)*0.1) * 0.08;
      const scale = pulse * irregular;

      orb.scale.setScalar(scale);
      
      // Rotation with base speed modified by afterglow
      const base = afterglow ? 0.4 : 0.25;
      orb.rotation.set(
        t*base + Math.sin(t*0.3)*0.1, 
        t*base*0.7 + Math.cos(t*0.4)*0.15, 
        Math.sin(t*0.2)*0.05
      );

      // Animate glow shells
      const { glow1, glow2 } = orb.userData;
      if (glow1) {
        glow1.scale.setScalar(0.9 + Math.sin(t*1.1)*0.1);
        (glow1.material as THREE.MeshBasicMaterial).opacity = 
          (afterglow ? 0.12 : 0.06) * (1 + Math.sin(t*1.3)*0.5);
      }
      if (glow2) {
        glow2.scale.setScalar(0.7 + Math.abs(Math.sin(t*2.0))*0.4);
        (glow2.material as THREE.MeshBasicMaterial).opacity = 
          0.04 + Math.abs(Math.sin(t*2.0))*0.08;
      }
    }

    // Camera drift
    cameraRef.current.position.set(
      3 * Math.sin(t * 0.12) + Math.sin(t * 0.8) * 0.5,
      2 * Math.cos(t * 0.18) + Math.cos(t * 1.1) * 0.3,
      30 + Math.sin(t * 0.05) * 2
    );
    cameraRef.current.lookAt(0, 0, 0);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  };

  // Initialize on mount
  useEffect(() => {
    if (canvasRef.current) {
      // Add event listeners with proper references
      canvasRef.current.addEventListener('webglcontextlost', handleContextLost, false);
      canvasRef.current.addEventListener('webglcontextrestored', handleContextRestored, false);
      
      initializeOrb();
    }

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('webglcontextlost', handleContextLost, false);
        canvasRef.current.removeEventListener('webglcontextrestored', handleContextRestored, false);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, []);

  // Update color when ego state changes
  useEffect(() => {
    if (orbMeshRef.current && orbMeshRef.current.userData.material) {
      const newColor = new THREE.Color(getEgoColor(egoState).accent);
      orbMeshRef.current.userData.material.uniforms.uColor.value.copy(newColor);
      
      // Update glow colors
      const { glow1, glow2 } = orbMeshRef.current.userData;
      if (glow1) (glow1.material as THREE.MeshBasicMaterial).color.copy(newColor);
      if (glow2) (glow2.material as THREE.MeshBasicMaterial).color.copy(newColor);
    }
  }, [egoState]);

  // Update afterglow
  useEffect(() => {
    if (orbMeshRef.current && orbMeshRef.current.userData.material) {
      orbMeshRef.current.userData.material.uniforms.uAfterglow.value = afterglow ? 1 : 0;
    }
  }, [afterglow]);

  if (contextLost) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-white/50 text-sm">Reconnecting...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        className="cursor-pointer"
        style={{ width: size, height: size }}
        onClick={onTap}
      />
    </div>
  );
});

WebGLOrb.displayName = 'WebGLOrb';
export default WebGLOrb;