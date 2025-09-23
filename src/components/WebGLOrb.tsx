import React, { useRef, useEffect, useState } from 'react';
import { EGO_STATES } from '../types/EgoState';

export interface WebGLOrbRef {
  updateState: (state: any) => void;
}

export interface WebGLOrbProps {
  onTap: () => void;
  afterglow?: boolean;
  className?: string;
  breathPhase?: 'inhale' | 'hold' | 'exhale' | 'rest';
  size?: number;
  egoState?: string;
  selectedGoal?: any;
  mousePosition?: { x: number; y: number };
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const WebGLOrbRender: React.ForwardRefRenderFunction<WebGLOrbRef, WebGLOrbProps> = (props, ref) => {
  const {
    onTap, 
    afterglow = false, 
    className = '', 
    breathPhase = 'rest',
    size,
    egoState = 'guardian',
    selectedGoal,
    mousePosition = { x: 0.5, y: 0.5 },
    isDragging = false,
    onDragStart,
    onDragEnd
  } = props;
  
  React.useImperativeHandle(ref, () => ({
    updateState: (state: any) => {
      // Handle state updates
    }
  }));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPressed, setIsPressed] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [momentum, setMomentum] = useState({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

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
      shadow: { primary: [0.3, 0.2, 0.5], secondary: [0.1, 0.1, 0.3] }, // Dark Purple
      builder: { primary: [0.5, 0.5, 0.5], secondary: [1.0, 0.6, 0.2] }, // Steel Grey/Orange
      seeker: { primary: [0.3, 0.2, 0.8], secondary: [0.2, 0.8, 0.8] }, // Indigo/Teal
      lover: { primary: [0.9, 0.4, 0.6], secondary: [1.0, 0.7, 0.8] }, // Deep Rose/Pink
      trickster: { primary: [0.2, 1.0, 0.2], secondary: [0.6, 0.2, 1.0] }, // Neon Green/Purple
      warrior: { primary: [0.8, 0.1, 0.1], secondary: [0.1, 0.1, 0.1] }, // Blood Red/Black
      visionary: { primary: [0.6, 0.2, 1.0], secondary: [0.4, 0.7, 1.0] } // Cosmic Violet/Starlight Blue
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

  // Interactive rotation based on mouse position
  useEffect(() => {
    if (isDragging && mousePosition) {
      const deltaX = mousePosition.x - lastMousePos.current.x;
      const deltaY = mousePosition.y - lastMousePos.current.y;
      
      setRotation(prev => ({
        x: prev.x + deltaY * 200, // Vertical mouse movement rotates around X axis
        y: prev.y + deltaX * 200  // Horizontal mouse movement rotates around Y axis
      }));
      
      setMomentum({ x: deltaY * 50, y: deltaX * 50 });
      lastMousePos.current = mousePosition;
    } else if (!isDragging && (momentum.x !== 0 || momentum.y !== 0)) {
      // Apply momentum when not dragging
      const decay = 0.95;
      setMomentum(prev => ({
        x: prev.x * decay,
        y: prev.y * decay
      }));
      
      setRotation(prev => ({
        x: prev.x + momentum.x,
        y: prev.y + momentum.y
      }));
      
      // Stop momentum when very small
      if (Math.abs(momentum.x) < 0.1 && Math.abs(momentum.y) < 0.1) {
        setMomentum({ x: 0, y: 0 });
      }
    }
  }, [mousePosition, isDragging, momentum]);

  // Auto-rotation when not interacting
  useEffect(() => {
    if (!isDragging && !isHovering && momentum.x === 0 && momentum.y === 0) {
      const autoRotate = setInterval(() => {
        setRotation(prev => ({
          x: prev.x + 0.3,
          y: prev.y + 0.5
        }));
      }, 50);
      
      return () => clearInterval(autoRotate);
    }
  }, [isDragging, isHovering, momentum]);

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
      uniform vec2 mousePos;
      uniform vec2 userRotation;
      uniform float interactionIntensity;
      uniform float pulseIntensity;
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
        
        // Enhanced interactive rotation
        float rotAngleX = userRotation.x * 0.01 + sin(time * 0.2) * 0.1;
        float rotAngleY = userRotation.y * 0.01 + cos(time * 0.15) * 0.1;
        float rotAngleZ = time * 0.05 + (mousePos.x - 0.5) * 0.5;
        
        // Hypnotic spiral mathematics
        float spiralTime = time * (0.5 + hypnoticMode * 0.3) + interactionIntensity * 2.0;
        float goldenRatio = 1.618033988749;
        float spiralRadius = length(pos.xz);
        float spiralAngle = atan(pos.z, pos.x) + spiralRadius * goldenRatio + spiralTime;
        
        // Alien energy tendrils extending outward
        float energyPulse = sin(time * 3.0 + spiralRadius * 5.0) * 0.5 + 0.5;
        float tentacleLength = 1.0 + energyPulse * pulseIntensity * (2.0 + interactionIntensity);
        
        // Create energy tentacles that extend beyond the core orb
        float tentacleId = mod(pointId, 8.0);
        float tentacleAngle = tentacleId * PI * 0.25;
        if (mod(pointId, 16.0) > 8.0) {
          // These are the extending energy lines
          vec3 tentacleDir = vec3(cos(tentacleAngle), sin(tentacleAngle * 0.5), sin(tentacleAngle));
          pos += tentacleDir * tentacleLength * (0.8 + energyPulse * 0.4);
          
          // Add alien wiggle to the tentacles
          float wiggle = sin(time * 4.0 + tentacleId * 2.0) * 0.3;
          pos.xyz += tentacleDir * wiggle * pulseIntensity;
        }
        
        // Fibonacci spiral influence
        float fibSpiral = sin(spiralAngle * goldenRatio) * cos(spiralRadius * PI);
        pos.xyz *= 1.0 + fibSpiral * hypnoticMode * (0.2 + interactionIntensity * 0.3);
        
        // Fractal depth pulsing
        float fractalPulse = sin(time * 2.0 + spiralRadius * 8.0) * tranceDepth * (0.3 + interactionIntensity * 0.4);
        pos.xyz *= 1.0 + fractalPulse;
        
        // Interactive 3D transformation
        mat4 interactiveRotation = rotX(rotAngleX) * rotY(rotAngleY) * rotZ(rotAngleZ);
        vec4 rotatedPos = interactiveRotation * vec4(pos, 1.0);
        pos = rotatedPos.xyz;

        mat4 wmat = rotZ(odd * PI * .5 + sin(tm) + rotAngleY);
        wmat *= trans(vec3(0, cos(pairA * PI), 0));
        wmat *= uniformScale(sin(pairA * PI) * (1.0 + interactionIntensity * 0.2));
        vec4 wp = wmat * vec4(pos, 1.);
        
        float su = abs(atan(wp.x, wp.z)) / PI;
        float sv = abs(wp.y) * 1.;
        float s = 0.5 + 0.3 * sin(time + su * 10.0 + sv * 5.0 + interactionIntensity * 5.0);
        wp.xyz *= mix(0.8, 1.2 + interactionIntensity * 0.3, pow(s, 1.));
        
        float r = 2.5;
        mat4 mat = persp(radians(60.0), resolution.x / resolution.y, 0.1, 10.0);
        vec3 eye = vec3(
          cos(tm + rotAngleY * 0.1) * r, 
          sin(tm * 0.93 + rotAngleX * 0.1) * r, 
          sin(tm + rotAngleZ * 0.1) * r
        );
        vec3 target = vec3(0);
        vec3 up = vec3(sin(rotAngleY * 0.05), sin(tm2 + rotAngleX * 0.1), cos(tm2 + rotAngleY * 0.1));
        
        mat *= cameraLookAt(eye, target, up);
        
        gl_Position = mat * wp;

        // Alien energy color patterns
        float colorMix = sin(spiralAngle * 0.1 + time * 0.2) * 0.5 + 0.5;
        vec3 baseColor = mix(primaryColor, secondaryColor, colorMix);
           
        // Energy tendril glow effect
        float energyGlow = energyPulse * pulseIntensity;
        if (mod(pointId, 16.0) > 8.0) {
          // Energy lines are brighter and more alien
          baseColor = mix(baseColor, vec3(1.0, 1.0, 1.0), energyGlow * 0.6);
          baseColor += vec3(0.0, energyGlow * 0.4, energyGlow * 0.8); // Cyan alien glow
        }
        
        float spiralBands = sin(spiralRadius * 10.0 - spiralTime * 3.0) * hypnoticMode * (1.0 + interactionIntensity);
        baseColor = mix(baseColor, vec3(1.0, 1.0, 1.0), spiralBands * (0.3 + interactionIntensity * 0.2));
        
        vec3 color = baseColor;
        
        // Enhanced alpha for energy tendrils
        float alpha = mix(0.3 + interactionIntensity * 0.2, 1.0, pow(1.0 - sv, 2.0));
        if (mod(pointId, 16.0) > 8.0) {
          // Energy lines have pulsating alpha
          alpha *= energyPulse * (0.6 + pulseIntensity * 0.4);
        }
        
        v_color = vec4(color, alpha);
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
    const mousePosLocation = gl.getUniformLocation(program, 'mousePos');
    const userRotationLocation = gl.getUniformLocation(program, 'userRotation');
    const interactionIntensityLocation = gl.getUniformLocation(program, 'interactionIntensity');
    const pulseIntensityLocation = gl.getUniformLocation(program, 'pulseIntensity');

    // Create vertex buffer
    const numVertices = 4096; // More vertices for energy tendrils
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
      const hypnoticIntensity = afterglow ? 1.0 : (isHovering ? 0.7 : 0.3);
      const tranceLevel = breathPhase === 'inhale' ? 0.8 : 
                         breathPhase === 'hold' ? 1.0 :
                         breathPhase === 'exhale' ? 0.6 : 0.4;
      
      gl.uniform1f(hypnoticModeLocation, hypnoticIntensity);
      gl.uniform1f(tranceDepthLocation, tranceLevel);
      
      // Alien pulse intensity based on interaction and breathing
      const alienPulse = (isHovering ? 1.0 : 0.6) * (isDragging ? 1.5 : 1.0) * tranceLevel;
      gl.uniform1f(pulseIntensityLocation, alienPulse);
      
      // Interactive uniforms
      gl.uniform2f(mousePosLocation, mousePosition.x, mousePosition.y);
      gl.uniform2f(userRotationLocation, rotation.x, rotation.y);
      gl.uniform1f(interactionIntensityLocation, isHovering ? 0.5 : (isDragging ? 1.0 : 0.0));
      
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
  }, [rotation, mousePosition, isDragging, isHovering, afterglow, breathPhase]);

