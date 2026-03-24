"use client";

import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import Link from "next/link";
import BlurHeading from "./blur-heading";

type CardProps = {
  title: string;
  description?: string;
  image: string;
  heightClass: string;
  delay?: number;
  slug: string;
};

function ParallaxCard({ title, description, image, heightClass, delay = 0, slug }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <Link href={`/competitions/${slug}`} className="block w-full">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        ref={ref}
        className={`relative w-full overflow-hidden group rounded-sm ${heightClass}`}
      >
        <motion.div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${image})`,
            y,
            scale: 1.25, 
            filter: "grayscale(100%) contrast(1.1) brightness(0.8)",
          }}
        />

        <div className="absolute inset-0 z-10 bg-linear-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/95" />

        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 md:p-10 flex flex-col items-start transition-transform duration-500 group-hover:-translate-y-2">
          <h2 className="text-3xl md:text-[2.6rem] font-medium tracking-tight leading-[1.05] mb-4 text-white">
            {title}
          </h2>
          {description && (
            <p className="text-gray-300 text-sm md:text-[15px] leading-relaxed max-w-[90%] font-light">
              {description}
            </p>
          )}
        </div>

        <div className="absolute bottom-8 right-8 z-30 bg-white text-black p-3 rounded-sm opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}

import { COMPETITIONS_DATA } from "@/lib/competitions-data";

export default function CompetitionsPage() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.2,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative overflow-hidden">
      
      <motion.div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://4kwallpapers.com/images/wallpapers/stars-galaxy-3840x2160-10307.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4) saturate(1.3)",
          scale: 1.15,
          y: bgY,
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-transparent via-[#030303]/40 to-[#030303]/95" />

      <div className="fixed top-6 left-6 z-50 pointer-events-auto">
        <Link href="/">
          <img 
            src="/neutron.png" 
            alt="Logo" 
            className="h-12 w-12 opacity-90 transition-transform duration-300 hover:scale-110"
          />
        </Link>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 pt-32 pb-40">
        <div className="mb-24 mt-10 max-w-4xl relative z-10">
          <BlurHeading
            text={"Enter the\ncosmic arena\nat neutron"}
            className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-bold uppercase tracking-[-0.03em] leading-[0.92]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative z-10 items-start">
          <div className="flex flex-col gap-8 lg:gap-12 w-full">
            {COMPETITIONS_DATA.filter((_, i) => i % 2 === 0).map((comp) => (
              <ParallaxCard
                key={comp.slug}
                slug={comp.slug}
                title={comp.title}
                description={comp.description}
                image={comp.image}
                heightClass={comp.heightClass}
                delay={comp.delay}
              />
            ))}
          </div>

          <div className="flex flex-col gap-8 lg:gap-12 w-full pt-0 md:pt-40">
            {COMPETITIONS_DATA.filter((_, i) => i % 2 !== 0).map((comp) => (
              <ParallaxCard
                key={comp.slug}
                slug={comp.slug}
                title={comp.title}
                description={comp.description}
                image={comp.image}
                heightClass={comp.heightClass}
                delay={comp.delay}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
