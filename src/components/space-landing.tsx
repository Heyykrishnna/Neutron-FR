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

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  useTime,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
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
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(object);
  box.getSize(size);
  object.scale.multiplyScalar(
    targetSize / Math.max(size.x, size.y, size.z, 0.001),
  );
  box.setFromObject(object);
  box.getCenter(center);
  object.position.x -= center.x;
  object.position.y -= center.y;
  object.position.z -= center.z;
  box.setFromObject(object);
  return object;
}

function createStarField(
  count: number,
  radius: number,
  size: number,
  color: string,
) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const s = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const d = radius * (0.35 + Math.random() * 0.65);
    positions[s] = d * Math.sin(phi) * Math.cos(theta);
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
function saveScrollY() {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
  } catch {}
}
function popSavedScrollY(): number | null {
  try {
    const v = sessionStorage.getItem(SCROLL_KEY);
    if (v !== null) {
      sessionStorage.removeItem(SCROLL_KEY);
      return Number(v);
    }
  } catch {}
  return null;
}

export default function SpaceLanding() {
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loaderCardRef = useRef<HTMLDivElement | null>(null);
  const loaderSheenRef = useRef<HTMLDivElement | null>(null);
  const loaderMotionRef = useRef<{
    rotateX: ((value: number) => gsap.core.Tween) | null;
    rotateY: ((value: number) => gsap.core.Tween) | null;
    shiftX: ((value: number) => gsap.core.Tween) | null;
    shiftY: ((value: number) => gsap.core.Tween) | null;
    sheenX: ((value: number) => gsap.core.Tween) | null;
    sheenY: ((value: number) => gsap.core.Tween) | null;
  }>({
    rotateX: null,
    rotateY: null,
    shiftX: null,
    shiftY: null,
    sheenX: null,
    sheenY: null,
  });
  const progressRef = useRef(0);
  const activePlanetRef = useRef(PLANET_RECORDS[0].slug);
  const navigatingRef = useRef(false);
  const routeTimeoutRef = useRef<number | null>(null);
  const zoomTargetRef = useRef<string | null>(null);
  const showScrollIndicatorRef = useRef(true);

  const searchParams = useSearchParams();
  const initPhase = searchParams?.get("phase");
  const refCode = searchParams?.get("ref") || searchParams?.get("utm_source");

  const [scenePhase, setScenePhase] = useState<ScenePhase>(
    initPhase === "planets" ? "planets" : "landing",
  );
  const [planetsReady, setPlanetsReady] = useState(initPhase === "planets");
  const [activePlanet, setActivePlanet] = useState(PLANET_RECORDS[0].slug);
  const [runtimeState, setRuntimeState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [navigatingPlanet, setNavigatingPlanet] = useState<string | null>(null);
  const [transitionState, setTransitionState] = useState<{
    slug: string;
    accent: string;
    phase: "zoom" | "atmosphere" | "fade";
  } | null>(null);
  const [planetPositions, setPlanetPositions] = useState<PlanetScreenPos[]>([]);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isEntering, setIsEntering] = useState(false);
  const [flashOverlay, setFlashOverlay] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const time = useTime();

  const driftX = useTransform(time, (t) => Math.sin(t / 2000) * 0.02);
  const driftY = useTransform(time, (t) => Math.cos(t / 1800) * 0.02);

  const bgXSpring = useSpring(
    useTransform(() => mouseX.get() + driftX.get()),
    { stiffness: 38, damping: 20, mass: 1.4 },
  );
  const bgYSpring = useSpring(
    useTransform(() => mouseY.get() + driftY.get()),
    { stiffness: 38, damping: 20, mass: 1.4 },
  );
  const bgX = useTransform(bgXSpring, [0, 1], ["0%", "100%"]);
  const bgY = useTransform(bgYSpring, [0, 1], ["0%", "100%"]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    },
    [mouseX, mouseY],
  );
  const onMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  const handleLoaderPointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pointerX = (e.clientX - rect.left) / rect.width - 0.5;
      const pointerY = (e.clientY - rect.top) / rect.height - 0.5;
      const motion = loaderMotionRef.current;

      motion.rotateX?.(pointerY * -12);
      motion.rotateY?.(pointerX * 16);
      motion.shiftX?.(pointerX * 8);
      motion.shiftY?.(pointerY * 6);
      motion.sheenX?.(pointerX * 120);
      motion.sheenY?.(pointerY * 90);
    },
    [],
  );

  const handleLoaderPointerLeave = useCallback(() => {
    const motion = loaderMotionRef.current;
    motion.rotateX?.(0);
    motion.rotateY?.(0);
    motion.shiftX?.(0);
    motion.shiftY?.(0);
    motion.sheenX?.(0);
    motion.sheenY?.(0);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!refCode || typeof window === "undefined") return;

    try {
      window.localStorage.setItem(
        "referral_code",
        refCode.trim().toUpperCase(),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [refCode]);

  const currentPlanet =
    PLANET_RECORDS.find((p) => p.slug === activePlanet) ?? PLANET_RECORDS[0];

  const syncActivePlanet = useCallback((slug: string) => {
    activePlanetRef.current = slug;
    setActivePlanet((cur) => (cur === slug ? cur : slug));
  }, []);

  const handlePlanetSelect = useCallback(
    (slug: string) => {
      if (navigatingRef.current) return;
      syncActivePlanet(slug);
      navigatingRef.current = true;
      setNavigatingPlanet(slug);
      saveScrollY();

      const planet = PLANET_RECORDS.find((p) => p.slug === slug);
      const accent = planet?.accent ?? "#ffffff";

      zoomTargetRef.current = slug;
      setTransitionState({ slug, accent, phase: "zoom" });

      setTimeout(() => {
        setTransitionState((prev) =>
          prev ? { ...prev, phase: "atmosphere" } : null,
        );
      }, 700);

      setTimeout(() => {
        setTransitionState((prev) =>
          prev ? { ...prev, phase: "fade" } : null,
        );
      }, 1100);

      routeTimeoutRef.current = window.setTimeout(() => {
        startTransition(() => {
          if (slug === "mars") {
            router.push("/about");
          } else if (slug === "moon") {
            router.push("/profile");
          } else {
            router.push(`/planets/${slug}`);
          }
        });
      }, 1500);
    },
    [router, syncActivePlanet],
  );

  useEffect(() => {
    showScrollIndicatorRef.current = showScrollIndicator;
  }, [showScrollIndicator]);

  useEffect(() => {
    const saved = popSavedScrollY();
    if (saved !== null && saved > 0) {
      requestAnimationFrame(() =>
        window.scrollTo({ top: saved, behavior: "instant" }),
      );
    }
  }, []);

  useEffect(() => {
    for (const planet of PLANET_RECORDS) {
      if (planet.slug === "mars") {
        router.prefetch("/about");
      } else if (planet.slug === "moon") {
        router.prefetch("/profile");
      } else {
        router.prefetch(`/planets/${planet.slug}`);
      }
    }
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
    const card = loaderCardRef.current;
    if (!card || scenePhase !== "planets" || runtimeState === "ready") return;

    const sheen = loaderSheenRef.current;
    const orbitLayer = card.querySelector<HTMLElement>("[data-loader-orbits]");
    const scanLine = card.querySelector<HTMLElement>("[data-loader-scan]");
    const progressLight = card.querySelector<HTMLElement>(
      "[data-loader-progress-light]",
    );
    const motion = loaderMotionRef.current;

    motion.rotateX = gsap.quickTo(card, "rotationX", {
      duration: 0.45,
      ease: "power3.out",
    });
    motion.rotateY = gsap.quickTo(card, "rotationY", {
      duration: 0.45,
      ease: "power3.out",
    });
    motion.shiftX = gsap.quickTo(card, "x", {
      duration: 0.45,
      ease: "power3.out",
    });
    motion.shiftY = gsap.quickTo(card, "y", {
      duration: 0.45,
      ease: "power3.out",
    });

    if (sheen) {
      motion.sheenX = gsap.quickTo(sheen, "x", {
        duration: 0.35,
        ease: "power3.out",
      });
      motion.sheenY = gsap.quickTo(sheen, "y", {
        duration: 0.35,
        ease: "power3.out",
      });
    }

    const floatTween = gsap.to(card, {
      y: -10,
      duration: 2.8,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    const orbitTween = orbitLayer
      ? gsap.to(orbitLayer, {
          rotation: 360,
          duration: 26,
          ease: "none",
          repeat: -1,
        })
      : null;

    const scanTween = scanLine
      ? gsap.fromTo(
          scanLine,
          { xPercent: -160 },
          { xPercent: 180, duration: 3.2, ease: "power1.inOut", repeat: -1 },
        )
      : null;

    const progressTween = progressLight
      ? gsap.fromTo(
          progressLight,
          { xPercent: -160 },
          { xPercent: 220, duration: 2.4, ease: "none", repeat: -1 },
        )
      : null;

    return () => {
      floatTween.kill();
      orbitTween?.kill();
      scanTween?.kill();
      progressTween?.kill();
      motion.rotateX = null;
      motion.rotateY = null;
      motion.shiftX = null;
      motion.shiftY = null;
      motion.sheenX = null;
      motion.sheenY = null;
      gsap.set(card, { clearProps: "x,y,rotationX,rotationY" });
      if (sheen) gsap.set(sheen, { clearProps: "x,y" });
    };
  }, [runtimeState, scenePhase]);

  useEffect(() => {
    if (scenePhase !== "planets") return;
    if (!canvasRef.current) return;

    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const sceneCleanup = await createScene({
          canvas: canvasRef.current!,
          progressRef,
          activePlanetRef,
          zoomTargetRef,
          onPlanetHover: (slug) => setHoveredPlanet(slug || null),
          onPlanetClick: handlePlanetSelect,
          onReady: () => setRuntimeState("ready"),
          onProgress: (p) => setLoadProgress(p),
          onScreenPositions: (positions) => setPlanetPositions([...positions]),
        });
        if (disposed) {
          sceneCleanup();
          return;
        }
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
  }, [scenePhase, handlePlanetSelect]);

  useEffect(() => {
    if (scenePhase !== "planets") return;
    const sceneProgress = { value: 0 };
    let lastPlanet = PLANET_RECORDS[0].slug;

    const tick = gsap.ticker.add(() => {});
    const ctx = gsap.context(() => {
      gsap.to(sceneProgress, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = sceneProgress.value || self.progress;
            progressRef.current = progress;
            if (navigatingRef.current) return;

            const scrollMax =
              document.documentElement.scrollHeight - window.innerHeight || 1;
            const scrolledPx = progress * scrollMax;
            const vh = window.innerHeight || 800;
            const scrolledVH = (scrolledPx / vh) * 100;

            const N = PLANET_RECORDS.length;
            const cycleProgress = Math.max(0, scrolledVH) / 380;
            const rawIndex = Math.floor(cycleProgress * N + 0.5);
            const activeIndex = rawIndex % N;
            const next =
              PLANET_RECORDS[activeIndex]?.slug ?? PLANET_RECORDS[0].slug;
            if (next !== lastPlanet) {
              lastPlanet = next;
              syncActivePlanet(next);
            }

            if (progress > 0.005 && showScrollIndicatorRef.current) {
              showScrollIndicatorRef.current = false;
              setShowScrollIndicator(false);
            }
          },
        },
      });
    });

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
    };
  }, [scenePhase, syncActivePlanet]);

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
          @keyframes loader-dot-pulse { 0%,100%{opacity:0.28;transform:scale(0.92)} 50%{opacity:1;transform:scale(1.14)} }
        `}</style>

        {isMobile && (
          <div className="fixed inset-0 z-100 h-screen w-full pointer-events-auto">
            <MobileLanding
              isMenuOpen={isMobileMenuOpen}
              onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
            <MobileNavbar
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />
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
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: isEntering ? 1.6 : 1.2,
                ease: isEntering ? [0.6, 0.05, 0.9, 0.2] : "easeInOut",
              }}
              style={{ transformOrigin: "50% 50%" }}
            >
              <div className="absolute inset-0 z-0 bg-black">
                <video
                  ref={(el) => {
                    if (el) el.playbackRate = 0.4;
                  }}
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
                    filter:
                      "brightness(0.60) saturate(0.80) sepia(0.30) blur(1px)",
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
          <Grainient
            color1="#3e2723"
            color2="#5d4037"
            color3="#0d0a08"
            timeSpeed={0.2}
            warpStrength={0.6}
            zoom={1.2}
            className="w-full h-full"
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-1 overflow-hidden"
        >
          <div
            className="absolute inset-[-25%] opacity-[0.28]"
            style={{
              backgroundImage:
                "radial-gradient(circle,rgba(255,220,160,0.9) 0.7px,transparent 1.1px),radial-gradient(circle,rgba(255,200,120,0.7) 0.55px,transparent 0.9px)",
              backgroundPosition: "0 0,55px 72px",
              backgroundSize: "110px 110px,140px 140px",
              animation: "drift-stars 22s linear infinite",
            }}
          />
          <div
            className="absolute inset-[-25%] opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle,rgba(255,180,80,0.75) 0.8px,transparent 1.2px),radial-gradient(circle,rgba(220,160,60,0.5) 0.6px,transparent 1px)",
              backgroundPosition: "28px 36px,88px 104px",
              backgroundSize: "160px 160px,210px 210px",
              animation: "drift-stars 30s -4s linear infinite reverse",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: "-14vw",
              top: "20vh",
              height: "42vw",
              width: "42vw",
              background:
                "radial-gradient(circle,rgba(180,80,10,0.14),transparent 70%)",
              animation: "pulse-cloud 16s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              right: "-12vw",
              top: "48vh",
              height: "36vw",
              width: "36vw",
              background:
                "radial-gradient(circle,rgba(120,50,5,0.12),transparent 70%)",
              animation: "pulse-cloud 16s -7s ease-in-out infinite",
            }}
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
                scale: 1,
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
                    textShadow:
                      "0 0 80px rgba(255,140,20,0.35), 0 0 200px rgba(255,80,0,0.18)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Enter the&nbsp;
                  <span
                    style={{
                      color: "#ffb84d",
                      textShadow: "0 0 60px rgba(255,140,20,0.6)",
                    }}
                  >
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
                  The annual techno-cultural fest of NST — click the singularity
                  to begin
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

              <div
                className="pointer-events-none absolute inset-0"
                style={{ zIndex: 12 }}
              >
                {[
                  {
                    style: { top: 18, left: 18 },
                    borderStyle: "border-t border-l",
                  },
                  {
                    style: { top: 18, right: 18 },
                    borderStyle: "border-t border-r",
                  },
                  {
                    style: { bottom: 18, left: 18 },
                    borderStyle: "border-b border-l",
                  },
                  {
                    style: { bottom: 18, right: 18 },
                    borderStyle: "border-b border-r",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`absolute w-8 h-8 ${c.borderStyle}`}
                    style={{
                      ...c.style,
                      borderColor: "rgba(255,160,40,0.35)",
                      animation: `corner-glow 4s ${i * 0.8}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 1.0 }}
                className="absolute inset-x-0 bottom-[8%] flex justify-center z-15 pointer-events-none"
              >
                <motion.div
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="text-[10px] sm:text-[10px] font-mono tracking-[0.4em] text-[#ffb84d] font-bold uppercase">
                    Click the black hole to enter the Cosmos
                  </span>
                </motion.div>
              </motion.div>
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
                backgroundImage:
                  "url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774685137/BG_l4fb9q.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "brightness(0.5) contrast(1.4)",
              }}
            />
          )}
        </AnimatePresence>

        <Link
          href="/"
          className="fixed top-6 left-6 z-50 transition-transform duration-300 hover:scale-110"
          aria-label="Neutron Home"
        >
          <Image
            src="https://ik.imagekit.io/yatharth/NEUT-LOGO.png"
            alt="Neutron Logo"
            width={48}
            height={48}
            className="object-contain"
            style={{
              filter:
                "drop-shadow(0 0 14px rgba(220,140,30,0.55)) drop-shadow(0 0 4px rgba(255,200,80,0.3))",
            }}
            priority
          />
        </Link>

        <AnimatePresence>
          {transitionState && (
            <motion.div
              key={`transition-${transitionState.slug}`}
              className="fixed inset-0 z-40 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity:
                    transitionState.phase === "zoom"
                      ? 0.4
                      : transitionState.phase === "atmosphere"
                        ? 0.85
                        : 1,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${transitionState.accent}55, ${transitionState.accent}22 50%, rgba(0,0,0,0.98) 80%)`,
                }}
              />
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{
                  opacity:
                    transitionState.phase === "atmosphere"
                      ? 0.6
                      : transitionState.phase === "fade"
                        ? 0.2
                        : 0,
                  scale:
                    transitionState.phase === "atmosphere"
                      ? 1.8
                      : transitionState.phase === "fade"
                        ? 2.5
                        : 0.3,
                }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: `radial-gradient(circle at 50% 50%, transparent 20%, ${transitionState.accent}33 40%, transparent 60%)`,
                }}
              />
              {transitionState.phase === "atmosphere" && (
                <div
                  className="absolute inset-0 mix-blend-overlay opacity-15"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
                  }}
                />
              )}
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: transitionState.phase === "fade" ? 1 : 0 }}
                transition={{ duration: 0.45, ease: "easeIn" }}
              />
            </motion.div>
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

        {scenePhase === "planets" &&
          runtimeState === "ready" &&
          planetPositions.map((pos) => {
            if (!pos.visible) return null;
            const pd = PLANET_RECORDS.find((p) => p.slug === pos.slug);
            if (!pd) return null;
            const isActive = activePlanet === pos.slug;

            return (
              <div
                key={pos.slug}
                style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  transform: `translate3d(calc(${pos.x}px - 50%), ${pos.y}px, 0)`,
                  zIndex: 15,
                  pointerEvents: pos.visible ? "auto" : "none",
                  willChange: "transform",
                }}
              >
                <motion.div
                  style={{ cursor: "pointer", userSelect: "none" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: pos.visible ? (isActive ? 1 : 0.62) : 0,
                    y: 0,
                    scale: isActive ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => handlePlanetSelect(pos.slug)}
                >
                  <div
                    className="flex flex-col items-center gap-[0.42rem] px-[0.9rem] py-[0.55rem] whitespace-nowrap"
                    style={{
                      border: isActive
                        ? "1px solid rgba(255,255,255,0.45)"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: isActive
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.06)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      clipPath:
                        "polygon(6px 0%,calc(100% - 6px) 0%,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0% calc(100% - 6px),0% 6px)",
                      boxShadow: isActive
                        ? "0 10px 44px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.08)"
                        : "0 8px 32px rgba(0,0,0,0.42),inset 0 1px 0 rgba(255,255,255,0.04)",
                      transition:
                        "background 240ms ease,border-color 240ms ease,box-shadow 240ms ease",
                    }}
                  >
                    <div
                      className="text-[0.78rem] font-bold uppercase tracking-[0.22em] leading-none"
                      style={{
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                        fontFamily: "monospace",
                      }}
                    >
                      {pd.name}
                    </div>
                  </div>
                </motion.div>
              </div>
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
                clipPath:
                  "polygon(8px 0%,calc(100% - 8px) 0%,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0% calc(100% - 8px),0% 8px)",
                boxShadow:
                  "0 24px 80px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.07)",
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
                    style={{
                      border: "none",
                      padding: 0,
                      background: "transparent",
                    }}
                    animate={{
                      width: isActive ? 48 : 10,
                      opacity: isActive ? 1 : 0.42,
                      backgroundColor: isActive
                        ? "#ffffff"
                        : "rgba(255,255,255,0.2)",
                    }}
                    whileHover={{ opacity: 1, backgroundColor: "#ffffff" }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    onClick={() => handlePlanetSelect(planet.slug)}
                  >
                    <span
                      className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.2em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      style={{
                        background: "rgba(0,0,0,0.88)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        backdropFilter: "blur(10px)",
                        fontFamily: "monospace",
                        clipPath:
                          "polygon(4px 0%,calc(100% - 4px) 0%,100% 4px,100% 100%,0% 100%,0% 4px)",
                      }}
                    >
                      {planet.name}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {scenePhase === "planets" && (
          <div
            className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#030303]"
            style={{
              opacity: runtimeState !== "ready" ? 1 : 0,
              pointerEvents: runtimeState !== "ready" ? "auto" : "none",
              transform: `scale(${runtimeState !== "ready" ? 1 : 1.06})`,
              filter: runtimeState !== "ready" ? "blur(0px)" : "blur(8px)",
              transition:
                "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div
              className="relative w-[min(88vw,860px)] px-4"
              style={{ perspective: "1800px" }}
            >
              <div
                ref={loaderCardRef}
                className="relative mx-auto cursor-pointer overflow-hidden"
                onMouseMove={handleLoaderPointerMove}
                onMouseLeave={handleLoaderPointerLeave}
                style={{
                  aspectRatio: "831 / 450",
                  borderRadius: "2.1rem",
                  border: "1.5px solid rgba(255,170,120,0.78)",
                  boxShadow:
                    "0 40px 120px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,153,92,0.15)",
                  transformStyle: "preserve-3d",
                  background:
                    "linear-gradient(180deg, rgba(19,14,12,0.86), rgba(11,8,6,0.96))",
                }}
              >
                <div className="absolute inset-0">
                  <Image
                    src="/space-loader-logo.png"
                    alt="Neutron 3.0 loader artwork"
                    fill
                    priority
                    sizes="(max-width: 768px) 88vw, 820px"
                    className="object-cover object-center"
                  />
                </div>

                <div
                  className="absolute inset-0"
                  style={{
                    background: [
                      "linear-gradient(180deg, rgba(8,6,5,0.18) 0%, rgba(8,6,5,0.12) 35%, rgba(8,6,5,0.55) 100%)",
                      "radial-gradient(circle at 50% 120%, rgba(255,149,77,0.28), transparent 46%)",
                      "radial-gradient(circle at 18% 14%, rgba(255,255,255,0.15), transparent 22%)",
                    ].join(","),
                  }}
                />

                <div
                  data-loader-orbits
                  className="pointer-events-none absolute inset-[-8%] opacity-[0.68]"
                >
                  <div className="absolute left-[-2%] top-[-8%] h-[86%] w-[88%] rounded-[50%] border border-[rgba(255,176,129,0.42)]" />
                  <div className="absolute right-[-20%] top-[-6%] h-[102%] w-[92%] rounded-[50%] border-[1.5px] border-[rgba(255,176,129,0.78)]" />
                  <div className="absolute right-[-10%] top-[6%] h-[90%] w-[72%] rounded-[50%] border border-[rgba(255,196,160,0.52)]" />
                  <div className="absolute left-[4%] top-[7%] h-[13%] w-[13%] rounded-full border border-[rgba(255,228,210,0.3)]" />
                  <div className="absolute left-[7%] top-[10%] h-[6%] w-[6%] rounded-full border border-[rgba(255,228,210,0.42)]" />
                  <div className="absolute left-[10%] top-[13%] h-[1.6%] w-[1.6%] rounded-full bg-[rgba(255,243,232,0.92)] shadow-[0_0_12px_rgba(255,232,214,0.7)]" />
                </div>

                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-screen"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.92) 0.8px, transparent 1.2px)",
                    backgroundSize: "32px 32px",
                    backgroundPosition: "0 0",
                  }}
                />

                <div
                  ref={loaderSheenRef}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,214,178,0.34), transparent 74%)",
                    mixBlendMode: "screen",
                    opacity: 0.7,
                  }}
                />

                <div
                  data-loader-scan
                  className="pointer-events-none absolute inset-y-[-18%] left-[-24%] w-[20%] rotate-18"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,230,205,0.42), rgba(255,255,255,0))",
                    filter: "blur(8px)",
                    opacity: 0.4,
                  }}
                />

                <div className="absolute left-4 top-4 rounded-full border border-[#ffb081]/50 bg-black/35 px-3 py-1 text-[0.55rem] uppercase tracking-[0.34em] text-[#ffd8bc] backdrop-blur-md md:left-6 md:top-6 md:text-[0.64rem]">
                  ORBITAL BOOT
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 md:bottom-6 md:left-6 md:right-6">
                  <div className="flex items-end justify-between gap-4">
                    <div className="max-w-[24rem]">
                      <div className="flex items-center gap-3">
                        <p className="text-[0.58rem] uppercase tracking-[0.36em] text-[#ffd9c0]/72 md:text-[0.68rem]">
                          Neutron 3.0
                        </p>
                        <span className="text-[0.6rem] font-mono font-bold text-[#ff9a62]">
                          {Math.floor(loadProgress)}%
                        </span>
                      </div>
                      <p className="mt-1 text-[0.72rem] leading-relaxed text-white/82 md:text-[0.92rem]">
                        Synchronizing orbital routes and calibrating planetary
                        anchors.
                      </p>
                    </div>

                    <div className="hidden items-center gap-2 text-[0.72rem] uppercase tracking-[0.3em] text-[#ffd3b0] md:flex">
                      <span className="block h-2 w-2 rounded-full bg-[#ff9a62] shadow-[0_0_14px_rgba(255,154,98,0.9)]" />
                      LIVE
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 bg-black/35 p-2 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="relative h-full w-full overflow-hidden rounded-full bg-[rgba(255,160,102,0.16)]">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
                            style={{
                              width: `${Math.max(5, loadProgress)}%`,
                              background:
                                "linear-gradient(90deg, rgba(255,151,88,0.18), rgba(255,221,196,0.96), rgba(255,151,88,0.25))",
                              boxShadow: "0 0 24px rgba(255,190,150,0.42)",
                            }}
                          />
                          <div
                            data-loader-progress-light
                            className="absolute inset-y-full left-[-35%] w-[35%] rounded-full"
                            style={{
                              background:
                                "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,240,225,0.94), rgba(255,255,255,0))",
                              filter: "blur(10px)",
                              opacity: 0.9,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((index) => (
                          <span
                            key={index}
                            className="block h-1.5 w-1.5 rounded-full bg-[#ffd7bf]"
                            style={{
                              animation: `loader-dot-pulse 1.6s ${index * 0.2}s ease-in-out infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {scenePhase === "planets" && (
          <div
            className="pointer-events-none fixed inset-0 z-25 transition-opacity duration-1000"
            style={{ opacity: 1 }}
          >
            {[
              {
                label: "Terms",
                href: "/terms",
                drift: "star-link-a 9s ease-in-out infinite",
                delay: "0s",
              },
              {
                label: "Contact",
                href: "/contact",
                drift: "star-link-c 13s ease-in-out infinite",
                delay: "0.6s",
              },
              {
                label: "About",
                href: "/about",
                drift: "star-link-d 10s ease-in-out infinite",
                delay: "2s",
              },
              {
                label: "FAQ",
                href: "/faq",
                drift: "star-link-e 12s ease-in-out infinite",
                delay: "0.9s",
              },
            ].map(({ label, href, drift, delay }, index) => {
              const pos = planetPositions[index];
              if (!pos) return null;
              return (
                <div
                  key={label}
                  className="fixed z-25 transition-opacity duration-500"
                  style={{
                    left: 0,
                    top: 0,
                    transform: `translate3d(calc(${pos.starX}px - 50%), calc(${pos.starY}px - 50%), 0)`,
                    opacity: pos.starVisible ? 1 : 0,
                    pointerEvents: pos.starVisible ? "auto" : "none",
                    willChange: "transform, opacity",
                  }}
                >
                  <NebulaStar
                    label={label}
                    href={href}
                    drift={drift}
                    delay={delay}
                  />
                </div>
              );
            })}
          </div>
        )}

        {scenePhase === "planets" && (
          <div
            className="relative z-20 pointer-events-none h-[50000svh]"
            aria-hidden="true"
          />
        )}

        <AnimatePresence>
          {isEntering && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-50 mix-blend-screen"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.65, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeIn" }}
              style={{
                backgroundImage:
                  "url('https://www.pngmart.com/files/23/Anime-Lines-PNG-Pic.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "invert(1)",
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
        <AnimatePresence>
          {scenePhase === "planets" && showScrollIndicator && (
            <motion.div
              className="fixed bottom-12 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <p className="text-[0.7rem] uppercase tracking-[0.4em] text-black/50 font-mono font-bold">
                Scroll to Explore
              </p>
              <motion.div
                className="w-px h-12 bg-linear-to-b from-black/40 to-transparent"
                animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ originY: 0 }}
              />
            </motion.div>
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
  zoomTargetRef,
  onPlanetHover,
  onPlanetClick,
  onReady,
  onProgress,
  onScreenPositions,
}: {
  canvas: HTMLCanvasElement;
  progressRef: MutableRefObject<number>;
  activePlanetRef: MutableRefObject<string>;
  zoomTargetRef: MutableRefObject<string | null>;
  onPlanetHover: (slug: string) => void;
  onPlanetClick: (slug: string) => void;
  onReady: () => void;
  onProgress: (progress: number) => void;
  onScreenPositions: (positions: PlanetScreenPos[]) => void;
}) {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  const isLowEnd =
    typeof navigator !== "undefined" &&
    (navigator.hardwareConcurrency <= 4 ||
      /Mobi|Android/i.test(navigator.userAgent));

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isLowEnd,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(dpr, isLowEnd ? 1.0 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#0a0400", 0.022);

  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    160,
  );
  camera.position.set(0, 0.8, 15.5);

  const ambientLight = new THREE.AmbientLight("#ffffff", 2.8);
  scene.add(ambientLight);

  const headlamp = new THREE.DirectionalLight("#ffffff", 1.2);
  headlamp.position.set(0, 0, 1);
  camera.add(headlamp);
  scene.add(camera);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    onProgress((itemsLoaded / itemsTotal) * 100);
  };

  const gltfLoader = new GLTFLoader(manager);
  const objLoader = new OBJLoader(manager);
  const texLoader = new THREE.TextureLoader(manager);

  const loadGLTF = (url: string) =>
    new Promise<any>((res, rej) => gltfLoader.load(url, res, undefined, rej));
  const loadOBJ = (url: string) =>
    new Promise<any>((res, rej) => objLoader.load(url, res, undefined, rej));

  const orbitCenterZ = -5.5;
  const sunPos = new THREE.Vector3(0, -1, orbitCenterZ);

  const planetsRig = new THREE.Group();
  scene.add(planetsRig);

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(8.2, 0.008, 16, 128),
    new THREE.MeshBasicMaterial({
      color: "#ffe0a0",
      transparent: true,
      opacity: 0.12,
    }),
  );
  ringA.position.copy(sunPos);
  ringA.rotation.x = Math.PI / 2;

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(12.5, 0.008, 16, 128),
    new THREE.MeshBasicMaterial({
      color: "#ffd56e",
      transparent: true,
      opacity: 0.08,
    }),
  );
  ringB.position.copy(sunPos);
  ringB.rotation.x = Math.PI / 2;
  ringB.rotation.y = 0.08;
  planetsRig.add(ringA, ringB);

  const starsNear = createStarField(
    isLowEnd ? 400 : 1100,
    72,
    0.034,
    "#ffe0a0",
  );
  const starsMid = createStarField(isLowEnd ? 200 : 720, 90, 0.024, "#ffcc80");
  const starsFar = createStarField(isLowEnd ? 150 : 480, 110, 0.018, "#e0b060");
  const starsWarm = createStarField(isLowEnd ? 100 : 360, 100, 0.02, "#fff0c0");
  (starsMid.material as THREE.PointsMaterial).opacity = 0.32;
  (starsFar.material as THREE.PointsMaterial).opacity = 0.2;
  (starsWarm.material as THREE.PointsMaterial).opacity = 0.22;
  scene.add(starsFar, starsMid, starsNear, starsWarm);

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

  const starGeometries = [
    starsNear.geometry,
    starsMid.geometry,
    starsFar.geometry,
    starsWarm.geometry,
  ];
  const starMaterials = [
    starsNear.material as THREE.Material,
    starsMid.material as THREE.Material,
    starsFar.material as THREE.Material,
    starsWarm.material as THREE.Material,
  ];

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
      const texture = texLoader.load(planet.texture ?? "");
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      obj.traverse((child: THREE.Object3D) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh)
          mesh.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 1.0,
            metalness: 0.0,
          });
      });
      target = normalizeModel(obj, planet.size);
    }

    target.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.userData.planetSlug = planet.slug;
        interactiveTargets.push(mesh);
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.roughness = 1.0;
          mesh.material.metalness = 0.0;
        }
      }
    });

    root.add(target);
    pivot.add(root);
    planetsRig.add(pivot);
    planetEntries.push({
      slug: planet.slug,
      pivot,
      root,
      target,
      basePosition: new THREE.Vector3(),
      scale: 0.001,
    });
  };

  await Promise.all(PLANET_RECORDS.map((_, i) => addPlanet(i)));
  planetEntries.sort(
    (a, b) =>
      PLANET_RECORDS.findIndex((p) => p.slug === a.slug) -
      PLANET_RECORDS.findIndex((p) => p.slug === b.slug),
  );

  const applyLayout = () => {
    const mobile = window.innerWidth < 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, mobile ? 0.45 : 0.8, mobile ? 16.8 : 15.5);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(dpr, isLowEnd ? 1.0 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  const findPlanetAtPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return (
      raycaster.intersectObjects(interactiveTargets, true)[0]?.object?.userData
        ?.planetSlug ?? ""
    );
  };

  let isDragging = false;
  let hasDragged = false;
  let dragLastX = 0;
  let dragLastY = 0;

  const handlePointerDown = (e: PointerEvent) => {
    isDragging = true;
    hasDragged = false;
    dragLastX = e.clientX;
    dragLastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const slug = findPlanetAtPointer(e.clientX, e.clientY);
    hoveredSlugRef.current = slug;

    if (isDragging) {
      const deltaX = e.clientX - dragLastX;
      const deltaY = e.clientY - dragLastY;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasDragged = true;
      }
      if (hasDragged) {
        window.scrollBy({
          top: -deltaX * 2.5 - deltaY * 2.5,
          left: 0,
          behavior: "instant",
        });
        dragLastX = e.clientX;
        dragLastY = e.clientY;
        canvas.style.cursor = "grabbing";
      }
    } else {
      canvas.style.cursor = slug ? "pointer" : "grab";
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
    if (!hasDragged) {
      const slug = findPlanetAtPointer(e.clientX, e.clientY);
      if (slug) onPlanetClick(slug);
    }
    const slug = findPlanetAtPointer(e.clientX, e.clientY);
    canvas.style.cursor = slug ? "pointer" : "grab";
  };

  const handlePointerLeave = () => {
    hoveredSlugRef.current = "";
    isDragging = false;
    canvas.style.cursor = "grab";
  };

  window.addEventListener("resize", applyLayout);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerLeave);
  canvas.style.cursor = "grab";
  applyLayout();
  onReady();

  const worldToScreen = (pos: THREE.Vector3) => {
    const p = pos.clone().project(camera);
    return {
      x: (p.x * 0.5 + 0.5) * window.innerWidth,
      y: (-p.y * 0.5 + 0.5) * window.innerHeight,
    };
  };

  const clock = new THREE.Timer();
  let animationFrame = 0;
  let frameCount = 0;

  const render = () => {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsed();

    const scrollMax =
      document.documentElement.scrollHeight - window.innerHeight || 1;
    const scrolledPx = progressRef.current * scrollMax;
    const vh = window.innerHeight || 800;
    const scrolledVH = (scrolledPx / vh) * 100;
    const cycleProgress = Math.max(0, scrolledVH) / 380;

    const intro = 1;
    const spread = 1;
    const focus = 1;
    const exit = 0;

    const mob = window.innerWidth < 768;
    const ringRadiusX = mob ? 8.0 : 10.0;
    const ringRadiusZ = mob ? 8.0 : 10.0;

    const systemScrollY = Math.sin(cycleProgress * Math.PI) * 1.8;
    const systemScrollX = Math.cos(cycleProgress * Math.PI * 2) * 1.2 - 1.2;
    const systemScrollZ = Math.sin(cycleProgress * Math.PI * 0.5) * -1.5;
    planetsRig.position.lerp(
      new THREE.Vector3(systemScrollX, systemScrollY, systemScrollZ),
      0.05,
    );

    planetsRig.rotation.y += delta * 0.026;
    planetsRig.rotation.x = Math.sin(elapsed * 0.085) * 0.016;
    planetsRig.rotation.z = Math.cos(elapsed * 0.065) * 0.007;

    const N = PLANET_RECORDS.length;
    const globalAngleOffset = cycleProgress * (Math.PI * 2);

    const frontTargetX = 0;
    const frontTargetY = mob ? -1.2 : -1.8;
    const frontTargetZ = orbitCenterZ + ringRadiusZ;
    const idealFrontPosition = new THREE.Vector3(
      frontTargetX,
      frontTargetY,
      frontTargetZ,
    ).add(planetsRig.position);

    planetEntries.forEach((entry, index) => {
      const planet = PLANET_RECORDS[index];
      const revealIn = 1;
      const visibility = 1;

      const isOrbitB = index >= 2;
      const currentRadiusX = 8.2;
      const currentRadiusZ = 8.2;
      const currentCenterZ = orbitCenterZ;

      let currentAngle = (index * (Math.PI * 2)) / N - globalAngleOffset;
      if (currentAngle > Math.PI) currentAngle -= Math.PI * 2;
      if (currentAngle < -Math.PI) currentAngle += Math.PI * 2;

      const targetX = Math.sin(currentAngle) * currentRadiusX;
      const targetZ = currentCenterZ + Math.cos(currentAngle) * currentRadiusZ;
      const targetY = -1;

      const angleScale = Math.max(0, Math.cos(currentAngle));
      const frontBoost = Math.pow(angleScale, 5.0);
      const emphasis = 1.0 + frontBoost * (mob ? 1.4 : 1.8);

      entry.basePosition.set(targetX, targetY, targetZ);
      entry.pivot.position.x = THREE.MathUtils.lerp(
        entry.basePosition.x * 0.08,
        entry.basePosition.x,
        spread,
      );
      entry.pivot.position.y = THREE.MathUtils.lerp(
        entry.basePosition.y - 5.4 - index * 0.25,
        entry.basePosition.y +
          Math.sin(elapsed * 0.66 + index * 1.28) * 0.13 +
          Math.sin(elapsed * 0.38 + index * 0.72) * 0.048 +
          Math.cos(elapsed * 0.22 + index * 1.05) * 0.022,
        revealIn,
      );
      entry.pivot.position.z = THREE.MathUtils.lerp(
        10 + index * 0.6,
        entry.basePosition.z + Math.sin(elapsed * 0.35 + index) * 0.09,
        visibility,
      );

      // SELF ROTATION ( axis rotation ) - Increased speed and logic check
      const rotationSpeed = (0.75 + index * 0.35) * delta;
      entry.target.rotation.y += rotationSpeed;

      entry.pivot.rotation.y += delta * (0.1 + index * 0.015);
      entry.pivot.rotation.x = Math.sin(elapsed * 0.22 + index * 0.88) * 0.038;

      // Keep other cosmetic rotations subtle
      entry.target.rotation.x = Math.sin(elapsed * 0.09 + index * 0.72) * 0.04;
      entry.root.position.y = Math.sin(elapsed * 0.62 + index * 1.28) * 0.085;
      entry.root.position.x = Math.sin(elapsed * 0.25 + index * 1.08) * 0.032;

      entry.scale = THREE.MathUtils.lerp(
        entry.scale,
        visibility * emphasis,
        0.068,
      );
      entry.root.scale.setScalar(Math.max(entry.scale, 0.001));
    });

    cameraOffset.set(0, mob ? 3.8 : 5.2, mob ? 8.5 : 11.0);
    const focusLookAt = new THREE.Vector3(0, mob ? 0.0 : 0.5, orbitCenterZ).add(
      planetsRig.position,
    );

    const startZ = mob ? 16.8 : 16.0;
    const endZ = mob ? 3.2 : 2.5;
    const startY = mob ? 0.4 : 0.7;
    const endY = mob ? 0.2 : 0.3;

    targetCameraPosition
      .set(
        0,
        THREE.MathUtils.lerp(startY, endY, intro),
        THREE.MathUtils.lerp(startZ, endZ, intro),
      )
      .add(planetsRig.position);
    targetLookAt
      .set(
        0,
        THREE.MathUtils.lerp(0.1, -0.3, intro),
        THREE.MathUtils.lerp(-1.5, -5.0, intro),
      )
      .add(planetsRig.position);
    camera.fov = THREE.MathUtils.lerp(40, 52, intro * (1 - spread));
    camera.updateProjectionMatrix();
    if (scene.fog instanceof THREE.FogExp2) {
      (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(
        0.022,
        0.01,
        intro * (1 - spread),
      );
    }

    targetCameraPosition.lerp(
      new THREE.Vector3(0, mob ? 3.0 : 4.8, mob ? 18.2 : 20.5).add(
        planetsRig.position,
      ),
      spread,
    );
    targetLookAt.lerp(
      new THREE.Vector3(0, 0.2, orbitCenterZ).add(planetsRig.position),
      spread,
    );
    targetCameraPosition.lerp(
      idealFrontPosition.clone().add(cameraOffset),
      focus,
    );
    targetLookAt.lerp(focusLookAt, focus);

    exitOffset.set(mob ? 1.4 : 2.1, 2.4, 5.8);
    targetCameraPosition.lerp(idealFrontPosition.clone().add(exitOffset), exit);
    targetLookAt.lerp(
      idealFrontPosition.clone().add(new THREE.Vector3(0.2, 0.1, 0)),
      exit,
    );
    camera.position.lerp(targetCameraPosition, 0.065);
    cameraLookAt.lerp(targetLookAt, 0.078);
    camera.lookAt(cameraLookAt);

    if (zoomTargetRef.current) {
      const zoomEntry = planetEntries.find(
        (e) => e.slug === zoomTargetRef.current,
      );
      if (zoomEntry) {
        const zoomWorldPos = new THREE.Vector3();
        zoomEntry.pivot.getWorldPosition(zoomWorldPos);
        const mob = window.innerWidth < 768;
        const zoomCamTarget = zoomWorldPos
          .clone()
          .add(new THREE.Vector3(mob ? 0.3 : 0.6, 0.35, mob ? 2.0 : 2.8));
        camera.position.lerp(zoomCamTarget, 0.07);
        cameraLookAt.lerp(zoomWorldPos, 0.09);
        camera.lookAt(cameraLookAt);
        camera.fov = THREE.MathUtils.lerp(camera.fov, 28, 0.04);
        camera.updateProjectionMatrix();
      }
    }

    starsNear.rotation.y += delta * 0.0065;
    starsMid.rotation.y -= delta * 0.0038;
    starsFar.rotation.y += delta * 0.002;
    starsWarm.rotation.y -= delta * 0.003;
    starsNear.rotation.x = Math.sin(elapsed * 0.06) * 0.02;
    starsFar.rotation.x = Math.cos(elapsed * 0.045) * 0.014;

    renderer.render(scene, camera);

    frameCount++;
    if (frameCount % (isLowEnd ? 4 : 3) === 0) {
      const screenPositions: PlanetScreenPos[] = planetEntries.map(
        (entry, index) => {
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
            const blocker = hits.find(
              (h) => h.object.userData?.planetSlug !== entry.slug,
            );
            if (
              blocker &&
              blocker.distance < camera.position.distanceTo(labelPos) - 0.5
            )
              occluded = true;
          }

          const starWorldPos = worldPos
            .clone()
            .add(
              new THREE.Vector3(
                index % 2 === 0 ? 5.8 : -5.8,
                index % 3 === 0 ? 3.5 : -4.2,
                index % 2 === 0 ? -3.0 : 3.0,
              ).multiplyScalar(Math.max(entry.scale, 0.4)),
            );
          const starScreen = worldToScreen(starWorldPos);
          const starBehind = starWorldPos.clone().project(camera).z > 1;

          let starOccluded = false;
          if (!starBehind) {
            const dir = starWorldPos.clone().sub(camera.position).normalize();
            raycaster.set(camera.position, dir);
            const hits = raycaster.intersectObjects(interactiveTargets, true);
            const blocker = hits.find(
              (h) => h.object.userData?.planetSlug !== entry.slug,
            );
            if (
              blocker &&
              blocker.distance < camera.position.distanceTo(starWorldPos) - 0.5
            )
              starOccluded = true;
          }

          return {
            slug: entry.slug,
            x: screen.x,
            y: screen.y + entry.scale * 36,
            visible:
              !behind && !occluded && entry.scale > 0.14 && spread > 0.28,
            scale: entry.scale,
            starX: starScreen.x,
            starY: starScreen.y,
            starVisible:
              !starBehind &&
              !starOccluded &&
              entry.scale > 0.05 &&
              spread > 0.12,
          };
        },
      );
      onScreenPositions(screenPositions);
    }

    animationFrame = window.requestAnimationFrame(render);
  };

  render();

  return () => {
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", applyLayout);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerUp);
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
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        for (const m of mats) m.dispose();
      });
    });
    renderer.dispose();
  };
}
