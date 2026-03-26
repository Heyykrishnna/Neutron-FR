"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Noise from "./Noise";

interface LoaderProps {
  onComplete: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4500); 

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ 
        y: "-100%",
        transition: { 
          duration: 1.2, 
          ease: [0.76, 0, 0.24, 1] 
        } 
      }}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] overflow-hidden">
          <video
            src="https://ik.imagekit.io/YatharthKhandelwal/loadervid.mp4"
            autoPlay
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className={`w-full h-full object-contain transition-opacity duration-1000 ${
              videoLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: videoLoaded ? 1 : 0, 
            y: videoLoaded ? 0 : 20 
          }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-4xl md:text-6xl font-sora font-extralight tracking-[0.3em] uppercase text-white/90">
            neutron
          </h1>
          <div className="w-12 h-px bg-white/20 mt-4" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Loader;
