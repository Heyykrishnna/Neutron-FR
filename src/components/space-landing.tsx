"use client";

import Image from "next/image";
import type { MutableRefObject } from "react";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import gsap from "gsap";
import Lenis from "lenis";
import { useRouter } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { PLANET_RECORDS } from "@/lib/planet-data";

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

gsap.registerPlugin(ScrollTrigger);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const amount = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function normalizeModel(object: THREE.Object3D, targetSize: number) {
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(object);
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

function tintSelection(object: THREE.Object3D, accent: string, intensity: number) {
  object.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh;
    if (!("material" in mesh) || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const m = mat as any;
      if (m.emissive) {
        m.emissive.set(accent);
        m.emissiveIntensity = intensity;
      }
    }
  });
}

function createStarField(count: number, radius: number, size: number, color: string) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const d = radius * (0.35 + Math.random() * 0.65);
    positions[s]     = d * Math.sin(phi) * Math.cos(theta);
    positions[s + 1] = d * Math.cos(phi) * 0.55;
    positions[s + 2] = d * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.46, depthWrite: false, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}

const SCROLL_KEY = "neutron_orbit_scroll";
function saveScrollY() { try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch {} }
function popSavedScrollY(): number | null {
  try {
    const v = sessionStorage.getItem(SCROLL_KEY);
    if (v !== null) { sessionStorage.removeItem(SCROLL_KEY); return Number(v); }
  } catch {}
  return null;
}

