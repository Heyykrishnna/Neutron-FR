"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AboutHero from "@/components/AboutHero";
import AboutStory from "@/components/AboutStory";
import AboutImpact from "@/components/AboutImpact";
import AboutGallery from "@/components/AboutGallery";
import AboutTeam from "@/components/AboutTeam";
import AboutFooter from "@/components/AboutFooter";

export default function AboutPage() {
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLanded(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative text-white min-h-screen">
      <div 
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774685137/BG_l4fb9q.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "brightness(0.3) contrast(1.1) hue-rotate(-10deg) saturate(1.4)",
        }}
      />

      <div 
        className="fixed inset-0 -z-5 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,200,0.015) 3px, rgba(0,255,200,0.015) 4px)',
        }}
      />

      <div 
        className="fixed inset-0 -z-5 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(180,60,20,0.08) 0%, transparent 30%, transparent 70%, rgba(100,30,10,0.15) 100%)',
        }}
      />

      <AnimatePresence>
        {!landed && (
          <motion.div
            key="landing-overlay"
            className="fixed inset-0 z-100 bg-black flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="w-1 h-20"
                style={{ background: 'linear-gradient(180deg, rgba(228,142,255,0.8), transparent)' }}
                animate={{ scaleY: [0, 1, 0.5], opacity: [0, 1, 0.6] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.4em]">Initiating surface contact</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes holo-flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.6} 94%{opacity:1} 96%{opacity:0.8} 97%{opacity:1} }
      `}</style>
      
      <AboutHero />
      <AboutStory />
      <AboutImpact />
      <AboutGallery />
      <AboutTeam />
      <AboutFooter />
    </main>
  );
}
