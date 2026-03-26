"use client";

import React, { useRef, useEffect } from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
  className?: string;
  fullScreen?: boolean;
}

const Noise: React.FC<NoiseProps> = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
  className = '',
  fullScreen = true
}) => {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId: number;

    const canvasSize = 1024;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      if (fullScreen) {
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
      } else {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
    };

    if (fullScreen) {
      window.addEventListener('resize', resize);
    }
    resize();
    
    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % patternRefreshInterval === 0) {
        drawGrain();
      }
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (fullScreen) {
        window.removeEventListener('resize', resize);
      }
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha, fullScreen]);

  return (
    <canvas
      className={`pointer-events-none fixed inset-0 ${className}`.trim()}
      ref={grainRef}
      style={{
        imageRendering: 'pixelated',
        width: '100vw',
        height: '100vh',
        zIndex: 0
      }}
    />
  );
};

export default Noise;