export default function SpaceLanding() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const activePlanetRef = useRef(PLANET_RECORDS[0].slug);
  const navigatingRef = useRef(false);
  const routeTimeoutRef = useRef<number | null>(null);

  const [activePlanet, setActivePlanet] = useState(PLANET_RECORDS[0].slug);
  const [runtimeState, setRuntimeState] = useState<"loading" | "ready" | "error">("loading");
  const [navigatingPlanet, setNavigatingPlanet] = useState<string | null>(null);
  const [planetPositions, setPlanetPositions] = useState<PlanetScreenPos[]>([]);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const onScroll = () => {
      const scrolledVH = (window.scrollY / window.innerHeight) * 100;
      setVideoOpacity(Math.max(0, 1 - scrolledVH / 150));
      setIsScrolled(scrolledVH > 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    for (const planet of PLANET_RECORDS) router.prefetch(`/planets/${planet.slug}`);
  }, [router]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const lenis = new Lenis({ lerp: 0.082, smoothWheel: true, syncTouch: true, touchMultiplier: 1.12 });
    lenis.on("scroll", ScrollTrigger.update);
    const ticker = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const sceneProgress = { value: 0 };
    let lastPlanet = PLANET_RECORDS[0].slug;

    const ctx = gsap.context(() => {
      gsap.to(sceneProgress, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: scrollRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = sceneProgress.value || self.progress;
            progressRef.current = progress;
            if (navigatingRef.current) return;
            
            const scrollMax = (document.documentElement.scrollHeight - window.innerHeight) || 1;
            const scrolledPx = progress * scrollMax;
            const vh = window.innerHeight || 800;
            const scrolledVH = (scrolledPx / vh) * 100;

            const N = PLANET_RECORDS.length;
            const cycleProgress = Math.max(0, scrolledVH - 420) / 380;
            const rawIndex = Math.floor((cycleProgress * N) + 0.5);
            const activeIndex = rawIndex % N;
            
            const next = PLANET_RECORDS[activeIndex]?.slug ?? PLANET_RECORDS[0].slug;
            if (next !== lastPlanet) { lastPlanet = next; syncActivePlanet(next); }
          },
        },
      });
    }, scrollRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(ticker);
      lenis.destroy();
      if (routeTimeoutRef.current) window.clearTimeout(routeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;
    let cleanup = () => {};

    const bootScene = async () => {
      try {
        const sceneCleanup = await createScene({
          canvas: canvasRef.current!,
          progressRef,
          activePlanetRef,
          onPlanetHover: (slug) => setHoveredPlanet(slug || null),
          onPlanetClick: handlePlanetSelect,
          onReady: () => setRuntimeState("ready"),
          onScreenPositions: (positions) => setPlanetPositions([...positions]),
        });
        if (disposed) { sceneCleanup(); return; }
        cleanup = sceneCleanup;
      } catch (err) {
        console.error(err);
        if (!disposed) setRuntimeState("error");
      }
    };

    void bootScene();
    return () => { disposed = true; cleanup(); };
  }, []);

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 240, damping: 28 }}>
      <div className="relative min-h-[50000svh] overflow-x-clip">

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
        `}</style>

        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            backgroundImage: "url('https://4kwallpapers.com/images/wallpapers/stars-galaxy-3840x2160-10307.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.45) saturate(0.8) sepia(0.35)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "linear-gradient(180deg,rgba(10,4,0,0.2) 0%,rgba(4,2,0,0.6) 100%)" }}
        />

        <div aria-hidden className="pointer-events-none fixed inset-0 z-1 overflow-hidden">
          <div
            className="absolute inset-[-25%] opacity-[0.32]"
            style={{
              backgroundImage: "radial-gradient(circle,rgba(255,220,160,0.9) 0.7px,transparent 1.1px),radial-gradient(circle,rgba(255,200,120,0.7) 0.55px,transparent 0.9px)",
              backgroundPosition: "0 0,55px 72px",
              backgroundSize: "110px 110px,140px 140px",
              animation: "drift-stars 22s linear infinite",
            }}
          />
          <div
            className="absolute inset-[-25%] opacity-[0.22]"
            style={{
              backgroundImage: "radial-gradient(circle,rgba(255,180,80,0.75) 0.8px,transparent 1.2px),radial-gradient(circle,rgba(220,160,60,0.5) 0.6px,transparent 1px)",
              backgroundPosition: "28px 36px,88px 104px",
              backgroundSize: "160px 160px,210px 210px",
              animation: "drift-stars 30s -4s linear infinite reverse",
            }}
          />
          <div
            className="absolute inset-[-25%] opacity-[0.16]"
            style={{
              backgroundImage: "radial-gradient(circle,rgba(255,240,200,0.65) 0.7px,transparent 1.1px),radial-gradient(circle,rgba(220,180,120,0.38) 0.5px,transparent 0.8px)",
              backgroundPosition: "14px 60px,100px 130px",
              backgroundSize: "200px 200px,270px 270px",
              animation: "drift-stars 42s -8s linear infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: "-14vw", top: "20vh", height: "42vw", width: "42vw",
              background: "radial-gradient(circle,rgba(180,80,10,0.18),transparent 70%)",
              animation: "pulse-cloud 16s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              right: "-12vw", top: "48vh", height: "36vw", width: "36vw",
              background: "radial-gradient(circle,rgba(120,50,5,0.16),transparent 70%)",
              animation: "pulse-cloud 16s -7s ease-in-out infinite",
            }}
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 overflow-hidden"
          style={{ opacity: videoOpacity, zIndex: 2, transition: "opacity 0.3s ease" }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.55) saturate(1.1) contrast(1)" }}
          >
            <source src="https://res.cloudinary.com/dpod2sj9t/video/upload/v1774324189/Neu_edaxyz.mp4" type="video/mp4" />
          </video>

          <div
            className="absolute inset-[-20%] opacity-[0.4]"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23grain)' opacity='0.22'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
              mixBlendMode: "multiply",
              animation: "grain-shift 1.8s steps(1) infinite",
            }}
          />

          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.85) 85%,rgba(0,0,0,0.98) 100%)" }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        <a
          href="/"
          className="fixed top-6 left-6 z-50 transition-transform duration-300 hover:scale-110"
          aria-label="Neutron Home"
        >
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

        <canvas ref={canvasRef} className="fixed inset-0 z-10 h-full w-full touch-none" aria-hidden="true" />

        {runtimeState === "ready" && planetPositions.map((pos) => {
          if (!pos.visible) return null;
          const pd = PLANET_RECORDS.find((p) => p.slug === pos.slug);
          if (!pd) return null;
          const isHovered = hoveredPlanet === pos.slug;
          const isActive = activePlanet === pos.slug;

          return (
            <motion.div
              key={pos.slug}
              style={{ position: "fixed", left: pos.x, top: pos.y, transform: "translate(-50%,0)", zIndex: 15, pointerEvents: "auto", cursor: "pointer", userSelect: "none" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: pos.visible ? (isActive ? 1 : 0.62) : 0, y: 0, scale: isHovered ? 1.05 : isActive ? 1.03 : 1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => handlePlanetSelect(pos.slug)}
              onMouseEnter={() => setHoveredPlanet(pos.slug)}
              onMouseLeave={() => setHoveredPlanet(null)}
            >
              <div
                className="flex flex-col items-center gap-[0.42rem] px-[0.9rem] py-[0.55rem] whitespace-nowrap"
                style={{
                  border: isActive
                    ? "1px solid rgba(220,140,40,0.45)"
                    : "1px solid rgba(180,100,20,0.22)",
                  background: isActive
                    ? "rgba(18,8,0,0.82)"
                    : "rgba(10,4,0,0.56)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  clipPath: "polygon(6px 0%,calc(100% - 6px) 0%,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0% calc(100% - 6px),0% 6px)",
                  boxShadow: isActive
                    ? "0 10px 44px rgba(0,0,0,0.55),0 0 30px rgba(200,120,20,0.15),inset 0 1px 0 rgba(255,180,60,0.08)"
                    : "0 8px 32px rgba(0,0,0,0.42),inset 0 1px 0 rgba(255,180,60,0.04)",
                  transition: "background 240ms ease,border-color 240ms ease,box-shadow 240ms ease",
                }}
              >
                <div
                  className="text-[0.78rem] font-bold uppercase tracking-[0.22em] leading-none"
                  style={{ color: isActive ? "#ffbe6a" : "rgba(220,160,60,0.8)", fontFamily: "monospace" }}
                >
                  {pd.name}
                </div>
              </div>
            </motion.div>
          );
        })}

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
              border: "1px solid rgba(200,120,20,0.3)",
              background: "rgba(12,5,0,0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              clipPath: "polygon(8px 0%,calc(100% - 8px) 0%,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0% calc(100% - 8px),0% 8px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5),0 0 40px rgba(180,100,10,0.08),inset 0 1px 0 rgba(255,180,50,0.07)",
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
                  animate={{
                    width: isActive ? 48 : 10,
                    opacity: isActive ? 1 : 0.42,
                    backgroundColor: isActive ? "#e08020" : "rgba(180,120,40,0.28)",
                    boxShadow: isActive
                      ? "0 0 0 1px rgba(255,200,80,0.18),0 0 22px rgba(220,140,30,0.55)"
                      : "0 0 0 1px rgba(200,130,40,0.10)",
                  }}
                  whileHover={{
                    opacity: 1,
                    scale: 1.28,
                    backgroundColor: "#f0a030",
                    boxShadow: "0 0 0 2px rgba(255,200,80,0.3),0 0 18px rgba(240,160,48,0.7)",
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  onClick={() => handlePlanetSelect(planet.slug)}
                >
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.2em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      background: "rgba(12,5,0,0.88)",
                      border: "1px solid rgba(200,120,30,0.4)",
                      color: "#f0c060",
                      backdropFilter: "blur(10px)",
                      fontFamily: "monospace",
                      clipPath: "polygon(4px 0%,calc(100% - 4px) 0%,100% 4px,100% 100%,0% 100%,0% 4px)",
                    }}
                  >
                    {planet.name}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {runtimeState !== "ready" && (
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
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: "1px solid rgba(180,100,20,0.22)",
                    borderTopColor: runtimeState === "error" ? "rgba(255,100,60,0.95)" : "rgba(255,180,60,0.9)",
                    borderRightColor: runtimeState === "error" ? "rgba(255,140,60,0.9)" : "rgba(200,120,30,0.8)",
                    boxShadow: "0 0 35px rgba(220,140,40,0.22)",
                    animation: "spin-loader 1.1s linear infinite",
                  }}
                />
                <span
                  className="absolute h-[0.95rem] w-[0.95rem] rounded-full"
                  style={{
                    background: "radial-gradient(circle,#fffbe8 0%,#f0c060 55%,#c06010 100%)",
                    boxShadow: "0 0 28px rgba(220,160,40,0.7)",
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="pointer-events-none fixed inset-0 z-25 transition-opacity duration-1000"
          style={{ opacity: isScrolled ? 1 : 0 }}
        >
          {[
            { label: "Terms",   href: "/terms",   drift: "star-link-a 9s ease-in-out infinite",  delay: "0s"    },
            { label: "Privacy", href: "/privacy", drift: "star-link-b 11s ease-in-out infinite", delay: "1.4s"  },
            { label: "Contact", href: "/contact", drift: "star-link-c 13s ease-in-out infinite", delay: "0.6s"  },
            { label: "About",   href: "/about",   drift: "star-link-d 10s ease-in-out infinite", delay: "2s"    },
            { label: "FAQ",     href: "/faq",     drift: "star-link-e 12s ease-in-out infinite", delay: "0.9s"  },
          ].map(({ label, href, drift, delay }, index) => {
            const color = "#f0c060";
            const pos = planetPositions[index];
            if (!pos) return null;

            return (
              <div
                key={label}
                className="fixed z-25 transition-opacity duration-500"
                style={{
                  left: pos.starX,
                  top: pos.starY,
                  opacity: pos.starVisible && isScrolled ? 1 : 0,
                  pointerEvents: pos.starVisible && isScrolled ? "auto" : "none",
                }}
              >
                <div style={{ transform: "translate(-50%, -50%)" }}>
                  <a
                    href={href}
                    className="group pointer-events-auto flex flex-col items-center gap-[0.4rem]"
                    style={{ animation: drift, animationDelay: delay }}
                  >
                    <span
                      className="relative block rounded-full transition-transform duration-300 group-hover:scale-150"
                      style={{
                        width: 14,
                        height: 14,
                        background: `radial-gradient(circle at 38% 34%, rgba(255,255,220,0.95), ${color} 60%)`,
                        boxShadow: `0 0 10px 4px ${color}88, 0 0 30px 8px ${color}44`,
                        animation: `star-glow-pulse 3s ease-in-out infinite`,
                        animationDelay: delay,
                        color,
                      }}
                    >
                      <span
                        className="absolute inset-0 rounded-full opacity-60"
                        style={{ background: `radial-gradient(circle,transparent 30%,${color}55 100%)`, animation: `star-glow-pulse 3s ease-in-out infinite reverse`, animationDelay: delay }}
                      />
                    </span>
                    <span
                      className="whitespace-nowrap px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1"
                      style={{
                        background: "rgba(10,4,0,0.82)",
                        border: `1px solid ${color}55`,
                        backdropFilter: "blur(10px)",
                        color,
                        fontFamily: "monospace",
                        boxShadow: `0 4px 20px ${color}22`,
                        clipPath: "polygon(4px 0%,calc(100% - 4px) 0%,100% 4px,100% 100%,0% 100%,0% 4px)",
                      }}
                    >
                      {label}
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div ref={scrollRef} className="relative z-20 pointer-events-none h-[50000svh]" aria-hidden="true" />
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

  const dirLight = new THREE.DirectionalLight("#ffe8d0", 2.2);
  dirLight.position.set(7, 9, 9);
  const ptLight1 = new THREE.PointLight("#e07830", 2.2, 52, 1.8);
  ptLight1.position.set(-8, 2.5, 7);
  const ptLight2 = new THREE.PointLight("#a04010", 1.4, 44, 1.8);
  ptLight2.position.set(9, -3.5, -8);
  const ptLight3 = new THREE.PointLight("#f0c880", 0.7, 30, 2);
  ptLight3.position.set(-2, 5, 12);
  scene.add(
    new THREE.AmbientLight("#4a2a10", 1.4),
    new THREE.HemisphereLight("#f0c080", "#0a0400", 0.75),
    dirLight, ptLight1, ptLight2, ptLight3,
  );

  const starsNear = createStarField(1100, 72, 0.034, "#ffe0a0");
  const starsMid  = createStarField(720,  90, 0.024, "#ffcc80");
  const starsFar  = createStarField(480, 110, 0.018, "#e0b060");
  const starsWarm = createStarField(360, 100, 0.020, "#fff0c0");
  (starsMid.material  as THREE.PointsMaterial).opacity = 0.32;
  (starsFar.material  as THREE.PointsMaterial).opacity = 0.20;
  (starsWarm.material as THREE.PointsMaterial).opacity = 0.22;
  scene.add(starsFar, starsMid, starsNear, starsWarm);

  const planetsRig = new THREE.Group();
  const accentLight = new THREE.PointLight("#8fd4ff", 0, 18, 1.8);
  scene.add(planetsRig, accentLight);

  const gltfLoader = new GLTFLoader();
  const objLoader = new OBJLoader();
  const textureLoader = new THREE.TextureLoader();

  const textures: THREE.Texture[] = [];
  const interactiveTargets: THREE.Object3D[] = [];
  const planetEntries: PlanetRuntimeEntry[] = [];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hoveredSlugRef = { current: "" };

  const selectedWorldPosition = new THREE.Vector3();
  const targetCameraPosition = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();
  const cameraLookAt = new THREE.Vector3(0, 0, 0);
  const cameraOffset = new THREE.Vector3();
  const exitOffset = new THREE.Vector3();

  const starGeometries = [starsNear.geometry, starsMid.geometry, starsFar.geometry, starsWarm.geometry];
  const starMaterials = [starsNear.material as THREE.Material, starsMid.material as THREE.Material, starsFar.material as THREE.Material, starsWarm.material as THREE.Material];

  const loadGLTF = (url: string) => new Promise<any>((res, rej) => gltfLoader.load(url, res, undefined, rej));
  const loadOBJ  = (url: string) => new Promise<any>((res, rej) => objLoader.load(url, res, undefined, rej));

  const addPlanet = async (index: number) => {
    const planet = PLANET_RECORDS[index];
    const root = new THREE.Group();
    const pivot = new THREE.Group();
    let target: THREE.Object3D;

    if (planet.kind === "glb") {
      const gltf = await loadGLTF(planet.model);
      target = normalizeModel(gltf.scene, planet.size);
      target.rotation.y = planet.rotationOffset ?? 0;
    } else {
      const obj = await loadOBJ(planet.model);
      const texture = textureLoader.load(planet.texture ?? "");
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      obj.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) mesh.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.78, metalness: 0.06 });
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
    pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(interactiveTargets, true)[0]?.object?.userData?.planetSlug ?? "";
  };

  const handlePointerMove = (e: PointerEvent) => {
    const slug = findPlanetAtPointer(e.clientX, e.clientY);
    hoveredSlugRef.current = slug;
    onPlanetHover(slug);
    canvas.style.cursor = slug ? "pointer" : "default";
  };
  const handlePointerLeave = () => { hoveredSlugRef.current = ""; onPlanetHover(""); canvas.style.cursor = "default"; };
  const handlePointerDown = (e: PointerEvent) => { const slug = findPlanetAtPointer(e.clientX, e.clientY); if (slug) onPlanetClick(slug); };

  window.addEventListener("resize", applyLayout);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.addEventListener("pointerdown", handlePointerDown);
  applyLayout();
  onReady();

  const worldToScreen = (pos: THREE.Vector3) => {
    const p = pos.clone().project(camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight };
  };

  const clock = new THREE.Timer();
  let animationFrame = 0;
  let frameCount = 0;

  const render = () => {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsed();    

    const scrollMax = (document.documentElement.scrollHeight - window.innerHeight) || 1;
    const scrolledPx = progressRef.current * scrollMax;
    const vh = window.innerHeight || 800;
    const scrolledVH = (scrolledPx / vh) * 100;
    
    const intro  = smoothstep(20, 150, scrolledVH);
    const spread = smoothstep(120, 300, scrolledVH);
    const focus  = smoothstep(280, 420, scrolledVH);
    const exit   = 0;

    const mob = window.innerWidth < 768;

    const ringRadiusX = mob ? 8.0 : 10.0;
    const ringRadiusZ = mob ? 8.0 : 10.0;
    const ringCenterZ = mob ? -6 : -5;
    
    planetsRig.rotation.y += delta * 0.026;
    planetsRig.rotation.x  = Math.sin(elapsed * 0.085) * 0.016;
    planetsRig.rotation.z  = Math.cos(elapsed * 0.065) * 0.007;

    const N = PLANET_RECORDS.length;
    const cycleProgress = Math.max(0, scrolledVH - 420) / 380;
    const globalAngleOffset = cycleProgress * (Math.PI * 2);

    const frontTargetX = 0;
    const frontTargetY = mob ? -1.2 : -1.8; 
    const frontTargetZ = ringCenterZ + ringRadiusZ;
    const idealFrontPosition = new THREE.Vector3(frontTargetX, frontTargetY, frontTargetZ);

    planetEntries.forEach((entry, index) => {
      const planet    = PLANET_RECORDS[index];
      const revealIn  = smoothstep(100 + index * 30, 220 + index * 30, scrolledVH);
      const visibility = clamp(revealIn, 0.001, 1);
      const isScrollSelected = entry.slug === activePlanetRef.current;
      const isHovered = entry.slug === hoveredSlugRef.current;
      
      let currentAngle = (index * (Math.PI * 2) / N) - globalAngleOffset;
      if (currentAngle > Math.PI) currentAngle -= Math.PI * 2;
      if (currentAngle < -Math.PI) currentAngle += Math.PI * 2;

      const targetX = Math.sin(currentAngle) * ringRadiusX;
      const targetZ = ringCenterZ + Math.cos(currentAngle) * ringRadiusZ;
      const targetY = frontTargetY + (1 - Math.cos(currentAngle)) * (mob ? 2.5 : 4.4);
      
      const angleScale = Math.max(0, Math.cos(currentAngle));
      const frontBoost = Math.pow(angleScale, 5.0);
      const continuousEmphasis = 1.0 + frontBoost * (mob ? 1.4 : 1.8);
      const emphasis = continuousEmphasis * (isHovered ? 1.05 : 1.0);
      
      const exitDrift = exit * (index % 2 === 0 ? -2.4 : 2.4);
      
      entry.basePosition.set(targetX, targetY, targetZ);

      entry.pivot.position.x = THREE.MathUtils.lerp(entry.basePosition.x * 0.08, entry.basePosition.x, spread);
      entry.pivot.position.y = THREE.MathUtils.lerp(
        entry.basePosition.y + 5.4 + index * 0.25,
        entry.basePosition.y + Math.sin(elapsed * 0.66 + index * 1.28) * 0.13 + Math.sin(elapsed * 0.38 + index * 0.72) * 0.048 + Math.cos(elapsed * 0.22 + index * 1.05) * 0.022,
        revealIn,
      );
      entry.pivot.position.z = THREE.MathUtils.lerp(10 + index * 0.6, entry.basePosition.z + Math.sin(elapsed * 0.35 + index) * 0.09, visibility);
      entry.pivot.rotation.y += delta * (0.60 + index * 0.025);
      entry.pivot.rotation.x = Math.sin(elapsed * 0.22 + index * 0.88) * 0.038 + Math.cos(elapsed * 0.14 + index * 0.55) * 0.015;
      entry.target.rotation.y += delta * (0.18 + index * 0.018);  
      entry.target.rotation.x = Math.sin(elapsed * 0.09 + index * 0.72) * 0.06;
      entry.root.position.y = Math.sin(elapsed * 0.62 + index * 1.28) * 0.085 + Math.cos(elapsed * 0.31 + index * 0.78) * 0.030;
      entry.root.position.x = Math.sin(elapsed * 0.25 + index * 1.08) * 0.032;
      entry.scale = THREE.MathUtils.lerp(entry.scale, visibility * emphasis, 0.068);
      entry.root.scale.setScalar(Math.max(entry.scale, 0.001));
      tintSelection(entry.target, planet.accent, isScrollSelected ? 0.26 : isHovered ? 0.12 : 0);
    });

    const scrollPlanet = PLANET_RECORDS.find((p) => p.slug === activePlanetRef.current) ?? PLANET_RECORDS[0];
    const scrollEntry  = planetEntries.find((e) => e.slug === scrollPlanet.slug) ?? planetEntries[0];

    if (scrollEntry) {
      accentLight.position.lerp(idealFrontPosition, 0.11);
      accentLight.color.set(scrollPlanet.accent);
      accentLight.intensity = THREE.MathUtils.lerp(accentLight.intensity, 2.0 * focus, 0.065);
    }

    cameraOffset.set(0, mob ? 3.8 : 5.2, mob ? 8.5 : 11.0);
    const focusLookAt = new THREE.Vector3(0, mob ? 0.0 : 0.5, ringCenterZ);

    targetCameraPosition.set(0, mob ? 0.35 : 0.7, THREE.MathUtils.lerp(mob ? 19.5 : 18, mob ? 14.6 : 13.2, intro));
    targetLookAt.set(0, 0.2, -2.8);
    
    targetCameraPosition.lerp(new THREE.Vector3(0, mob ? 3.0 : 4.8, mob ? 18.2 : 20.5), spread);
    targetLookAt.lerp(new THREE.Vector3(0, 0.2, ringCenterZ), spread);
    
    targetCameraPosition.lerp(idealFrontPosition.clone().add(cameraOffset), focus);
    targetLookAt.lerp(focusLookAt, focus);
    
    exitOffset.set(mob ? 1.4 : 2.1, 2.4, 5.8);
    targetCameraPosition.lerp(idealFrontPosition.clone().add(exitOffset), exit);
    targetLookAt.lerp(idealFrontPosition.clone().add(new THREE.Vector3(0.2, 0.1, 0)), exit);
    camera.position.lerp(targetCameraPosition, 0.055);
    cameraLookAt.lerp(targetLookAt, 0.068);
    camera.lookAt(cameraLookAt);

    starsNear.rotation.y += delta * 0.0065;
    starsMid.rotation.y  -= delta * 0.0038;
    starsFar.rotation.y  += delta * 0.002;
    starsWarm.rotation.y -= delta * 0.003;
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
           const dir = labelPos.clone().sub(camera.position).normalize();
           raycaster.set(camera.position, dir);
           const hits = raycaster.intersectObjects(interactiveTargets, true);
           const blocker = hits.find(h => h.object.userData?.planetSlug !== entry.slug);
           if (blocker && blocker.distance < camera.position.distanceTo(labelPos) - 0.5) {
             occluded = true;
           }
        }

        const starWorldPos = worldPos.clone().add(
          new THREE.Vector3(
            index % 2 === 0 ? 5.8 : -5.8,
            index % 3 === 0 ? 3.5 : -4.2,
            index % 2 === 0 ? -3.0 : 3.0
          ).multiplyScalar(Math.max(entry.scale, 0.4))
        );
        const starScreen = worldToScreen(starWorldPos);
        const starBehind = starWorldPos.clone().project(camera).z > 1;

        let starOccluded = false;
        if (!starBehind) {
           const dir = starWorldPos.clone().sub(camera.position).normalize();
           raycaster.set(camera.position, dir);
           const hits = raycaster.intersectObjects(interactiveTargets, true);
           const blocker = hits.find(h => h.object.userData?.planetSlug !== entry.slug);
           if (blocker && blocker.distance < camera.position.distanceTo(starWorldPos) - 0.5) {
             starOccluded = true;
           }
        }

        return { 
          slug: entry.slug, 
          x: screen.x, 
          y: screen.y + entry.scale * 36, 
          visible: !behind && !occluded && entry.scale > 0.14 && spread > 0.28, 
          scale: entry.scale,
          starX: starScreen.x,
          starY: starScreen.y,
          starVisible: !starBehind && !starOccluded && entry.scale > 0.05 && spread > 0.12
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
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerleave", handlePointerLeave);
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.style.cursor = "default";
    for (const g of starGeometries) g.dispose();
    for (const m of starMaterials) m.dispose();
    for (const t of textures) t.dispose();
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
