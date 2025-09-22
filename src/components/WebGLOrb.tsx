import React, { useRef, useEffect, useState } from 'react';
import { EGO_STATES } from '../types/EgoState';

interface WebGLOrbProps {
  onTap: () => void;
  afterglow?: boolean;
  className?: string;
  breathPhase?: 'inhale' | 'hold' | 'exhale' | 'rest';
  size?: number;
  egoState?: string;
  selectedGoal?: any;
}

export default function WebGLOrb({ 
  onTap, 
  afterglow = false, 
  className = '', 
  breathPhase = 'rest',
  size,
  egoState = 'protector',
  selectedGoal
}: WebGLOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPressed, setIsPressed] = useState(false);

  // Get ego state colors
  const getEgoStateColor = () => {
    const colorMap = {
      guardian: { primary: [0.2, 0.4, 0.8], secondary: [0.1, 0.3, 0.6] }, // Blue
      rebel: { primary: [0.8, 0.2, 0.2], secondary: [0.6, 0.1, 0.1] }, // Red
      healer: { primary: [0.2, 0.8, 0.4], secondary: [0.1, 0.6, 0.3] }, // Green
      explorer: { primary: [0.9, 0.8, 0.2], secondary: [0.7, 0.6, 0.1] }, // Yellow
      mystic: { primary: [0.6, 0.2, 0.8], secondary: [0.4, 0.1, 0.6] }, // Purple
      sage: { primary: [0.8, 0.8, 0.8], secondary: [0.6, 0.6, 0.6] }, // Gray/White
      child: { primary: [1.0, 0.6, 0.2], secondary: [0.8, 0.4, 0.1] }, // Orange
      performer: { primary: [0.9, 0.2, 0.6], secondary: [0.7, 0.1, 0.4] }, // Pink
      shadow: { primary: [0.3, 0.2, 0.5], secondary: [0.1, 0.1, 0.3] } // Dark Purple
    };
    return colorMap[egoState as keyof typeof colorMap] || colorMap.guardian;
  };

  // Get goal sigil/glyph
  const getGoalSigil = () => {
    if (!selectedGoal) return null;
    
    const sigils = {
      stress: '◈', // Shield
      focus: '◉', // Target
      confidence: '★', // Star
      sleep: '◐', // Moon
      cravings: '◆', // Diamond
      pain: '❅', // Snowflake
      creative: '◈' // Lightbulb-like
    };
    
    return sigils[selectedGoal.id as keyof typeof sigils] || '◉';
  };
  // Breathing animation based on phase
  const getBreathScale = () => {
    switch (breathPhase) {
      case 'inhale': return 1.2;
      case 'hold': return 1.2;
      case 'exhale': return 0.8;
      case 'rest': return 1.0;
      default: return 1.0;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS orb');
      return;
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute float vertexId;
      uniform float vertexCount;
      uniform float time;
      uniform vec2 resolution;
      uniform sampler2D sound;
      uniform float hypnoticMode;
      uniform float tranceDepth;
      uniform vec3 primaryColor;
      uniform vec3 secondaryColor;
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

      mat4 lookAt(vec3 eye, vec3 target, vec3 up) {
        vec3 zAxis = normalize(eye - target);
        vec3 xAxis = normalize(cross(up, zAxis));
        vec3 yAxis = cross(zAxis, xAxis);
        return mat4(
          xAxis, 0,
          yAxis, 0,
          zAxis, 0,
          eye, 1);
      }

      mat4 cameraLookAt(vec3 eye, vec3 target, vec3 up) {
        return inverse(lookAt(eye, target, up));
      }

      float t2m1(float v) {
        return v * 2. - 1.;
      }

      const float edgePointsPerCircle = 64.0;
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
        
        float tm = time * 0.1;
        float tm2 = time * 0.13;
        
        // Hypnotic spiral mathematics
        float spiralTime = time * (0.5 + hypnoticMode * 0.3);
        float goldenRatio = 1.618033988749;
        float spiralRadius = length(pos.xz);
        float spiralAngle = atan(pos.z, pos.x) + spiralRadius * goldenRatio + spiralTime;
        
        // Fibonacci spiral influence
        float fibSpiral = sin(spiralAngle * goldenRatio) * cos(spiralRadius * PI);
        pos.xyz *= 1.0 + fibSpiral * hypnoticMode * 0.2;
        
        // Fractal depth pulsing
        float fractalPulse = sin(time * 2.0 + spiralRadius * 8.0) * tranceDepth * 0.3;
        pos.xyz *= 1.0 + fractalPulse;

        mat4 wmat = rotZ(odd * PI * .5 + sin(tm));
        wmat *= trans(vec3(0, cos(pairA * PI), 0));
        wmat *= uniformScale(sin(pairA * PI));
        vec4 wp = wmat * vec4(pos, 1.);
        
        float su = abs(atan(wp.x, wp.z)) / PI;
        float sv = abs(wp.y) * 1.;
        float s = 0.5 + 0.3 * sin(time + su * 10.0 + sv * 5.0);
        wp.xyz *= mix(0.8, 1.2, pow(s, 1.));
        
        float r = 2.5;
        mat4 mat = persp(radians(60.0), resolution.x / resolution.y, 0.1, 10.0);
        vec3 eye = vec3(cos(tm) * r, sin(tm * 0.93) * r, sin(tm) * r);
        vec3 target = vec3(0);
        vec3 up = vec3(0., sin(tm2), cos(tm2));
        
        mat *= cameraLookAt(eye, target, up);
        
        gl_Position = mat * wp;

        // Ego state color patterns
        float colorMix = sin(spiralAngle * 0.1 + time * 0.2) * 0.5 + 0.5;
        vec3 baseColor = mix(primaryColor, secondaryColor, colorMix);
           
        // Add spiral color bands for fixation
        float spiralBands = sin(spiralRadius * 10.0 - spiralTime * 3.0) * hypnoticMode;
        baseColor = mix(baseColor, vec3(1.0, 1.0, 1.0), spiralBands * 0.3);
        
        vec3 color = baseColor;
        v_color = vec4(color, mix(0.3, 1.0, pow(1.0 - sv, 2.0)));
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
    const hypnoticModeLocation = gl.getUniformLocation(program, 'hypnoticMode');
    const tranceDepthLocation = gl.getUniformLocation(program, 'tranceDepth');
    const primaryColorLocation = gl.getUniformLocation(program, 'primaryColor');
    const secondaryColorLocation = gl.getUniformLocation(program, 'secondaryColor');

    // Create vertex buffer
    const numVertices = 2048;
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
      
      // Hypnotic parameters based on props
      const hypnoticIntensity = afterglow ? 1.0 : 0.3;
      const tranceLevel = breathPhase === 'inhale' ? 0.8 : 
                         breathPhase === 'hold' ? 1.0 :
                         breathPhase === 'exhale' ? 0.6 : 0.4;
      
      gl.uniform1f(hypnoticModeLocation, hypnoticIntensity);
      gl.uniform1f(tranceDepthLocation, tranceLevel);
      
      // Set ego state colors
      const egoColors = getEgoStateColor();
      gl.uniform3f(primaryColorLocation, egoColors.primary[0], egoColors.primary[1], egoColors.primary[2]);
      gl.uniform3f(secondaryColorLocation, egoColors.secondary[0], egoColors.secondary[1], egoColors.secondary[2]);

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
  }, []);

  const egoColors = getEgoStateColor();
  const goalSigil = getGoalSigil();

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
    <div className={`flex justify-center ${className}`}>
      <div className="relative">
        <div
          className={`relative cursor-pointer transition-transform duration-200 ${
            isPressed ? 'scale-95' : 'scale-100'
          }`}
          style={{
            width: size || (window.innerWidth < 768 ? Math.min(window.innerWidth * 0.5, 200) : 280),
            height: size || (window.innerWidth < 768 ? Math.min(window.innerWidth * 0.5, 200) : 280),
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)',
            filter: afterglow ? 'brightness(1.2) saturate(1.1)' : `hue-rotate(${egoState === 'nurturer' ? '30deg' : egoState === 'sage' ? '60deg' : egoState === 'performer' ? '-30deg' : '0deg'})`,
            transform: `scale(${getBreathScale()})`,
            transition: 'transform 4s ease-in-out',
            aspectRatio: '1 / 1'
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
          
          {/* Goal Sigil Overlay */}
          {goalSigil && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="text-white/30 text-4xl font-light"
                style={{
                  textShadow: `0 0 20px rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, 0.5)`,
                  filter: 'blur(0.5px)'
                }}
              >
                {goalSigil}
              </div>
            </div>
          )}
          
          {/* Fallback CSS orb if WebGL fails */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-48 h-48 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, 0.6) 0%, rgba(${egoColors.secondary[0] * 255}, ${egoColors.secondary[1] * 255}, ${egoColors.secondary[2] * 255}, 0.4) 100%)`
              }}
            />
          </div>
        </div>
        
        {/* Text below orb - always rendered */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-max">
          <div className="flex flex-col items-center text-center space-y-1">
            <p className="text-white/80 text-sm mb-1">Tap to begin with</p>
            <p className="text-teal-400 font-medium text-sm">
              {EGO_STATES.find(s => s.id === egoState)?.name} Mode
            </p>
            {selectedGoal && (
              <p className="text-orange-400 text-xs mt-1">• {selectedGoal.name}</p>
            )}
          </div>
        </div>
    </div>
  );
}
}
  )
}
  )
}
  )
}
  )
}