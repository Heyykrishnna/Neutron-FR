"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface LoaderProps {
  onComplete: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<"loading" | "image-reveal">("loading");

  useEffect(() => {
    const imageTimer = setTimeout(() => {
      setPhase("image-reveal");
    }, 3200);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500); 

    return () => {
      clearTimeout(imageTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const words = {
    mobile: ["NEUT", "RON"],
    desktop: ["NEUTRON"]
  };

  const letterVariants = {
    hidden: { y: "150%", rotateX: -60, opacity: 0, filter: "blur(10px)" },
    visible: { 
      y: "0%", 
      rotateX: 0, 
      opacity: 1, 
      filter: "blur(0px)",
      transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] as const } 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.2,
        filter: "blur(10px)",
        transition: { 
          duration: 1.2, 
          ease: [0.76, 0, 0.24, 1] 
        } 
      }}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden bg-[#030303]"
    >
      <div className="relative flex flex-col items-center justify-center w-full h-full">

        <AnimatePresence>
          {phase === "loading" && (
            <motion.div
              key="text-content"
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)", transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } }}
            >
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="mb-8 md:mb-12 relative w-16 h-16 md:w-24 md:h-24"
              >
                <Image
                  src="/neutron.png"
                  alt="Neutron Logo"
                  fill
                  className="object-contain drop-shadow-[0_0_15px_rgba(255,160,40,0.6)]"
                />
              </motion.div>

              <div className="md:hidden flex flex-col items-center justify-center font-black uppercase text-[#EFEFEF] leading-[0.85] -tracking-[0.06em]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                {words.mobile.map((word, wordIdx) => (
                  <motion.div 
                    key={wordIdx}
                    className="flex overflow-hidden"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.1, delayChildren: wordIdx * 0.3 } }
                    }}
                  >
                    {word.split("").map((char, i) => (
                      <motion.span
                        key={i}
                        variants={letterVariants}
                        className="text-[29vw] inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </motion.div>
                ))}
              </div>

              <div className="hidden md:flex flex-col items-center justify-center font-black uppercase text-[#EFEFEF] leading-none -tracking-[0.08em]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                <motion.div 
                  className="flex overflow-hidden"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
                  }}
                >
                  {words.desktop[0].split("").map((char, i) => (
                    <motion.span
                      key={i}
                      variants={letterVariants}
                      className="text-[17vw] inline-block"
                      style={{ 
                        textShadow: "0 0 40px rgba(255,255,255,0.1)" 
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              </div>

              <motion.div
                className="absolute bottom-16 md:bottom-24 w-1/2 md:w-1/4 h-1 bg-white/10 rounded-full overflow-hidden"
              >
                <motion.div 
                  className="w-full h-full bg-white/80 rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3.2, ease: "linear" }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "image-reveal" && (
            <motion.div
              key="image-reveal"
              className="absolute inset-0 z-10 w-full h-full mix-blend-screen"
              initial={{ opacity: 0, scale: 0.8, filter: "brightness(0)" }}
              animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
              transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            >
              <Image 
                src="https://image.benq.com/is/image/benqco/T7-1200X600?$ResponsivePreset$" 
                alt="Cosmos Background"
                fill
                className="object-cover"
                style={{
                  filter: "brightness(0.6) contrast(1.2) sepia(0.2) hue-rotate(-10deg)"
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

export default Loader;
