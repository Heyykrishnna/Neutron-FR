"use client";

import { motion, useInView, useSpring, useTransform, animate, useMotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const Counter = ({ value, duration = 2, suffix = "" }: { value: number; duration?: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      animate(motionValue, value, { duration, ease: "easeOut" });
    }
  }, [isInView, value, duration, motionValue]);

  return (
    <span ref={ref}>
      <motion.span>{roundedValue}</motion.span>
      {suffix}
    </span>
  );
};

const ImpactChart = ({ data, labels, color = "#ffb84d" }: { data: number[]; labels: string[]; color?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isVisible = useInView(useRef(null), { once: true });
  
  const width = 300;
  const height = 100;
  const max = Math.max(...data);
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (d / max) * height
  }));

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const relativeX = (x / rect.width) * width;
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round((relativeX / width) * (data.length - 1)))
    );
    setHoveredIndex(index);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-[140px] relative mt-4 opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-crosshair touch-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
      onTouchEnd={() => setHoveredIndex(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d overflow-visible">
        {hoveredIndex !== null && (
          <motion.line
            x1={points[hoveredIndex].x}
            y1={0}
            x2={points[hoveredIndex].x}
            y2={height}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
          />
        )}
        <motion.path
          d={areaData}
          fill={color}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 0.1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
        />
        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          viewport={{ once: true }}
        />

        {hoveredIndex !== null && (
          <motion.circle
            cx={points[hoveredIndex].x}
            cy={points[hoveredIndex].y}
            r="4"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="shadow-[0_0_10px_white]"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        )}
      </svg>

      {hoveredIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            bottom: "100%",
            marginBottom: "12px"
          }}
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-xl">
            <span className="text-[0.65rem] font-mono text-white/50 uppercase tracking-tighter mr-2">
              {labels[hoveredIndex]}
            </span>
            <span className="text-sm font-bold text-[#ffb84d]">
              {data[hoveredIndex]}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const IMPACT_STATS = [
  { 
    label: "Total Footfalls", 
    value: 15000, 
    suffix: "+", 
    data: [1200, 2500, 4800, 9500, 15000],
    labels: ["2022", "2023", "2024", "2025", "Current"],
    description: "Iterative growth in physical and digital presence."
  },
  { 
    label: "Fund Raised", 
    value: 25, 
    suffix: "L+", 
    data: [5, 12, 18, 22, 25],
    labels: ["Seed", "Iter 1.0", "Iter 2.0", "Iter 3.0", "Current"],
    description: "Support from leading venture firms and sponsors."
  },
  { 
    label: "Partner Universities", 
    value: 120, 
    suffix: "+", 
    data: [30, 55, 85, 110, 120],
    labels: ["Initial", "Expansion", "Regional", "National", "Target"],
    description: "Expanded academic network across several states."
  },
  { 
    label: "Events & Workshops", 
    value: 45, 
    suffix: "+", 
    data: [10, 22, 35, 42, 45],
    labels: ["Phase A", "Phase B", "Phase C", "Phase D", "Live"],
    description: "Curated experiences from drone racing to VR workshops."
  }
];

export default function AboutImpact() {
  return (
    <section className="relative w-full bg-transparent pb-32 px-4 md:px-12 overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col mb-20">
          <h2 className="text-[3rem] md:text-[4.5rem] font-bold tracking-tight text-white leading-tight">
            The Magnitude of <br />
            Our Impact<span className="text-[#ffb84d]">.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {IMPACT_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 md:p-10 rounded-4xl bg-black/30 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 group backdrop-blur-md relative overflow-hidden"
              style={{
                boxShadow: '0 0 20px rgba(0,255,200,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: `hero-float ${6 + i * 0.8}s ease-in-out infinite`,
              }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-white/40 font-mono text-xs uppercase tracking-[0.2em]">
                  {stat.label}
                </span>
                <div className="text-[3.5rem] md:text-[5rem] font-bold text-white tracking-tighter leading-none mt-2">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/50 text-[1rem] leading-relaxed max-w-[80%] mt-4">
                  {stat.description}
                </p>
              </div>
              
              <ImpactChart data={stat.data} labels={stat.labels} />
              {/* HUD bracket corners */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-cyan-400/30 rounded-tl-sm pointer-events-none" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-cyan-400/30 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-cyan-400/30 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-cyan-400/30 rounded-br-sm pointer-events-none" />
              {/* Holographic scanline effect */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.3) 2px, rgba(0,255,200,0.3) 3px)' }} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
