"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Noise from "./Noise";
import Grainient from "./Grainient";

interface MobileLandingProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export default function MobileLanding({ onMenuToggle, isMenuOpen }: MobileLandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Hero Image Animations
  const heroScale = useTransform(smoothProgress, [0, 0.4], [1, 1.1]);
  const heroRadius = useTransform(smoothProgress, [0, 0.35], ["80px", "0px"]);
  const heroWidth = useTransform(smoothProgress, [0, 0.35], ["94%", "100%"]);
  const heroHeight = useTransform(smoothProgress, [0, 0.4], ["84vh", "100vh"]);
  const heroY = useTransform(smoothProgress, [0, 0.4], ["-40px", "0px"]);

  // Text Animations
  const firstTextOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const firstTextY = useTransform(smoothProgress, [0, 0.15], [0, -20]);
  
  const secondTextOpacity = useTransform(smoothProgress, [0.25, 0.45], [0, 1]);
  const secondTextY = useTransform(smoothProgress, [0.25, 0.45], [20, 0]);

  return (
    <div ref={containerRef} className="relative min-h-[300vh] w-full bg-[#0d0a08] overflow-x-hidden flex flex-col px-0 pb-12 transition-colors duration-500">
      <Noise patternAlpha={10} className="fixed inset-0 opacity-40 z-0" />

      <header className="fixed top-0 left-0 w-full z-100 flex items-center justify-between px-6 pt-6 pb-4">
        <a href="/" className="transition-transform hover:scale-110 active:scale-95">
          <Image 
            src="/neutron.png" 
            alt="Neutron Logo" 
            width={48} 
            height={48} 
            className="drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          />
        </a>

        <button 
          onClick={onMenuToggle}
          className="flex flex-col gap-1.5 p-2 focus:outline-none group relative z-100"
          aria-label="Toggle Menu"
        >
          <motion.span 
            animate={isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="w-10 h-[2px] bg-white/90 rounded-full group-hover:bg-orange-200 transition-colors"
          />
          <motion.span 
            animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="w-10 h-[2px] bg-white/90 rounded-full group-hover:bg-orange-200 transition-colors"
          />
           <motion.span 
            animate={isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="w-10 h-[2px] bg-white/90 rounded-full group-hover:bg-orange-200 transition-colors"
          />
        </button>
      </header>

      {/* Hero Animation Section */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ 
            width: heroWidth, 
            height: heroHeight, 
            borderRadius: heroRadius,
            y: heroY
          }}
          className="relative overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.8)] border-x border-b border-white/5"
        >
          <motion.div style={{ scale: heroScale }} className="relative w-full h-full">
            <Image
              src="https://ik.imagekit.io/YatharthKhandelwal/Phone.png"
              alt="The future of aviation"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
          
          {/* Overlay Noise over image */}
          <Noise patternAlpha={12} className="absolute inset-0 opacity-50 z-20" fullScreen={false} />
          
          <div className="absolute inset-0 bg-linear-to-t from-[#0d0a08]/90 via-transparent to-transparent opacity-80 z-10" />
          
          <motion.div 
            style={{ opacity: firstTextOpacity, y: firstTextY }}
            className="absolute bottom-1 left-0 w-full px-8 pb-4 pointer-events-none z-30"
          >
            <h1 
              className="text-[3rem] font-bold leading-[0.85] tracking-tighter mb-6 drop-shadow-2xl text-white"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              Break Limits.<br />Build Galaxies.
            </h1>

            <p 
              className="text-[1.1rem] text-white/80 font-normal tracking-wide max-w-[85%]"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              Neutron is not just a fest. It’s a launchpad for the engineers of the future.
            </p>
          </motion.div>

          <motion.div 
            style={{ opacity: secondTextOpacity, y: secondTextY }}
            className="absolute bottom-[12%] left-0 w-full px-8 pb-4 pointer-events-none z-30"
          >
            <h2 
              className="text-[3rem] font-bold leading-[0.95] tracking-tighter mb-6 drop-shadow-2xl text-white"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              Explore the orbit.<br />Navigate your future.
            </h2>

            <p 
              className="text-[1rem] text-white/70 font-normal tracking-wide max-w-[90%]"
              style={{ fontFamily: "var(--font-sora)" }}
            >
              Join us in redefining how the world moves. The journey starts with a single step into the unknown.
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Spacer to allow scrolling */}
      <div className="h-[200vh]" />

      <div 
        className="fixed bottom-0 left-0 w-full h-[30vh] pointer-events-none"
        style={{ 
          background: "linear-gradient(to top, #0d0a08 0%, #0d0a08 20%, rgba(13,10,8,0.8) 50%, rgba(13,10,8,0) 100%)",
          zIndex: 5
        }}
      />
      
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
         <Grainient
            color1="#3e2723"
            color2="#5d4037"
            color3="#0d0a08"
            timeSpeed={0.3}
            colorBalance={-0.3}
            warpStrength={0.4}
            zoom={1.2}
            className="w-full h-full"
          />
      </div>
    </div>
  );
}
