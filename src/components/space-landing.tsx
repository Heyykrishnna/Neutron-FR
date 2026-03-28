"use client";

import Image from "next/image";
import type { MutableRefObject } from "react";
import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { AnimatePresence, MotionConfig, motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRouter, useSearchParams } from "next/navigation";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { PLANET_RECORDS } from "@/lib/planet-data";
import NebulaStar from "./nebula-star";
import Noise from "./Noise";
import Grainient from "./Grainient";
import MobileLanding from "./MobileLanding";
import MobileNavbar from "./MobileNavbar";


type PlanetRuntimeEntry = {
  slug: string;
  pivot: THREE.Group;
  root: THREE.Group;
  target: THREE.Object3D;
  basePosition: THREE.Vector3;
  scale: number;
};

type PlanetScreenPos = {
  slug: string;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
  starX: number;
  starY: number;
  starVisible: boolean;
};

type ScenePhase = "landing" | "warping" | "planets";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const amount = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function normalizeModel(object: THREE.Object3D, targetSize: number) {
  const size   = new THREE.Vector3();
  const center = new THREE.Vector3();
  const box    = new THREE.Box3().setFromObject(object);
  box.getSize(size);
  object.scale.multiplyScalar(targetSize / Math.max(size.x, size.y, size.z, 0.001));
  box.setFromObject(object);
  box.getCenter(center);
  object.position.x -= center.x;
  object.position.y -= center.y;
  object.position.z -= center.z;
  box.setFromObject(object);
  object.position.y -= box.min.y;
  return object;
}

function createStarField(count: number, radius: number, size: number, color: string) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s     = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const d     = radius * (0.35 + Math.random() * 0.65);
    positions[s]     = d * Math.sin(phi) * Math.cos(theta);
    positions[s + 1] = d * Math.cos(phi) * 0.55;
    positions[s + 2] = d * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

const SCROLL_KEY = "neutron_orbit_scroll";
function saveScrollY()  { try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch {} }
function popSavedScrollY(): number | null {
  try {
    const v = sessionStorage.getItem(SCROLL_KEY);
    if (v !== null) { sessionStorage.removeItem(SCROLL_KEY); return Number(v); }
  } catch {}
  return null;
}

