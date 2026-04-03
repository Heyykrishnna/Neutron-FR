"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Grainient from "@/src/components/Grainient";
import Noise from "@/src/components/Noise";
import Image from "next/image";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      try {
        await logout();
      } catch (error) {
        console.error("Logout failed:", error);
      } finally {
        router.replace("/");
      }
    };
    performLogout();
  }, [logout, router]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0d0a08]">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <Grainient
          color1="#3e2723"
          color2="#5d4037"
          color3="#000000"
          timeSpeed={0.3}
          warpStrength={1.2}
          zoom={1.5}
          className="w-full h-full opacity-60"
        />
        <Noise patternAlpha={12} className="opacity-40" />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 text-center max-w-lg">
        <motion.div
           initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
           animate={{ scale: 1, opacity: 1, rotate: 0 }}
           transition={{ 
             duration: 1.2, 
             ease: [0.16, 1, 0.3, 1] 
           }}
           className="relative"
        >
          <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-150" />
          <Image 
            src="https://ik.imagekit.io/yatharth/NEUT-LOGO.png" 
            alt="Neutron Logo" 
            width={100} 
            height={100} 
            className="relative drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          />
        </motion.div>

        <div className="space-y-3">
          <motion.h1 
            initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl font-bold text-white tracking-tighter sm:text-5xl"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Logging Out
          </motion.h1>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            className="h-px bg-linear-to-r from-transparent via-white/20 to-transparent mx-auto"
          />

          <motion.p 
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-white/40 text-[0.7rem] font-bold tracking-[0.3em] uppercase max-w-[280px] mx-auto leading-relaxed"
          >
            Securing your local session & disconnecting from the orbit
          </motion.p>
        </div>

        <div className="w-40 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: 2, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-linear-to-r from-transparent via-orange-400/50 to-transparent w-full"
          />
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-white/10 origin-left"
          />
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 1.2 }}
          className="text-[0.55rem] text-white tracking-[0.5em] uppercase font-mono"
        >
          Session Termination Sequence
        </motion.p>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-size-[100%_2px,3px_100%] select-none" />
    </div>
  );
}
