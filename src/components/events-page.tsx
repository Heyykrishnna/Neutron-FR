"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import * as THREE from "three";
import Link from "next/link";
import BlurHeading from "./blur-heading";
import { Filter, CircleDot, ArrowDownUp, ChevronDown } from "lucide-react";
import { useCompetitions } from "@/hooks/api/useCompetitions";
import { playSciFiClick } from "./audio-controller";

const ThreeStarsBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#000000", 0.001);
    
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 800;
    
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const txLoader = new THREE.TextureLoader();
    const starImg1 = txLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png");
    const starImg2 = txLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/circle.png");
    const starImg3 = txLoader.load("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/snowflake1.png");
    
    const createLayer = (count: number, size: number, texture: THREE.Texture, color: string, zRange: number) => {
       const geo = new THREE.BufferGeometry();
       const pos = [];
       for(let i=0; i<count; i++) {
         pos.push((Math.random() - 0.5)*2500, (Math.random() - 0.5)*2500, (Math.random() - 0.5)*zRange);
       }
       geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
       const mat = new THREE.PointsMaterial({ size, map: texture, transparent: true, blending: THREE.AdditiveBlending, color, depthWrite: false });
       return new THREE.Points(geo, mat);
    };
    
    const layer1 = createLayer(800, 3, starImg1, "#88aaff", 1000);
    layer1.position.z = -600;
    scene.add(layer1);
    
    const layer2 = createLayer(400, 7, starImg2, "#ffd7aa", 800);
    layer2.position.z = -200;
    scene.add(layer2);
    
    const layer3 = createLayer(150, 14, starImg3, "#ffffff", 600);
    layer3.position.z = 100;
    scene.add(layer3);
    
    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    
    const onScroll = () => { targetScrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    
    const resize = () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resize);
    
    let animFrame = 0;
    let time = 0;
    const tick = () => {
       time += 0.005;
       currentScrollY += (targetScrollY - currentScrollY) * 0.08;
       
       layer1.position.y = currentScrollY * 0.08;
       layer2.position.y = currentScrollY * 0.25;
       layer3.position.y = currentScrollY * 0.6;
       
       layer1.rotation.y = time * 0.05;
       layer2.rotation.y = time * 0.08;
       layer3.rotation.y = time * 0.15;
       
       renderer.render(scene, camera);
       animFrame = requestAnimationFrame(tick);
    };
    tick();
    
    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animFrame);
        renderer.dispose();
    }
  }, []);
  
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none w-full h-full mix-blend-screen opacity-70" />;
}

type CardProps = {
  title: string;
  description?: string;
  image: string;
  heightClass: string;
  delay?: number;
  slug: string;
  category: string;
  teamSize: string;
  status: "OPEN" | "CLOSED" | "CANCELLED" | "POSTPONED";
};

