"use client";

import Link from "next/link";
import React from "react";
import { playSciFiClick } from "./audio-controller";

interface ReturnButtonProps {
  href: string;
}

export function ReturnButton({ href }: ReturnButtonProps) {
  return (
    <div className="fixed top-8 left-8 z-50 pointer-events-auto">
      <Link href={href} onClick={playSciFiClick}>
        <div className="flex items-center space-x-4 group cursor-pointer relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 hover:border-white/30 transition-all duration-500">
           <div className="flex items-center justify-center bg-black/50 w-8 h-8 rounded-full group-hover:bg-white transition-colors duration-500">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white group-hover:text-black transition-colors duration-500">
               <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
           </div>
           <span className="text-xs font-medium tracking-[0.2em] uppercase text-white/70 group-hover:text-white transition-colors">Return</span>
        </div>
      </Link>
    </div>
  );
}
