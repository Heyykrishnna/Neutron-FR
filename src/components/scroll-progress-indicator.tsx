"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import React from 'react';

export function ScrollProgressIndicator() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="fixed top-1/4 right-8 bottom-1/4 w-[2px] bg-white/10 z-60 max-md:hidden flex flex-col justify-start items-center rounded-full pointer-events-none">
      <div className="absolute inset-0 flex flex-col justify-between py-2 items-center opacity-30 w-full">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-2 h-px bg-white" />
        ))}
      </div>
      
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-white/20 via-white to-white origin-top shadow-[0_0_15px_rgba(255,255,255,1)]"
        style={{ scaleY, transformOrigin: "top" }}
        initial={{ scaleY: 0 }}
      />
      <div className="absolute top-1/2 right-4 -translate-y-1/2 uppercase text-[10px] font-mono tracking-[0.3em] text-white/30 whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        MISSION PROGRESS
      </div>
    </div>
  );
}