function ParallaxCard({
  title,
  description,
  image,
  heightClass,
  delay = 0,
  slug,
  category,
  teamSize,
  status,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const springConfig = { stiffness: 400, damping: 30 };
  const springX = useSpring(mx, springConfig);
  const springY = useSpring(my, springConfig);
  
  const rotateX = useTransform(springY, [0, 1], [15, -15]);
  const rotateY = useTransform(springX, [0, 1], [-15, 15]);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    mx.set(x / rect.width);
    my.set(y / rect.height);
    setMousePosition({ x, y });
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    mx.set(0.5);
    my.set(0.5);
  };

  const handleCardClick = () => {
    playSciFiClick();
  };

  return (
    <Link
      href={`/events/${slug}`}
      className="block w-full perspective-[1500px]"
      onClick={handleCardClick}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 150, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          duration: 1.2,
          delay: delay * 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative w-full overflow-hidden group rounded-xl border border-white/5 ${heightClass} shadow-[0_0_30px_rgba(0,0,0,0.8)] will-change-transform`}
      >
        {/* Glow Element */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 mix-blend-screen transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.18), transparent 40%)`,
          }}
        />

        <motion.div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1500 group-hover:scale-110"
          style={{
            backgroundImage: `url(${image})`,
            filter: "grayscale(80%) contrast(1.1) brightness(0.6)",
            transform: "translateZ(-30px)",
          }}
        />

        <div className="absolute inset-0 z-10 bg-linear-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-black" />

        <div
          className="absolute bottom-0 left-0 right-0 z-20 p-8 md:p-10 flex flex-col items-start transition-all duration-500 group-hover:-translate-y-4"
          style={{ transform: "translateZ(40px)" }}
        >
          <h2 className="text-3xl md:text-[2.6rem] font-bold tracking-tight leading-[1.05] mb-4 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            {title}
          </h2>
          {description && (
            <p className="text-gray-300 text-sm md:text-[15px] leading-relaxed max-w-[90%] font-light mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
              {description}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-auto transform-gpu">
            <span className="px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50 font-mono backdrop-blur-md">
              {category}
            </span>
            <span className="px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/50 font-mono backdrop-blur-md">
              {teamSize}
            </span>
            <span
              className={`px-3 py-1.5 rounded-sm border text-[10px] uppercase tracking-wider font-mono backdrop-blur-md ${
                status === "OPEN"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : status === "CLOSED"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : status === "POSTPONED"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-white/5 border-white/10 text-white/30"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        <div
          className="absolute top-8 right-8 z-30 p-4 border border-white/10 bg-black/40 backdrop-blur-md text-white rounded-full opacity-0 -translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-105"
          style={{ transform: "translateZ(50px)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            className="rotate-45 group-hover:rotate-0 transition-transform duration-500"
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </motion.div>
    </Link>
  );
}

export default function EventsPage() {
  const {
    data: competitions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useCompetitions();

  // Filter to show only events with eventType: EVENT or WORKSHOP
  const events = useMemo(
    () =>
      competitions.filter(
        (c) =>
          ["EVENT", "WORKSHOP"].includes(c?.eventType) ||
          ["EVENT", "WORKSHOP"].includes(c?.event_type) ||
          ["EVENT", "WORKSHOP"].includes(c?.type)
      ),
    [competitions]
  );

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
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(
        events
          .map((e) => e?.category)
          .filter((category): category is string => Boolean(category)),
      ),
    );
    return ["All Categories", ...cats];
  }, [events]);

  const statuses = ["All Status", "OPEN", "CLOSED", "POSTPONED", "CANCELLED"];
  const sortOptions = ["Default", "Title (A-Z)", "Title (Z-A)", "Date (Newest)", "Date (Oldest)"];

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e?.title || e?.name || "")
            .toLowerCase()
            .includes(query) ||
          (e?.category || "").toLowerCase().includes(query) ||
          (e?.description && e.description.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== "All Categories") {
      result = result.filter((e) => e?.category === selectedCategory);
    }

    if (selectedStatus !== "All Status") {
      result = result.filter((e) => e?.status === selectedStatus);
    }

    if (sortBy === "Title (A-Z)") {
      result.sort((a, b) =>
        (a?.title || a?.name || "").localeCompare(b?.title || b?.name || "")
      );
    } else if (sortBy === "Title (Z-A)") {
      result.sort((a, b) =>
        (b?.title || b?.name || "").localeCompare(a?.title || a?.name || "")
      );
    } else if (sortBy === "Date (Newest)") {
      result.sort(
        (a, b) =>
          new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()
      );
    } else if (sortBy === "Date (Oldest)") {
      result.sort(
        (a, b) =>
          new Date(a?.date || 0).getTime() - new Date(b?.date || 0).getTime()
      );
    }

    return result;
  }, [searchQuery, selectedCategory, selectedStatus, sortBy, events]);

  const leftColumnEvents = filteredEvents.filter((_, i) => i % 2 === 0);
  const rightColumnEvents = filteredEvents.filter((_, i) => i % 2 !== 0);

  const handleDropdownClick = (type: string) => {
    playSciFiClick();
    setActiveDropdown(activeDropdown === type ? null : type);
  };
  
  const handleDropdownSelect = () => {
    playSciFiClick();
    setActiveDropdown(null);
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-white/20 relative overflow-hidden">
      
      <motion.div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://4kwallpapers.com/images/wallpapers/stars-galaxy-3840x2160-10307.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.35) saturate(1.2)",
          scale: 1.15,
          y: bgY,
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-[#030303]/20 via-[#030303]/60 to-[#030303]" />
      
      <ThreeStarsBackground />

      <div className="fixed top-6 left-6 z-50 pointer-events-auto flex flex-row items-center gap-4">
        <Link href="/" onClick={playSciFiClick}>
          <img 
            src="https://ik.imagekit.io/yatharth/NEUT-LOGO.png" 
            alt="Logo" 
            className="h-12 w-12 opacity-90 transition-transform duration-300 hover:scale-110 drop-shadow-[0_0_15px_rgba(255,200,80,0.4)]"
          />
        </Link>
        <Link 
          href="/?phase=planets"
          onClick={playSciFiClick}
          className="group flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Planets</span>
        </Link>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 pt-36 pb-40">
        <motion.div 
          className="mb-16 md:mb-28 mt-4 md:mt-10 max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <BlurHeading
            text={"Explore the\ncosmic events\nat neutron"}
            className="text-4xl sm:text-5xl md:text-[5.5rem] lg:text-[7rem] font-bold uppercase tracking-[-0.03em] leading-[0.92] drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          />
        </motion.div>

        <div className="relative z-20 mb-20 flex flex-col gap-6" ref={filterRef}>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <motion.div 
              className="relative w-full md:w-[400px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search cosmic signals..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveDropdown(null);
                }}
                onFocus={playSciFiClick}
                className="w-full h-14 bg-black/40 backdrop-blur-md border border-white/10 rounded-sm pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/5 transition-all font-mono text-sm tracking-wide shadow-inner"
              />
            </motion.div>

            <motion.div 
              className="flex flex-row flex-wrap gap-3 w-full md:w-auto overflow-visible py-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                <button
                  onClick={() => handleDropdownClick('category')}
                  className={`h-14 px-6 flex items-center gap-3 rounded-sm border transition-all cursor-pointer font-mono text-[10px] uppercase tracking-widest ${
                    activeDropdown === 'category' || selectedCategory !== "All Categories"
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "bg-black/40 backdrop-blur-md border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Filter size={18} strokeWidth={activeDropdown === 'category' ? 2.5 : 1.5} />
                  <span>{selectedCategory === "All Categories" ? "Category" : selectedCategory}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'category' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute top-full left-0 mt-3 w-64 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 overflow-hidden"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            handleDropdownSelect();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left group ${
                            selectedCategory === cat ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="font-mono text-[10px] uppercase tracking-widest">{cat === "All Categories" ? "All Events" : cat}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => handleDropdownClick('status')}
                  className={`h-14 px-6 flex items-center gap-3 rounded-sm border transition-all cursor-pointer font-mono text-[10px] uppercase tracking-widest ${
                    activeDropdown === 'status' || selectedStatus !== "All Status"
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "bg-black/40 backdrop-blur-md border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <CircleDot size={18} strokeWidth={activeDropdown === 'status' ? 2.5 : 1.5} />
                  <span>{selectedStatus === "All Status" ? "Status" : selectedStatus}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'status' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute top-full left-0 mt-3 w-48 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 overflow-hidden"
                    >
                      {statuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setSelectedStatus(status);
                            handleDropdownSelect();
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all text-left ${
                            selectedStatus === status ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                             status === 'OPEN' ? 'bg-emerald-500 text-emerald-500' : 
                             status === 'CLOSED' ? 'bg-rose-500 text-rose-500' : 
                             status === 'POSTPONED' ? 'bg-amber-500 text-amber-500' : 'bg-white/20 text-white/20'
                          }`} />
                          <span className="font-mono text-[10px] uppercase tracking-widest">{status === "All Status" ? "All Status" : status}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  onClick={() => handleDropdownClick('sort')}
                  className={`h-14 px-6 flex items-center gap-3 rounded-sm border transition-all cursor-pointer font-mono text-[10px] uppercase tracking-widest ${
                    activeDropdown === 'sort' || sortBy !== "Default"
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "bg-black/40 backdrop-blur-md border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <ArrowDownUp size={18} strokeWidth={activeDropdown === 'sort' ? 2.5 : 1.5} />
                  <span>{sortBy === "Default" ? "Sort By" : sortBy}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === 'sort' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'sort' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute top-full right-0 mt-3 w-52 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 p-2 overflow-hidden"
                    >
                      {sortOptions.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setSortBy(opt);
                            handleDropdownSelect();
                          }}
                          className={`w-full px-4 py-3 rounded-sm transition-all text-left font-mono text-[10px] uppercase tracking-widest ${
                            sortBy === opt ? "bg-white/15 text-white" : "text-white/40 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
          
          {filteredEvents.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-20 text-center py-20 border border-dashed border-white/20 rounded-lg bg-black/20 backdrop-blur-md"
            >
              <p className="text-white/40 font-mono uppercase tracking-[0.2em] text-sm">No cosmic signals detected matching your criteria.</p>
              <button 
                onClick={() => {
                  playSciFiClick();
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setSelectedStatus("All Status");
                  setSortBy("Default");
                }}
                className="mt-8 px-6 py-3 hover:scale-105 bg-white text-black hover:bg-gray-200 border border-transparent rounded-full transition-all text-[11px] font-mono font-bold uppercase tracking-widest"
              >
                Recalibrate Sensors
              </button>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 relative z-10 items-start mt-8 md:mt-0">
          <div className="flex flex-col gap-8 lg:gap-12 w-full">
            {leftColumnEvents.map((event, index) => (
              <ParallaxCard
                key={String(event.id || event._id || `event-${index}`)}
                slug={event?.slug || String(event?.id || event?._id || "")}
                title={event?.title || event?.name || "Untitled Event"}
                description={event?.description}
                image={event?.posterPath || ""}
                heightClass={event?.heightClass || "h-[600px]"}
                delay={index}
                category={event?.category || ""}
                teamSize={event?.minTeamSize && event?.maxTeamSize ? `${event.minTeamSize}-${event.maxTeamSize} Members` : ""}
                status={(event?.status || "OPEN").toUpperCase() as "OPEN" | "CLOSED" | "CANCELLED" | "POSTPONED"}
              />
            ))}
          </div>

          <div className="flex flex-col gap-8 lg:gap-12 w-full pt-0 md:pt-40 lg:pt-56">
            {rightColumnEvents.map((event, index) => (
              <ParallaxCard
                key={String(event.id || event._id || `event-${index}`)}
                slug={event?.slug || String(event?.id || event?._id || "")}
                title={event?.title || event?.name || "Untitled Event"}
                description={event?.description}
                image={event?.image || ""}
                heightClass={event?.heightClass || "h-[600px]"}
                delay={index}
                category={event?.category || ""}
                teamSize={event?.minTeamSize && event?.maxTeamSize ? `${event.minTeamSize}-${event.maxTeamSize} Members` : ""}
                status={(event?.status || "OPEN").toUpperCase() as "OPEN" | "CLOSED" | "CANCELLED" | "POSTPONED"}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
