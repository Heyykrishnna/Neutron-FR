"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VERT = /* glsl */ `
  attribute vec2 position;
  void main(){
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;      // 0 → 1 normalised transition progress
  uniform vec2  uResolution;

  // Hash for noise
  float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(hash(i), hash(i+vec2(1,0)), f.x),
      mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
      f.y
    );
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 center = vec2(0.5,0.5);
    vec2 d  = uv - center;
    float dist = length(d);

    float t = uTime; // 0 → 1

    // ── Phase curves ──────────────────────────────────────────
    float buildT = smoothstep(0.0, 0.45, t);       // warp build
    float peakT  = smoothstep(0.35, 0.88, t);      // warp peak
    float flashT = smoothstep(0.78, 1.0, t);       // white flash

    // ── Radial warp strength ───────────────────────────────────
    float warpAmt  = buildT * 0.045 + peakT * 0.065;
    // Lensing distortion (pulls towards centre)
    float lensing  = warpAmt / (dist + 0.14);
    vec2  warpedUV = uv - normalize(d) * lensing * min(dist, 0.5);

    // ── Chromatic aberration ───────────────────────────────────
    float caAmt   = peakT * 0.028;
    vec2  rOff    = normalize(d) * caAmt;
    vec2  uvR = warpedUV + rOff;
    vec2  uvG = warpedUV;
    vec2  uvB = warpedUV - rOff;

    // ── Speed-line radial streaks ──────────────────────────────
    float angle   = atan(d.y, d.x);
    float streak  = abs(sin(angle * 28.0 + t * 12.0)) * 0.5 + 0.5;
    streak        = pow(streak, 14.0);
    float streakR = dist < 0.48 ? streak * peakT * 0.55 : 0.0;

    // ── Spinning noise curtain ─────────────────────────────────
    float n = noise(d * 4.5 + t * 3.0);
    float curtain = n * peakT * 0.18;

    // ── Vignette ──────────────────────────────────────────────
    float vig  = 1.0 - smoothstep(0.3, 0.9, dist);
    float vig2 = 1.0 - smoothstep(0.0, 0.5, dist) * peakT * 0.6;

    // ── Base colour (very dark space) ─────────────────────────
    vec3 baseCol = vec3(0.04, 0.015, 0.005);

    // Warm orange glow towards centre
    float glow   = exp(-dist * (2.4 + peakT * 5.0)) * peakT;
    vec3  glowCol= vec3(1.0, 0.45, 0.08) * glow * 1.8;

    // Speed lines bright
    vec3  sl = vec3(1.0, 0.72, 0.28) * streakR;

    // Noise film grain / curtain
    vec3 curtainCol = vec3(n * 0.6, n * 0.22, 0.0) * curtain;

    vec3 col = baseCol + glowCol + sl + curtainCol;
    col *= vig;
    col = mix(col, col * vig2, peakT);

    // ── White flash ───────────────────────────────────────────
    col = mix(col, vec3(1.0), flashT);

    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  active: boolean;
  onComplete: () => void;
}

export default function WarpTransition({ active, onComplete }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const glRef      = useRef<WebGLRenderingContext | null>(null);
  const progRef    = useRef<WebGLProgram | null>(null);
  const rafRef     = useRef<number>(0);
  const startRef   = useRef<number>(0);
  const calledBack = useRef(false);

  const DURATION = 1380; // ms

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false });
    if (!gl) return;
    glRef.current = gl;

    const makeShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    progRef.current = prog;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }, []);

  const animate = useCallback((now: number) => {
    const gl   = glRef.current;
    const prog = progRef.current;
    const canvas = canvasRef.current;
    if (!gl || !prog || !canvas) return;

    const elapsed = now - startRef.current;
    const t       = Math.min(elapsed / DURATION, 1.0);

    gl.useProgram(prog);
    gl.uniform1f(gl.getUniformLocation(prog, "uTime"), t);
    gl.uniform2f(gl.getUniformLocation(prog, "uResolution"), canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (t >= 1.0) {
      if (!calledBack.current) {
        calledBack.current = true;
        onComplete();
      }
      return;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    calledBack.current = false;
    initGL();
    resize();
    window.addEventListener("resize", resize);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, initGL, resize, animate]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="warp"
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "100%", imageRendering: "pixelated" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