  const egoColors = getEgoStateColor();
  const goalSigil = getGoalSigil();

  const handlePointerDown = () => {
    setIsPressed(true);
    if (onDragStart) onDragStart();
    lastMousePos.current = mousePosition;
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    if (onDragEnd) onDragEnd();
    setTimeout(onTap, 100);
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
    setIsHovering(false);
    if (onDragEnd) onDragEnd();
  };

  const handlePointerEnter = () => {
    setIsHovering(true);
  };

  return (
    <div className={`flex justify-center items-center ${className} relative z-50`}>
      <div className="relative flex items-center justify-center">
        <div
          className={`relative cursor-pointer transition-transform duration-200 select-none ${
            isPressed ? 'scale-95' : isHovering ? 'scale-105' : 'scale-100'
          } shadow-2xl shadow-black/40 hover:shadow-cyan-500/20`}
          style={{
            width: size || (window.innerWidth < 768 ? Math.min(window.innerWidth * 0.5, 200) : 280),
            height: size || (window.innerWidth < 768 ? Math.min(window.innerWidth * 0.5, 200) : 280),
            borderRadius: '50%',
            overflow: 'hidden',
            background: isDragging ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
            border: `2px solid ${isHovering ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            filter: afterglow ? 'brightness(1.2) saturate(1.1) drop-shadow(0 0 20px rgba(20, 184, 166, 0.5))' : 
                   isHovering ? 'brightness(1.1) saturate(1.05) drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))' :
                   `hue-rotate(${egoState === 'nurturer' ? '30deg' : egoState === 'sage' ? '60deg' : egoState === 'performer' ? '-30deg' : '0deg'})`,
            transform: `scale(${getBreathScale()})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out, filter 0.3s ease, border-color 0.3s ease',
            aspectRatio: '1 / 1',
            minWidth: '240px',
            minHeight: '240px',
            maxWidth: '100vw',
            maxHeight: '100vh',
            boxSizing: 'border-box',
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerLeave}
          onPointerLeave={handlePointerLeave}
          onPointerEnter={handlePointerEnter}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ 
              display: 'block',
              filter: isHovering ? 'brightness(1.1) contrast(1.1)' : 'none',
              transition: 'filter 0.3s ease'
            }}
          />
          
