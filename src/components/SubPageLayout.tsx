"use client";

import React, { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Noise from "./Noise";
import AboutFooter from "./AboutFooter";

interface SubPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showHero?: boolean;
}

export default function SubPageLayout({ children, title, subtitle, showHero = true }: SubPageLayoutProps) {
  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden selection:bg-orange-500/30 font-sans">
      {/* Background Layer */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774685137/BG_l4fb9q.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.12) contrast(1.1)",
        }}
      />

      <Noise patternAlpha={4} className="fixed inset-0 z-1 pointer-events-none opacity-20" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <Link href="/" className="group flex items-center gap-3 transition-transform duration-500">
          <div className="relative w-8 h-8 md:w-10 md:h-10">
             <Image
              src="/neutron.png"
              alt="Neutron Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.55rem] font-mono tracking-[0.4em] text-white/30 uppercase">
              Neutron 3.0
            </span>
            <span className="text-xs md:text-sm font-bold tracking-widest text-white uppercase group-hover:text-amber-500 transition-colors">
              Home
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[0.6rem] font-mono tracking-[0.3em] uppercase text-white/30">
          <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 max-w-7xl">
        {showHero && (
          <header className="pt-12 pb-24 md:pt-24 md:pb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 uppercase leading-[0.9]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs md:text-sm text-white/40 font-mono tracking-widest uppercase max-w-xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </motion.div>
          </header>
        )}

        <div className={showHero ? "" : "pt-12"}>
          {children}
        </div>
      </main>

      <AboutFooter />

      {/* Subtle Bottom Fade */}
      <div className="fixed bottom-0 left-0 w-full h-[20vh] bg-linear-to-t from-black to-transparent pointer-events-none z-5" />
    </div>
  );
}
