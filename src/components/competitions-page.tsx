"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import BlurHeading from "./blur-heading";
import gsap from "gsap";
import {Filter, CircleDot, ArrowDownUp, ChevronDown } from "lucide-react";

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

function ParallaxCard({ title, description, image, heightClass, delay = 0, slug, category, teamSize, status }: CardProps) {
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

import { COMPETITIONS_DATA } from "@/lib/competitions-data";

export default function CompetitionsPage() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("Default");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);

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
    const cats = Array.from(new Set(COMPETITIONS_DATA.map(c => c.category)));
    return ["All Categories", ...cats];
  }, []);

  const statuses = ["All Status", "open", "closed", "postponed", "cancelled"];
  const sortOptions = ["Default", "Title (A-Z)", "Title (Z-A)", "Date (Newest)", "Date (Oldest)"];

  const filteredCompetitions = useMemo(() => {
    let result = [...COMPETITIONS_DATA];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.category.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== "All Categories") {
      result = result.filter(c => c.category === selectedCategory);
    }

    if (selectedStatus !== "All Status") {
      result = result.filter(c => c.status === selectedStatus);
    }

    if (sortBy === "Title (A-Z)") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "Title (Z-A)") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "Date (Newest)") {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === "Date (Oldest)") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return result;
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  const leftColumnComps = filteredCompetitions.filter((_, i) => i % 2 === 0);
  const rightColumnComps = filteredCompetitions.filter((_, i) => i % 2 !== 0);

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

      <div className="fixed top-6 left-6 z-50 pointer-events-auto flex flex-row items-center gap-4">
        <Link href="/">
          <img 
            src="/neutron.png" 
            alt="Logo" 
            className="h-12 w-12 opacity-90 transition-transform duration-300 hover:scale-110"
          />
        </Link>
        <Link 
          href="/?phase=planets"
          className="group flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs font-mono uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Planets</span>
        </Link>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 pt-32 pb-40">
        <div className="mb-12 md:mb-24 mt-4 md:mt-10 max-w-4xl relative z-10">
          <BlurHeading
            text={"Enter the\ncosmic arena\nat neutron"}
            className="text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[7rem] font-bold uppercase tracking-[-0.03em] leading-[0.92]"
          />
        </div>

        <div className="relative z-20 mb-16 flex flex-col gap-6" ref={filterRef}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-[400px]">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search competitions, categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveDropdown(null);
                }}
                className="w-full h-14 bg-white/5 border border-white/10 rounded-sm pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-hidden focus:border-white/30 transition-all font-mono text-sm"
              />
            </div>

            <div className="flex flex-row flex-wrap gap-3 w-full md:w-auto overflow-visible py-2">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                  className={`h-14 px-6 flex items-center gap-3 rounded-sm border transition-all cursor-pointer font-mono text-[10px] uppercase tracking-widest ${
                    activeDropdown === 'category' || selectedCategory !== "All Categories"
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Filter size={18} strokeWidth={activeDropdown === 'category' ? 2.5 : 1.5} />
                  <span>{selectedCategory === "All Categories" ? "Category" : selectedCategory}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'category' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-sm shadow-2xl z-50 p-2 overflow-hidden"
                    >
                      {categories.map((cat) => {
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setActiveDropdown(null);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left group ${
                              selectedCategory === cat ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span className="font-mono text-[10px] uppercase tracking-widest">{cat === "All Categories" ? "All Missions" : cat}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
                  className={`h-14 px-6 flex items-center gap-3 rounded-sm border transition-all cursor-pointer font-mono text-[10px] uppercase tracking-widest ${
                    activeDropdown === 'status' || selectedStatus !== "All Status"
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <CircleDot size={18} strokeWidth={activeDropdown === 'status' ? 2.5 : 1.5} />
                  <span>{selectedStatus === "All Status" ? "Status" : selectedStatus}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'status' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-sm shadow-2xl z-50 p-2 overflow-hidden"
                    >
                      {statuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            setActiveDropdown(null);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left ${
                            selectedStatus === status ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                             status === 'open' ? 'bg-emerald-500' : 
                             status === 'closed' ? 'bg-rose-500' : 
                             status === 'postponed' ? 'bg-amber-500' : 'bg-white/20'
                          }`} />
                          <span className="font-mono text-[10px] uppercase tracking-widest">{status === "All Status" ? "All Status" : status}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                  className={`h-14 px-6 flex items-center gap-3 rounded-sm border transition-all cursor-pointer font-mono text-[10px] uppercase tracking-widest ${
                    activeDropdown === 'sort' || sortBy !== "Default"
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <ArrowDownUp size={18} strokeWidth={activeDropdown === 'sort' ? 2.5 : 1.5} />
                  <span>{sortBy === "Default" ? "Sort By" : sortBy}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'sort' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-sm shadow-2xl z-50 p-2 overflow-hidden"
                    >
                      {sortOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSortBy(opt);
                            setActiveDropdown(null);
                          }}
                          className={`w-full px-4 py-3 rounded-sm transition-all text-left font-mono text-[10px] uppercase tracking-widest ${
                            sortBy === opt ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {filteredCompetitions.length === 0 && (
            <div className="mt-20 text-center py-20 border border-dashed border-white/10 rounded-sm">
              <p className="text-white/40 font-mono uppercase tracking-[0.2em] text-sm">No cosmic signals detected matching your criteria.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setSelectedStatus("All Status");
                  setSortBy("Default");
                }}
                className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-[10px] font-mono uppercase tracking-widest text-white/60"
              >
                Reset Sensors
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 relative z-10 items-start mt-8 md:mt-0">
          <div className="flex flex-col gap-8 lg:gap-12 w-full">
            {leftColumnComps.map((comp) => (
              <ParallaxCard
                key={comp.slug}
                slug={comp.slug}
                title={comp.title}
                description={comp.description}
                image={comp.image}
                heightClass={comp.heightClass}
                delay={comp.delay}
                category={comp.category}
                teamSize={comp.teamSize}
                status={comp.status}
              />
            ))}
          </div>

          <div className="flex flex-col gap-8 lg:gap-12 w-full pt-0 md:pt-40">
            {rightColumnComps.map((comp) => (
              <ParallaxCard
                key={comp.slug}
                slug={comp.slug}
                title={comp.title}
                description={comp.description}
                image={comp.image}
                heightClass={comp.heightClass}
                delay={comp.delay}
                category={comp.category}
                teamSize={comp.teamSize}
                status={comp.status}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
