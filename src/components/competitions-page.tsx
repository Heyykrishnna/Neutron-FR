"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import BlurHeading from "./blur-heading";
import { Filter, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useCompetitions } from "@/hooks/api/useCompetitions";
import { playSciFiClick } from "./audio-controller";
import { Globe3D } from "@/components/ui/3d-globe";

// ============================================================================
// Space Backdrop Component
// ============================================================================

const SpaceBackdrop = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0a0a1a_0%,#000000_100%)]" />
      <div 
        className="absolute inset-0 opacity-40 bg-repeat bg-size-[200px_200px]"
        style={{
          backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')`,
        }}
      />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px]" />

      <div className="absolute bottom-[-45%] left-1/2 -translate-x-1/2 w-[140%] aspect-square max-w-[1200px] opacity-80 mix-blend-screen pointer-events-auto">
        <Globe3D 
          className="w-full h-full"
          config={{
            radius: 2,
            autoRotateSpeed: 0.5,
            showAtmosphere: false,
            atmosphereIntensity: 0,
            bumpScale: 3,
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-linear-to-t from-black to-transparent z-10" />
    </div>
  );
};

// ============================================================================
// Polaroid Card Component
// ============================================================================

type CardProps = {
  title: string;
  image: string;
  slug: string;
  category: string;
  date: string;
  index: number;
  total: number;
  scrollToCard: (idx: number) => void;
};

