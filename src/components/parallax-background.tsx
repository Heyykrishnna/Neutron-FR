"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React from "react";

export function ParallaxBackground({ imageUrl }: { imageUrl: string }) {
  const { scrollYProgress } = useScroll();

  const starsY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const cloudsY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#030303]" style={{ perspective: "1000px" }}>
      <motion.div
        className="absolute -inset-[50%] bg-[url('https://4kwallpapers.com/images/wallpapers/stars-galaxy-3840x2160-10307.jpg')] bg-cover bg-center opacity-40 mix-blend-screen"
        style={{
          y: starsY,
          transform: "translateZ(-300px)",
        }}
      />

      <motion.div
        className="absolute inset-x-0 -top-[20%] h-[150%] bg-cover bg-center opacity-60 mix-blend-lighten"
        style={{
          backgroundImage: `url(${imageUrl})`,
          filter: "brightness(0.3) contrast(1.2) grayscale(40%) blur(12px)",
          y: cloudsY,
          transform: "translateZ(-100px) scale(1.3)",
        }}
      />

      <div className="absolute inset-0 bg-linear-to-b from-[#030303]/10 via-[#030303]/70 to-[#030303] z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#030303_100%)] z-10 opacity-70" />
    </div>
  );
}
