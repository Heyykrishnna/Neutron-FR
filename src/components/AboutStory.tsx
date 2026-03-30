"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { motion, useSpring } from "framer-motion";

const STORY_SECTIONS = [
  {
    id: 1,
    title: "The Singularity",
    text: "It all began with a single ripple in the fabric of space-time. A point of infinite density, where laws of physics as we know them ceased to exist. We didn't just observe it—we entered it.",
    image: "https://cdn.prod.website-files.com/62e8d2ea218fb7676b6892a6/695bd44c5ed672dde63d1267_Frame%201943243498.avif",
  },
  {
    id: 2,
    title: "Beyond the Horizon",
    text: "As we crossed the event horizon, the stars didn't just fade—they transformed. Time became a dimension we could walk through, and space became a canvas for our imagination.",
    image: "https://cdn.prod.website-files.com/62e8d2ea218fb7676b6892a6/695bd44c6e00eb853581c9cd_Frame%201943243494.avif",
  },
  {
    id: 3,
    title: "New Frontiers",
    text: "Neutron 3.0 was born from this expansion. Not just a festival, but a portal into the future of techno-culture. We are the architects of this new reality, and you are its pioneers.",
    image: "https://cdn.prod.website-files.com/62e8d2ea218fb7676b6892a6/695bd44befe1a76a37682392_Frame%201943243493.avif",
  },
  {
    id: 4,
    title: "Your Journey Begins",
    text: "The cosmos is calling. It's not just about what you see—it's about what you become. Welcome to the singularity. Welcome to Neutron 3.0.",
    image: "https://cdn.prod.website-files.com/62e8d2ea218fb7676b6892a6/695bd44ca40985306cad3d95_Frame%201943243497.avif",
  },
];

export default function AboutStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  
  const springConfig = { stiffness: 400, damping: 28, mass: 0.5 };
  const springX = useSpring(0, springConfig);
  const springY = useSpring(0, springConfig);

  useEffect(() => {
    springX.set(mousePos.x);
    springY.set(mousePos.y);
  }, [mousePos, springX, springY]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    if (!containerRef.current || !scrollRef.current) return;

    const panels = gsap.utils.toArray<HTMLElement>(".story-panel");
    const isMobile = window.innerWidth < 768;
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=" + (panels.length * 100) + "%",
          pin: true,
          scrub: 1,
        }
      });

      tl.to(scrollRef.current, {
        xPercent: -100 * (panels.length - 1) / panels.length,
        ease: "none"
      });

      panels.forEach((panel) => {
        const img = panel.querySelector(".story-image");
        if (img && !isMobile) {
            gsap.fromTo(img, 
                { x: "-15%" },
                { 
                    x: "15%",
                    ease: "none",
                    scrollTrigger: {
                        trigger: panel,
                        containerAnimation: tl,
                        start: "left right",
                        end: "right left",
                        scrub: true
                    }
                }
            );
        }

        const titleWords = panel.querySelectorAll(".title-word");
        const textP = panel.querySelector(".story-text");
        const phase = panel.querySelector(".story-phase");

        gsap.fromTo(titleWords, 
            { opacity: 0, rotateX: 90, y: 100 },
            { 
                opacity: 1, rotateX: 0, y: 0, 
                stagger: 0.1, 
                duration: 0.8,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: panel,
                    containerAnimation: tl,
                    start: isMobile ? "left center+=200" : "left center", 
                    toggleActions: "play reverse play reverse"
                }
            }
        );

        gsap.fromTo([phase, textP], 
            { opacity: 0, x: -30 },
            { 
                opacity: 1, x: 0, 
                stagger: 0.15,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: panel,
                    containerAnimation: tl,
                    start: isMobile ? "left center+=200" : "left center",
                    toggleActions: "play reverse play reverse"
                }
            }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-screen bg-[#050505] overflow-hidden md:cursor-none"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      
      {isHovering && (
        <motion.div 
          className="hidden md:flex fixed top-0 left-0 w-10 h-10 rounded-full border border-[#ffb84d]/50 pointer-events-none z-50 items-center justify-center mix-blend-difference"
          style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </motion.div>
      )}

      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] md:text-[25vw] font-black text-transparent opacity-[0.02] pointer-events-none select-none tracking-tighter whitespace-nowrap"
          style={{ WebkitTextStroke: "1px #ffffff" }}>
        NEUTRON
      </h1>

      <div 
        ref={scrollRef} 
        className="flex h-full w-[400vw]"
      >
        {STORY_SECTIONS.map((section, index) => (
          <div 
            key={section.id} 
            className="story-panel relative w-screen h-full flex items-center justify-center p-6 md:p-24 overflow-hidden shrink-0"
          >
            
            <div className={`w-full max-w-[1400px] mx-auto flex flex-col ${index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-24 relative z-10`} style={{ perspective: "1000px" }}>
              
              <div className="w-full md:w-1/2 h-[35vh] md:h-[65vh] overflow-hidden rounded-[2vw] relative border border-white/5 shadow-2xl backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/20 z-10 transition-colors duration-700 hover:bg-transparent" />
                <div className="story-image w-full h-full md:w-[130%] md:h-[130%] absolute md:top-[-15%] md:left-[-15%] top-0 left-0">
                  <Image 
                    src={section.image} 
                    alt={section.title} 
                    fill 
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-700 md:hover:scale-105"
                  />
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col justify-center">
                <div className="overflow-hidden mb-4 md:mb-6">
                  <span className="story-phase text-[#ffb84d] font-mono text-xs md:text-sm tracking-[0.4em] uppercase block">
                    Phase 0{section.id}
                  </span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 md:mb-8 tracking-tighter leading-[0.9] uppercase italic" style={{ transformStyle: "preserve-3d" }}>
                  {section.title.split(" ").map((word, i) => (
                    <span 
                      key={i}
                      className="title-word inline-block mr-[2vw]"
                    >
                      {word}
                    </span>
                  ))}
                </h2>
                
                <p className="story-text text-sm sm:text-base md:text-xl lg:text-2xl text-white/60 font-light leading-relaxed max-w-xl">
                  {section.text}
                </p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