function PolaroidCard({ title, image, slug, category, date, index, total, scrollToCard }: CardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.0005
  });

  // Orbital Transform Logic
  const x = useTransform(smoothProgress, [0, 0.5, 1], ["100vw", "0vw", "-100vw"]);
  const y = useTransform(smoothProgress, [0, 0.5, 1], [60, 0, 60]); 
  const z = useTransform(smoothProgress, [0.4, 0.5, 0.6], [-100, 100, -100]);
  const rotateX = useTransform(smoothProgress, [0, 0.5, 1], [15, 0, -15]); 
  const rotateY = useTransform(smoothProgress, [0, 0.5, 1], [18, 0, -18]); 
  const rotateZ = useTransform(smoothProgress, [0, 0.5, 1], [10, 0, -10]); 
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.85, 1.1, 0.85]); 
  const opacity = useTransform(smoothProgress, [0, 0.15, 0.5, 0.85, 1], [0, 1, 1, 1, 0]);

  return (
    <div ref={containerRef} className="h-screen w-full flex items-center justify-center relative perspective-[2000px] pointer-events-none">
      <motion.div
        style={{
          x,
          y,
          z,
          rotateX,
          rotateY,
          rotateZ,
          scale,
          opacity,
          transformStyle: "preserve-3d",
          backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.7), rgba(10, 10, 15, 0.8)), url('https://ik.imagekit.io/yatharth/CARDS.png')`,
          backgroundColor: "#0a0a0f",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "overlay",
        }}
        className="relative w-[320px] md:w-[480px] aspect-4/5 p-4 pb-16 md:p-6 md:pb-24 shadow-[0_40px_80px_rgba(0,0,0,0.9)] rounded-[2px] group pointer-events-auto overflow-visible border border-zinc-800/60"
      >
        <div className="absolute inset-0 pointer-events-none rounded-[2px] border border-white/5 shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]" />
        
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-size-[100%_2px,3px_100%]" />
        
        <Link href={`/competitions/${slug}`} onClick={playSciFiClick} className="block w-full h-full relative flex-col z-10">
          <div className="flex justify-between items-start text-[9px] md:text-[12px] font-caveat text-zinc-500 tracking-wider pt-1">
            <div className="flex flex-col -space-y-1">
              <span>F/11</span>
              <span>ISO 100</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 font-caveat text-2xl md:text-xl text-zinc-300 leading-none -rotate-1">
              LIFT OFF!
            </div>
            <div className="font-caveat text-xl md:text-lg text-zinc-300 rotate-1">
              {date || "MISSION DATE"}
            </div>
          </div>

          <div className="w-full aspect-4/3 relative overflow-hidden bg-zinc-900 mt-6 md:mt-10 rounded-[1px] border border-zinc-800 group-hover:border-amber-500/50 transition-colors duration-500 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.2] grayscale-[0.3] transition-all duration-700 group-hover:scale-105 group-hover:brightness-[0.9] group-hover:grayscale-0"
            />
            <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-amber-500/30" />
            <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-amber-500/30" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-amber-500/30" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-amber-500/30" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center pt-6">
            <h2 className="font-sans font-black text-4xl md:text-4xl text-amber-500 uppercase tracking-tighter leading-none px-4 text-center mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:text-amber-400 transition-colors">
              {title}
            </h2>
            <div className="flex items-center gap-4">
              <div className="h-px w-8 bg-amber-500/20" />
              <span className="text-[10px] md:text-[8px] font-mono uppercase tracking-[0.5em] text-amber-500/40 font-bold">
                DATA_NODE_{index + 1}
              </span>
              <div className="h-px w-8 bg-amber-500/20" />
            </div>
          </div>
        </Link>
        <div className="absolute top-1/2 -left-12 -right-12 md:-left-16 md:-right-16 -translate-y-1/2 flex justify-between items-center z-50 px-2 pointer-events-none">
          <button
            onClick={(e) => { e.stopPropagation(); playSciFiClick(); scrollToCard(index - 1); }}
            className={`w-12 h-12 flex items-center justify-center bg-zinc-950 border border-amber-500/20 text-amber-500 transition-all hover:bg-amber-500/10 hover:border-amber-500/50 hover:scale-110 pointer-events-auto backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.05)] ${index === 0 ? 'opacity-0 cursor-default' : 'opacity-40 hover:opacity-100'}`}
            disabled={index === 0}
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); playSciFiClick(); scrollToCard(index + 1); }}
            className={`w-12 h-12 flex items-center justify-center bg-zinc-950 border border-amber-500/20 text-amber-500 transition-all hover:bg-amber-500/10 hover:border-amber-500/50 hover:scale-110 pointer-events-auto backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.05)] ${index === total - 1 ? 'opacity-0 cursor-default' : 'opacity-40 hover:opacity-100'}`}
            disabled={index === total - 1}
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Main Competitions Page Component
// ============================================================================

export default function CompetitionsPage() {
  const {
    data: competitions = [],
    isLoading,
    isError,
    refetch,
  } = useCompetitions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const filterRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(
        competitions
          .map((c) => c?.category)
          .filter((category): category is string => Boolean(category)),
      ),
    );
    return ["All Categories", ...cats];
  }, [competitions]);

  const filteredCompetitions = useMemo(() => {
    let result = [...competitions];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const title = String(c?.title || c?.name || "").toLowerCase();
        const category = String(c?.category || "").toLowerCase();
        return title.includes(query) || category.includes(query);
      });
    }
    if (selectedCategory !== "All Categories") {
      result = result.filter((c) => c?.category === selectedCategory);
    }
    return result;
  }, [searchQuery, selectedCategory, competitions]);

  const scrollToCard = (idx: number) => {
    if (idx < 0 || idx >= filteredCompetitions.length) return;
    const headerOffset = window.innerHeight * 0.3; // matches the pt-[30vh]
    const targetY = (idx * window.innerHeight) + headerOffset;
    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 relative overflow-x-hidden">
      <SpaceBackdrop />

      <div className="fixed top-6 left-6 z-50 flex flex-row items-center gap-4">
        <Link href="/" onClick={playSciFiClick}>
          <img
            src="https://ik.imagekit.io/yatharth/NEUT-LOGO.png"
            alt="Logo"
            className="h-10 w-10 md:h-12 md:w-12 opacity-90 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_15px_rgba(255,200,80,0.4)]"
          />
        </Link>
        <Link
          href="/?phase=planets"
          onClick={playSciFiClick}
          className="group flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Planets</span>
        </Link>
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none pt-12 md:pt-24 pb-12 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <BlurHeading text={"COMPETITIONS"} className="text-4xl md:text-7xl lg:text-[6rem] font-bold uppercase tracking-[-0.03em] leading-[0.92] drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
        </motion.div>
      </header>

      <main className="relative z-10">
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="font-mono text-[10px] tracking-[0.5em] text-white/40 uppercase">CALIBRATING...</span>
            </div>
          </div>
        ) : (
          <div className="h-full pt-[30vh]">
            {filteredCompetitions.length > 0 ? (
              filteredCompetitions.map((comp, idx) => (
                <PolaroidCard
                  key={String(comp.id || comp._id || idx)}
                  title={comp.title || comp.name || "Untitled Mission"}
                  image={comp.image || "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa"}
                  slug={comp.slug || ""}
                  category={comp.category || "General"}
                  date={new Date(comp.date || comp.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  index={idx}
                  total={filteredCompetitions.length}
                  scrollToCard={scrollToCard}
                />
              ))
            ) : (
              <div className="h-screen flex items-center justify-center">
                 <span className="font-mono text-[10px] tracking-[0.5em] text-white/40 uppercase">NO MISSIONS DETECTED</span>
              </div>
            )}
            <div className="h-[50vh]" />
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none opacity-40">
        <span className="text-[8px] font-mono tracking-[0.4em] uppercase">SCROLL TO ORBIT</span>
        <div className="w-px h-12 bg-linear-to-b from-white to-transparent" />
      </div>
    </div>
  );
}