export default function SpaceLanding() {
  const router = useRouter();

  const canvasRef       = useRef<HTMLCanvasElement | null>(null);
  const progressRef     = useRef(0);
  const activePlanetRef = useRef(PLANET_RECORDS[0].slug);
  const navigatingRef   = useRef(false);
  const routeTimeoutRef = useRef<number | null>(null);

  const searchParams = useSearchParams();
  const initPhase = searchParams?.get("phase");

  const [scenePhase, setScenePhase] = useState<ScenePhase>(initPhase === "planets" ? "planets" : "landing");
  const [planetsReady, setPlanetsReady] = useState(initPhase === "planets");
  const [activePlanet, setActivePlanet]       = useState(PLANET_RECORDS[0].slug);
  const [runtimeState, setRuntimeState]       = useState<"loading" | "ready" | "error">("loading");
  const [navigatingPlanet, setNavigatingPlanet] = useState<string | null>(null);
  const [planetPositions, setPlanetPositions] = useState<PlanetScreenPos[]>([]);
  const [hoveredPlanet, setHoveredPlanet]     = useState<string | null>(null);
  const [isMobile, setIsMobile]               = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isEntering, setIsEntering]           = useState(false);
  const [flashOverlay, setFlashOverlay]       = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const bgXSpring = useSpring(mouseX, { stiffness: 38, damping: 20, mass: 1.4 });
  const bgYSpring = useSpring(mouseY, { stiffness: 38, damping: 20, mass: 1.4 });
  const bgX = useTransform(bgXSpring, [0, 1], ["0%", "100%"]);
  const bgY = useTransform(bgYSpring, [0, 1], ["0%", "100%"]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    },
    [mouseX, mouseY]
  );
  const onMouseLeave = useCallback(() => { mouseX.set(0.5); mouseY.set(0.5); }, [mouseX, mouseY]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const currentPlanet = PLANET_RECORDS.find((p) => p.slug === activePlanet) ?? PLANET_RECORDS[0];

  const syncActivePlanet = useEffectEvent((slug: string) => {
    activePlanetRef.current = slug;
    setActivePlanet((cur) => (cur === slug ? cur : slug));
  });

  const handlePlanetSelect = useEffectEvent((slug: string) => {
    if (navigatingRef.current) return;
    syncActivePlanet(slug);
    navigatingRef.current = true;
    setNavigatingPlanet(slug);
    saveScrollY();
    routeTimeoutRef.current = window.setTimeout(() => {
      startTransition(() => { router.push(`/planets/${slug}`); });
    }, 420);
  });

  useEffect(() => {
    const saved = popSavedScrollY();
    if (saved !== null && saved > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: "instant" }));
    }
  }, []);

  useEffect(() => {
    for (const planet of PLANET_RECORDS) router.prefetch(`/planets/${planet.slug}`);
  }, [router]);

  const handleBlackHoleClick = useCallback(() => {
    if (scenePhase !== "landing" || isEntering) return;
    setIsEntering(true);
    
    setTimeout(() => {
      setFlashOverlay(true);
    }, 1200);

    setTimeout(() => {
      setScenePhase("planets");
      setPlanetsReady(true);
      setIsEntering(false); 
    }, 1600);

    setTimeout(() => {
      setFlashOverlay(false);
    }, 2200);
  }, [scenePhase, isEntering]);

  useEffect(() => {
    if (scenePhase !== "planets") return;
    if (!canvasRef.current) return;

    let disposed = false;
    let cleanup  = () => {};

    (async () => {
      try {
        const sceneCleanup = await createScene({
          canvas:           canvasRef.current!,
          progressRef,
          activePlanetRef,
          onPlanetHover:    (slug) => setHoveredPlanet(slug || null),
          onPlanetClick:    handlePlanetSelect,
          onReady:          () => setRuntimeState("ready"),
          onScreenPositions:(positions) => setPlanetPositions([...positions]),
        });
        if (disposed) { sceneCleanup(); return; }
        cleanup = sceneCleanup;
      } catch (err) {
        console.error(err);
        if (!disposed) setRuntimeState("error");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
      if (routeTimeoutRef.current) window.clearTimeout(routeTimeoutRef.current);
    };
  }, [scenePhase]);

  useEffect(() => {
    if (scenePhase !== "planets") return;
    const sceneProgress = { value: 0 };
    let lastPlanet = PLANET_RECORDS[0].slug;

    const tick = gsap.ticker.add(() => {});
    const ctx  = gsap.context(() => {
      gsap.to(sceneProgress, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start:  "top top",
          end:    "bottom bottom",
          scrub:  true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = sceneProgress.value || self.progress;
            progressRef.current = progress;
            if (navigatingRef.current) return;

            const scrollMax   = (document.documentElement.scrollHeight - window.innerHeight) || 1;
            const scrolledPx  = progress * scrollMax;
            const vh          = window.innerHeight || 800;
            const scrolledVH  = (scrolledPx / vh) * 100;

            const N             = PLANET_RECORDS.length;
            const cycleProgress = Math.max(0, scrolledVH) / 380;
            const rawIndex      = Math.floor(cycleProgress * N + 0.5);
            const activeIndex   = rawIndex % N;
            const next          = PLANET_RECORDS[activeIndex]?.slug ?? PLANET_RECORDS[0].slug;
            if (next !== lastPlanet) { lastPlanet = next; syncActivePlanet(next); }
          },
        },
      });
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
    };
  }, [scenePhase]);


  const [activePlanetLabel] = useState(PLANET_RECORDS[0].name);

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 240, damping: 28 }}>
      <div
          className="relative overflow-x-clip"
        style={{ minHeight: scenePhase === "planets" ? "50000svh" : "100svh" }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <style>{`
          @keyframes drift-stars    { from{transform:translate(0,0)} to{transform:translate(-22px,-18px)} }
          @keyframes pulse-cloud    { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.06) translateY(-8px)} }
          @keyframes grain-shift    { 0%{transform:translate(0,0)} 20%{transform:translate(-3%,-4%)} 40%{transform:translate(2%,3%)} 60%{transform:translate(-2%,2%)} 80%{transform:translate(3%,-3%)} 100%{transform:translate(0,0)} }
          @keyframes spin-loader    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes star-glow-pulse{ 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.18)} }
          @keyframes star-link-a    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,-5px)} }
          @keyframes star-link-b    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-4px,4px)} }
          @keyframes star-link-c    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(5px,3px)} }
          @keyframes star-link-d    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-3px,-5px)} }
          @keyframes star-link-e    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4px,5px)} }
          @keyframes corner-glow    { 0%,100%{opacity:0.45} 50%{opacity:0.9} }
          @keyframes bh-pulse       { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.12);opacity:0.7} }
          @keyframes bh-fadeflicker { 0%,100%{opacity:0.55} 50%{opacity:1} }
          @keyframes hero-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        `}</style>

        {isMobile && (
          <div className="fixed inset-0 z-100 h-screen w-full pointer-events-auto">
            <MobileLanding isMenuOpen={isMobileMenuOpen} onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
            <MobileNavbar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        <AnimatePresence>
          {scenePhase !== "planets" && (
            <motion.div
              key="landing-background"
              className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                scale: isEntering ? 5 : 1, 
                opacity: 1 
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: isEntering ? 1.6 : 1.2,
                ease: isEntering ? [0.6, 0.05, 0.9, 0.2] : "easeInOut", 
              }}
              style={{ transformOrigin: "50% 50%" }}
            >
              <div 
                className="absolute inset-0 z-0 bg-black"
              >
                <video
                  ref={(el) => { if (el) el.playbackRate = 0.4; }}
                  src="https://res.cloudinary.com/dpod2sj9t/video/upload/v1774639307/Black_Hole_4K_Video_2160P_z5dhla.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ 
                    backgroundSize: "200%",
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    filter: "brightness(0.60) saturate(0.80) sepia(0.30) blur(1px)",
                  }}
                />
              </div>

              <motion.div
                aria-hidden
                className="absolute inset-0 z-10"
                style={{
                  backgroundImage: "url('/Landing/image (2).png')",
                  backgroundSize: "180%", 
                  backgroundRepeat: "no-repeat",
                  backgroundPositionX: bgX,
                  backgroundPositionY: bgY,
                  filter: "brightness(0.60) saturate(0.80) sepia(0.30)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-1"
          style={{
            background: [
              "radial-gradient(ellipse 80% 70% at 50% 38%, transparent 38%, rgba(0,0,0,0.72) 72%, rgba(0,0,0,0.96) 100%)",
              "linear-gradient(180deg, rgba(0,0,0,0.58) 0%, transparent 18%, transparent 75%, rgba(0,0,0,0.88) 100%)",
              "linear-gradient(90deg, rgba(0,0,0,0.52) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.52) 100%)",
            ].join(","),
          }}
        />

        <div className="fixed inset-0 z-1 pointer-events-none opacity-[0.12]">
          <Grainient color1="#3e2723" color2="#5d4037" color3="#0d0a08" timeSpeed={0.2} warpStrength={0.6} zoom={1.2} className="w-full h-full" />
        </div>

        <div aria-hidden className="pointer-events-none fixed inset-0 z-1 overflow-hidden">
          <div className="absolute inset-[-25%] opacity-[0.28]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,220,160,0.9) 0.7px,transparent 1.1px),radial-gradient(circle,rgba(255,200,120,0.7) 0.55px,transparent 0.9px)", backgroundPosition: "0 0,55px 72px", backgroundSize: "110px 110px,140px 140px", animation: "drift-stars 22s linear infinite" }}
          />
          <div className="absolute inset-[-25%] opacity-[0.18]"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,180,80,0.75) 0.8px,transparent 1.2px),radial-gradient(circle,rgba(220,160,60,0.5) 0.6px,transparent 1px)", backgroundPosition: "28px 36px,88px 104px", backgroundSize: "160px 160px,210px 210px", animation: "drift-stars 30s -4s linear infinite reverse" }}
          />
          <div className="absolute rounded-full"
            style={{ left: "-14vw", top: "20vh", height: "42vw", width: "42vw", background: "radial-gradient(circle,rgba(180,80,10,0.14),transparent 70%)", animation: "pulse-cloud 16s ease-in-out infinite" }}
          />
          <div className="absolute rounded-full"
            style={{ right: "-12vw", top: "48vh", height: "36vw", width: "36vw", background: "radial-gradient(circle,rgba(120,50,5,0.12),transparent 70%)", animation: "pulse-cloud 16s -7s ease-in-out infinite" }}
          />
        </div>

        <Noise patternAlpha={12} patternRefreshInterval={2} />

        <AnimatePresence>
          {scenePhase === "landing" && (
            <motion.div
              key="landing"
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: isEntering ? 0 : 1,
                scale: 1 
              }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: isEntering ? 0.6 : 0.5, ease: "easeIn" }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-[12%] flex flex-col items-center gap-3 px-4 select-none"
                style={{ zIndex: 12 }}
              >
                <motion.p
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.9 }}
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.45em",
                    fontSize: "clamp(0.6rem, 1.1vw, 0.85rem)",
                    color: "rgba(255,190,80,0.72)",
                    textTransform: "uppercase",
                  }}
                >
                  N E U T R O N &nbsp; 3 . 0
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 1.0 }}
                  style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(2.4rem, 6vw, 5.5rem)",
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.08,
                    textShadow: "0 0 80px rgba(255,140,20,0.35), 0 0 200px rgba(255,80,0,0.18)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Enter the&nbsp;
                  <span style={{ color: "#ffb84d", textShadow: "0 0 60px rgba(255,140,20,0.6)" }}>
                    Cosmos
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.9 }}
                  style={{
                    fontSize: "clamp(0.82rem, 1.3vw, 1.05rem)",
                    color: "rgba(255,220,160,0.55)",
                    textAlign: "center",
                    maxWidth: 480,
                    lineHeight: 1.6,
                  }}
                >
                  The annual techno-cultural fest of NST — click the singularity to begin
                </motion.p>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "clamp(180px, 35vmin, 400px)", 
                  height: "clamp(180px, 35vmin, 400px)",
                  zIndex: 15,
                  cursor: "pointer",
                  borderRadius: "50%",
                  pointerEvents: "auto",
                }}
                onClick={handleBlackHoleClick}
                title="Click to enter the Cosmos"
              />

              <div className="pointer-events-none absolute inset-0" style={{ zIndex: 12 }}>
                {[
                  { style: { top: 18, left: 18 }, borderStyle: "border-t border-l" },
                  { style: { top: 18, right: 18 }, borderStyle: "border-t border-r" },
                  { style: { bottom: 18, left: 18 }, borderStyle: "border-b border-l" },
                  { style: { bottom: 18, right: 18 }, borderStyle: "border-b border-r" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`absolute w-8 h-8 ${c.borderStyle}`}
                    style={{ ...c.style, borderColor: "rgba(255,160,40,0.35)", animation: `corner-glow 4s ${i * 0.8}s ease-in-out infinite` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scenePhase === "planets" && (
            <motion.div
              key="planets-bg"
              className="pointer-events-none fixed inset-0 z-[-5]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              style={{
                backgroundImage: "url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774685137/BG_l4fb9q.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "brightness(0.5) contrast(1.4)",
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {scenePhase === "planets" && (
            <motion.div
              key="planets-ui"
              className="pointer-events-none fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <motion.button
                className="pointer-events-auto fixed top-20 right-6 z-20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "instant" });
                  progressRef.current = 0;
                  setScenePhase("landing");
                  setRuntimeState("loading");
                  setPlanetPositions([]);
                }}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,180,80,0.7)",
                  background: "rgba(0,0,0,0.55)",
                  border: "1px solid rgba(255,160,40,0.25)",
                  backdropFilter: "blur(10px)",
                  padding: "0.45rem 0.9rem",
                  cursor: "pointer",
                  clipPath: "polygon(4px 0%,calc(100% - 4px) 0%,100% 4px,100% calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,0% calc(100% - 4px),0% 4px)",
                }}
              >
                ← Exit
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <a href="/" className="fixed top-6 left-6 z-50 transition-transform duration-300 hover:scale-110" aria-label="Neutron Home">
          <Image
            src="/neutron.png"
            alt="Neutron Logo"
            width={48}
            height={48}
            className="object-contain"
            style={{ filter: "drop-shadow(0 0 14px rgba(220,140,30,0.55)) drop-shadow(0 0 4px rgba(255,200,80,0.3))" }}
            priority
          />
        </a>

        <AnimatePresence>
          {navigatingPlanet && (
            <motion.div
              key={navigatingPlanet}
              className="fixed inset-0 z-40"
              style={{ background: "radial-gradient(circle at center,rgba(180,90,10,0.14),transparent 22%),linear-gradient(180deg,rgba(8,3,0,0.18),rgba(8,3,0,0.96))" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </AnimatePresence>

        <canvas
          ref={canvasRef}
          className="fixed inset-0 h-full w-full touch-none"
          aria-hidden="true"
          style={{
            zIndex: 10,
            opacity: scenePhase === "planets" ? 1 : 0,
            transition: "opacity 0.6s ease",
            pointerEvents: scenePhase === "planets" ? "auto" : "none",
          }}
        />

        {scenePhase === "planets" && runtimeState === "ready" && planetPositions.map((pos) => {
          if (!pos.visible) return null;
          const pd        = PLANET_RECORDS.find((p) => p.slug === pos.slug);
          if (!pd) return null;
          const isActive  = activePlanet === pos.slug;

          return (
            <motion.div
              key={pos.slug}
              style={{ position: "fixed", left: pos.x, top: pos.y, transform: "translate(-50%,0)", zIndex: 15, pointerEvents: "auto", cursor: "pointer", userSelect: "none" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: pos.visible ? (isActive ? 1 : 0.62) : 0, y: 0, scale: isActive ? 1.03 : 1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handlePlanetSelect(pos.slug)}
            >
              <div
                className="flex flex-col items-center gap-[0.42rem] px-[0.9rem] py-[0.55rem] whitespace-nowrap"
                style={{
                  border: isActive ? "1px solid rgba(255,255,255,0.45)" : "1px solid rgba(255,255,255,0.12)",
                  background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  clipPath: "polygon(6px 0%,calc(100% - 6px) 0%,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0% calc(100% - 6px),0% 6px)",
                  boxShadow: isActive ? "0 10px 44px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.08)" : "0 8px 32px rgba(0,0,0,0.42),inset 0 1px 0 rgba(255,255,255,0.04)",
                  transition: "background 240ms ease,border-color 240ms ease,box-shadow 240ms ease",
                }}
              >
                <div className="text-[0.78rem] font-bold uppercase tracking-[0.22em] leading-none" style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {pd.name}
                </div>
              </div>
            </motion.div>
          );
        })}

        {scenePhase === "planets" && (
          <motion.div
            className="pointer-events-auto fixed inset-x-0 bottom-6 z-20 flex justify-center px-4 md:bottom-8"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <motion.div
              layout
              className="flex items-center gap-[0.7rem] px-4 py-3"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                clipPath: "polygon(8px 0%,calc(100% - 8px) 0%,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0% calc(100% - 8px),0% 8px)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              {PLANET_RECORDS.map((planet) => {
                const isActive = activePlanet === planet.slug;
                return (
                  <motion.button
                    key={planet.slug}
                    layout
                    title={planet.name}
                    aria-label={`Go to ${planet.name}`}
                    className="relative h-[0.6rem] cursor-pointer group"
                    style={{ border: "none", padding: 0, background: "transparent" }}
                    animate={{ width: isActive ? 48 : 10, opacity: isActive ? 1 : 0.42, backgroundColor: isActive ? "#ffffff" : "rgba(255,255,255,0.2)" }}
                    whileHover={{ opacity: 1, backgroundColor: "#ffffff" }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    onClick={() => handlePlanetSelect(planet.slug)}
                  >
                    <span
                      className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.2em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      style={{ background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", backdropFilter: "blur(10px)", fontFamily: "monospace", clipPath: "polygon(4px 0%,calc(100% - 4px) 0%,100% 4px,100% 100%,0% 100%,0% 4px)" }}
                    >
                      {planet.name}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {scenePhase === "planets" && runtimeState !== "ready" && (
            <motion.div
              key={runtimeState}
              className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative grid place-items-center h-18 w-18"
                animate={{ scale: runtimeState === "loading" ? [0.94, 1, 0.94] : 1 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(180,100,20,0.22)", borderTopColor: runtimeState === "error" ? "rgba(255,100,60,0.95)" : "rgba(255,180,60,0.9)", borderRightColor: runtimeState === "error" ? "rgba(255,140,60,0.9)" : "rgba(200,120,30,0.8)", boxShadow: "0 0 35px rgba(220,140,40,0.22)", animation: "spin-loader 1.1s linear infinite" }} />
                <span className="absolute h-[0.95rem] w-[0.95rem] rounded-full" style={{ background: "radial-gradient(circle,#fffbe8 0%,#f0c060 55%,#c06010 100%)", boxShadow: "0 0 28px rgba(220,160,40,0.7)" }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {scenePhase === "planets" && (
          <div className="pointer-events-none fixed inset-0 z-25 transition-opacity duration-1000" style={{ opacity: 1 }}>
            {[
              { label: "Terms",   href: "/terms",   drift: "star-link-a 9s ease-in-out infinite",  delay: "0s"   },
              { label: "Privacy", href: "/privacy", drift: "star-link-b 11s ease-in-out infinite", delay: "1.4s" },
              { label: "Contact", href: "/contact", drift: "star-link-c 13s ease-in-out infinite", delay: "0.6s" },
              { label: "About",   href: "/about",   drift: "star-link-d 10s ease-in-out infinite", delay: "2s"   },
              { label: "FAQ",     href: "/faq",     drift: "star-link-e 12s ease-in-out infinite", delay: "0.9s" },
            ].map(({ label, href, drift, delay }, index) => {
              const pos = planetPositions[index];
              if (!pos) return null;
              return (
                <div
                  key={label}
                  className="fixed z-25 transition-opacity duration-500"
                  style={{ left: pos.starX, top: pos.starY, opacity: pos.starVisible ? 1 : 0, pointerEvents: pos.starVisible ? "auto" : "none", transform: "translate(-50%, -50%)" }}
                >
                  <NebulaStar label={label} href={href} drift={drift} delay={delay} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Scroll container (planets phase only) ─────────────────── */}
        {scenePhase === "planets" && (
          <div className="relative z-20 pointer-events-none h-[50000svh]" aria-hidden="true" />
        )}

        {/* ── Action Lines during Zoom ─────────────────────────── */}
        <AnimatePresence>
          {isEntering && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-50 mix-blend-screen"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.65, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeIn" }}
              style={{
                backgroundImage: "url('https://www.pngmart.com/files/23/Anime-Lines-PNG-Pic.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "invert(1)", // Turn black manga lines into bright white warp beams
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {flashOverlay && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-200 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

async function createScene({
  canvas,
  progressRef,
  activePlanetRef,
  onPlanetHover,
  onPlanetClick,
  onReady,
  onScreenPositions,
}: {
  canvas: HTMLCanvasElement;
  progressRef: MutableRefObject<number>;
  activePlanetRef: MutableRefObject<string>;
  onPlanetHover: (slug: string) => void;
  onPlanetClick: (slug: string) => void;
  onReady: () => void;
  onScreenPositions: (positions: PlanetScreenPos[]) => void;
}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#0a0400", 0.022);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 160);
  camera.position.set(0, 0.8, 15.5);

  const ambientLight = new THREE.AmbientLight("#ffffff", 3.0);
  scene.add(ambientLight);

  const starsNear = createStarField(1100, 72, 0.034, "#ffe0a0");
  const starsMid  = createStarField(720,  90, 0.024, "#ffcc80");
  const starsFar  = createStarField(480, 110, 0.018, "#e0b060");
  const starsWarm = createStarField(360, 100, 0.020, "#fff0c0");
  (starsMid.material  as THREE.PointsMaterial).opacity = 0.32;
  (starsFar.material  as THREE.PointsMaterial).opacity = 0.20;
  (starsWarm.material as THREE.PointsMaterial).opacity = 0.22;
  scene.add(starsFar, starsMid, starsNear, starsWarm);

  const planetsRig = new THREE.Group();
  scene.add(planetsRig);

  const gltfLoader = new GLTFLoader();
  const objLoader  = new OBJLoader();
  const texLoader  = new THREE.TextureLoader();

  const textures:           THREE.Texture[]     = [];
  const interactiveTargets: THREE.Object3D[]    = [];
  const planetEntries:      PlanetRuntimeEntry[] = [];
  const raycaster = new THREE.Raycaster();
  const pointer   = new THREE.Vector2();
  const hoveredSlugRef = { current: "" };

  const selectedWorldPosition = new THREE.Vector3();
  const targetCameraPosition  = new THREE.Vector3();
  const targetLookAt          = new THREE.Vector3();
  const cameraLookAt          = new THREE.Vector3(0, 0, 0);
  const cameraOffset          = new THREE.Vector3();
  const exitOffset            = new THREE.Vector3();

  const starGeometries = [starsNear.geometry, starsMid.geometry, starsFar.geometry, starsWarm.geometry];
  const starMaterials  = [starsNear.material as THREE.Material, starsMid.material as THREE.Material, starsFar.material as THREE.Material, starsWarm.material as THREE.Material];

  const loadGLTF = (url: string) => new Promise<any>((res, rej) => gltfLoader.load(url, res, undefined, rej));
  const loadOBJ  = (url: string) => new Promise<any>((res, rej) => objLoader.load(url, res, undefined, rej));

  const addPlanet = async (index: number) => {
    const planet = PLANET_RECORDS[index];
    const root   = new THREE.Group();
    const pivot  = new THREE.Group();
    let   target: THREE.Object3D;

    if (planet.kind === "glb") {
      const gltf = await loadGLTF(planet.model);
      target = normalizeModel(gltf.scene, planet.size);
      target.rotation.y = planet.rotationOffset ?? 0;
    } else {
      const obj     = await loadOBJ(planet.model);
      const texture = texLoader.load(planet.texture ?? "");
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      obj.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) mesh.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1.0, metalness: 0 });
      });
      target = normalizeModel(obj, planet.size);
    }

    target.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) { mesh.userData.planetSlug = planet.slug; interactiveTargets.push(mesh); }
    });

    root.add(target);
    pivot.add(root);
    planetsRig.add(pivot);
    planetEntries.push({ slug: planet.slug, pivot, root, target, basePosition: new THREE.Vector3(), scale: 0.001 });
  };

  await Promise.all(PLANET_RECORDS.map((_, i) => addPlanet(i)));
  planetEntries.sort((a, b) =>
    PLANET_RECORDS.findIndex((p) => p.slug === a.slug) - PLANET_RECORDS.findIndex((p) => p.slug === b.slug),
  );

  const applyLayout = () => {
    const mobile = window.innerWidth < 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, mobile ? 0.45 : 0.8, mobile ? 16.8 : 15.5);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  const findPlanetAtPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x  =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    pointer.y  = -((clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(interactiveTargets, true)[0]?.object?.userData?.planetSlug ?? "";
  };

  const handlePointerMove  = (e: PointerEvent) => { const slug = findPlanetAtPointer(e.clientX, e.clientY); hoveredSlugRef.current = slug; canvas.style.cursor = slug ? "pointer" : "default"; };
  const handlePointerLeave = () => { hoveredSlugRef.current = ""; canvas.style.cursor = "default"; };
  const handlePointerDown  = (e: PointerEvent) => { const slug = findPlanetAtPointer(e.clientX, e.clientY); if (slug) onPlanetClick(slug); };

  window.addEventListener("resize", applyLayout);
  canvas.addEventListener("pointermove",  handlePointerMove);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("pointerdown",  handlePointerDown);
  applyLayout();
  onReady();

  const worldToScreen = (pos: THREE.Vector3) => {
    const p = pos.clone().project(camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
  };

  const clock = new THREE.Timer();
  let animationFrame = 0;
  let frameCount     = 0;

  const render = () => {
    const delta   = clock.getDelta();
    const elapsed = clock.getElapsed();

    const scrollMax  = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const scrolledPx = progressRef.current * scrollMax;
    const vh         = window.innerHeight || 800;
    const scrolledVH = (scrolledPx / vh) * 100;

    const intro  = 1;
    const spread = 1;
    const focus  = 1;
    const exit   = 0;

    const mob = window.innerWidth < 768;
    const ringRadiusX = mob ? 8.0 : 10.0;
    const ringRadiusZ = mob ? 8.0 : 10.0;
    const ringCenterZ = mob ? -6  : -5;

    planetsRig.rotation.y += delta * 0.026;
    planetsRig.rotation.x  = Math.sin(elapsed * 0.085) * 0.016;
    planetsRig.rotation.z  = Math.cos(elapsed * 0.065) * 0.007;

    const N = PLANET_RECORDS.length;
    const cycleProgress    = Math.max(0, scrolledVH) / 380;
    const globalAngleOffset = cycleProgress * (Math.PI * 2);

    const frontTargetX       = 0;
    const frontTargetY       = mob ? -1.2 : -1.8;
    const frontTargetZ       = ringCenterZ + ringRadiusZ;
    const idealFrontPosition = new THREE.Vector3(frontTargetX, frontTargetY, frontTargetZ);

    planetEntries.forEach((entry, index) => {
      const planet      = PLANET_RECORDS[index];
      const revealIn    = 1;
      const visibility  = 1;

      let currentAngle = (index * (Math.PI * 2) / N) - globalAngleOffset;
      if (currentAngle >  Math.PI) currentAngle -= Math.PI * 2;
      if (currentAngle < -Math.PI) currentAngle += Math.PI * 2;

      const targetX = Math.sin(currentAngle) * ringRadiusX;
      const targetZ = ringCenterZ + Math.cos(currentAngle) * ringRadiusZ;
      const targetY = frontTargetY + (1 - Math.cos(currentAngle)) * (mob ? 2.5 : 4.4);

      const angleScale = Math.max(0, Math.cos(currentAngle));
      const frontBoost = Math.pow(angleScale, 5.0);
      const emphasis   = 1.0 + frontBoost * (mob ? 1.4 : 1.8);
      const exitDrift  = exit * (index % 2 === 0 ? -2.4 : 2.4);

      entry.basePosition.set(targetX, targetY, targetZ);
      entry.pivot.position.x = THREE.MathUtils.lerp(entry.basePosition.x * 0.08, entry.basePosition.x, spread);
      entry.pivot.position.y = THREE.MathUtils.lerp(
        entry.basePosition.y - 5.4 - index * 0.25,
        entry.basePosition.y + Math.sin(elapsed * 0.66 + index * 1.28) * 0.13 + Math.sin(elapsed * 0.38 + index * 0.72) * 0.048 + Math.cos(elapsed * 0.22 + index * 1.05) * 0.022,
        revealIn
      );
      entry.pivot.position.z = THREE.MathUtils.lerp(10 + index * 0.6, entry.basePosition.z + Math.sin(elapsed * 0.35 + index) * 0.09, visibility);
      entry.pivot.rotation.y += delta * (0.60 + index * 0.025);
      entry.pivot.rotation.x  = Math.sin(elapsed * 0.22 + index * 0.88) * 0.038 + Math.cos(elapsed * 0.14 + index * 0.55) * 0.015;
      entry.target.rotation.y += delta * (0.18 + index * 0.018);
      entry.target.rotation.x  = Math.sin(elapsed * 0.09 + index * 0.72) * 0.06;
      entry.root.position.y    = Math.sin(elapsed * 0.62 + index * 1.28) * 0.085 + Math.cos(elapsed * 0.31 + index * 0.78) * 0.030;
      entry.root.position.x    = Math.sin(elapsed * 0.25 + index * 1.08) * 0.032;
      entry.scale              = THREE.MathUtils.lerp(entry.scale, visibility * emphasis, 0.068);
      entry.root.scale.setScalar(Math.max(entry.scale, 0.001));
    });

    cameraOffset.set(0, mob ? 3.8 : 5.2, mob ? 8.5 : 11.0);
    const focusLookAt = new THREE.Vector3(0, mob ? 0.0 : 0.5, ringCenterZ);

    const startZ = mob ? 16.8 : 16.0;
    const endZ   = mob ? 3.2  : 2.5;
    const startY = mob ? 0.40 : 0.70;
    const endY   = mob ? 0.20 : 0.30;

    targetCameraPosition.set(0, THREE.MathUtils.lerp(startY, endY, intro), THREE.MathUtils.lerp(startZ, endZ, intro));
    targetLookAt.set(0, THREE.MathUtils.lerp(0.1, -0.3, intro), THREE.MathUtils.lerp(-1.5, -5.0, intro));
    camera.fov = THREE.MathUtils.lerp(40, 52, intro * (1 - spread));
    camera.updateProjectionMatrix();
    if (scene.fog instanceof THREE.FogExp2) {
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(0.022, 0.010, intro * (1 - spread));
    }

    targetCameraPosition.lerp(new THREE.Vector3(0, mob ? 3.0 : 4.8, mob ? 18.2 : 20.5), spread);
    targetLookAt.lerp(new THREE.Vector3(0, 0.2, ringCenterZ), spread);
    targetCameraPosition.lerp(idealFrontPosition.clone().add(cameraOffset), focus);
    targetLookAt.lerp(focusLookAt, focus);

    exitOffset.set(mob ? 1.4 : 2.1, 2.4, 5.8);
    targetCameraPosition.lerp(idealFrontPosition.clone().add(exitOffset), exit);
    targetLookAt.lerp(idealFrontPosition.clone().add(new THREE.Vector3(0.2, 0.1, 0)), exit);
    camera.position.lerp(targetCameraPosition, 0.065);
    cameraLookAt.lerp(targetLookAt, 0.078);
    camera.lookAt(cameraLookAt);

    starsNear.rotation.y +=  delta * 0.0065;
    starsMid.rotation.y  -=  delta * 0.0038;
    starsFar.rotation.y  +=  delta * 0.002;
    starsWarm.rotation.y -=  delta * 0.003;
    starsNear.rotation.x  = Math.sin(elapsed * 0.06) * 0.02;
    starsFar.rotation.x   = Math.cos(elapsed * 0.045) * 0.014;

    renderer.render(scene, camera);

    frameCount++;
    if (frameCount % 2 === 0) {
      const screenPositions: PlanetScreenPos[] = planetEntries.map((entry, index) => {
        const worldPos = new THREE.Vector3();
        entry.pivot.getWorldPosition(worldPos);
        const labelPos = worldPos.clone();
        labelPos.y -= entry.scale * 0.45;
        const screen = worldToScreen(labelPos);
        const behind = worldPos.clone().project(camera).z > 1;

        let occluded = false;
        if (!behind) {
          const dir  = labelPos.clone().sub(camera.position).normalize();
          raycaster.set(camera.position, dir);
          const hits    = raycaster.intersectObjects(interactiveTargets, true);
          const blocker = hits.find(h => h.object.userData?.planetSlug !== entry.slug);
          if (blocker && blocker.distance < camera.position.distanceTo(labelPos) - 0.5) occluded = true;
        }

        const starWorldPos = worldPos.clone().add(
          new THREE.Vector3(index % 2 === 0 ? 5.8 : -5.8, index % 3 === 0 ? 3.5 : -4.2, index % 2 === 0 ? -3.0 : 3.0)
            .multiplyScalar(Math.max(entry.scale, 0.4))
        );
        const starScreen  = worldToScreen(starWorldPos);
        const starBehind  = starWorldPos.clone().project(camera).z > 1;

        let starOccluded = false;
        if (!starBehind) {
          const dir  = starWorldPos.clone().sub(camera.position).normalize();
          raycaster.set(camera.position, dir);
          const hits    = raycaster.intersectObjects(interactiveTargets, true);
          const blocker = hits.find(h => h.object.userData?.planetSlug !== entry.slug);
          if (blocker && blocker.distance < camera.position.distanceTo(starWorldPos) - 0.5) starOccluded = true;
        }

        return {
          slug: entry.slug,
          x: screen.x,
          y: screen.y + entry.scale * 36,
          visible: !behind && !occluded && entry.scale > 0.14 && spread > 0.28,
          scale: entry.scale,
          starX: starScreen.x,
          starY: starScreen.y,
          starVisible: !starBehind && !starOccluded && entry.scale > 0.05 && spread > 0.12,
        };
      });
      onScreenPositions(screenPositions);
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  render();

  return () => {
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", applyLayout);
    canvas.removeEventListener("pointermove",  handlePointerMove);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    canvas.removeEventListener("pointerdown",  handlePointerDown);
    canvas.style.cursor = "default";
    for (const g of starGeometries) g.dispose();
    for (const m of starMaterials)  m.dispose();
    for (const t of textures)       t.dispose();
    planetEntries.forEach((entry) => {
      entry.target.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (!mesh.material) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) m.dispose();
      });
    });
    renderer.dispose();
  };
}
