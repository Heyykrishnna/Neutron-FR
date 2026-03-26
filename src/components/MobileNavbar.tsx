"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Grainient from "./Grainient";
import Noise from "./Noise";
import Link from "next/link";

interface MobileNavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DISCOVER_LINKS = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/news" },
  { name: "Competitions", href: "/planets/jupiter" },
  { name: "Events", href: "/planets/venus" },
  { name: "Campus Ambassador", href: "https://ca.neutronfest.org" },
  { name: "Profile", href: "/profile" }
];

const CONNECT_LINKS = [
  { name: "YouTube", href: "https://youtu.be/2b-kZc_UW6I?list=PLSiPF1zjyE3Fd_aXpCIkGCSuKr5vEA4mg" },
  { name: "Instagram", href: "https://www.instagram.com/neutronfest/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/neutronfest" },
];

const COLORS = [
  "#3e2723", 
  "#5d4037", 
  "#8d6e63",
  "#0d0a08"
];

export default function MobileNavbar({ isOpen, onClose }: MobileNavbarProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.2 } }}
          className="fixed inset-0 z-110 overflow-hidden"
        >
          {/* Staggered Background Panels */}
          {COLORS.map((color, i) => (
            <motion.div
              key={color}
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1],
                delay: i * 0.08
              }}
              style={{ backgroundColor: color, zIndex: i + 1 }}
              className="absolute inset-0"
            />
          ))}

          {/* Main Content Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative z-50 flex flex-col h-full bg-transparent"
          >
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <Grainient
                color1="#3e2723"
                color2="#5d4037"
                color3="#0d0a08"
                timeSpeed={0.6}
                warpStrength={1.2}
                zoom={1.5}
                className="w-full h-full"
              />
            </div>
            
            <Noise patternAlpha={8} className="opacity-30 z-1 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between px-6 pt-10 pb-6 shadow-sm">
               <button onClick={onClose} className="transition-transform active:scale-90 flex items-center gap-3">
                <Image 
                  src="/neutron.png" 
                  alt="Neutron Logo" 
                  width={42} 
                  height={42} 
                  className="opacity-100 drop-shadow-lg" 
                />
               </button>

               <button 
                 onClick={onClose}
                 className="p-3 bg-white/5 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                 aria-label="Close Menu"
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
                 </svg>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pt-8 pb-20 relative z-10">
              <div className="space-y-12">
                
                <div className="grid grid-cols-[60px_1fr] gap-4">
                  <span className="text-white/20 text-[0.7rem] uppercase font-bold pt-4 tracking-[0.3em] [writing-mode:vertical-lr] rotate-180">Discover</span>
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
                    }}
                    className="flex flex-col space-y-4"
                  >
                    {DISCOVER_LINKS.map((link) => (
                      <motion.div
                        key={link.name}
                        variants={{
                          hidden: { opacity: 0, x: -20, filter: "blur(5px)" },
                          visible: { opacity: 1, x: 0, filter: "blur(0px)" }
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className="text-[2.2rem] font-bold text-white/90 leading-tight hover:text-orange-200 transition-colors tracking-tighter block active:scale-95"
                          style={{ fontFamily: "var(--font-sora)" }}
                        >
                          {link.name}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="grid grid-cols-[60px_1fr] gap-4 mt-8">
                  <span className="text-white/20 text-[0.7rem] uppercase font-bold pt-1 tracking-[0.3em] [writing-mode:vertical-lr] rotate-180">Connect</span>
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.05, delayChildren: 0.5 } }
                    }}
                    className="flex flex-col space-y-4"
                  >
                    {CONNECT_LINKS.map((link) => (
                      <motion.div
                        key={link.name}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className="text-[1.2rem] font-medium text-white/50 leading-none hover:text-white transition-all tracking-tight block hover:pl-2 active:scale-95"
                          style={{ fontFamily: "var(--font-sora)" }}
                        >
                          {link.name}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full h-[25vh] bg-linear-to-t from-[#0d0a08] to-transparent pointer-events-none z-20" />
            
            <div className="absolute bottom-10 left-10 z-30">
              <p className="text-[0.6rem] text-white/20 uppercase tracking-[0.4em] font-medium">Let's explore the orbit</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

