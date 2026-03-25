"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Grainient from "./Grainient";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-[#050505] text-white selection:bg-purple-500/30">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 z-0">
          <Grainient
            color1="#ad18f2"
            color2="#3a0bf4"
            color3="#07001f"
            timeSpeed={0.8}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={1}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.22}
            grainScale={5}
            grainAnimated={false}
            contrast={1.2}
            gamma={1}
            saturation={0.7}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-r from-transparent to-[#050505] z-10" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md text-center"
        >
          <div className="mb-8 flex justify-center">
            <Image
              src="/neutron.png"
              alt="Neutron Logo"
              width={80}
              height={80}
              className="drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            />
          </div>
          <h1 className="text-4xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-linear-to-b from-white to-white/50">
            {title}
          </h1>
          <p className="text-md text-white/60 font-light leading-relaxed">
            {subtitle}
          </p>
          
          <div className="mt-12 space-y-4">
             {[
               { id: 1, text: "Initiate Your Identity" },
               { id: 2, text: "Establish Your Credentials" },
               { id: 3, text: "Initiate Launch Sequence" }
             ].map((step) => (
               <div key={step.id} className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-left transition-colors hover:bg-white/10 group">
                 <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform">
                   {step.id}
                 </div>
                 <span className="text-white/80 font-medium">{step.text}</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
             <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-purple-600/10 blur-[100px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