          {/* Goal Sigil Overlay */}
          {goalSigil && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="text-white/30 text-4xl font-light transition-all duration-300"
                style={{
                  textShadow: `0 0 20px rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, 0.5)`,
                  filter: isHovering ? 'blur(0px)' : 'blur(0.5px)',
                  transform: `rotateX(${rotation.x * 0.05}deg) rotateY(${rotation.y * 0.05}deg)`
                }}
              >
                {goalSigil}
              </div>
            </div>
          )}
          
          {/* Interactive Glow Ring */}
          {(isHovering || isDragging) && (
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(from ${rotation.y}deg, transparent, rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, 0.3), transparent)`,
                animation: isDragging ? 'spin 2s linear infinite' : 'spin 8s linear infinite'
              }}
            />
          )}
          
          {/* Fallback CSS orb if WebGL fails */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Core CSS Orb */}
            <div 
              className="w-48 h-48 rounded-full transition-all duration-300 relative"
              style={{
                background: `radial-gradient(circle, rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, ${isHovering ? 0.8 : 0.6}) 0%, rgba(${egoColors.secondary[0] * 255}, ${egoColors.secondary[1] * 255}, ${egoColors.secondary[2] * 255}, ${isHovering ? 0.6 : 0.4}) 100%)`,
                transform: `rotateX(${rotation.x * 0.1}deg) rotateY(${rotation.y * 0.1}deg)`,
                filter: isHovering ? 'brightness(1.2)' : 'brightness(1)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              {/* Alien Energy Tendrils - CSS Fallback */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 opacity-60"
                  style={{
                    height: '120px',
                    background: `linear-gradient(to top, rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, 0.8), transparent)`,
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'bottom center',
                    transform: `translateX(-50%) translateY(-50%) rotate(${i * 45}deg)`,
                    animation: `alienPulse 2s ease-in-out infinite ${i * 0.25}s`,
                    filter: 'blur(0.5px)',
                    boxShadow: `0 0 10px rgba(${egoColors.primary[0] * 255}, ${egoColors.primary[1] * 255}, ${egoColors.primary[2] * 255}, 0.6)`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Text below orb - always rendered */}
        {/* Removed duplicate text - handled by parent component */}
      </div>
      
      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes alienPulse {
          0%, 100% { 
            transform: translateX(-50%) translateY(-50%) rotate(var(--rotation, 0deg)) scaleY(0.6);
            opacity: 0.3;
          }
          50% { 
            transform: translateX(-50%) translateY(-50%) rotate(var(--rotation, 0deg)) scaleY(1.2);
            opacity: 0.8;
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: rotateX(var(--rotX, 0deg)) rotateY(var(--rotY, 0deg)) scale(0.95);
          }
          50% { 
            transform: rotateX(var(--rotX, 0deg)) rotateY(var(--rotY, 0deg)) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

const WebGLOrb = React.forwardRef(WebGLOrbRender);

WebGLOrb.displayName = 'WebGLOrb';

export default WebGLOrb;
  