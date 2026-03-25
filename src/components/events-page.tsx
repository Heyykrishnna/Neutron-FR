"use client";

import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import Link from "next/link";
import BlurHeading from "./blur-heading";
import { EVENTS_DATA } from "@/lib/events-data";

type CardProps = {
  title: string;
  description?: string;
  image: string;
  heightClass: string;
  delay?: number;
  slug: string;
  category: string;
  teamSize: string;
  status: "open" | "closed" | "cancelled" | "postponed";
};

function EventParallaxCard({ title, description, image, heightClass, delay = 0, slug, category, teamSize, status }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <Link href={`/events/${slug}`} className="block w-full">
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
            <p className="text-gray-400 text-sm md:text-[15px] leading-relaxed max-w-[90%] font-light mb-6">
              {description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-auto">
            <span className="px-2 py-1 rounded-sm bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50 font-mono">
              {category}
            </span>
            <span className="px-2 py-1 rounded-sm bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50 font-mono">
              {teamSize}
            </span>
            <span className={`px-2 py-1 rounded-sm border text-[10px] uppercase tracking-wider font-mono ${
              status === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              status === 'closed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              status === 'postponed' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-white/5 border-white/10 text-white/30'
            }`}>
              {status}
            </span>
          </div>
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

export default function EventsPage() {
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
            text={"Explore the\ncosmic events\nat neutron"}
            className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-bold uppercase tracking-[-0.03em] leading-[0.92]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 relative z-10 items-start">
          <div className="flex flex-col gap-8 lg:gap-12 w-full">
            {EVENTS_DATA.filter((_, i) => i % 2 === 0).map((event) => (
              <EventParallaxCard
                key={event.slug}
                slug={event.slug}
                title={event.title}
                description={event.description}
                image={event.image}
                heightClass={event.heightClass}
                delay={event.delay}
                category={event.category}
                teamSize={event.teamSize}
                status={event.status}
              />
            ))}
          </div>

          <div className="flex flex-col gap-8 lg:gap-12 w-full pt-0 md:pt-40">
            {EVENTS_DATA.filter((_, i) => i % 2 !== 0).map((event) => (
              <EventParallaxCard
                key={event.slug}
                slug={event.slug}
                title={event.title}
                description={event.description}
                image={event.image}
                heightClass={event.heightClass}
                delay={event.delay}
                category={event.category}
                teamSize={event.teamSize}
                status={event.status}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
