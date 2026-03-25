"use client";

import React, { useMemo, useState } from "react";
import { motion, useTransform, MotionValue, useMotionValueEvent, useSpring, AnimatePresence } from "framer-motion";

interface CardInfo {
  name: string;
  title: string;
  handle: string;
  status: string;
  bgImage: string;
  backColor: string;
}

interface StickyScrollCardsProps {
  progress: MotionValue<number>;
  prizePool: string;
  location: string;
  teamSize: string;
  competitionTitle: string;
  category: string;
  eventType: string;
}

export const StickyScrollCards: React.FC<StickyScrollCardsProps> = ({
  progress,
  prizePool,
  location,
  teamSize,
  competitionTitle,
  category,
  eventType,
}) => {
  const [index, setIndex] = useState(0);

  const cardData: CardInfo[] = useMemo(() => [
    {
      name: "Prize Pool",
      title: prizePool,
      handle: "bounty_info",
      status: "Verified Reward",
      bgImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&q=80",
      backColor: "#740f0d"
    },
    {
      name: "Deployment",
      title: location,
      handle: "coordinates",
      status: "Active Zone",
      bgImage: "https://images8.alphacoders.com/117/thumb-1920-1178623.jpg",
      backColor: "#151515"
    },
    {
      name: "Participation",
      title: teamSize,
      handle: "formation",
      status: "Crew Access",
      bgImage: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1600&q=80",
      backColor: "#939393"
    },
    {
      name: competitionTitle,
      title: `${category} • ${eventType}`,
      handle: "mission_brief",
      status: "Ready for Launch",
      bgImage: "https://wallpapercave.com/wp/wp12457548.png",
      backColor: "#0a0a0a"
    }
  ], [prizePool, location, teamSize, competitionTitle, category, eventType]);
  useMotionValueEvent(progress, "change", (latest) => {
    const newIndex = Math.min(Math.floor(latest * 4), 3);
    if (newIndex !== index) {
      setIndex(newIndex);
    }
  });

  const rawRotation = useTransform(progress, [0, 1], [0, 1440]);
  const rotateY = useSpring(rawRotation, { 
    stiffness: 30,
    damping: 25, 
    mass: 0.8,
    restDelta: 0.001 
  });
  
  const scale = useTransform(progress, (v) => {
    const phaseProgress = (v * 4) % 1;
    return 1 - (Math.sin(phaseProgress * Math.PI) * 0.15);
  });

  const currentData = cardData[index];

  return (
    <div className="w-full flex justify-center items-center perspective-[2000px] h-full py-20">
      <motion.div
        style={{
          rotateY,
          scale,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[0.75] max-w-[420px] shadow-2xl rounded-3xl"
      >
        <div 
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          className="absolute inset-0 w-full h-full bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between p-10 z-20"
        >
          <CardContent data={currentData} />
        </div>

        <div 
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)" 
          }}
          className="absolute inset-0 w-full h-full bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between p-10 z-10"
        >
          <CardContent data={currentData} />
        </div>
      </motion.div>
    </div>
  );
};

function CardContent({ data }: { data: CardInfo }) {
  return (
    <>
      <div className="absolute inset-0 bg-black z-0" />
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={data.bgImage}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.25, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="w-full h-full bg-cover bg-center opacity-90"
            style={{ backgroundImage: `url('${data.bgImage}')` }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-col h-full">
         <div className="mt-auto">
           <motion.h3 
             key={`name-${data.name}`}
             initial={{ y: 15, opacity: 0 }}
             animate={{ y: 0, opacity: 0.4 }}
             transition={{ duration: 0.6 }}
             className="text-xs font-mono uppercase tracking-[0.5em] mb-6 text-white"
           >
             {data.name}
           </motion.h3>
           <motion.p 
             key={`title-${data.title}`}
             initial={{ y: 30, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.15, duration: 0.8, type: "spring", stiffness: 80, damping: 15 }}
             className="text-2xl lg:text-4xl font-black tracking-tighter leading-none text-white uppercase"
           >
             {data.title}
           </motion.p>
           
           <div className="mt-16 flex items-center space-x-6">
             <div className="flex -space-x-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border border-black bg-white/5 backdrop-blur-md shadow-inner flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-linear-to-tr from-white/10 to-transparent" />
                 </div>
               ))}
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.3em]">Neural Link::Active</span>
               <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest break-all">{data.handle}</span>
             </div>
           </div>
         </div>
      </div>

      <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dpod2sj9t/image/upload/v1774362639/nnnoise_zgex87.svg')] opacity-[0.25] mix-blend-overlay pointer-events-none z-20"></div>
    </>
  );
}
