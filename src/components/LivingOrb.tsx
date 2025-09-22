import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface OrbState {
  depth: number;
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest';
  phase: string;
  isListening: boolean;
  isSpeaking: boolean;
  emotion: 'calm' | 'focused' | 'deep' | 'transcendent';
  energy: number; // 0-1
}

interface LivingOrbProps {
  onTap: () => void;
  className?: string;
  size?: number;
}

export interface LivingOrbRef {
  updateState: (state: Partial<OrbState>) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
}

const LivingOrb = forwardRef<LivingOrbRef, LivingOrbProps>(({ onTap, className = '', size = 320 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPressed, setIsPressed] = useState(false);
  const [orbState, setOrbState] = useState<OrbState>({
    depth: 1,
    breathing: 'rest',
    phase: 'idle',
    isListening: false,
    isSpeaking: false,
    emotion: 'calm',
    energy: 0.3
  });

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    updateState: (newState: Partial<OrbState>) => {
      setOrbState(prev => ({ ...prev, ...newState }));
    },
    setSpeaking: (speaking: boolean) => {
      setOrbState(prev => ({ ...prev, isSpeaking: speaking }));
    },
    setListening: (listening: boolean) => {
      setOrbState(prev => ({ ...prev, isListening: listening }));
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    // Enhanced vertex shader with emotional states
    const vertexShaderSource = `
      attribute float vertexId;
      uniform float vertexCount;
      uniform float time;
      uniform vec2 resolution;
      uniform float depth;
      uniform float breathing;
      uniform float energy;
      uniform float emotion;
      uniform float isListening;
      uniform float isSpeaking;
      varying vec4 v_color;

      #define PI 3.14159265359

      vec3 hsv2rgb(vec3 c) {
        c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      mat4 rotX(float angleInRadians) {
        float s = sin(angleInRadians);
        float c = cos(angleInRadians);
        return mat4( 
          1, 0, 0, 0,
          0, c, s, 0,
          0, -s, c, 0,
          0, 0, 0, 1);  
      }

      mat4 rotY(float angleInRadians) {
        float s = sin(angleInRadians);
        float c = cos(angleInRadians);
        return mat4( 
          c, 0,-s, 0,
          0, 1, 0, 0,
          s, 0, c, 0,
          0, 0, 0, 1);  
      }

      mat4 rotZ(float angleInRadians) {
        float s = sin(angleInRadians);
        float c = cos(angleInRadians);
        return mat4( 
          c,-s, 0, 0, 
          s, c, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1); 
      }

      mat4 trans(vec3 trans) {
        return mat4(
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          trans, 1);
      }

      mat4 uniformScale(float s) {
        return mat4(
          s, 0, 0, 0,
          0, s, 0, 0,
          0, 0, s, 0,
          0, 0, 0, 1);
      }

      mat4 persp(float fov, float aspect, float zNear, float zFar) {
        float f = tan(PI * 0.5 - 0.5 * fov);
        float rangeInv = 1.0 / (zNear - zFar);
        return mat4(
          f / aspect, 0, 0, 0,
          0, f, 0, 0,
          0, 0, (zNear + zFar) * rangeInv, -1,
          0, 0, zNear * zFar * rangeInv * 2., 0);
      }

      mat4 inverse(mat4 m) {
        float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
              a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
              a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
              a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],
              b00 = a00 * a11 - a01 * a10,
              b01 = a00 * a12 - a02 * a10,
              b02 = a00 * a13 - a03 * a10,
              b03 = a01 * a12 - a02 * a11,
              b04 = a01 * a13 - a03 * a11,
              b05 = a02 * a13 - a03 * a12,
              b06 = a20 * a31 - a21 * a30,
              b07 = a20 * a32 - a22 * a30,
              b08 = a20 * a33 - a23 * a30,
              b09 = a21 * a32 - a22 * a31,
              b10 = a21 * a33 - a23 * a31,
              b11 = a22 * a33 - a23 * a32,
              det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        return mat4(
            a11 * b11 - a12 * b10 + a13 * b09,
            a02 * b10 - a01 * b11 - a03 * b09,
            a31 * b05 - a32 * b04 + a33 * b03,
            a22 * b04 - a21 * b05 - a23 * b03,
            a12 * b08 - a10 * b11 - a13 * b07,
            a00 * b11 - a02 * b08 + a03 * b07,
            a32 * b02 - a30 * b05 - a33 * b01,
            a20 * b05 - a22 * b02 + a23 * b01,
            a10 * b10 - a11 * b08 + a13 * b06,
            a01 * b08 - a00 * b10 - a03 * b06,
            a30 * b04 - a31 * b02 + a33 * b00,
            a21 * b02 - a20 * b04 - a23 * b00,
            a11 * b07 - a10 * b09 - a12 * b06,
            a00 * b09 - a01 * b07 + a02 * b06,
            a31 * b01 - a30 * b03 - a32 * b00,
            a20 * b03 - a21 * b01 + a22 * b00) / det;
      }

      mat4 cameraLookAt(vec3 eye, vec3 target, vec3 up) {
        return inverse(mat4(
          normalize(cross(up, normalize(eye - target))), 0,
          cross(normalize(eye - target), normalize(cross(up, normalize(eye - target)))), 0,
          normalize(eye - target), 0,
          eye, 1));
      }

      float t2m1(float v) {
        return v * 2. - 1.;
      }

      const float edgePointsPerCircle = 128.0;
      const float pointsPerCircle = edgePointsPerCircle * 2.0;

      void main() {
        float pointId = mod(vertexId, pointsPerCircle);  
        float pId = floor(pointId / 2.) + mod(pointId, 2.);
        float numCircles = floor(vertexCount / pointsPerCircle);
        float circleId = floor(vertexId / pointsPerCircle);
        float numPairs = floor(numCircles / 2.);
        float pairId = floor(circleId / 2.);
        float pairV = pairId / numPairs;
        float pairA = t2m1(pairV);
        float odd = mod(pairId, 2.);
        
        float pV = pId / edgePointsPerCircle;
        float cV = circleId / numCircles;
        float cA = t2m1(cV);
        
        float a = pV * PI * 2.;
        float x = cos(a);
        float z = sin(a);
        
        vec3 pos = vec3(x, 0, z);
        
        // Enhanced time with emotional states
        float tm = time * (0.1 + energy * 0.05);
        float tm2 = time * (0.13 + emotion * 0.02);
        
        // Breathing influence
        float breathScale = 1.0 + breathing * 0.3 * sin(time * 2.0);
        
        // Listening pulse
        float listenPulse = isListening > 0.5 ? (1.0 + 0.4 * sin(time * 8.0)) : 1.0;
        
        // Speaking vibration
        float speakVib = isSpeaking > 0.5 ? (1.0 + 0.2 * sin(time * 15.0)) : 1.0;

        mat4 wmat = rotZ(odd * PI * .5 + sin(tm));
        wmat *= trans(vec3(0, cos(pairA * PI), 0));
        wmat *= uniformScale(sin(pairA * PI) * breathScale * listenPulse * speakVib);
        vec4 wp = wmat * vec4(pos, 1.);
        
        float su = abs(atan(wp.x, wp.z)) / PI;
        float sv = abs(wp.y) * 1.;
        float s = 0.5 + 0.3 * sin(time + su * 10.0 + sv * 5.0);
        wp.xyz *= mix(0.8, 1.2, pow(s, 1.));
        
        float r = 2.5 + depth * 0.2;
        mat4 mat = persp(radians(60.0), resolution.x / resolution.y, 0.1, 10.0);
        vec3 eye = vec3(cos(tm) * r, sin(tm * 0.93) * r, sin(tm) * r);
        vec3 target = vec3(0);
        vec3 up = vec3(0., sin(tm2), cos(tm2));
        
        mat *= cameraLookAt(eye, target, up);
        
        gl_Position = mat * wp;

        // Enhanced color based on emotional state
        vec3 baseColor = mix(
           vec3(0.2, 0.8, 0.8), // Teal
           vec3(0.8, 0.4, 0.2), // Orange
           emotion);
           
        // Listening state - blue pulse
        if (isListening > 0.5) {
          baseColor = mix(baseColor, vec3(0.2, 0.4, 1.0), 0.6);
        }
        
        // Speaking state - warm glow
        if (isSpeaking > 0.5) {
          baseColor = mix(baseColor, vec3(1.0, 0.6, 0.2), 0.4);
        }
        
        // Depth influence
        baseColor = mix(baseColor, vec3(0.6, 0.2, 0.8), depth * 0.2);

        v_color = vec4(baseColor, mix(0.3, 1.0, pow(1.0 - sv, 2.0)));
        v_color.rgb *= v_color.a;
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `;

    // Create shader function
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }

    // Create program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    // Get uniform locations
    const vertexIdLocation = gl.getAttribLocation(program, 'vertexId');
    const vertexCountLocation = gl.getUniformLocation(program, 'vertexCount');
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const depthLocation = gl.getUniformLocation(program, 'depth');
    const breathingLocation = gl.getUniformLocation(program, 'breathing');
    const energyLocation = gl.getUniformLocation(program, 'energy');
    const emotionLocation = gl.getUniformLocation(program, 'emotion');
    const isListeningLocation = gl.getUniformLocation(program, 'isListening');
    const isSpeakingLocation = gl.getUniformLocation(program, 'isSpeaking');

    // Create vertex buffer
    const numVertices = 4096; // Increased for more detail
    const vertices = new Float32Array(numVertices);
    for (let i = 0; i < numVertices; i++) {
      vertices[i] = i;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Animation loop
    let startTime = Date.now();
    
    function render() {
      if (!canvas || !gl || !program) return;
      
      const currentTime = (Date.now() - startTime) / 1000;
      
      // Set canvas size
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Clear
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Use program
      gl.useProgram(program);

      // Set uniforms
      gl.uniform1f(vertexCountLocation, numVertices);
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(depthLocation, orbState.depth);
      
      // Breathing cycle mapping
      const breathingValue = {
        'inhale': 1.0,
        'hold': 0.5,
        'exhale': -1.0,
        'rest': 0.0
      }[orbState.breathing] || 0.0;
      
      gl.uniform1f(breathingLocation, breathingValue);
      gl.uniform1f(energyLocation, orbState.energy);
      
      // Emotion mapping
      const emotionValue = {
        'calm': 0.0,
        'focused': 0.3,
        'deep': 0.6,
        'transcendent': 1.0
      }[orbState.emotion] || 0.0;
      
      gl.uniform1f(emotionLocation, emotionValue);
      gl.uniform1f(isListeningLocation, orbState.isListening ? 1.0 : 0.0);
      gl.uniform1f(isSpeakingLocation, orbState.isSpeaking ? 1.0 : 0.0);

      // Set attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(vertexIdLocation);
      gl.vertexAttribPointer(vertexIdLocation, 1, gl.FLOAT, false, 0, 0);

      // Draw
      gl.drawArrays(gl.LINES, 0, numVertices);

      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Only initialize once when component mounts

  const handlePointerDown = () => {
    setIsPressed(true);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    setTimeout(onTap, 100);
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
  };

  return (
    <div className={`flex justify-center py-8 ${className}`}>
      <div className="relative">
        <div
          className={`relative cursor-pointer transition-transform duration-200 ${
            isPressed ? 'scale-95' : 'scale-100'
          }`}
          style={{
            width: size,
            height: size,
            borderRadius: 20,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)',
            filter: orbState.depth > 3 ? 'brightness(1.2) saturate(1.1)' : 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerLeave}
          onPointerLeave={handlePointerLeave}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
          
          {/* State indicators */}
          {orbState.isListening && (
            <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
          )}
          {orbState.isSpeaking && (
            <div className="absolute top-4 left-4 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
          )}
        </div>
        
        {/* Dynamic hint text */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <p className="text-white/40 text-sm tracking-wide text-center">
            {orbState.phase === 'idle' ? 'Tap to begin' :
             orbState.isListening ? 'Listening...' :
             orbState.isSpeaking ? 'Speaking...' :
             `${orbState.phase} • L${Math.floor(orbState.depth)}`}
          </p>
        </div>
      </div>
    </div>
  );
});

LivingOrb.displayName = 'LivingOrb';

export default LivingOrb;